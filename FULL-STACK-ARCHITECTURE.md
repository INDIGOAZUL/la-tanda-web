# La Tanda Platform - Full Stack Architecture

**Version:** 4.11.0 | **Last Updated:** 2026-02-25 | **Status:** PRODUCTION

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Authentication & Security](#7-authentication--security)
8. [Core Financial Operations](#8-core-financial-operations)
9. [Groups & Tandas System](#9-groups--tandas-system)
10. [Marketplace](#10-marketplace)
11. [Infrastructure & Deployment](#11-infrastructure--deployment)
12. [Version History](#12-version-history)

---

## 1. Executive Summary

### 1.1 Platform Description
La Tanda is a fintech platform for managing rotating savings groups (tandas/ROSCAs — Rotating Savings and Credit Associations) in Honduras. The platform enables users to:
- Create and join savings groups with configurable rules
- Make periodic contributions with coordinator oversight
- Receive pooled payouts on rotation with commission management
- Request payment extensions (prórrogas) and manage mora
- Trade products and services in a local marketplace
- Access Honduras lottery predictions with ML analytics
- Communicate via social feed with media, polls, and mentions

### 1.2 Technology Stack

| Component | Technology | Details |
|-----------|------------|---------|
| Backend Runtime | Node.js 18+ | Native `http` module (no Express) |
| Primary Database | PostgreSQL 16 | 73 tables, `latanda_production` DB |
| Cache/Sessions | Redis 6+ | Rate limiting, token blacklist, sessions |
| Frontend | Vanilla JS | No framework — hub layout, dark theme |
| Process Manager | PM2 | Cluster mode (2 instances) + 3 fork processes |
| Web Server | Nginx | Reverse proxy, SSL, gzip_static, rate limiting |
| AI Assistant | Groq Llama 3.3 70B | MIA chatbot via `mia-api.js` |
| Email | Nodemailer | 5 dark-theme invoice templates, `pagos@latanda.online` |
| OCR | Tesseract.js | Payment receipt verification |
| Biometric | face-api.js | Face recognition for KYC |
| API Docs | Swagger UI | OpenAPI 3.0.3 spec, 220 paths, 244 operations |

### 1.3 Platform Metrics

| Metric | Value |
|--------|-------|
| API Version | 4.11.0 |
| Database Tables | 73 |
| API Route Matches | 187 |
| OpenAPI Documented Paths | 220 (244 operations) |
| Backend LOC (6 core files) | ~33,900 |
| Frontend Files | 94 (49 HTML, 25 JS, 20 CSS) |
| PM2 Processes | 5 |

---

## 2. System Architecture

### 2.1 Request Flow

```
Internet
    │
    ▼
┌─────────────────────────────┐
│  Nginx (ports 80/443)       │
│  - SSL termination          │
│  - gzip_static serving      │
│  - Rate limiting (3 zones)  │
│  - Security headers         │
│  - WebSocket proxy (/ws/)   │
└──────┬──────────┬───────────┘
       │          │
       ▼          ▼
  Static Files   API Proxy
  /var/www/html  ──► 127.0.0.1:3002
  /var/www/docs      │
                     ▼
              ┌──────────────┐
              │  Node.js API │
              │  (PM2 x2)   │
              └──┬───────┬───┘
                 │       │
                 ▼       ▼
            PostgreSQL  Redis
            port 5432   port 6379
```

### 2.2 Port Map

| Port | Service | Binding |
|------|---------|---------|
| 80/443 | Nginx | Public |
| 3002 | Node.js API | 127.0.0.1 only |
| 5432 | PostgreSQL 16 | 127.0.0.1 only |
| 6379 | Redis | 127.0.0.1 only |

### 2.3 PM2 Processes

| Process | Mode | Purpose |
|---------|------|---------|
| `latanda-api` (x2) | Cluster | Main API server |
| `lottery-scheduler` | Fork | Daily lottery scrape (10:15 AM HN) |
| `payment-reminder-cron` | Fork | Daily payment status check (8:00 AM HN) |
| `swagger-docs` | Fork | Swagger UI static server |

---

## 3. Backend Architecture

### 3.1 File Structure

```
/var/www/latanda.online/
├── integrated-api-complete-95-endpoints.js  (27,803 lines — main API monolith)
├── marketplace-api.js                       (3,523 lines — marketplace endpoints)
├── db-postgres.js                           (1,592 lines — DB helpers, queries)
├── db-helpers-groups.js                     (349 lines — group enrichment, public groups)
├── email-templates.js                       (450 lines — 5 payment email templates)
├── mia-api.js                               (152 lines — AI chatbot)
├── mia-knowledge-base.js                    (knowledge base for MIA)
├── lottery-predictor.js                     (ML predictions — EWMA, Markov, CUSUM)
├── lottery-scraper.js                       (Honduras lottery data scraper)
├── lottery-scheduler.js                     (PM2 cron — daily scrape)
├── payment-reminder-cron.js                 (PM2 cron — daily payment check)
├── notifications-utils.js                   (notification types, createNotification)
├── security-middleware.js                   (rate limiting, Redis, blacklist)
├── ecosystem.config.js                      (PM2 configuration)
├── .env                                     (secrets — never committed)
└── node_modules/
```

### 3.2 Main API Structure

The API is a single-file monolith (`integrated-api-complete-95-endpoints.js`) using Node.js native `http` module with URL-based routing:

```javascript
const server = http.createServer(async (req, res) => {
    // 1. Rate limiting (security-middleware.js)
    // 2. CORS headers
    // 3. Token blacklist check (Redis)
    // 4. Route matching via pathname + method
    // 5. Auth via authenticateRequest() / requireAuth()
    // 6. Handler logic with PostgreSQL queries
    // 7. JSON response via sendSuccess() / sendError()
});
```

### 3.3 Key Helper Functions

| Function | Purpose |
|----------|---------|
| `authenticateRequest(req)` | Extracts JWT from Authorization header, returns user or null |
| `requireAuth(req, res)` | Same but sends 401 if no valid token |
| `sendSuccess(res, data)` | Sends `{ success: true, data }` |
| `sendError(res, code, message)` | Sends `{ success: false, error }` |
| `getPaymentDueDate(freq, start, cycle, grace)` | Centralized date calculator (biweekly/weekly/monthly) |
| `checkCycleAdvanceWithMora()` | Threshold-based cycle advance with auto-mora |
| `escapeHtml(str)` | XSS prevention (frontend — 131+ call sites) |

### 3.4 Database Access Pattern

All queries use parameterized `$N` placeholders — zero string interpolation:
- `db-postgres.js`: Core CRUD (users, wallets, transactions, contributions, deposits)
- `db-helpers-groups.js`: Group enrichment (`getEnrichedGroupsByUser`, `getPublicGroups`, `enrichGroupWithPaymentStatus`)
- Inline in main API: Complex joins, batch operations
- DB user: `latanda_app` (DML-only, no superuser)
- Zero `SELECT *`, zero `RETURNING *`, zero `SELECT alias.*`

---

## 4. Database Schema

### 4.1 Tables by Domain (73 total)

**Core Auth & Users (10)**
- `users` — user_id VARCHAR(50) PK, name, email (UNIQUE), password_hash, role, status, avatar_url, notification_preferences JSONB
- `user_sessions`, `user_webauthn_credentials`, `user_backup_codes`, `user_security_questions`
- `user_wallets` — balance NUMERIC, currency, user_id FK
- `user_transaction_pins`, `user_custom_limits`, `user_withdrawal_whitelist`
- `kyc_documents`

**Groups & Tandas (10)**
- `groups` — group_id PK, name, contribution_amount, frequency, max_members, current_cycle, commission_rate, advance_threshold, grace_period, admin_id FK
- `group_members` — user_id, group_id, role, status, num_positions, commission_accepted
- `tandas` — tanda_id, group_id FK, turns_order text[], current_turn, status
- `contributions` — user_id, group_id, cycle_number, amount, status, verification_method
- `cycle_distributions` — beneficiary, cycle_number, target_total, total_collected, fees
- `turn_assignments`, `tanda_turn_history`, `tanda_turn_payments`
- `payment_deferrals` — type (mora/extension), status, proposed_date, reason
- `group_invitations`, `group_start_decisions`, `failed_group_joins`, `role_requests`

**Financial (6)**
- `wallet_transactions` — debit/credit ledger with tx_type, reference_id
- `deposits` — unified bank/crypto/mobile, status_history JSONB, admin fields
- `withdrawals` — bank/mobile/crypto with fee tracking
- `payout_requests` — group payout lifecycle
- `user_payout_methods` — bank accounts, mobile wallets, crypto addresses
- `token_conversion_ledger` — LTD token conversions

**Marketplace (12)**
- `marketplace_providers`, `marketplace_services`, `marketplace_products`
- `marketplace_categories`, `marketplace_bookings`, `marketplace_reviews`
- `marketplace_messages`, `marketplace_favorites`
- `marketplace_product_orders`, `marketplace_product_referrals`
- `marketplace_referral_codes`, `marketplace_referrals`
- `marketplace_commission_payouts`, `marketplace_subscriptions`

**Social Feed (5)**
- `social_feed` — posts with media_urls, poll_options JSONB
- `social_comments`, `social_likes`, `social_bookmarks`, `social_follows`
- `poll_votes`

**Honduras Lottery (10)**
- `hn_lottery_draws`, `hn_lottery_predictions`, `hn_lottery_stats`
- `hn_lottery_markov`, `hn_lottery_spins`, `hn_lottery_points_log`
- `hn_lottery_achievements`, `hn_lottery_user_achievements`
- `hn_lottery_user_stats`, `hn_lottery_subscriptions`

**Notifications & System (5)**
- `notifications`, `notification_preferences`, `push_subscriptions`
- `audit_logs`, `compliance_alerts`
- `platform_state`, `mining_history`, `user_mining_status`
- `tier_requirements`, `achievement_definitions`, `user_achievements`, `user_portfolios`, `user_referrals`

---

## 5. API Endpoints

### 5.1 Endpoint Categories (187 routes, 16 OpenAPI tags)

| Tag | Count | Description |
|-----|-------|-------------|
| Auth | 24 | Registration, login, email verification, password reset, WebAuthn |
| User | 25 | Profile, settings, search, payout methods, sync |
| Wallet | 36 | Balance, deposits (bank/crypto/mobile), withdrawals, PIN, limits |
| Groups | 35 | CRUD, members, payments, distribution, extensions, balances |
| Tandas | 9 | My tandas, available positions, start/activate |
| Contributions | 7 | Record, verify, pending, bulk, payment status |
| Social Feed | 27 | Posts, comments, likes, bookmarks, mentions, polls, media |
| Marketplace Services | 23 | Providers, services, bookings, reviews, uploads |
| Marketplace Products | 11 | Products, orders, referrals |
| Marketplace Providers | 7 | Provider profiles, search, portfolio |
| Marketplace Portfolio | 6 | Public store pages |
| Marketplace Bookings | 4 | Booking lifecycle |
| Lottery | 18 | Predictions, draws, spins, achievements, subscriptions |
| MIA AI | 2 | Chat, status |
| Notifications | 3 | List, mark read, push subscribe |
| Public | 7 | Health, status, link preview, categories |

### 5.2 Key Endpoint Patterns

**Authentication**: All endpoints except public ones require JWT via `Authorization: Bearer <token>`. Tokens are 24h expiry. Logged-out tokens are blacklisted in Redis and rejected at the HTTP pipeline level (before routing).

**Group Financial Cycle**:
```
POST /api/groups/:id/contributions/record-for-member  — coordinator records single payment
POST /api/groups/:id/contributions/record-bulk         — coordinator records batch (max 50)
GET  /api/groups/:id/members/payment-status            — all members' payment state
POST /api/groups/:id/distribution/preview              — calculate next payout
POST /api/groups/:id/distribution/execute              — execute payout (transactional)
GET  /api/groups/:id/tanda-balances                    — per-member balance sheet
```

**Payment Deferrals (v4.11.0)**:
```
POST  /api/groups/:id/members/:userId/mark-mora  — coordinator marks member as mora
POST  /api/groups/:id/extensions/request          — member requests prórroga
GET   /api/groups/:id/extensions                  — list deferrals with filters
PATCH /api/groups/:id/extensions/:id              — approve/reject extension
```

**Full API documentation**: https://latanda.online/docs (Swagger UI)
**OpenAPI spec**: `/var/www/docs/openapi.json` (220 paths, 244 operations)

---

## 6. Frontend Architecture

### 6.1 File Structure

```
/var/www/html/main/
├── *.html (49 pages)              — Hub layout pages
├── css/ (20 files)                — Modular CSS
│   ├── variables.css              — Design tokens
│   ├── dashboard-layout.css       — 3-column hub layout
│   ├── mobile-drawer.css          — Edge swipe drawer
│   ├── groups-page.css            — Groups/tandas styles
│   └── hub/social-feed.css        — Social feed styles
├── js/ (25 files)                 — Modular JS
│   ├── components-loader.js       — Shared header/sidebar/nav loader
│   ├── hub/social-feed.js         — Social feed SPA
│   ├── edge-swipe.js              — Mobile drawer gesture
│   └── ...
├── marketplace-social.js          — Marketplace SPA (in root, not js/)
├── payout-frontend.js             — Payout system
└── negocio/index.html             — Public store portfolio page
```

### 6.2 Design System

- **Theme**: Dark mode only — `#0f172a` (bg), `#1e293b` (cards), `#00FFFF` (primary accent), `#f59e0b` (amber warnings)
- **Layout**: 3-column hub (left sidebar + main feed + right sidebar) matching social media pattern
- **Language**: Spanish (es-HN) for all user-facing text, English for code comments
- **Security**: `escapeHtml()` on all dynamic data (131+ calls), zero inline `onclick` in HTML, delegated event listeners with `data-action` attributes
- **Caching**: `?v=` query params on all CSS/JS, pre-compressed `.gz` files served via `gzip_static`

### 6.3 Key Pages

| Page | Purpose |
|------|---------|
| `home-dashboard.html` | Social feed, sidebar widgets, notifications |
| `groups-advanced-system.html` | Mis Grupos / Mis Tandas / Crear Grupo (3 tabs) |
| `marketplace-social.html` | Marketplace with Mi Tienda, Explorar |
| `explorar.html` | Discover content — tiendas, products, services |
| `mia.html` | AI chatbot interface |
| `mineria.html` | LTD token mining |
| `loteria.html` | Honduras lottery predictor |
| `auth-enhanced.html` | Login/register with WebAuthn |

---

## 7. Authentication & Security

### 7.1 Auth Flow

1. **Register**: Email MX validation → bcrypt hash → JWT (24h) → email verification code
2. **Login**: Credential verify → JWT generation → audit log → optional WebAuthn
3. **Logout**: Token blacklisted in Redis → immediately rejected at pipeline level
4. **Token blacklist**: SHA256 hash checked via Redis GET before any route matching (fail-open if Redis down)

### 7.2 Security Hardening

| Area | Implementation |
|------|----------------|
| XSS | `escapeHtml()` on all user data (quotes included), zero inline handlers |
| SQL Injection | Parameterized queries only, column allowlists on UPDATE |
| IDOR | `authUser.userId` from JWT only — zero `body.user_id` fallbacks |
| CSRF | JWT in Authorization header (not cookies) |
| Rate Limiting | 3 nginx zones: login (5r/min), api (5r/s), general (10r/s) |
| Token Security | `{ algorithms: ['HS256'] }`, blacklist enforcement, `safeCompare()` |
| Financial | `BEGIN` + `SELECT FOR UPDATE` + `COMMIT` on all wallet/payment ops |
| Headers | HSTS, CSP, X-Frame-Options, Permissions-Policy via nginx snippet |
| CORS | `https://latanda.online` only — no wildcards |
| Secrets | `.env` file (600 perms), zero hardcoded keys in codebase |

### 7.3 Resolved Critical Issues

| ID | Issue | Resolution | Version |
|----|-------|------------|---------|
| C3 | Token blacklist not enforced | Early pipeline check before routing | v4.6.3 |
| C6 | Deposits in-memory DB | Migrated to PostgreSQL `deposits` table | v4.7.0 |
| — | 4 SQL injections (dynamic columns) | Column allowlists in db-postgres.js | v4.3.0 |
| — | 17x `RETURNING *` | All replaced with explicit columns | v4.2.0 |
| — | 50+ XSS vulnerabilities | `escapeHtml()` + delegated handlers | v3.94–4.10 |

---

## 8. Core Financial Operations

### 8.1 Wallet System

- **Balance**: `user_wallets` table with `balance` NUMERIC column
- **Deposits**: Bank transfer, crypto, mobile — unified `deposits` table with type column
- **Withdrawals**: Bank, mobile, crypto — `withdrawals` table with fee tracking
- **Transactions**: Immutable ledger in `wallet_transactions` (debit/credit entries)
- **PIN**: Required for transactions above threshold, lockout after 5 failures
- **Race conditions**: All financial ops use `BEGIN` + `SELECT FOR UPDATE` + `COMMIT`

### 8.2 Contribution Lifecycle

```
Member pays → Coordinator records (record-for-member / record-bulk)
    → Contribution created (status: completed/coordinator_approved)
    → Auto-find next unpaid cycle via generate_series
    → Check: contributions >= num_positions per cycle?
    → If threshold % paid → cycle advances → unpaid members get mora
    → Active/approved deferrals resolve on payment
```

### 8.3 Distribution Lifecycle

```
Coordinator previews → target_total = max_members × contribution_amount
    → Beneficiary from turns_order[nextDistCycle - 1]
    → Fee calculation (platform + coordinator commission)
    → Execute (transactional): record distribution + increment current_turn
    → Contributions archived (status: 'archived')
    → Beneficiary notified (in-app + email)
```

### 8.4 Payment Deferrals (Mora & Prórrogas)

- **Mora**: Coordinator or auto-threshold marks member as late
- **Extension (Prórroga)**: Member requests delay with reason and proposed date
- **Advance threshold**: Configurable 50-100% (default 80) — cycle advances when met
- **Cron skip**: Members with approved extensions skip late notifications

---

## 9. Groups & Tandas System

### 9.1 Group Lifecycle

```
Create → Recruiting (invite members, assign positions)
    → Lottery (optional random position assignment)
    → Active (contributions begin, cycles advance)
    → Completed (all cycles done)
```

### 9.2 Key Concepts

| Concept | Description |
|---------|-------------|
| `num_positions` | Members can hold multiple positions (slots) in a group |
| `commission_rate` | Per-group custom rate (0-5%) or platform default (tiered) |
| `advance_threshold` | % of payments needed to advance cycle (default 80%) |
| `grace_period` | Days after due date before late status (from DB, default 5) |
| `turns_order` | PostgreSQL `text[]` with JSON strings `{"user_id":"...","slot":N}` |

### 9.3 Frontend: Mis Grupos Tab

- **Rol: Todos** — Shows own groups + public groups ("Grupos Abiertos" section with amber divider)
- **Rol: Creador** — Own groups where user is creator (contextual empty state with "Crear Grupo" CTA)
- **Rol: Coordinador/Miembro** — Filtered own groups
- **Public groups**: Fetched from `/api/groups/public-pg`, displayed with "Solicitar unirse" button
- **Cards**: Status-colored left border, avatar, 2x2 stat grid, alert banners, contextual action buttons

### 9.4 Coordinator Payment View

Role-based routing: creators/coordinators see full payment management panel with:
- Per-member payment status grid
- Individual and bulk recording
- Threshold progress bar
- Mora marking button
- Commission management panel

---

## 10. Marketplace

### 10.1 Components

- **Providers**: Business profiles with portfolio pages (`/negocio/{handle}`)
- **Services**: Bookable services with categories, reviews, ratings
- **Products**: Physical/digital products with images, orders, referrals
- **Messaging**: In-platform buyer-seller communication
- **Categories**: 12+ categories with icons

### 10.2 Mi Tienda

- Onboarding flow for new sellers (Early Adopter program)
- Dashboard with real stats (rating, completed jobs, reviews)
- Edit modal for profile, logo upload, social links
- Store portfolio: public page at `latanda.online/negocio/{handle}`

### 10.3 Explorar

- 4 sub-tabs: Tiendas, Productos, Servicios, Recientes
- Category filter pills (cities for tiendas, API categories for products/services)
- Real API data with pagination and "Cargar más"

---

## 11. Infrastructure & Deployment

### 11.1 Server

| Detail | Value |
|--------|-------|
| OS | Ubuntu 24.04.2 LTS |
| IP | 168.231.67.201 |
| Disk | 96 GB (19% used) |
| Access | SSH key auth (root) |

### 11.2 Nginx Configuration

- **SSL**: Let's Encrypt via Certbot (auto-renewal)
- **Rate limiting**: 3 zones in `security-hardening.conf`
- **Security headers**: `snippets/security-headers.conf` (included per location block)
- **Static serving**: `gzip_static on`, `expires 7d` for JS/CSS
- **WebSocket**: `location /ws/` with upgrade headers and 86400s timeout
- **API docs**: `location ^~ /docs` with rate limiting and noindex headers

### 11.3 Deployment Workflow

```bash
# 1. Edit locally, upload
scp file.js root@168.231.67.201:/var/www/latanda.online/

# 2. Syntax check
ssh root@168.231.67.201 "node --check /var/www/latanda.online/file.js"

# 3. Zero-downtime reload
ssh root@168.231.67.201 "pm2 reload latanda-api"

# 4. Verify
ssh root@168.231.67.201 "curl -s http://localhost:3002/health"

# 5. Regenerate compressed files
ssh root@168.231.67.201 "gzip -9 -k -f /var/www/html/main/file.html"
```

### 11.4 Backup & Monitoring

- **Backups**: `/root/backups/` — manual pre-change backups, `pg_dump` in backup script
- **PM2 monitoring**: `pm2 logs`, `pm2 monit`, auto-restart on crash
- **Cron jobs**: Payment status check (daily 8AM HN), lottery scrape (daily 10:15AM HN)

### 11.5 GitHub Repositories

| Repo | Visibility | Mirrors |
|------|------------|---------|
| `INDIGOAZUL/latanda-fintech` | Private | `/var/www/latanda.online/` (backend) |
| `INDIGOAZUL/latanda-frontend` | Private | `/var/www/html/main/` (frontend) |
| `INDIGOAZUL/la-tanda-web` | Public | Frontend showcase (no credentials) |

---

## 12. Version History

| Version | Date | Highlights |
|---------|------|------------|
| 4.11.0 | 2026-02-22 | Mora y Prórrogas, advance_threshold, payment deferrals |
| 4.10.8 | 2026-02-21 | Distribution system rewrite, tanda balances |
| 4.10.7 | 2026-02-21 | Commission manager panel |
| 4.10.6 | 2026-02-21 | Payment email notifications, cycle auto-advance, num_positions |
| 4.10.5 | 2026-02-20 | Coordinator payment management |
| 4.10.0 | 2026-02-20 | Groups page rebuild — hub layout, 3 tabs, XSS hardening |
| 4.9.0 | 2026-02-19 | Security Audit Round 29 |
| 4.8.0 | 2026-02-19 | Mi Tienda gaps fix, Explorar tiendas tab |
| 4.7.0 | 2026-02-18 | Deposits migrated to PostgreSQL |
| 4.6.3 | 2026-02-18 | Token blacklist enforcement |
| 4.6.2 | 2026-02-17 | Swagger UI + OpenAPI spec |
| 4.4.0 | 2026-02-14 | Mi Tienda: crear y configurar tienda |
| 4.3.0 | 2026-02-12 | Audit Round 28 — SQL injection fixes, RETURNING * elimination |
| 4.0.0 | 2026-02-11 | Audit Round 25 — Docker cleanup, race condition fixes |
| 3.94.0 | 2026-02-10 | Audit Round 19 (FINAL) — 41 fixes |

> **Full changelog**: See `CHANGELOG.md` and `CLAUDE.md`

---

*Document generated 2026-02-25. Always: backup before changes, read before editing, test before deploying.*
