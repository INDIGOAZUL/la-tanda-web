#!/bin/bash

# Nginx + SSL Setup for api.latanda.online
echo "🌐 Setting up Nginx reverse proxy and SSL for api.latanda.online"
echo "════════════════════════════════════════════════════════════════"

# Step 1: Install Nginx
echo "📥 Installing Nginx..."
apt update
apt install -y nginx

# Step 2: Install Certbot for SSL
echo "🔒 Installing Certbot for SSL certificates..."
apt install -y certbot python3-certbot-nginx

# Step 3: Create Nginx configuration
echo "⚙️ Creating Nginx configuration..."
cat > /etc/nginx/sites-available/api.latanda.online << 'EOF'
server {
    listen 80;
    server_name api.latanda.online;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Proxy to Node.js API
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://latanda.online" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://latanda.online";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain charset=UTF-8";
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Allow from anywhere for health checks
        add_header Access-Control-Allow-Origin "*" always;
    }
}
EOF

# Step 4: Enable the site
echo "🔗 Enabling site configuration..."
ln -sf /etc/nginx/sites-available/api.latanda.online /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Step 5: Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Step 6: Start Nginx
    echo "🚀 Starting Nginx..."
    systemctl enable nginx
    systemctl restart nginx
    
    # Step 7: Obtain SSL certificate
    echo "🔒 Obtaining SSL certificate..."
    certbot --nginx -d api.latanda.online --non-interactive --agree-tos --email admin@latanda.online --redirect
    
    if [ $? -eq 0 ]; then
        echo "✅ SSL certificate obtained and configured"
        
        # Step 8: Test the setup
        echo "🧪 Testing HTTPS setup..."
        sleep 2
        curl -k https://api.latanda.online/health | head -5
        
        echo ""
        echo "🎉 Setup completed successfully!"
        echo "✅ Nginx reverse proxy configured"
        echo "✅ SSL certificate installed"
        echo "✅ API accessible at: https://api.latanda.online"
        echo ""
        echo "📋 Test endpoints:"
        echo "curl https://api.latanda.online/health"
        echo "curl https://api.latanda.online/api/system/status"
        
    else
        echo "❌ SSL certificate setup failed"
        echo "Manual setup may be required"
    fi
    
else
    echo "❌ Nginx configuration test failed"
    echo "Please check the configuration"
fi

echo ""
echo "🔧 Nginx status:"
systemctl status nginx --no-pager -l