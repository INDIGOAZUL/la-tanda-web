# 🚀 La Tanda API - Hostinger Deployment Guide

## 📦 Deployment Package Ready
**File**: `DEPLOYMENT-PACKAGE.tar.gz` (335K)  
**Contains**: Complete La Tanda API with PostgreSQL database  
**Status**: ✅ Production-ready with 100% database integration

## 🎯 Manual Deployment Steps

### Step 1: Access Hostinger Control Panel
1. Login to your Hostinger account
2. Navigate to your hosting dashboard
3. Access **File Manager** or **SSH Terminal**

### Step 2: Upload Deployment Package
```bash
# Option A: File Manager Upload
- Click "Upload" in File Manager
- Select: DEPLOYMENT-PACKAGE.tar.gz
- Upload to: /public_html/ or /var/www/

# Option B: SSH Upload (if available)
scp DEPLOYMENT-PACKAGE.tar.gz username@api.latanda.online:~/
```

### Step 3: Extract Package
```bash
# In File Manager: Right-click → Extract
# Or via SSH:
tar -xzf DEPLOYMENT-PACKAGE.tar.gz
cd backup-production-ready-20250802-105030/
```

### Step 4: Install Dependencies
```bash
# Install Node.js (if not already installed)
# Via Hostinger control panel or:
npm install --production
```

### Step 5: Setup PostgreSQL Database
```bash
# Create database (via Hostinger DB panel or SSH)
createdb latanda_production

# Import database
psql latanda_production < latanda_database_backup.sql

# Create user and permissions
psql -c "CREATE USER latanda_user WITH PASSWORD 'your_secure_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE latanda_production TO latanda_user;"
```

### Step 6: Configure Environment
Edit `.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=latanda_production
DB_USER=latanda_user
DB_PASSWORD=your_secure_password

PORT=3001
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key

CORS_ORIGINS=https://latanda.online,https://api.latanda.online
```

### Step 7: Start API Server
```bash
# Start the server
node api-server-database.js

# Or use PM2 for production
npm install -g pm2
pm2 start api-server-database.js --name "latanda-api"
pm2 startup
pm2 save
```

### Step 8: Configure Web Server
Add to Apache/Nginx config:
```apache
# Apache VirtualHost for api.latanda.online
<VirtualHost *:443>
    ServerName api.latanda.online
    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
</VirtualHost>
```

## 🔧 Verification Steps

### Test API Endpoints
```bash
# Health check
curl https://api.latanda.online/health

# System status
curl https://api.latanda.online/api/system/status

# Admin login test
curl -X POST https://api.latanda.online/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@latanda.online","password":"[REDACTED]"}'
```

### Expected Responses
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "stats": {
      "users": 2,
      "groups": 0,
      "contributions": 0,
      "transactions": 0
    }
  }
}
```

## 📊 Database Verification
```sql
-- Check tables
\dt

-- Verify users
SELECT name, email, role FROM users;

-- Check database stats
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM groups) as groups,
  (SELECT COUNT(*) FROM contributions) as contributions;
```

## 🔒 Security Checklist
- [ ] Database password changed from default
- [ ] JWT secret updated for production
- [ ] CORS origins configured for your domains
- [ ] SSL certificate installed
- [ ] Firewall configured (port 3001 internal only)
- [ ] Regular database backups scheduled

## 🚨 Troubleshooting

### Common Issues
1. **Database Connection Error**
   - Check PostgreSQL service is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **Permission Denied**
   - Check file ownership: `chown -R www-data:www-data /path/to/app`
   - Verify execute permissions on node

3. **Port Already in Use**
   - Change PORT in `.env`
   - Kill existing process: `pkill node`

### Log Files
- Application logs: Check console output
- Database logs: `/var/log/postgresql/`
- Web server logs: `/var/log/apache2/` or `/var/log/nginx/`

## 📞 Support
- API Documentation: All 73+ endpoints documented in code
- Database Schema: Complete in `database/schema.sql`
- Test Suite: Run `node test-database-final.js`

---

**🎉 Deployment Status**: Ready for production  
**💯 Integration**: 100% PostgreSQL complete  
**✅ Testing**: 7/7 tests passed  
**🚀 Go Live**: Ready for api.latanda.online