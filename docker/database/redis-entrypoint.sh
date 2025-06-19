#!/bin/sh

mkdir -p /usr/local/etc/redis

cat > /usr/local/etc/redis/redis.conf <<EOF
user ${REDIS_USER} on >${REDIS_PASSWORD} ~* +@all
user default off
EOF

cat > /usr/local/bin/redis-healthcheck.sh <<'HEALTHCHECK_EOF'

if [ -z "$REDIS_USER" ] || [ -z "$REDIS_PASSWORD" ]; then
    echo "Error: REDIS_USER or REDIS_PASSWORD not set"
    exit 1
fi

redis-cli -u "redis://${REDIS_USER}:${REDIS_PASSWORD}@127.0.0.1:6379" PING > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "Redis is healthy"
    exit 0
else
    echo "Redis is not responding"
    exit 1
fi
HEALTHCHECK_EOF

chmod +x /usr/local/bin/redis-healthcheck.sh

exec redis-server /usr/local/etc/redis/redis.conf --appendonly no