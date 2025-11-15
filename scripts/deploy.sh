#!/bin/bash

# Deployment script for Interceptor AI
# Usage: ./scripts/deploy.sh [environment]
# Example: ./scripts/deploy.sh production

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
    echo "📋 Loading environment variables from .env.$ENVIRONMENT"
    set -a
    source "$PROJECT_ROOT/.env.$ENVIRONMENT"
    set +a
else
    echo "⚠️  Warning: .env.$ENVIRONMENT not found"
fi

# Check required environment variables
REQUIRED_VARS=(
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "ANTHROPIC_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set"
        exit 1
    fi
done

echo "✅ All required environment variables are set"

# Build Docker images
echo "🏗️  Building Docker images..."
cd "$PROJECT_ROOT"

docker-compose -f docker-compose.prod.yml build --no-cache

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Start new containers
echo "🐳 Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health of all services
SERVICES=("postgres" "redis" "backend" "frontend" "nginx")
for service in "${SERVICES[@]}"; do
    echo "🔍 Checking health of $service..."
    timeout 60 bash -c "until docker-compose -f docker-compose.prod.yml ps | grep $service | grep -q 'healthy\|Up'; do sleep 2; done"
    echo "✅ $service is healthy"
done

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

# Check final health
echo "🏥 Final health check..."
sleep 5

if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    echo "📋 Checking logs..."
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

# Clean up old images
echo "🧹 Cleaning up old Docker images..."
docker system prune -af

echo "🎉 Deployment to $ENVIRONMENT completed successfully!"
echo "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps
