# 🔒 SSL Installation Guide for La Tanda VPS

**Issue:** Hostinger's proxy is blocking Let's Encrypt HTTP validation
**Solution:** Use DNS validation OR configure Hostinger routing

---

## 🎯 SITUATION

Your current setup:
- **VPS:** Ubuntu 24.04 with n8n (168.231.67.201)
- **Nginx:** Configured for HTTP only (port 80)
- **HTTPS:** Going through Hostinger's proxy/routing layer
- **Problem:** Hostinger proxy returns 404 for `.well-known` challenges

**Evidence:**
```bash
# Local works:
curl http://localhost/.well-known/acme-challenge/test.txt
→ HTTP 200 OK ✅

# External fails:
curl http://latanda.online/.well-known/acme-challenge/test.txt
→ HTTP 404 Not Found ❌
```

This proves Hostinger is intercepting requests before they reach your VPS.

---

## ✅ SOLUTION OPTIONS

### Option A: DNS Validation (RECOMMENDED - No Hostinger dependency)

**Steps:**

1. **Start DNS validation:**
   ```bash
   sudo certbot certonly --manual --preferred-challenges dns \
     -d latanda.online -d www.latanda.online \
     --register-unsafely-without-email --agree-tos
   ```

2. **You'll see output like:**
   ```
   Please deploy a DNS TXT record under the name:
   _acme-challenge.latanda.online

   with the following value:
   pf35YK7SVpjdj6yJzweBwJKnzIz99sFDwlEqkjhZeX0
   ```

3. **Add DNS TXT record in Hostinger:**
   - Go to: https://hpanel.hostinger.com
   - Domains → latanda.online → DNS / Name Server
   - Add TXT record:
     - **Name:** `_acme-challenge`
     - **Value:** `[the value certbot gives you]`
     - **TTL:** 300 (5 minutes)

4. **Wait for DNS propagation (5-10 minutes):**
   ```bash
   dig TXT _acme-challenge.latanda.online +short
   # Should return the TXT value
   ```

5. **Press Enter in certbot to continue**

6. **Certbot will give you another TXT record for www.latanda.online:**
   - Add second TXT record:
     - **Name:** `_acme-challenge.www`
     - **Value:** `[second value]`

7. **Wait and press Enter again**

8. **Certificate will be issued!**
   ```
   Successfully received certificate.
   Certificate is saved at: /etc/letsencrypt/live/latanda.online/fullchain.pem
   Key is saved at: /etc/letsencrypt/live/latanda.online/privkey.pem
   ```

9. **Configure nginx for HTTPS** (see below)

**Pros:**
- ✅ Works regardless of Hostinger routing
- ✅ No dependency on Hostinger support
- ✅ Standard method for complex setups

**Cons:**
- ❌ Manual DNS record management
- ❌ Need to repeat for renewals (every 90 days)

---

### Option B: Fix Hostinger Routing (Contact Support)

**Contact Hostinger support and ask:**

```
Subject: Configure VPS routing for Let's Encrypt SSL

Hello,

I have a VPS (latanda.main - 168.231.67.201) running Ubuntu 24.04.

Currently, HTTP requests to latanda.online are being proxied/routed
through Hostinger infrastructure before reaching my VPS nginx server.

This is preventing Let's Encrypt HTTP-01 validation challenges from
working (/.well-known/acme-challenge returns 404).

Could you please either:
1. Configure the routing to pass /.well-known requests directly to my VPS
2. Remove any proxy/routing layer so traffic hits my VPS directly
3. Provide documentation on how SSL/HTTPS is configured for VPS instances

Domain: latanda.online
VPS IP: 168.231.67.201

Thank you!
```

**Pros:**
- ✅ Once fixed, auto-renewal works
- ✅ Standard HTTP validation

**Cons:**
- ❌ Depends on Hostinger support response time
- ❌ May not be configurable (their infrastructure)

---

### Option C: Use Existing Certificates (If Hostinger provides them)

Check if Hostinger already has SSL configured at their proxy level:

1. Go to: https://hpanel.hostinger.com
2. Check VPS → SSL/TLS section
3. If SSL is already enabled, just configure nginx to use their certificates

---

## 🔧 AFTER GETTING CERTIFICATE

Once you have the SSL certificate (via Option A or B), configure nginx:

### 1. Update nginx configuration:

```bash
sudo nano /etc/nginx/sites-enabled/latanda.online
```

**Add HTTPS server block** (uncomment and update the SSL section):

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name latanda.online www.latanda.online;

    ssl_certificate /etc/letsencrypt/live/latanda.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/latanda.online/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    root /var/www/html;
    index index.html auth.html home-dashboard.html;

    # Admin panel - Password Protection (NO IP whitelist)
    location ~ ^/(admin-panel.*|admin|dashboard-admin)\\.html {
        # HTTP Basic Auth only
        auth_basic "La Tanda Admin Area";
        auth_basic_user_file /etc/nginx/.htpasswd;

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;

        try_files $uri =404;
    }

    # Public routes
    location / {
        try_files $uri $uri/ =404;
    }

    # Let's Encrypt renewals
    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name latanda.online www.latanda.online;

    # Let's Encrypt validation
    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
    }

    # Redirect all other HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}
```

### 2. Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Test HTTPS:

```bash
curl -I https://latanda.online/admin-panel.html
# Should return: HTTP/2 200 or 401 (auth required)
```

---

## 🎯 MY RECOMMENDATION

**Use Option A (DNS Validation)** because:
1. Works immediately (no waiting for Hostinger support)
2. You have full control
3. Standard practice for complex hosting setups
4. Takes only 15-20 minutes

**Steps to do right now:**
1. Run: `sudo certbot certonly --manual --preferred-challenges dns -d latanda.online -d www.latanda.online --register-unsafely-without-email --agree-tos`
2. Add the TXT records to Hostinger DNS
3. Complete validation
4. Configure nginx with SSL
5. Admin panel will work on HTTPS with fixed code!

---

## 📋 DNS VALIDATION QUICK GUIDE

**Terminal 1 - Start certbot:**
```bash
sudo certbot certonly --manual --preferred-challenges dns \
  -d latanda.online -d www.latanda.online \
  --register-unsafely-without-email --agree-tos
```

**Browser - Add DNS records:**
1. Go to: https://hpanel.hostinger.com
2. Domains → latanda.online → DNS
3. Click "Add Record"
4. Type: TXT
5. Name: _acme-challenge
6. Content: [value from certbot]
7. Save

**Terminal 2 - Verify DNS:**
```bash
watch -n 5 'dig TXT _acme-challenge.latanda.online +short'
# Wait until you see the TXT value appear
```

**Terminal 1 - Continue:**
Press Enter when DNS is ready

Repeat for www subdomain TXT record.

---

**Ready to proceed with Option A (DNS validation)?** I can walk you through each step!
