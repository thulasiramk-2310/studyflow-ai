# Deploying StudyFlow AI to an Oracle Cloud free VM

One-time setup, about 30 minutes. After this, every push to `main` deploys automatically.

## 1. Create the VM
1. Sign up at cloud.oracle.com (card is for verification; Always Free resources are never charged).
2. Compute > Instances > Create: image **Ubuntu 22.04**, shape **VM.Standard.A1.Flex**, 4 OCPU, 24 GB RAM. Upload your SSH public key.
3. Networking > the instance's subnet > Security List > add ingress rules for TCP 80 and 443 from `0.0.0.0/0`.
4. Note the public IP. Optional: reserve it (Networking > Reserved Public IPs) so it never changes.

## 2. Register the domain
1. Sign in at duckdns.org, create the subdomain `studyflow-ai`, point it at the VM's public IP.
2. Copy your DuckDNS token.

## 3. Prepare the VM
    scp deploy/vm_bootstrap.sh ubuntu@<VM_IP>:~
    ssh ubuntu@<VM_IP> 'bash vm_bootstrap.sh'

Then log in again and fill `/opt/studyflow/.env` with every key from your local `.env.example` (it is gitignored, so copy it from your machine), plus:

    DUCKDNS_TOKEN=<your token>
    SITE_ADDRESS=studyflow-ai.duckdns.org

## 4. GitHub settings
Repository > Settings > Secrets and variables > Actions > New repository secret:

| Secret | Value |
|---|---|
| `VM_HOST` | the VM public IP |
| `VM_SSH_KEY` | private key matching the VM's authorized key |
| `DEMO_PASSWORD` | password for `demo@studyflow.ai` |

After the first workflow run, open each package under your GitHub profile > Packages (`studyflow-auth`, `-study`, `-ai`, `-gateway`) > Package settings > Change visibility > **Public**, so the VM can pull without credentials.

## 5. Uptime monitoring
At uptimerobot.com create an HTTP(s) monitor for `https://studyflow-ai.duckdns.org/health`, 5-minute interval, email alerts.

## Operations
- Deploy a specific version: Actions > Deploy > Run workflow.
- Logs: `ssh ubuntu@<VM_IP> 'cd /opt/studyflow && docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail 100 <service>'`
- Restore a backup: `gunzip -c backups/studyflow-<date>.sql.gz | docker exec -i studyflow_postgres psql -U <user> <db>`
