# La Tanda API - Development & Extension Guide

**Version:** 2.0.0  
**Environment:** Production  
**URL:** https://api.latanda.online  
**Database:** PostgreSQL  
**Last Updated:** August 2, 2025

---

## 📚 Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Adding New Tables](#adding-new-tables)
4. [Adding New API Endpoints](#adding-new-api-endpoints)
5. [File Structure](#file-structure)
6. [Development Workflow](#development-workflow)
7. [Testing Guide](#testing-guide)
8. [Deployment Process](#deployment-process)
9. [Security Guidelines](#security-guidelines)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ System Architecture

### Production Stack
- **Web Server:** Nginx (reverse proxy)
- **Application:** Node.js + Express
- **Database:** PostgreSQL 16
- **Process Manager:** PM2
- **SSL:** Let's Encrypt
- **Authentication:** JWT tokens

### File Locations
```
/root/backup-production-ready-20250802-105030/
├── api-server-database.js       # Main API server
├── database/
│   ├── connection.js           # Database connection pool
│   └── schema.sql             # Complete database schema
├── .env                       # Production environment variables
├── package.json              # Dependencies
└── logs/                     # Application logs
```

---

## 🗄️ Database Schema

### Current Tables (11 total)

#### 1. **users** - User accounts and authentication
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user',
    verification_level VARCHAR(50) DEFAULT 'basic',
    kyc_status VARCHAR(50) DEFAULT 'pending',
    status VARCHAR(50) DEFAULT 'active',
    wallet_address VARCHAR(255),
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    profile_image_url TEXT,
    bio TEXT,
    two_factor_enabled BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false
);
```

#### 2. **groups** - Tanda group management
```sql
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    admin_id UUID NOT NULL REFERENCES users(id),
    contribution_amount NUMERIC(10,2) NOT NULL,
    max_members INTEGER NOT NULL,
    frequency VARCHAR(20) NOT NULL, -- 'weekly', 'biweekly', 'monthly'
    category VARCHAR(100) DEFAULT 'general',
    status VARCHAR(50) DEFAULT 'active',
    location VARCHAR(255) DEFAULT 'Honduras',
    start_date DATE,
    end_date DATE,
    total_amount_collected NUMERIC(15,2) DEFAULT 0.00,
    current_cycle INTEGER DEFAULT 1,
    rules JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. **group_members** - Group membership tracking
```sql
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id),
    user_id UUID NOT NULL REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    member_status VARCHAR(50) DEFAULT 'active',
    member_number INTEGER NOT NULL,
    total_contributed NUMERIC(10,2) DEFAULT 0.00,
    UNIQUE(group_id, user_id),
    UNIQUE(group_id, member_number)
);
```

#### 4. **contributions** - Payment tracking
```sql
CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    group_id UUID NOT NULL REFERENCES groups(id),
    amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    transaction_id VARCHAR(255),
    confirmation_code VARCHAR(100),
    notes TEXT,
    due_date DATE,
    paid_date TIMESTAMP WITH TIME ZONE,
    cycle_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. **transactions** - Financial transaction log
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'HNL',
    status VARCHAR(50) DEFAULT 'pending',
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    transaction_hash VARCHAR(255),
    confirmation_code VARCHAR(100),
    group_id UUID REFERENCES groups(id),
    contribution_id UUID REFERENCES contributions(id),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. **turn_assignments** - Payout order management
```sql
CREATE TABLE turn_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id),
    user_id UUID NOT NULL REFERENCES users(id),
    turn_number INTEGER NOT NULL,
    lottery_number INTEGER,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_payout_date DATE,
    actual_payout_date TIMESTAMP WITH TIME ZONE,
    payout_amount NUMERIC(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    cycle_number INTEGER DEFAULT 1,
    UNIQUE(group_id, turn_number, cycle_number),
    UNIQUE(group_id, user_id, cycle_number)
);
```

#### 7. **lottery_results** - Fair payout selection
```sql
CREATE TABLE lottery_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id),
    conducted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    conducted_by UUID NOT NULL REFERENCES users(id),
    total_participants INTEGER NOT NULL,
    lottery_method VARCHAR(50) DEFAULT 'random_number_generation',
    results JSONB NOT NULL,
    fairness_score INTEGER,
    validation_hash VARCHAR(255),
    cycle_number INTEGER DEFAULT 1,
    is_re_lottery BOOLEAN DEFAULT false,
    reason TEXT
);
```

#### 8. **notifications** - User notification system
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 9. **kyc_documents** - KYC compliance
```sql
CREATE TABLE kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100),
    document_url TEXT,
    verification_status VARCHAR(50) DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    expiry_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 10. **user_sessions** - Session management
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    session_token VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 11. **user_wallets** - Digital wallet integration
```sql
CREATE TABLE user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    balance NUMERIC(15,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'HNL',
    crypto_balances JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT false,
    wallet_address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ➕ Adding New Tables

### Step 1: Design the Table
1. **Plan the schema** with proper data types
2. **Define relationships** using foreign keys
3. **Add constraints** for data integrity
4. **Include indexes** for performance

### Step 2: Create Migration SQL
```sql
-- Example: Adding a new "rewards" table
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    redeemed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}'
);

