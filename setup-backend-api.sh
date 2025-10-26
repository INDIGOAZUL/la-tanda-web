#!/bin/bash

# 🛠️ LA TANDA WEB3 - BACKEND API SETUP SCRIPT
# This script sets up the production backend API server

set -e  # Exit on any error

# Configuration
SERVER="168.231.67.201"
USER="root"
API_PATH="/var/www/api.latanda.online"
DB_NAME="latanda_db"
DB_USER="latanda_user"

echo "🛠️ Starting La Tanda Backend API Setup..."
echo "=============================================="

# Connect to server and setup backend
ssh $USER@$SERVER << 'EOF'

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js (if not already installed)
if ! command -v node &> /dev/null; then
    echo "🟢 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PostgreSQL (if not already installed)  
if ! command -v psql &> /dev/null; then
    echo "🐘 Installing PostgreSQL..."
    apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
fi

# Install PM2 globally (if not already installed)
if ! command -v pm2 &> /dev/null; then
    echo "⚡ Installing PM2..."
    npm install -g pm2
fi

# Create API directory
echo "📁 Creating API directory..."
mkdir -p /var/www/api.latanda.online
cd /var/www/api.latanda.online

# Initialize Node.js project
echo "🚀 Initializing Node.js project..."
cat > package.json << 'PACKAGE_EOF'
{
  "name": "latanda-api",
  "version": "1.0.0",
  "description": "La Tanda Web3 Platform API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "pg": "^8.11.0",
    "multer": "^1.4.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.0",
    "dotenv": "^16.0.3",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  },
  "keywords": ["web3", "tandas", "defi", "honduras"],
  "author": "La Tanda Team",
  "license": "MIT"
}
PACKAGE_EOF

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create basic server structure
echo "🔧 Creating server structure..."
mkdir -p routes middleware models config

# Create main server file
cat > server.js << 'SERVER_EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    'https://latanda.online',
    'http://localhost:8080'  // For development
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    message: 'La Tanda API v1.0 - Production Ready',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users', 
      groups: '/api/groups',
      wallet: '/api/wallet',
      kyc: '/api/kyc',
      marketplace: '/api/marketplace',
      tokens: '/api/tokens',
      commissions: '/api/commissions'
    }
  });
});

// API documentation endpoint
app.get('/docs', (req, res) => {
  res.json({
    title: 'La Tanda Web3 Platform API',
    version: '1.0.0',
    description: 'Complete API for traditional Honduran tandas with Web3 integration',
    endpoints: {
      'POST /api/auth/login': 'User authentication',
      'POST /api/auth/register': 'User registration',
      'GET /api/users/profile': 'Get user profile',
      'POST /api/groups/create': 'Create new tanda group',
      'POST /api/wallet/deposit': 'Deposit funds',
      'POST /api/kyc/submit': 'Submit KYC documents',
      'GET /api/marketplace/products': 'Get marketplace products',
      'POST /api/tokens/stake': 'Stake LTD tokens',
      'GET /api/commissions/earnings': 'Get commission earnings'
    }
  });
});

// Mount route modules (to be created)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));
// app.use('/api/groups', require('./routes/groups'));
// app.use('/api/wallet', require('./routes/wallet'));
// app.use('/api/kyc', require('./routes/kyc'));
// app.use('/api/marketplace', require('./routes/marketplace'));
// app.use('/api/tokens', require('./routes/tokens'));
// app.use('/api/commissions', require('./routes/commissions'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} not implemented yet`
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 La Tanda API Server running on port ${PORT}`);
  console.log(`📖 Documentation: http://localhost:${PORT}/docs`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
SERVER_EOF

# Create environment configuration
cat > .env << 'ENV_EOF'
NODE_ENV=production
PORT=3001
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_this
DB_HOST=localhost
DB_PORT=5432
DB_NAME=latanda_db
DB_USER=latanda_user
DB_PASSWORD=your_secure_db_password_here
CORS_ORIGIN=https://latanda.online
ENV_EOF

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'PM2_EOF'
module.exports = {
  apps: [{
    name: 'latanda-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
PM2_EOF

# Create logs directory
mkdir -p logs

# Set up database (basic setup)
echo "🐘 Setting up database..."
sudo -u postgres createdb latanda_db 2>/dev/null || echo "Database already exists"
sudo -u postgres createuser latanda_user 2>/dev/null || echo "User already exists"

# Create basic database schema file
cat > schema.sql << 'SCHEMA_EOF'
-- La Tanda Database Schema
-- Core tables for the Web3 platform

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_data JSONB DEFAULT '{}',
    verification_level INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}',
    members JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    balance DECIMAL(15,2) DEFAULT 0.00,
    locked_funds DECIMAL(15,2) DEFAULT 0.00,
    transactions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kyc_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    documents JSONB DEFAULT '[]',
    verification_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketplace_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_records(user_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON marketplace_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_commissions_user ON commissions(user_id);
SCHEMA_EOF

# Set proper permissions
chown -R www-data:www-data /var/www/api.latanda.online
chmod -R 755 /var/www/api.latanda.online

echo "✅ Backend API setup complete!"
echo "📁 API directory: /var/www/api.latanda.online"
echo "🚀 To start the API: cd /var/www/api.latanda.online && pm2 start ecosystem.config.js"
echo "📊 To monitor: pm2 monit"
echo "📋 To view logs: pm2 logs latanda-api"

EOF

echo ""
echo "🎉 BACKEND SETUP COMPLETE!"
echo "=============================================="
echo "✅ Node.js API server structure created"
echo "✅ PostgreSQL database prepared"  
echo "✅ PM2 process manager configured"
echo "✅ Basic security middleware implemented"
echo ""
echo "🚀 To start the API server:"
echo "   ssh $USER@$SERVER"
echo "   cd /var/www/api.latanda.online"
echo "   pm2 start ecosystem.config.js"
echo ""
echo "🌐 API will be available at:"
echo "   • Health check: https://api.latanda.online/"
echo "   • Documentation: https://api.latanda.online/docs"
echo ""
echo "📝 Next steps:"
echo "   1. Configure Nginx proxy for api.latanda.online"
echo "   2. Implement authentication endpoints"
echo "   3. Add database connection and models"
echo "   4. Implement remaining API routes"