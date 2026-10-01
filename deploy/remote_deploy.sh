#!/usr/bin/env bash
# Pull and start one release. Run on the VM: deploy/remote_deploy.sh <tag>
#
# Each release keeps its own compose files and Caddyfile in releases/<tag>/,
# uploaded by CI. Deploying a tag first restores that tag's config, so rolling
# back to an older tag also undoes config changes made by the newer one.
set -euo pipefail
TAG="${1:?usage: remote_deploy.sh <image-tag>}"
ROOT="${STUDYFLOW_ROOT:-/opt/studyflow}"
RELEASE="$ROOT/releases/$TAG"

for f in docker-compose.yml docker-compose.prod.yml Caddyfile; do
  if [ ! -f "$RELEASE/$f" ]; then
    echo "missing $RELEASE/$f" >&2
    exit 1
  fi
done

cd "$ROOT"
cp "$RELEASE/docker-compose.yml" "$RELEASE/docker-compose.prod.yml" .
mkdir -p deploy
cp "$RELEASE/Caddyfile" deploy/Caddyfile

export IMAGE_TAG="$TAG"
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
"${COMPOSE[@]}" pull --quiet
"${COMPOSE[@]}" up -d --remove-orphans --wait --wait-timeout 300
# The caddy container is not recreated when only the Caddyfile changes, and
# Caddy does not watch its config file.
"${COMPOSE[@]}" exec -T caddy caddy reload --config /etc/caddy/Caddyfile
echo "deployed $TAG"
