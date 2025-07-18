#!/bin/bash
# setup-infrastructure.sh
echo "Setting up global infrastructure..."

docker network create nginx-proxy 2>/dev/null || echo "Network nginx-proxy already exists"

docker volume create nginx-certs 2>/dev/null || true
docker volume create nginx-vhost 2>/dev/null || true
docker volume create nginx-html 2>/dev/null || true
docker volume create acme-state 2>/dev/null || true

# 啟動 nginx-proxy
if ! docker ps | grep -q nginx-proxy; then
    echo "Starting nginx-proxy..."
    docker run -d \
        --name nginx-proxy \
        --network webproxy \
        -p 80:80 \
        -p 443:443 \
        -v /var/run/docker.sock:/tmp/docker.sock:ro \
        -v nginx-certs:/etc/nginx/certs \
        -v nginx-vhost:/etc/nginx/vhost.d \
        -v nginx-html:/usr/share/nginx/html \
        --restart unless-stopped \
        nginxproxy/nginx-proxy:latest
else
    echo "nginx-proxy is already running"
fi

# 啟動 acme-companion
if ! docker ps | grep -q acme-companion; then
    echo "Starting acme-companion..."
    docker run -d \
        --name acme-companion \
        --network webproxy \
        -v /var/run/docker.sock:/var/run/docker.sock:ro \
        -v nginx-certs:/etc/nginx/certs \
        -v nginx-vhost:/etc/nginx/vhost.d \
        -v nginx-html:/usr/share/nginx/html \
        -v acme-state:/etc/acme.sh \
        --volumes-from nginx-proxy \
        --restart unless-stopped \
        nginxproxy/acme-companion:latest
else
    echo "acme-companion is already running"
fi

echo "Infrastructure setup completed"