# ReqSploit - Production Deployment Guide

Complete guide for deploying ReqSploit to production.

## 📋 Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Docker 24.0+ and Docker Compose 2.20+
- Domain name with DNS configured
- Port 80 and 443 open
- Minimum 2GB RAM, 2 CPU cores, 20GB disk
- Anthropic API key

## 🚀 Quick Start

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone Repository

```bash
# Create application directory
sudo mkdir -p /opt/burponweb
sudo chown $USER:$USER /opt/burponweb
cd /opt/burponweb

# Clone repository
git clone https://github.com/yourusername/burponweb.git .
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.production.example .env.production

# Edit environment variables
nano .env.production
```

**Required variables:**
```bash
# Database
POSTGRES_PASSWORD=your_strong_password_here

# Redis
REDIS_PASSWORD=your_strong_password_here

# JWT Secrets (generate with: openssl rand -base64 64)
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-...

# URLs
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-domain.com
```

### 4. Deploy Application

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy
./scripts/deploy.sh production
```

### 5. Setup SSL (Let's Encrypt)

```bash
# Setup SSL certificate
./scripts/setup-ssl.sh your-domain.com admin@your-domain.com
```

## 📊 Monitoring & Maintenance

### Check Service Status

```bash
# View all containers
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Health Checks

```bash
# Check application health
curl https://your-domain.com/health

# Check backend health
curl https://your-domain.com/api/health

# Check WebSocket
curl https://your-domain.com/socket.io/
```

### Database Management

```bash
# Access PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U burponweb

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# View database size
docker-compose -f docker-compose.prod.yml exec postgres psql -U burponweb -c "SELECT pg_size_pretty(pg_database_size('burponweb'));"
```

### Backup & Restore

```bash
# Create backup
./scripts/backup.sh /backups

# Restore from backup
./scripts/restore.sh 20250115_143022 /backups

# Automated backups with cron
crontab -e
# Add: 0 2 * * * /opt/burponweb/scripts/backup.sh /backups
```

## 🔄 Updates & Rollbacks

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
./scripts/deploy.sh production
```

### Rollback

```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Restore from backup
./scripts/restore.sh <backup_timestamp>

# Or checkout previous version
git checkout <previous_commit>
./scripts/deploy.sh production
```

## 🔐 Security Hardening

### Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### SSL/TLS Hardening

The Nginx configuration includes:
- TLS 1.2 and 1.3 only
- Strong cipher suites
- HSTS headers
- OCSP stapling
- Session caching

### Rate Limiting

Configured in `nginx/nginx.conf`:
- API endpoints: 10 requests/second
- Auth endpoints: 5 requests/minute

### Security Headers

All responses include:
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `X-XSS-Protection`
- `Referrer-Policy`

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.prod.yml
backend:
  deploy:
    replicas: 3
```

### Vertical Scaling

```yaml
# docker-compose.prod.yml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
```

### Database Scaling

- Enable PostgreSQL replication
- Add read replicas
- Configure connection pooling

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Check resource usage
docker stats

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check connection
docker-compose -f docker-compose.prod.yml exec backend npx prisma db pull

# Reset database
docker-compose -f docker-compose.prod.yml exec postgres psql -U burponweb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### SSL Certificate Issues

```bash
# Renew certificate manually
docker-compose -f docker-compose.prod.yml run --rm certbot renew

# Check certificate expiry
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### High Memory Usage

```bash
# Check memory usage
docker stats

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Clear Docker cache
docker system prune -af
```

## 📞 Support

### Logs Location

- Backend logs: `/data/logs/backend.log`
- Nginx logs: `/var/log/nginx/`
- Docker logs: `docker-compose logs`

### System Requirements

**Minimum:**
- 2GB RAM
- 2 CPU cores
- 20GB disk
- 10 Mbps network

**Recommended:**
- 4GB RAM
- 4 CPU cores
- 50GB SSD
- 100 Mbps network

**Production:**
- 8GB RAM
- 8 CPU cores
- 100GB SSD
- 1 Gbps network

### Performance Tuning

```bash
# Optimize PostgreSQL
# Edit postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9

# Optimize Redis
# Edit redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
```

## 🔄 CI/CD with GitHub Actions

The project includes automated CI/CD workflows in `.github/workflows/ci-cd.yml`.

### Setup GitHub Secrets

1. Go to GitHub repository → Settings → Secrets
2. Add the following secrets:
   - `SSH_PRIVATE_KEY`: SSH key for server access
   - `SSH_HOST`: Server IP address
   - `SSH_USER`: SSH username
   - `ANTHROPIC_API_KEY`: Anthropic API key

### Workflow Features

- ✅ Automated testing on push/PR
- ✅ Docker image building and pushing
- ✅ Security scanning with Trivy
- ✅ Automated deployment to production
- ✅ Health checks after deployment

### Manual Deployment

```bash
# Trigger deployment manually
git tag v1.0.0
git push origin v1.0.0
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

**Version**: 1.0.0
**Last Updated**: 2025-01-15
