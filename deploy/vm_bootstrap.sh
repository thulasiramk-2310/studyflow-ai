#!/usr/bin/env bash
# One-time setup for a fresh Oracle Cloud Ubuntu ARM VM. Run as the default
# `ubuntu` user: bash vm_bootstrap.sh
set -euo pipefail

sudo apt-get update -y
sudo apt-get install -y ca-certificates curl iptables-persistent
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"

# Oracle's Ubuntu image blocks everything except SSH in iptables, even when
# the cloud security list allows it.
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

sudo mkdir -p /opt/studyflow/frontend/releases /opt/studyflow/backups /opt/studyflow/deploy
sudo chown -R "$USER":"$USER" /opt/studyflow
touch /opt/studyflow/.env && chmod 600 /opt/studyflow/.env

( crontab -l 2>/dev/null | grep -v studyflow ; cat <<'CRON'
30 2 * * * /opt/studyflow/deploy/backup.sh >> /opt/studyflow/backups/backup.log 2>&1 # studyflow
0 3 * * 0 docker image prune -af --filter until=168h >/dev/null 2>&1 # studyflow
*/5 * * * * . /opt/studyflow/.env && curl -s "https://www.duckdns.org/update?domains=studyflow-ai&token=$DUCKDNS_TOKEN&ip=" >/dev/null # studyflow
CRON
) | crontab -

echo "Done. Log out and back in so the docker group applies, then fill in /opt/studyflow/.env"
