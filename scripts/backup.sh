#!/bin/bash

# Backup script for Interceptor AI
# Usage: ./scripts/backup.sh [backup_dir]
# Example: ./scripts/backup.sh /backups

set -e

BACKUP_DIR=${1:-./backups}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

mkdir -p "$BACKUP_DIR"

echo "📦 Starting backup at $TIMESTAMP..."

# Backup PostgreSQL database
echo "🗄️  Backing up PostgreSQL database..."
docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres \
    pg_dump -U burponweb burponweb | gzip > "$BACKUP_DIR/postgres_$TIMESTAMP.sql.gz"
echo "✅ Database backup saved to $BACKUP_DIR/postgres_$TIMESTAMP.sql.gz"

# Backup Redis data
echo "💾 Backing up Redis data..."
docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T redis \
    redis-cli --rdb /data/dump.rdb BGSAVE
sleep 5
docker cp burponweb-redis-prod:/data/dump.rdb "$BACKUP_DIR/redis_$TIMESTAMP.rdb"
echo "✅ Redis backup saved to $BACKUP_DIR/redis_$TIMESTAMP.rdb"

# Backup certificates
echo "🔐 Backing up certificates..."
if [ -d "$PROJECT_ROOT/data/certs" ]; then
    tar -czf "$BACKUP_DIR/certs_$TIMESTAMP.tar.gz" -C "$PROJECT_ROOT/data" certs
    echo "✅ Certificates backup saved to $BACKUP_DIR/certs_$TIMESTAMP.tar.gz"
fi

# Backup SSL certificates
echo "🔒 Backing up SSL certificates..."
if [ -d "$PROJECT_ROOT/certbot/conf" ]; then
    tar -czf "$BACKUP_DIR/ssl_$TIMESTAMP.tar.gz" -C "$PROJECT_ROOT/certbot" conf
    echo "✅ SSL certificates backup saved to $BACKUP_DIR/ssl_$TIMESTAMP.tar.gz"
fi

# Backup logs
echo "📋 Backing up logs..."
if [ -d "$PROJECT_ROOT/data/logs" ]; then
    tar -czf "$BACKUP_DIR/logs_$TIMESTAMP.tar.gz" -C "$PROJECT_ROOT/data" logs
    echo "✅ Logs backup saved to $BACKUP_DIR/logs_$TIMESTAMP.tar.gz"
fi

# Create backup manifest
cat > "$BACKUP_DIR/manifest_$TIMESTAMP.txt" << EOF
Backup Manifest
Created: $TIMESTAMP
Database: postgres_$TIMESTAMP.sql.gz
Redis: redis_$TIMESTAMP.rdb
Certificates: certs_$TIMESTAMP.tar.gz
SSL: ssl_$TIMESTAMP.tar.gz
Logs: logs_$TIMESTAMP.tar.gz
EOF

echo "📄 Manifest saved to $BACKUP_DIR/manifest_$TIMESTAMP.txt"

# Clean up old backups (keep last 7 days)
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -type f -mtime +7 -delete
echo "✅ Old backups cleaned up"

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "📊 Total backup size: $TOTAL_SIZE"

echo "🎉 Backup completed successfully!"
echo "📁 Backup location: $BACKUP_DIR"
