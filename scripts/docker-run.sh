  docker run -d \
    -p 3000:3000 \
    -v /var/lib/get.ticketsforteachers.us:/app/data \
    --log-driver journald \
    --env-file /home/dan/projects/get.ticketsforteachers.us/.env.production \
    --name get.ticketsforteachers.us \
    get.ticketsforteachers.us