-- Add indexes
CREATE INDEX idx_rewards_user_id ON rewards(user_id);
CREATE INDEX idx_rewards_type ON rewards(reward_type);
CREATE INDEX idx_rewards_status ON rewards(status);

-- Add trigger for updated_at (if needed)
CREATE TRIGGER update_rewards_updated_at 
    BEFORE UPDATE ON rewards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Apply Migration
```bash
# Connect to production database
sudo -u postgres psql latanda_production

# Run the migration
\i new_table_migration.sql

# Verify the table
\dt
\d rewards
```

### Step 4: Update Application Code
Add the table operations to `api-server-database.js`:
```javascript
// Add reward operations
app.post('/api/rewards', authenticateToken, async (req, res) => {
    try {
        const { reward_type, amount, description } = req.body;
        const result = await db.query(`
            INSERT INTO rewards (user_id, reward_type, amount, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [req.user.id, reward_type, amount, description]);
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: error.message, code: 500 }
        });
    }
});
```

---

## 🔗 Adding New API Endpoints

### Current API Structure (85+ endpoints)

#### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Password reset

#### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upload-avatar` - Upload profile image
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/verify` - Verify user account

#### Group Management
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create new group
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/leave` - Leave group

#### Financial Operations
- `GET /api/contributions` - List contributions
- `POST /api/contributions` - Make contribution
- `GET /api/transactions` - Transaction history
- `POST /api/transactions` - Create transaction
- `GET /api/wallets/balance` - Get wallet balance

#### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/send` - Send notification

### Adding New Endpoints

#### Step 1: Plan the Endpoint
```javascript
// Define the endpoint structure
Method: POST/GET/PUT/DELETE
Route: /api/resource
Authentication: Required/Optional
Validation: Input validation rules
Response: Success/Error format
```

#### Step 2: Add to api-server-database.js
```javascript
// Example: Adding a rewards endpoint
app.get('/api/rewards', authenticateToken, [
    // Add validation middleware if needed
    query('status').optional().isIn(['active', 'redeemed', 'expired']),
    query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
    try {
        const { status = 'active', limit = 20, offset = 0 } = req.query;
        
        let whereClause = 'WHERE user_id = $1';
        let params = [req.user.id];
        
        if (status) {
            whereClause += ' AND status = $2';
            params.push(status);
        }
        
        const result = await db.query(`
            SELECT * FROM rewards 
            ${whereClause}
            ORDER BY earned_at DESC 
            LIMIT $${params.length + 1} 
            OFFSET $${params.length + 2}
        `, [...params, limit, offset]);
        
        const countResult = await db.query(`
            SELECT COUNT(*) as total FROM rewards ${whereClause}
        `, params);
        
        res.json({
            success: true,
            data: {
                rewards: result.rows,
                pagination: {
                    total: parseInt(countResult.rows[0].total),
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: result.rows.length === parseInt(limit)
                }
            },
            meta: {
                timestamp: new Date().toISOString(),
                user_id: req.user.id
            }
        });
        
    } catch (error) {
        console.error('Rewards fetch error:', error);
        res.status(500).json({
            success: false,
            error: { 
                message: 'Failed to fetch rewards', 
                code: 500 
            }
        });
    }
});
```

#### Step 3: Add Input Validation
```javascript
// Use express-validator for input validation
const { body, query, param, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array(),
                code: 400
            }
        });
    }
    next();
};

// Example validations
app.post('/api/rewards/redeem', authenticateToken, [
    body('reward_id').isUUID().withMessage('Valid reward ID required'),
    body('redemption_method').isIn(['cash', 'transfer', 'credit'])
], handleValidationErrors, async (req, res) => {
    // Endpoint logic here
});
```

#### Step 4: Add Authentication & Authorization
```javascript
// Authentication middleware (already implemented)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: { message: 'Access token required', code: 401 }
        });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: { message: 'Invalid or expired token', code: 403 }
            });
        }
        req.user = user;
        next();
    });
};

// Role-based authorization
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Insufficient permissions', code: 403 }
            });
        }
        next();
    };
};

// Usage
app.delete('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    // Admin-only endpoint
});
```

