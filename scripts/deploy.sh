#!/usr/bin/env bash
set -euo pipefail

# Deploy the latest code change on the server. Run from anywhere.
# See documentation/DEPLOYMENT.md ("Redeploy / update").

cd ~/projects/get.ticketsforteachers.us

git pull
docker build -t get.ticketsforteachers.us .
docker stop get.ticketsforteachers.us || true
docker rm get.ticketsforteachers.us || true

"$(dirname "$0")/docker-run.sh"
