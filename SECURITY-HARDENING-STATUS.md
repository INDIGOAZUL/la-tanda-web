# La Tanda Security Hardening Status

**Last Updated:** 2025-12-18
**Server:** 168.231.67.201
**Current Version:** v2.9.0

---

## Completed Tasks

### Phase 1 (2025-12-14) - Initial Hardening
- [x] fail2ban installed (SSH, nginx jails)
- [x] CORS restricted to latanda.online domains
- [x] Nginx rate limiting active
- [x] Security headers unified (7 headers)
- [x] Unnecessary firewall ports closed

### Phase 2 (2025-12-14) - SSH + Backups
- [x] SSH hardened (key-only, no password auth)
- [x] GPG encrypted backups configured
- [x] Daily backup cron scheduled (2:00 AM)

### Phase 3 (2025-12-15) - Admin 2FA
- [x] Admin 2FA (TOTP) implemented
- [x] QR code setup flow
- [x] 6-digit code validation
- [x] Pending token system (5 min expiry)
- [x] 2FA enable/disable endpoints

### Phase 4 (2025-12-18) - Error Recovery
- [x] Failed joins tracking table
- [x] Automatic retry system (cron 8 AM)
- [x] Admin notification on errors
- [x] PostgreSQL trigger for data sync

---

## ModSecurity WAF Status (Investigated 2025-12-18)

### Installation Status: INSTALLED BUT DISABLED

**Packages Installed:**
- libmodsecurity3 (v3.0.12)
- libnginx-mod-http-modsecurity (v1.0.3)
- modsecurity-crs (OWASP Core Rule Set v3.3.5)

**Configuration Files:**
| File | Purpose |
|------|---------|
| /etc/modsecurity/modsecurity.conf | Main config (DetectionOnly mode) |
| /etc/modsecurity/modsecurity-minimal.conf | Minimal ruleset |
| /etc/nginx/modsecurity.conf | Nginx integration |
| /etc/nginx/modsecurity_includes.conf | Rule includes |

**Current Status:** DISABLED in nginx
```nginx
# In /etc/nginx/sites-enabled/latanda.online:
# modsecurity on; # DISABLED - causes crashes on Ubuntu 24.04
# modsecurity_rules_file /etc/modsecurity/modsecurity-minimal.conf;
```

**Issue:** Causes nginx crashes on Ubuntu 24.04
**Action Required:** Investigate compatibility issue before enabling

### Investigation Notes (To Do)
1. Check nginx error logs for crash details
2. Test with even more minimal ruleset
3. Check libnginx-mod-http-modsecurity version compatibility
4. Consider updating packages or downgrading
5. Test in staging environment first

---

## Pending Tasks

| # | Task | Priority | Status | Notes |
|---|------|----------|--------|-------|
| 1 | ModSecurity WAF | High | ⚠️ Investigate | Installed but crashes on Ubuntu 24.04 |
| 2 | auditd Logging | Medium | ❌ Not installed | System call auditing |
| 3 | Log Aggregation | Low | ❌ Not installed | Loki/Grafana (defer) |
| 4 | Database Security Audit | Done | ✅ Complete | localhost only, scram-sha-256 |

---

## Current Security Posture

### Network Layer
- UFW firewall active (22, 80, 443)
- fail2ban brute force protection
- Nginx rate limiting (30/min API, 5/min auth)

### Application Layer
- CORS restricted to latanda.online domains
- JWT authentication on 80+ endpoints
- API rate limiting (4 tiers)
- Input sanitization
- **Admin 2FA (TOTP) required** ✅

### Server Layer
- SSH key-only authentication
- PermitRootLogin prohibit-password
- X11 forwarding disabled
- Automatic security updates

### Database Layer
- PostgreSQL restricted to localhost ✅
- scram-sha-256 authentication ✅
- Triggers for data integrity ✅
- Application-level audit_logs (275 entries) ✅
- Docker network access for n8n (172.18.0.0/16)

### Backup System
- Daily encrypted backups (GPG RSA-4096)
- 7-day retention
- GPG Key ID: A1E333AD0A5DE6A84529BC5ACA0A34D668134BD0

---

## Security Headers Active

| Header | Value |
|--------|-------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |
| Content-Security-Policy | default-src 'self' |
| Strict-Transport-Security | max-age=31536000 |
| Permissions-Policy | geolocation=(), microphone=() |

---

## Key Files Reference

| Purpose | Path |
|---------|------|
| SSH Hardening | /etc/ssh/sshd_config.d/99-security-hardening.conf |
| fail2ban Config | /etc/fail2ban/jail.local |
| Backup Script | /root/scripts/encrypted-backup.sh |
| Backup Location | /root/backups/latanda-backup-*.gpg |
| Security Headers | /etc/nginx/conf.d/security-hardening.conf |
| Failed Joins Cron | /var/www/latanda.online/cron/failed-joins-checker.js |
| ModSecurity Config | /etc/modsecurity/modsecurity.conf |
| ModSecurity Minimal | /etc/modsecurity/modsecurity-minimal.conf |

---

## Emergency Recovery

### Restore from Encrypted Backup
```bash
# Decrypt
gpg --decrypt /root/backups/latanda-backup-YYYYMMDD_HHMMSS.tar.gz.gpg > backup.tar.gz

# Extract
tar xzf backup.tar.gz -C /
```

### If Locked Out of SSH
1. Use Hostinger VPS console
2. Remove: rm /etc/ssh/sshd_config.d/99-security-hardening.conf
3. Restart: systemctl restart ssh

---
*Updated: 2025-12-18 by Claude Code*
