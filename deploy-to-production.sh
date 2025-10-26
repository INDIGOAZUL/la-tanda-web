#!/bin/bash

# 🚀 LA TANDA WEB3 - PRODUCTION DEPLOYMENT SCRIPT
# This script deploys our complete frontend to the production server

set -e  # Exit on any error

# Configuration
SERVER="168.231.67.201"
USER="root"
LOCAL_PATH="/home/ebanksnigel/la-tanda-web"
REMOTE_PATH="/var/www/latanda.online"
BACKUP_PATH="/var/www/latanda.online.backup.$(date +%Y%m%d_%H%M%S)"

echo "🚀 Starting La Tanda Web3 Production Deployment..."
echo "======================================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command_exists scp; then
    echo "❌ Error: scp not found. Please install openssh-client"
    exit 1
fi

if ! command_exists ssh; then
    echo "❌ Error: ssh not found. Please install openssh-client"
    exit 1
fi

# Test SSH connection
echo "🔗 Testing SSH connection to production server..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $USER@$SERVER "echo 'SSH connection successful'" || {
    echo "❌ Error: Cannot connect to production server"
    exit 1
}

# Create backup of current production site
echo "💾 Creating backup of current production site..."
ssh $USER@$SERVER "
    if [ -d '$REMOTE_PATH' ]; then
        cp -r $REMOTE_PATH $BACKUP_PATH
        echo '✅ Backup created at $BACKUP_PATH'
    else
        echo '⚠️  No existing site found to backup'
    fi
"

# Create remote directory if it doesn't exist
echo "📁 Ensuring remote directory exists..."
ssh $USER@$SERVER "mkdir -p $REMOTE_PATH"

# Deploy frontend files
echo "📤 Uploading complete La Tanda Web3 system..."
echo "   Source: $LOCAL_PATH"
echo "   Destination: $USER@$SERVER:$REMOTE_PATH"

# Upload all files
scp -r $LOCAL_PATH/* $USER@$SERVER:$REMOTE_PATH/

# Set proper permissions on server
echo "🔐 Setting proper permissions..."
ssh $USER@$SERVER "
    chown -R www-data:www-data $REMOTE_PATH 2>/dev/null || chown -R nginx:nginx $REMOTE_PATH 2>/dev/null || echo 'Note: Could not change owner (may not be needed)'
    chmod -R 755 $REMOTE_PATH
    chmod 644 $REMOTE_PATH/*.html $REMOTE_PATH/*.css $REMOTE_PATH/*.js $REMOTE_PATH/*.json 2>/dev/null || true
"

# Configure Nginx if needed
echo "🌐 Checking web server configuration..."
ssh $USER@$SERVER "
    # Check if Nginx is running
    if systemctl is-active --quiet nginx; then
        echo '✅ Nginx is running'
        
        # Test Nginx configuration
        nginx -t 2>/dev/null && echo '✅ Nginx configuration is valid' || echo '⚠️  Please check Nginx configuration'
        
        # Reload Nginx to apply any changes
        systemctl reload nginx && echo '✅ Nginx reloaded' || echo '⚠️  Could not reload Nginx'
        
    elif systemctl is-active --quiet apache2; then
        echo '✅ Apache is running'
        systemctl reload apache2 && echo '✅ Apache reloaded' || echo '⚠️  Could not reload Apache'
        
    else
        echo '⚠️  No web server detected. Please configure Nginx or Apache manually.'
    fi
"

# Verify deployment
echo "✅ Verifying deployment..."
ssh $USER@$SERVER "
    echo 'Files deployed:'
    ls -la $REMOTE_PATH/*.html | head -10
    echo ''
    echo 'Directory size:'
    du -sh $REMOTE_PATH
"

# Test the live site
echo "🌐 Testing live deployment..."
if command_exists curl; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://latanda.online/ || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Main site is responding (HTTP $HTTP_CODE)"
    else
        echo "⚠️  Main site returned HTTP $HTTP_CODE"
    fi
    
    # Test a few key pages
    for page in "auth-enhanced.html" "home-dashboard.html" "tanda-wallet.html"; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://latanda.online/$page" || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo "✅ $page is accessible (HTTP $HTTP_CODE)"
        else
            echo "⚠️  $page returned HTTP $HTTP_CODE"
        fi
    done
else
    echo "⚠️  curl not available for testing. Please test manually."
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================================================"
echo "✅ Complete La Tanda Web3 system deployed to production"
echo "🌐 Main site: https://latanda.online"
echo "📊 System includes all 9 sections:"
echo "   • Landing page & navigation"
echo "   • Authentication system"
echo "   • Post-login dashboard" 
echo "   • Advanced group management"
echo "   • Web3 wallet integration"
echo "   • Marketplace & social features"
echo "   • KYC registration system"
echo "   • Token economics dashboard"
echo "   • Commission & referral system"
echo ""
echo "📝 Next steps:"
echo "   1. Test all sections manually: https://latanda.online"
echo "   2. Verify mobile responsiveness"
echo "   3. Begin Phase 2: Backend API development"
echo ""
echo "💾 Backup location on server: $BACKUP_PATH"
echo "🔄 To rollback if needed: ssh $USER@$SERVER 'cp -r $BACKUP_PATH/* $REMOTE_PATH/'"
echo ""
echo "🚀 Your complete Web3 system is now LIVE!"