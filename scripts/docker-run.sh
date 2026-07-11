#!/usr/bin/env bash
set -euo pipefail

# Start the app container. Assumes the image is already built and any old
# container of the same name has been stopped/removed.

docker run -d \
  -p 3000:3000 \
  -v /var/lib/get.ticketsforteachers.us:/app/data \
  --log-driver journald \
  --env-file /home/dan/projects/get.ticketsforteachers.us/.env.production \
  --name get.ticketsforteachers.us \
  get.ticketsforteachers.us
