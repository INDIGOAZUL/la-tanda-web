# La Tanda - Production Status

## Current Version: v2.9.0
**Last Deploy:** 2025-12-18

## Quick Reference

### Server Access
```bash
ssh root@168.231.67.201
# Password in CLAUDE.md
```

### Important Paths
| Path | Description |
|------|-------------|
| /var/www/latanda.online/ | API Backend |
| /var/www/html/main/ | Frontend |
| /var/www/html/main/js/ | JavaScript modules |
| /var/www/latanda.online/cron/ | Cron jobs |
| /var/www/latanda.online/docs/ | Documentation |

### Key Files
| File | Purpose |
|------|---------|
| integrated-api-complete-95-endpoints.js | Main API (99 endpoints) |
| db-postgres.js | PostgreSQL functions |
| db-unified.js | DB abstraction layer |
| FULL-STACK-ARCHITECTURE.md | Complete architecture doc |
| admin-panel-v2.html | Main admin panel |
| cron/failed-joins-checker.js | Daily error checker |

### Commands
```bash
# Restart API after changes
pm2 restart latanda-api-fixed

# Check API status
pm2 list && pm2 logs --lines 20

# Check API syntax
node --check integrated-api-complete-95-endpoints.js

# Test API
curl -s http://localhost:3002/api/system/status

# View cron logs
tail -f /var/log/failed-joins-cron.log

# Reload nginx
nginx -t && systemctl reload nginx
```

### Database
- **Type:** PostgreSQL 16
- **Name:** latanda_production
- **Tables:** 30+ (users, groups, group_members, contributions, tandas, user_wallets, notifications, audit_logs, failed_group_joins, referrals, mining_*, etc.)

---

## Current Features (v2.9.0)

### Authentication & Security
- ✅ JWT Authentication (24h access + 7d refresh)
- ✅ Admin 2FA (TOTP) with QR setup
- ✅ Rate limiting (4 tiers)
- ✅ Security headers (7 headers)
- ✅ fail2ban protection

### Core Features
- ✅ Groups & Tandas management
- ✅ Wallet & transactions
- ✅ Real-time notifications
- ✅ PostgreSQL global search (Ctrl+K)

### Admin Features
- ✅ Admin panel v2 (consolidated)
- ✅ User management
- ✅ Deleted groups recovery
- ✅ Failed joins management
- ✅ Deposits/withdrawals pending

### Recent Additions (Dec 2025)
- ✅ Referral system (5 endpoints)
- ✅ Mining system (7 tables, 4 endpoints)
- ✅ Reusable invitations (is_reusable, max_uses)
- ✅ Failed joins tracking + auto-retry
- ✅ PostgreSQL trigger for member_count sync

---

## Cron Jobs Active

| Schedule | Job | Log |
|----------|-----|-----|
| 2:00 AM | Encrypted backup | /var/log/backup.log |
| 8:00 AM | Failed joins checker | /var/log/failed-joins-cron.log |

---

## API Endpoints Summary

| Category | Count | Base Path |
|----------|-------|-----------|
| Authentication | 12 | /api/auth/* |
| Wallet | 15 | /api/wallet/* |
| Groups/Tandas | 18 | /api/groups/*, /api/tandas/* |
| Admin | 17 | /api/admin/* |
| Notifications | 4 | /api/notifications/* |
| Referrals | 5 | /api/referrals/* |
| Mining | 4 | /api/mining/* |
| **Total** | **99** | |

---

## Pending Tasks

| Priority | Task | Status |
|----------|------|--------|
| HIGH | ModSecurity WAF | ⚠️ Investigate crash |
| MEDIUM | auditd Logging | ⏳ Pending |
| MEDIUM | Log Aggregation (Grafana) | ⏳ Pending |
| MEDIUM | Mining Admin Panel | ⏳ Planned |
| DONE | Database security | ✅ Complete |

---

## Version History (Recent)

| Version | Date | Changes |
|---------|------|---------|
| 2.9.0 | 2025-12-18 | Failed joins management, trigger sync |
| 2.8.0 | 2025-12-17 | Reusable invitations |
| 2.7.0 | 2025-12-17 | Bug fix: invitation inviter_id |
| 2.6.0 | 2025-12-17 | Mining system |
| 2.5.0 | 2025-12-16 | Referral system |
| 2.4.0 | 2025-12-16 | Frontend-Backend consolidation |
| 2.3.0 | 2025-12-15 | Group soft/hard delete |
| 2.2.0 | 2025-12-15 | Admin 2FA (TOTP) |
| 2.1.0 | 2025-12-14 | Security hardening |
| 2.0.0 | 2025-12-12 | Initial architecture |

---
*Updated: 2025-12-18 by Claude Code*

---

## Future Features (Reference Only)

### Creator Escrow System
**Page:** /creator-escrow-demo.html
**Status:** Demo only (client-side simulation)
**Audited:** 2025-12-18

**What exists:**
- HTML demo page (877 lines)
- JavaScript class for simulation (15KB)

**What's needed for production:**
- 3 database tables (creator_escrows, escrow_releases, creator_ratings)
- 5 API endpoints
- Integration with tanda payout flow
- Admin panel section

**Complexity:** Medium-High
**Priority:** Future (not scheduled)
