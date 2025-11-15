#!/bin/bash

# Restore script for Interceptor AI
# Usage: ./scripts/restore.sh <backup_timestamp>
# Example: ./scripts/restore.sh 20250115_143022

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore.sh <backup_timestamp>"
    echo "Example: ./scripts/restore.sh 20250115_143022"
    exit 1
fi

TIMESTAMP=$1
BACKUP_DIR=${2:-./backups}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔄 Starting restore from backup $TIMESTAMP..."

# Check if backup files exist
if [ ! -f "$BACKUP_DIR/postgres_$TIMESTAMP.sql.gz" ]; then
    echo "❌ Error: Backup file postgres_$TIMESTAMP.sql.gz not found"
    exit 1
fi

# Confirm restore
read -p "⚠️  This will overwrite the current database. Are you sure? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Stop all services
echo "🛑 Stopping services..."
cd "$PROJECT_ROOT"
docker-compose -f docker-compose.prod.yml down

# Start only database services
echo "🚀 Starting database services..."
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

# Restore PostgreSQL
echo "🗄️  Restoring PostgreSQL database..."
gunzip -c "$BACKUP_DIR/postgres_$TIMESTAMP.sql.gz" | \
    docker-compose -f docker-compose.prod.yml exec -T postgres \
    psql -U burponweb burponweb
echo "✅ PostgreSQL database restored"

# Restore Redis
echo "💾 Restoring Redis data..."
if [ -f "$BACKUP_DIR/redis_$TIMESTAMP.rdb" ]; then
    docker-compose -f docker-compose.prod.yml stop redis
    docker cp "$BACKUP_DIR/redis_$TIMESTAMP.rdb" burponweb-redis-prod:/data/dump.rdb
    docker-compose -f docker-compose.prod.yml start redis
    echo "✅ Redis data restored"
fi

# Restore certificates
echo "🔐 Restoring certificates..."
if [ -f "$BACKUP_DIR/certs_$TIMESTAMP.tar.gz" ]; then
    rm -rf "$PROJECT_ROOT/data/certs"
    tar -xzf "$BACKUP_DIR/certs_$TIMESTAMP.tar.gz" -C "$PROJECT_ROOT/data"
    echo "✅ Certificates restored"
fi

# Restore SSL certificates
echo "🔒 Restoring SSL certificates..."
if [ -f "$BACKUP_DIR/ssl_$TIMESTAMP.tar.gz" ]; then
    rm -rf "$PROJECT_ROOT/certbot/conf"
    tar -xzf "$BACKUP_DIR/ssl_$TIMESTAMP.tar.gz" -C "$PROJECT_ROOT/certbot"
    echo "✅ SSL certificates restored"
fi

# Restore logs
echo "📋 Restoring logs..."
if [ -f "$BACKUP_DIR/logs_$TIMESTAMP.tar.gz" ]; then
    rm -rf "$PROJECT_ROOT/data/logs"
    tar -xzf "$BACKUP_DIR/logs_$TIMESTAMP.tar.gz" -C "$PROJECT_ROOT/data"
    echo "✅ Logs restored"
fi

# Start all services
echo "🚀 Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 15

# Health check
echo "🏥 Running health check..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

echo "🎉 Restore completed successfully!"
echo "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps
