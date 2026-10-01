#!/usr/bin/env bash
# Post-deploy checks. Usage: DEMO_PASSWORD=... scripts/smoke_test.sh https://studyflow-ai.duckdns.org
set -uo pipefail

BASE="${1:?usage: smoke_test.sh <base-url>}"
: "${DEMO_PASSWORD:?DEMO_PASSWORD is not set}"
CURL=(curl -s -m 15 -o /dev/null -w "%{http_code} %{time_total}")
[ "${INSECURE:-0}" = "1" ] && CURL+=(-k)
JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT
FAILED=0

check() {
  local name="$1" expected="$2"; shift 2
  local out code secs
  out="$("${CURL[@]}" -b "$JAR" -c "$JAR" "$@")"
  code="${out%% *}"; secs="${out##* }"
  echo "$name $code ${secs}s"
  if [ "$code" != "$expected" ]; then
    echo "  expected $expected" >&2
    FAILED=1
  fi
}

check frontend 200 "$BASE/"
check health 200 "$BASE/health"
check login 200 -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"demo@studyflow.ai\",\"password\":\"$DEMO_PASSWORD\"}" "$BASE/auth/login"
check auth_me 200 "$BASE/auth/me"
check groups 200 "$BASE/api/v1/groups/"

exit "$FAILED"
