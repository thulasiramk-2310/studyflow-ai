#!/usr/bin/env bash
# Nightly Postgres backup, keeps 7 days. Installed in cron by vm_bootstrap.sh.
set -euo pipefail
cd /opt/studyflow
set -a; . ./.env; set +a
mkdir -p backups
docker exec studyflow_postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "backups/studyflow-$(date +%F).sql.gz"
find backups -name 'studyflow-*.sql.gz' -mtime +7 -delete