#### Step 5: Error Handling
```javascript
// Consistent error response format
const sendError = (res, statusCode, message, details = null) => {
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            code: statusCode,
            details,
            timestamp: new Date().toISOString()
        }
    });
};

// Database error handling
try {
    const result = await db.query(query, params);
    // Success response
} catch (error) {
    console.error('Database error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
        return sendError(res, 409, 'Resource already exists');
    }
    if (error.code === '23503') { // Foreign key violation
        return sendError(res, 400, 'Invalid reference');
    }
    
    return sendError(res, 500, 'Internal server error');
}
```

---

## 📁 File Structure

### Core Files
```
/root/backup-production-ready-20250802-105030/
├── api-server-database.js       # Main API server (2,204 lines)
├── database/
│   ├── connection.js           # DB connection pool (238 lines)
│   └── schema.sql             # Complete schema (1,009 lines)
├── .env                       # Environment variables
├── package.json              # Dependencies & scripts
├── package-lock.json          # Locked dependencies
└── logs/                     # Application logs
```

### Development Files (in backup)
```
├── test-database-final.js      # Database integration tests
├── web3-dashboard.html         # Frontend dashboard
├── auth-enhanced.html          # Authentication interface
├── kyc-registration.html       # KYC compliance form
├── marketplace-social.html     # Marketplace features
├── tanda-wallet.html          # Wallet interface
└── *.js                      # Frontend JavaScript modules
```

---

## 🔄 Development Workflow

### 1. Local Development Setup
```bash
# Clone or download the deployment package
cd /path/to/development

# Install dependencies
npm install

# Set up local PostgreSQL
createdb latanda_development
psql latanda_development < database/schema.sql

# Create development environment
cp .env .env.development
# Edit .env.development with local database credentials

# Start development server
NODE_ENV=development node api-server-database.js
```

### 2. Making Changes
```bash
# 1. Create feature branch (if using git)
git checkout -b feature/new-rewards-system

# 2. Make database changes
# - Create migration SQL file
# - Test on development database

# 3. Update API code
# - Add new endpoints
# - Update existing endpoints
# - Add validation

# 4. Test changes
node test-database-final.js

# 5. Update documentation
```

### 3. Testing Changes
```bash
# Run integration tests
node test-database-final.js

# Test specific endpoints
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@latanda.online","password":"[REDACTED]"}'

# Test with authentication
curl -X GET http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Production Deployment
```bash
# 1. Backup current production
sudo -u postgres pg_dump latanda_production > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply database migrations
sudo -u postgres psql latanda_production < new_migration.sql

# 3. Update application code
# Replace api-server-database.js with new version

# 4. Restart application
pm2 restart latanda-api

# 5. Test production
curl https://api.latanda.online/health
```

---

## 🧪 Testing Guide

### Database Integration Tests
```javascript
// File: test-database-final.js
const tests = [
    {
        name: '🏥 Health Check',
        path: '/health',
        method: 'GET'
    },
    {
        name: '🔐 Admin Login',
        path: '/api/auth/login',
        method: 'POST',
        data: {
            email: 'admin@latanda.online',
            password: '[REDACTED]'
        }
    },
    // Add new tests here
];
```

### Adding New Tests
```javascript
// Add to the tests array in test-database-final.js
{
    name: '🎁 Get User Rewards',
    path: '/api/rewards',
    method: 'GET',
    requiresAuth: true, // Will use token from previous login
    expectStatus: 200
},
{
    name: '🎁 Create New Reward',
    path: '/api/rewards',
    method: 'POST',
    requiresAuth: true,
    data: {
        reward_type: 'contribution_bonus',
        amount: 50.00,
        description: 'Monthly contribution bonus'
    }
}
```

### Manual Testing Commands
```bash
# Health check
curl https://api.latanda.online/health

# Login and get token
TOKEN=$(curl -s -X POST https://api.latanda.online/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@latanda.online","password":"[REDACTED]"}' \
  | jq -r '.data.token')

# Use token for authenticated requests
curl -X GET https://api.latanda.online/api/users/profile \
  -H "Authorization: Bearer $TOKEN"

# Test new endpoints
curl -X GET https://api.latanda.online/api/rewards \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🚀 Deployment Process

### Production Environment
- **Server:** api.latanda.online (168.231.67.201)
- **Database:** PostgreSQL 16
- **Web Server:** Nginx with SSL
- **Process Manager:** PM2
- **Location:** `/root/backup-production-ready-20250802-105030/`

