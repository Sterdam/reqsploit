#!/bin/bash

# SSL Setup script using Let's Encrypt
# Usage: ./scripts/setup-ssl.sh <domain> <email>
# Example: ./scripts/setup-ssl.sh interceptor-ai.com admin@interceptor-ai.com

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: ./scripts/setup-ssl.sh <domain> <email>"
    echo "Example: ./scripts/setup-ssl.sh interceptor-ai.com admin@interceptor-ai.com"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔐 Setting up SSL certificate for $DOMAIN..."

# Create directories
mkdir -p "$PROJECT_ROOT/certbot/conf"
mkdir -p "$PROJECT_ROOT/certbot/www"

# Update Nginx configuration with domain
echo "📝 Updating Nginx configuration..."
sed -i "s/server_name _;/server_name $DOMAIN;/" "$PROJECT_ROOT/nginx/nginx.conf"

# Start Nginx without SSL first
echo "🚀 Starting Nginx for certificate verification..."
cd "$PROJECT_ROOT"
docker-compose -f docker-compose.prod.yml up -d nginx

# Wait for Nginx to be ready
echo "⏳ Waiting for Nginx to be ready..."
sleep 5

# Request certificate
echo "📜 Requesting SSL certificate from Let's Encrypt..."
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Enable HTTPS in Nginx configuration
echo "🔧 Enabling HTTPS in Nginx..."
cat > "$PROJECT_ROOT/nginx/nginx-ssl.conf" << EOF
# Nginx reverse proxy configuration with SSL
upstream backend {
    server backend:3000;
}

upstream frontend {
    server frontend:80;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=auth_limit:10m rate=5r/m;

# HTTP - redirect to HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/$DOMAIN/chain.pem;

    client_max_body_size 10M;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # API routes
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Authentication endpoints
    location ~ ^/api/auth/(login|register) {
        limit_req zone=auth_limit burst=3 nodelay;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Replace Nginx configuration
mv "$PROJECT_ROOT/nginx/nginx-ssl.conf" "$PROJECT_ROOT/nginx/nginx.conf"

# Restart Nginx with SSL
echo "🔄 Restarting Nginx with SSL..."
docker-compose -f docker-compose.prod.yml restart nginx

# Wait for Nginx to be ready
sleep 5

# Test SSL
echo "🧪 Testing SSL certificate..."
if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
    echo "✅ SSL certificate is working!"
    echo "🎉 Your site is now available at https://$DOMAIN"
else
    echo "❌ SSL test failed. Check the logs:"
    docker-compose -f docker-compose.prod.yml logs nginx
    exit 1
fi

echo "📋 Certificate renewal is automated via certbot service"
echo "🔒 SSL setup completed successfully!"
