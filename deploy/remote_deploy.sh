#!/usr/bin/env bash
# Pull and start one image tag. Run on the VM: deploy/remote_deploy.sh <tag>
set -euo pipefail
TAG="${1:?usage: remote_deploy.sh <image-tag>}"
cd /opt/studyflow
export IMAGE_TAG="$TAG"
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
"${COMPOSE[@]}" pull --quiet
"${COMPOSE[@]}" up -d --remove-orphans --wait --wait-timeout 300
echo "deployed $TAG"