### Deployment Steps
```bash
# 1. Connect to production server
ssh root@api.latanda.online

# 2. Backup current system
cd /root/backup-production-ready-20250802-105030
cp api-server-database.js api-server-database.js.backup.$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump latanda_production > db_backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Apply database changes (if any)
sudo -u postgres psql latanda_production < new_migration.sql

# 4. Update application files
# Upload new api-server-database.js or other files

# 5. Restart services
pm2 restart latanda-api
systemctl reload nginx

# 6. Verify deployment
curl https://api.latanda.online/health
pm2 logs latanda-api --lines 20
```

### Rollback Procedure
```bash
# If deployment fails, rollback:
# 1. Restore application
cp api-server-database.js.backup.TIMESTAMP api-server-database.js

# 2. Restore database (if needed)
sudo -u postgres psql latanda_production < db_backup_TIMESTAMP.sql

# 3. Restart services
pm2 restart latanda-api
```

---

## 🔒 Security Guidelines

### Database Security
```sql
-- Always use parameterized queries
const result = await db.query(
    'SELECT * FROM users WHERE email = $1', 
    [email]
);

-- Never do this (SQL injection risk):
const result = await db.query(
    `SELECT * FROM users WHERE email = '${email}'`
);
```

### Input Validation
```javascript
// Always validate input
const { body } = require('express-validator');

app.post('/api/endpoint', [
    body('email').isEmail().normalizeEmail(),
    body('amount').isNumeric().custom(value => value > 0),
    body('description').trim().isLength({ min: 1, max: 500 })
], handleValidationErrors, async (req, res) => {
    // Endpoint logic
});
```

### Authentication
```javascript
// Always check authentication for protected endpoints
app.get('/api/protected', authenticateToken, async (req, res) => {
    // Only authenticated users can access
});

// Check user permissions
app.delete('/api/admin-only', authenticateToken, requireRole(['admin']), async (req, res) => {
    // Only admins can access
});
```

### Environment Variables
```bash
# Never commit sensitive data
# Always use environment variables
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key

# Use strong passwords
# Rotate secrets regularly
# Use different secrets for development/production
```

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL status
systemctl status postgresql

# Check database connections
sudo -u postgres psql latanda_production -c "SELECT COUNT(*) FROM users;"

# Check connection pool
# Look for poolStats in /health endpoint
curl https://api.latanda.online/health | jq '.database.stats.poolStats'
```

#### API Server Issues
```bash
# Check PM2 status
pm2 list
pm2 logs latanda-api

# Check if port is in use
netstat -tlnp | grep :3001

# Restart API server
pm2 restart latanda-api
```

#### Nginx Issues
```bash
# Test Nginx configuration
nginx -t

# Check Nginx status
systemctl status nginx

# View Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Restart Nginx
systemctl reload nginx
```

#### SSL Certificate Issues
```bash
# Check certificate expiry
certbot certificates

# Renew certificates
certbot renew

# Test SSL configuration
curl -I https://api.latanda.online
```

### Database Debugging
```sql
-- Check table sizes
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats WHERE tablename IN ('users','groups','contributions');

-- Check active connections
SELECT datname, usename, application_name, client_addr, state 
FROM pg_stat_activity 
WHERE datname = 'latanda_production';

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Performance Monitoring
```bash
# Monitor API performance
curl -w "@curl-format.txt" -s -o /dev/null https://api.latanda.online/health

# Check system resources
htop
df -h
free -m

# Monitor database performance
sudo -u postgres psql latanda_production -c "
SELECT datname, numbackends, xact_commit, xact_rollback, 
       blks_read, blks_hit, tup_returned, tup_fetched 
FROM pg_stat_database 
WHERE datname = 'latanda_production';
"
```

---

## 📞 Support Information

### Production Details
- **API URL:** https://api.latanda.online
- **Database:** PostgreSQL 16 on localhost:5432
- **Process Manager:** PM2 (process name: latanda-api)
- **Log Location:** `/root/backup-production-ready-20250802-105030/logs/`
- **Configuration:** `/root/backup-production-ready-20250802-105030/.env`

### Key Commands
```bash
# Check API status
curl https://api.latanda.online/health

# Check database
sudo -u postgres psql latanda_production -c "SELECT COUNT(*) FROM users;"

# Restart API
pm2 restart latanda-api

# View logs
pm2 logs latanda-api --lines 50

# Database backup
sudo -u postgres pg_dump latanda_production > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Emergency Contacts
- **System Administrator:** Available via deployment documentation
- **Database Admin:** PostgreSQL user 'latanda_user'
- **API Documentation:** All endpoints documented in api-server-database.js

---

**Document Version:** 1.0  
**Last Updated:** August 2, 2025  
**Status:** Production Ready ✅