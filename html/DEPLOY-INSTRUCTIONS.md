# 🚀 DEPLOYMENT INSTRUCTIONS

## 📋 RUN THESE COMMANDS TO REPLACE "COMING SOON" WITH REAL PLATFORM:

### Step 1: Connect to server and backup
```bash
ssh root@168.231.67.201
cp -r /var/www/latanda.online/html /var/www/latanda.online/html.backup.$(date +%Y%m%d-%H%M%S)
```

### Step 2: Upload files from local machine
```bash
# From your local machine (not on server):
rsync -avz /tmp/latanda-deployment/ root@168.231.67.201:/var/www/latanda.online/html/
```

### Step 3: Set permissions
```bash
ssh root@168.231.67.201 'chown -R www-data:www-data /var/www/latanda.online/html && chmod -R 755 /var/www/latanda.online/html'
```

### Step 4: Test the deployment
```bash
curl -I https://latanda.online
```

## 📂 FILES BEING DEPLOYED:
- index.html (Professional landing page)
- groups-advanced-system.html (Core functionality)
- web3-dashboard.html (DeFi interface)
- All CSS and JS files
- Complete platform functionality

## 🎯 WHAT THIS WILL DO:
- Replace "Coming Soon" placeholder
- Show actual working platform
- Connect to your 85+ working APIs
- Give developers something real to see

## ✅ AFTER DEPLOYMENT:
Visit https://latanda.online and you should see:
- Professional La Tanda Web3 platform
- Developer recruitment banner
- Working navigation
- Live functionality

**Ready to run these commands?**