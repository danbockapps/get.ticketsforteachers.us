  docker run -d \
    -p 3000:3000 \
    -v /path/on/vps/data:/app/data \
    --env DATABASE_PATH=/app/data/database.db \
    --name tickets-for-teachers \
    tickets-for-teachers