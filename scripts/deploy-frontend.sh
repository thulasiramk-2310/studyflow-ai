#!/usr/bin/env bash
#
# Redeploy the StudyFlow frontend to S3 + CloudFront.
#
# The app is served from a single CloudFront origin (frontend from S3, /api and
# /auth routed to the ALB), so the build MUST use relative API paths — this
# script forces VITE_API_BASE_URL="" regardless of any local .env.
#
# Usage:   bash scripts/deploy-frontend.sh
#
# Override the targets via env vars if the infra is ever recreated:
#   FRONTEND_BUCKET=... CLOUDFRONT_DIST_ID=... bash scripts/deploy-frontend.sh
#
set -euo pipefail

BUCKET="${FRONTEND_BUCKET:-studyflow-frontend-dev-809809510670}"
DISTRIBUTION_ID="${CLOUDFRONT_DIST_ID:-E3VVVJTVK24PDV}"
REGION="${AWS_REGION:-ap-south-1}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

echo "==> Building frontend (relative API paths)..."
cd "$FRONTEND_DIR"
VITE_API_BASE_URL="" npm run build

if [ ! -f dist/index.html ]; then
  echo "ERROR: dist/index.html not found — build failed." >&2
  exit 1
fi

# Safety: the single-origin setup breaks if an absolute API URL is baked in.
if grep -rq "elb.amazonaws.com" dist/ 2>/dev/null; then
  echo "ERROR: build contains an absolute ALB URL — check VITE_API_BASE_URL." >&2
  exit 1
fi

echo "==> Uploading hashed assets (immutable, long cache)..."
aws s3 sync dist/assets/ "s3://$BUCKET/assets/" \
  --region "$REGION" --delete \
  --cache-control "public,max-age=31536000,immutable"

echo "==> Uploading root files (index.html, icons — no cache)..."
aws s3 sync dist/ "s3://$BUCKET/" \
  --region "$REGION" --delete --exclude "assets/*" \
  --cache-control "no-cache"

echo "==> Invalidating CloudFront cache..."
INVALIDATION_ID="$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query "Invalidation.Id" --output text)"
echo "    invalidation: $INVALIDATION_ID (waiting for completion, ~1-2 min)"
aws cloudfront wait invalidation-completed \
  --distribution-id "$DISTRIBUTION_ID" --id "$INVALIDATION_ID"

echo "==> Done. Live at https://d1ejnwh4j27hm7.cloudfront.net"
