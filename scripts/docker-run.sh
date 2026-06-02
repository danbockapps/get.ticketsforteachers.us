  docker run -d \
    -p 3000:3000 \
    -v /var/lib/tickets-for-teachers:/app/data \
    --log-driver journald \
    --env-file /home/dan/projects/tickets-for-teachers/.env.production \
    --name tickets-for-teachers \
    tickets-for-teachers