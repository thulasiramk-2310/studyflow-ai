#!/usr/bin/env bash
# Runs deploy/remote_deploy.sh against a fake app root with a stub `docker`.
# Usage: bash deploy/tests/test_remote_deploy.sh
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$HERE/../remote_deploy.sh"
FAILED=0

fail() { echo "FAIL: $1"; FAILED=1; }

setup() {
  ROOT="$(mktemp -d)"
  BIN="$(mktemp -d)"
  LOG="$ROOT/docker.log"
  cat > "$BIN/docker" <<STUB
#!/usr/bin/env bash
echo "\$*" >> "$LOG"
STUB
  chmod +x "$BIN/docker"
  for tag in good bad; do
    mkdir -p "$ROOT/releases/$tag"
    echo "compose $tag" > "$ROOT/releases/$tag/docker-compose.yml"
    echo "prod $tag" > "$ROOT/releases/$tag/docker-compose.prod.yml"
    echo "caddy $tag" > "$ROOT/releases/$tag/Caddyfile"
  done
  mkdir -p "$ROOT/deploy"
}

# A deploy must run with the compose files and Caddyfile of the tag it deploys,
# so a rollback to "good" undoes config changes made by "bad".
setup
PATH="$BIN:$PATH" STUDYFLOW_ROOT="$ROOT" bash "$SCRIPT" bad >/dev/null 2>&1
PATH="$BIN:$PATH" STUDYFLOW_ROOT="$ROOT" bash "$SCRIPT" good >/dev/null 2>&1 || fail "deploy of good tag exited non-zero"
[ "$(cat "$ROOT/docker-compose.yml" 2>/dev/null)" = "compose good" ] || fail "docker-compose.yml not restored from releases/good"
[ "$(cat "$ROOT/docker-compose.prod.yml" 2>/dev/null)" = "prod good" ] || fail "docker-compose.prod.yml not restored from releases/good"
[ "$(cat "$ROOT/deploy/Caddyfile" 2>/dev/null)" = "caddy good" ] || fail "Caddyfile not restored from releases/good"

# Caddy does not watch its config; every deploy must reload it.
grep -q "exec -T caddy caddy reload" "$LOG" 2>/dev/null || fail "caddy was not reloaded"

# An unknown tag must fail before touching the running stack.
setup
PATH="$BIN:$PATH" STUDYFLOW_ROOT="$ROOT" bash "$SCRIPT" missing >/dev/null 2>&1 && fail "unknown tag did not fail"
[ ! -s "$LOG" ] || fail "docker was called for an unknown tag"

[ "$FAILED" = 0 ] && echo "remote_deploy tests passed"
exit "$FAILED"
