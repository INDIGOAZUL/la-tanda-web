#!/bin/bash

# La Tanda Production Server Setup Commands
# Run these commands on the production server (api.latanda.online)

echo "🗄️ Setting up PostgreSQL for La Tanda Production"
echo "════════════════════════════════════════════════"

# Step 1: Install PostgreSQL if not already installed
echo "📥 Installing PostgreSQL..."
apt update
apt install -y postgresql postgresql-contrib

# Step 2: Start and enable PostgreSQL
echo "🚀 Starting PostgreSQL service..."
systemctl start postgresql
systemctl enable postgresql

# Step 3: Create database and user as postgres user
echo "🔧 Creating database and user..."
sudo -u postgres createdb latanda_production
sudo -u postgres psql -c "CREATE USER latanda_user WITH PASSWORD 'LaTanda2024!Production';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE latanda_production TO latanda_user;"
sudo -u postgres psql -c "ALTER USER latanda_user CREATEDB;"

# Step 4: Import database schema and data
echo "📊 Importing database..."
sudo -u postgres psql latanda_production < latanda_database_backup.sql

# Step 5: Test database connection
echo "🧪 Testing database connection..."
sudo -u postgres psql latanda_production -c "SELECT COUNT(*) as users FROM users;"

# Step 6: Create production environment file
echo "⚙️ Creating production environment..."
cat > .env << 'EOF'
# La Tanda Production Environment
DB_HOST=localhost
DB_PORT=5432
DB_NAME=latanda_production
DB_USER=latanda_user
DB_PASSWORD=LaTanda2024!Production

PORT=3001
NODE_ENV=production
JWT_SECRET=latanda-super-secure-jwt-secret-2024-production-api

CORS_ORIGINS=https://latanda.online,https://www.latanda.online,https://api.latanda.online
EOF

# Step 7: Install Node.js if not available
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Step 8: Install PM2 for process management
echo "🔧 Installing PM2..."
npm install -g pm2

# Step 9: Start the API server
echo "🚀 Starting API server..."
pm2 start api-server-database.js --name "latanda-api"
pm2 startup
pm2 save

# Step 10: Test the API
echo "🧪 Testing API endpoints..."
sleep 3
curl -s http://localhost:3001/health | head -10

echo ""
echo "✅ Setup completed!"
echo "🌐 API running on: http://localhost:3001"
echo "🔍 Health check: curl http://localhost:3001/health"
echo "📊 Status check: curl http://localhost:3001/api/system/status"