# La Tanda Platform - Development Guide

**Last Updated:** 2026-01-31 | **Version:** 3.52.0 | **Cache:** v6.87.0

---

## Quick Reference

### Server Access
```bash
ssh root@168.231.67.201  # SSH key auth
```

### Key Locations
| Purpose | Path |
|---------|------|
| API Backend | `/var/www/latanda.online/integrated-api-complete-95-endpoints.js` |
| Frontend | `/var/www/html/main/` |
| Components Loader | `/var/www/html/main/js/components-loader.js` |
| Environment | `/var/www/latanda.online/.env` |
| Marketplace API | `/var/www/latanda.online/marketplace-api.js` |
| Lottery API | `/var/www/latanda.online/lottery-api.js` |
| Backups | `/root/backups/` |
| **Swagger UI** | **https://latanda.online/docs** |
| **Blockchain Strategy** | **https://latanda.online/docs/BLOCKCHAIN-STRATEGY.md** |

### Essential Commands
```bash
pm2 reload latanda-api              # Zero-downtime reload (preferred)
pm2 list && pm2 logs latanda-api --lines 20
curl -s 'http://localhost:3002/health'
nginx -t && systemctl reload nginx
```

---

## Instructions for Claude

### Before Changes
1. **Backup first:** `cp <file> /root/backups/<file>.backup-$(date +%Y%m%d)`
2. **Read file before editing** - Never edit blind
3. **Test on localhost** when possible

### After JS/CSS Changes
1. Bump cache version in `components-loader.js`
2. Tell user: Ctrl+Shift+R to hard refresh

### After API Changes
1. `pm2 reload latanda-api`
2. Verify: `curl -s 'http://localhost:3002/health'`

### Code Style
- Spanish for user-facing text (es-HN locale)
- English for code comments and logs

### ⚠️ HTML Editing Precautions (CRITICAL)

**NEVER use Python regex with `re.DOTALL` on HTML files with repeated tags.**

**What happened (2026-01-27):**
```python
# DANGEROUS - DO NOT USE
pattern = r'<aside class="left-sidebar".*?</aside>'
content = re.sub(pattern, new_content, content, flags=re.DOTALL)
```

This pattern matched from the FIRST `<aside>` to the LAST `</aside>` in the file, deleting the entire page content (main-feed, right-sidebar, scripts, etc.).

**Safe alternatives:**
1. **Use line numbers with sed:**
   ```bash
   sed -n '1870,1935p' file.html  # Preview first
   sed -i '1870,1935d' file.html  # Then delete
   ```

2. **Use specific unique markers:**
   ```bash
   sed -i '/<!-- START SIDEBAR-BRAND -->/,/<!-- END SIDEBAR-BRAND -->/d' file.html
   ```

3. **For complex edits, use Python with BeautifulSoup:**
   ```python
   from bs4 import BeautifulSoup
   soup = BeautifulSoup(html, 'html.parser')
   sidebar = soup.find('aside', {'id': 'leftSidebar'})
   brand = sidebar.find('div', {'class': 'sidebar-brand'})
   brand.decompose()  # Safely removes only that element
   ```

4. **ALWAYS backup before editing:**
   ```bash
   cp file.html /root/backups/file.html.backup-$(date +%Y%m%d-%H%M%S)
   ```

---

## Architecture

### Stack
Node.js (native http) | PostgreSQL 16 | Redis | Vanilla HTML/CSS/JS | PM2 | Nginx

### API Endpoints (140+)
| Category | Base Path | Count |
|----------|-----------|-------|
| **Public** | `/api/public/*` | **4** |
| Auth | `/api/auth/*` | 12 |
| Wallet | `/api/wallet/*` | 15 |
| Groups/Tandas | `/api/groups/*`, `/api/tandas/*` | 18 |
| Admin | `/api/admin/*` | 12 |
| Lottery | `/api/lottery/*` | 15 |
| Marketplace | `/api/marketplace/*` | 30+ |
| **Hub** | `/api/hub/*` | **3** |
| **Feed/Social** | `/api/feed/*` | **12** |

### Ports
80/443 (Nginx) | 3002 (API) | 3003 (Modules) | 5432 (PostgreSQL) | 6379 (Redis)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API 404 | Check endpoint in API file, nginx config, PM2 status |
| Changes not showing | Bump cache version, hard refresh (Ctrl+Shift+R) |
| PM2 restarting | Check logs: `pm2 logs latanda-api --lines 50` |
| DB connection failed | `systemctl status postgresql`, check `.env` |

---

## Recent Changes

### 2026-01-31 (v3.52.0)
- **Blockchain Strategy Document Created**
  - New file: `/var/www/latanda.online/BLOCKCHAIN-STRATEGY.md` (8.5 KB)
  - Defines two-phase blockchain strategy:
    - **Fase 1:** Polygon PoS Mainnet (~$15K, 8-12 semanas)
    - **Fase 2:** La Tanda Chain propia (21 validators, $453K, 6 meses)
  - Includes: Capital requirements, validator specs, geographic node distribution
  - Criteria for activating Phase 2 (10K users, $1M/month volume, etc.)
  - **Made publicly accessible:** `https://latanda.online/docs/BLOCKCHAIN-STRATEGY.md`
- **Documentation Links Added**
  - `whitepaper.html` → link to blockchain strategy in Roadmap section
  - `/docs/index.html` → new card for Blockchain Strategy
  - `ROADMAP.md` v1.1 → corrected link path
- **Email Configuration (ImprovMX + Gmail)**
  - New aliases created: `validators@`, `invest@`, `dev@latanda.online`
  - Gmail "Send as" configured for all three
  - All forwarding to ebanksnigel@gmail.com
- **Contact Channels Documented**
  - Discord: `discord.com/channels/1429482603374710967`
  - Telegram: `t.me/AhorroLaTanda`
- **GitHub Community**
  - New fork by `jamoran1356` (Tech Lead @ PYDTI.com)
  - Outreach comment posted on Issue #28
  - 6 total forks, bounties active (#12-#16, #28)

### 2026-01-30 (v3.51.0)
- **Left Sidebar Navigation - Complete Overhaul**
  - 5 new dedicated pages created, each with full Twitter-style 3-column layout
  - Sidebar now has 7 functional navigation items (was 6 placeholder links)
- **New Pages Created:**
  - `explorar.html` - Hybrid discovery with external APIs + internal content
  - `trabajo.html` - Jobs, services, freelance listings with tabs
  - `creator-hub.html` - Content creator tools and analytics dashboard
  - `guardados.html` - Saved/bookmarked items management with filtering
  - `mensajes.html` - Direct messaging interface with conversation list
- **New JavaScript Modules:**
  - `/js/explore.js` (9.7 KB) - ExchangeRate-API, CoinGecko crypto, news feeds
  - `/js/trabajo.js` (10.7 KB) - Job listings with tabs (Empleos, Servicios, Freelance)
  - `/js/creator-hub.js` (9.2 KB) - Creator content management and achievements
  - `/js/guardados.js` (7.9 KB) - Saved items with type filtering (posts, productos, trabajos, usuarios)
  - `/js/mensajes.js` (7.7 KB) - Conversation list with online status and unread badges
- **GitHub Community Updates:**
  - **PR #18 Merged**: Role-Based Feature Gating with XSS security fix applied
  - XSS fix: Added `escapeHtml()` method, replaced inline onclick with addEventListener
  - Spam cleanup: 87 comments from @ldeong deleted
  - 6-month interaction limit set on repository
  - Bounty: 150 LTD pending for @ldeong (awaiting account creation)
- **Mobile Cache Fix:**
  - Fixed compose box not showing on mobile (SW was caching v3.0 instead of v4.1)
  - Updated version strings in social-feed.js/css
  - Service Worker precache hashes updated
- Service Worker: v6.87.0

**Left Sidebar Navigation (Final):**
```
┌──────────────────────────────┐
│  Inicio      → home-dashboard│
│  Explorar    → explorar      │
│  Trabajo     → trabajo       │
│  Creator Hub → creator-hub   │
│  Guardados   → guardados     │
│  Mensajes    → mensajes      │
│  Menu        → profile       │
└──────────────────────────────┘
```

**New Files Created:**
| File | Size | Purpose |
|------|------|---------|
| `/var/www/html/main/explorar.html` | 8 KB | Discovery page |
| `/var/www/html/main/trabajo.html` | 8 KB | Jobs/services page |
| `/var/www/html/main/creator-hub.html` | 10 KB | Creator dashboard |
| `/var/www/html/main/guardados.html` | 5 KB | Saved items page |
| `/var/www/html/main/mensajes.html` | 4 KB | Messaging page |
| `/var/www/html/main/js/explore.js` | 9.7 KB | Explorar module |
| `/var/www/html/main/js/trabajo.js` | 10.7 KB | Trabajo module |
| `/var/www/html/main/js/creator-hub.js` | 9.2 KB | Creator Hub module |
| `/var/www/html/main/js/guardados.js` | 7.9 KB | Guardados module |
| `/var/www/html/main/js/mensajes.js` | 7.7 KB | Mensajes module |

### 2026-01-27 (v3.50.1)
- **Compose Box (Twitter-style)**
  - New compose box at top of feed with user avatar + "¿Qué está pasando?"
  - Toolbar with 6 icons: Imagen, GIF, Encuesta, Emoji, Programar, Ubicación
  - "MIA" button for AI-assisted compose
  - "Publicar" button (cyan)
  - Auto-resize textarea
  - Responsive design for mobile
- **Feed UI Cleanup**
  - Removed "Actividad de la Comunidad" header (redundant)
  - Hidden greeting "Hola, Usuario!" on mobile (compose box has avatar)
  - Reduced spacing for more content visibility
  - Tighter tabs and compose box on mobile
- **Mobile Touch Fix**
  - Fixed: Mobile clicks not responding (Service Worker cache issue)
  - EdgeSwipe.js had backwards logic (was disabled on desktop, enabled on mobile)
  - Added force SW update script to clear old cached SW versions
  - EdgeSwipe v1.5 simplified - buttons only, no swipe gestures (caused device crash)
- **Mobile Bottom Nav Update**
  - New layout: Menu | Inicio | Mercado | Widgets
  - Menu button opens left sidebar via EdgeSwipe.toggleLeft()
  - Widgets button opens right sidebar via EdgeSwipe.toggleRight()
- **Bug Fix: Regex HTML Deletion**
  - Accidentally deleted page content using `re.DOTALL` regex on HTML
  - Restored from backup: `/root/backups/home-dashboard.html.backup-compose-20260127-074952`
  - Added documentation in CLAUDE.md about safe HTML editing practices
- **CSS/JS Updates**
  - `edge-swipe.js` v1.5 - simplified, buttons only
  - `edge-swipe.css` v1.4 - mobile sidebar styles
  - `social-feed.css` v4.1 - compose box styles + mobile responsive
  - `social-feed.js` v4.1 - compose box rendering + handleCompose()
- **Backups Created (2026-01-28 00:03)**
  - `/root/backups/home-dashboard.html.backup-20260128-000347`
  - `/root/backups/edge-swipe.js.backup-20260128-000358`
  - `/root/backups/edge-swipe.css.backup-20260128-000358`
  - `/root/backups/social-feed.js.backup-20260128-000358`
  - `/root/backups/social-feed.css.backup-20260128-000358`
- Service Worker: v6.80.0

**Current Working State:**
- ✅ Desktop: 3-column layout (left sidebar, feed, right sidebar)
- ✅ Mobile: Bottom nav with Menu/Inicio/Mercado/Widgets
- ✅ Mobile sidebars: Open via buttons (no swipe gestures)
- ✅ Compose box: Twitter-style with avatar and toolbar
- ✅ Social feed: Tabs, infinite scroll, engagement actions
- ✅ Left sidebar: 7 nav items all functional with dedicated pages
- ✅ New pages: Explorar, Trabajo, Creator Hub, Guardados, Mensajes

### 2026-01-26 (v3.49.0)
- **Mobile Bottom Nav Redesign**
  - Replaced 4-button nav (Menu, Inicio, Explorar, Stats) with new layout
  - New buttons: **MIA** (robot cyan), **Mercado** (store), **Mensajes** (envelope), **Predictor** (magic gold)
  - Direct access to key features without nested menus
  - Fixed button styling for consistency (transparent background, proper icons)
- **Mobile Drawer Updates**
  - Updated nav items: Perfil, Wallet, Mis Tandas, Mercado, Mensajes
  - Added "Herramientas" section: MIA Assistant, Predictor Loteria, Loteria
  - Fixed: Bottom nav "Menu" now correctly opens MobileDrawer (was opening EdgeSwipe)
- **Floating Elements Cleanup**
  - Hidden MIA widget (functionality moved to bottom nav)
  - Hidden PWA floating install button
  - Restored FAB "Publicar" button for mobile (cyan, bottom-right)
- **Bug Fixes**
  - Fixed `edge-swipe.js` null reference errors (added null checks)
  - Fixed `user-mini-profile.js` "closest is not a function" error
  - Fixed optional chaining (`?.`) syntax errors for older browsers
  - Fixed CSS for bottom nav button consistency
- **CSS Updates**
  - `dashboard-layout.css` v1.7 - bottom nav fixes, hidden floating elements
  - `mobile-drawer.css` v1.3 - FAB visible on mobile media query
- Service Worker: v6.63.0

### 2026-01-26 (v3.48.0)
- **Twitter Layout Phase 2 + Major Cleanup**
  - Left sidebar complete: 6 nav items + CTA "Publicar" + 4 quick links
  - **HTML Cleanup:** Removed 2670 lines of redundant code (5225 → 2555 lines, -51%)
  - **Fixed duplicate IDs:** `socialFeedContainer`, `welcomeTitle`, `hubAlertsContainer` now unique
  - **CSS Cleanup:** Removed unnecessary hiding rules from dashboard-layout.css
  - **Fixed malformed HTML:** `</body></html>` now properly at end of file
- **Twitter Layout Phase 3 - Dynamic Widgets**
  - New endpoint `GET /api/feed/social/suggestions` - returns users to follow
  - New file `js/hub/sidebar-widgets.js` - fetches and renders widgets
  - "A Quien Seguir" widget now shows real user suggestions
  - "Seguir" button functional with follow API + animations
  - Trending widget with fallback to defaults when API empty
- **Twitter Layout Phase 4 - Mobile Drawer & FAB**
  - New file `css/mobile-drawer.css` - drawer styles with animations
  - New file `js/mobile-drawer.js` - drawer logic and user data
  - Slide-out drawer: user info, stats, navigation links, logout
  - FAB (Floating Action Button) for "Publicar" on mobile
  - Bottom nav "Menu" button opens drawer
- **Twitter Layout Phase 5 - Polish & Keyboard Shortcuts**
  - New file `css/dashboard-polish.css` - advanced animations, transitions
  - New file `js/dashboard-polish.js` - keyboard navigation, performance
  - Keyboard shortcuts: j/k nav, l/b/c actions, g+key goto, ? help
  - Card entrance animations with stagger effect
  - Scroll sync for sticky sidebars (Twitter-style)
  - Accessibility: skip-to-content, reduced-motion support
  - Performance: will-change, lazy loading, GPU acceleration
- Cache: v28.0

### 2026-01-25 (v3.46.0)
- **Social Platform Completa** - Twitter/X-like social features for feed
  - **Phase 1: Enhanced Cards** - Avatars with initials, thumbnails, verified badges
    - Modified `GET /api/feed/social` to JOIN with users table for actor data
    - Added engagement counters to response (likes, comments, views, shares)
    - Enhanced `social-feed.js` with new `renderEventCard()` design
    - New card layout: avatar header, body with media, engagement footer
  - **Phase 2: Likes & Bookmarks**
    - New tables: `social_likes`, `social_bookmarks`
    - New endpoints: `POST /api/feed/social/:id/like`, `POST /api/feed/social/:id/bookmark`, `GET /api/feed/social/bookmarks`
    - Optimistic UI updates with animations
  - **Phase 3: Comments System**
    - New table: `social_comments` with nested replies
    - New endpoints: `GET/POST /api/feed/social/:id/comments`, `DELETE /api/feed/social/comments/:id`
    - New components: `/js/hub/comments-modal.js`, `/css/hub/comments-modal.css`
  - **Phase 4: Social Follows**
    - New table: `social_follows`
    - New endpoints: `POST/DELETE /api/feed/social/follow/:userId`, `GET /api/feed/social/following`, `GET /api/feed/social/user/:userId/profile`
    - New components: `/js/hub/user-mini-profile.js`, `/css/hub/user-mini-profile.css`
  - **Phase 5: Discovery & Tabs**
    - New endpoint: `GET /api/feed/social/trending` (24h engagement score)
    - Filter tabs UI: Todos, Trending, Grupos, Mercado, Loteria, Logros
- Cache: v27.5
- **Twitter-style 3-Column Layout** (Phase 1)
  - New file: `/css/dashboard-layout.css` - Full 3-column responsive layout
  - Left sidebar: Navigation menu + quick links
  - Center: Social feed (scrollable)
  - Right sidebar: Hub cards + "Who to follow" + Trending (sticky, internally scrollable)
  - Mobile bottom nav for tablet/mobile
  - Sidebar data sync script for real-time updates

### 2026-01-24 (v3.45.0)
- **Social Feed** - New public community activity feed for dashboard
  - New PostgreSQL table `social_feed` with event types: group_created, product_posted, lottery_result, prediction_shared, milestone
  - New API endpoint `GET /api/feed/social` with pagination and type filtering
  - New helper function `insertSocialEvent()` for auto-populating feed
  - New frontend components: `/js/hub/social-feed.js`, `/css/hub/social-feed.css`
  - Infinite scroll with IntersectionObserver
- **Dashboard Cleanup** - Simplified dashboard layout
  - Hidden sections: Stats Carousel, Mining, Mis Tandas, Acciones + Mercado, Footer Stats
  - Dashboard now shows: Header → Hub Cards (4) → Social Feed
  - Mining section moved to DeFi Hub (future task)
- Cache: v27.0

### 2026-01-23 (v3.44.1)
- **Lottery Slide CSS Fix** - Fixed carousel lottery slide rendering issues
  - Added complete `.lottery-slide-dual` CSS with proper flexbox layout
  - Fixed orphaned CSS fragment causing browser parser errors
  - Added `.lottery-modal-overlay { display: none; }` to hide modal by default
  - Mobile responsive styles for max-width: 480px
- Cache: v26.7

### 2026-01-23 (v3.44.0)
- **Hub Inteligente Unificado** - New intelligent command center for home-dashboard
  - Contextual Alerts Banner (urgent, opportunity, info, reward types)
  - Insights Panel with rule-based personalized suggestions
  - 4 Module Cards Grid (Finanzas, Mercado, Loteria, Mineria)
  - Unified Activity Feed with filtering and pagination
  - MIA Assistant floating widget with quick actions
  - 3 new API endpoints: `/api/hub/summary`, `/api/hub/activity`, `/api/hub/insights`
  - New files in `/js/hub/` and `/css/hub/`
- **Dashboard Cleanup** - Removed redundant sections:
  - Removed Stats Carousel Slide 1 (Mi Resumen) - data now in Hub cards
  - Removed Stats Carousel Slide 2 (DeFi Metrics) - was placeholder
  - Removed Actividad Reciente section - replaced by Hub unified feed
  - Carousel now has 2 slides (Governance, Lottery Predictor)
- Cache: v26.0

### 2026-01-22 (v3.43.0)
- **Header CSS Fix** - Fixed broken layout in global header
- **Tier Progress Banner** - New collapsible user tier display
  - Progress bar, expandable details, tanda member highlighting
  - Dynamic user data from API subscription endpoint
  - Correct paused tanda detection (`tandas.status` vs `groups.status`)
  - Dynamic "Próximos pasos" based on tier/status
- **Marketplace Features Documentation** - Documented 5 undocumented features
- Cache: v25.2

### 2026-01-20 (v3.42.0)
- **Developer Onboarding System** - Complete developer experience
  - Demo account: `demo@latanda.online` / `LaTandaDemo2026!`
  - Public endpoints: `/api/public/stats`, `/api/public/products`, etc.
  - Postman collection: `/postman-collection.json`
  - Developer Portal "Try Now" section with instant onboarding
- **GitHub Community** - Issue #28 created, README updated
- Cache: v24.2

### 2026-01-19 (v3.41.0)
- **SSL Certificate Renewed** - New expiration April 2026
- **Paused Tanda Status Fix** - Shows tanda status instead of group status
- Cache: v24.1

### 2026-01-18 (v3.40.0)
- **Product Creation Flow Fix** - End-to-end publishing working
- Cache: v23.9

See `CHANGELOG.md` for full details

---

## Documentation

| Doc | Location |
|-----|----------|
| Full Changelog | `/home/ebanksnigel/CHANGELOG.md` |
| Architecture | `/var/www/latanda.online/FULL-STACK-ARCHITECTURE.md` |
| **Blockchain Strategy** | `/var/www/latanda.online/BLOCKCHAIN-STRATEGY.md` |
| Remote Audit | `/home/ebanksnigel/REMOTE-SERVER-AUDIT.md` |
| **Twitter Layout Plan** | `/home/ebanksnigel/PLAN-TWITTER-LAYOUT.md` |
| Social Plan | `/home/ebanksnigel/.claude/plans/rosy-splashing-widget.md` |

---

## Twitter Layout Progress

| Phase | Description | Status |
|-------|-------------|--------|
| **1** | Structure Base (HTML + CSS Grid) | ✅ Complete |
| **2** | Left Sidebar + HTML Cleanup | ✅ Complete |
| **3** | Right Sidebar real data | ✅ Complete |
| **4** | Responsive/Mobile drawers | ✅ Complete |
| **5** | Polish (animations, shortcuts) | ✅ Complete |
| **6** | Mobile Nav Redesign | ✅ Complete |
| **7** | Sidebar Pages (Explorar, Trabajo, etc.) | ✅ Complete |

**🎉 Twitter Layout + Sidebar Pages COMPLETADO**

**Layout Files:**
- CSS: `/var/www/html/main/css/dashboard-layout.css`
- CSS: `/var/www/html/main/css/mobile-drawer.css`
- CSS: `/var/www/html/main/css/dashboard-polish.css`
- CSS: `/var/www/html/main/css/edge-swipe.css` (v1.4)
- CSS: `/var/www/html/main/css/hub/social-feed.css` (v4.1)
- HTML: `/var/www/html/main/home-dashboard.html`
- JS: `/var/www/html/main/js/hub/sidebar-widgets.js`
- JS: `/var/www/html/main/js/hub/social-feed.js` (v4.1)
- JS: `/var/www/html/main/js/mobile-drawer.js`
- JS: `/var/www/html/main/js/dashboard-polish.js`
- JS: `/var/www/html/main/js/edge-swipe.js` (v1.5 - simplified, buttons only)

**Sidebar Page Files (v3.51.0):**
- HTML: `/var/www/html/main/explorar.html`
- HTML: `/var/www/html/main/trabajo.html`
- HTML: `/var/www/html/main/creator-hub.html`
- HTML: `/var/www/html/main/guardados.html`
- HTML: `/var/www/html/main/mensajes.html`
- JS: `/var/www/html/main/js/explore.js`
- JS: `/var/www/html/main/js/trabajo.js`
- JS: `/var/www/html/main/js/creator-hub.js`
- JS: `/var/www/html/main/js/guardados.js`
- JS: `/var/www/html/main/js/mensajes.js`

**Mobile Bottom Nav:**
```
┌────────┬────────┬─────────┬─────────┐
│  Menu  │ Inicio │ Mercado │ Widgets │
│   ☰    │   🏠   │   🏪    │   ⊞    │
└────────┴────────┴─────────┴─────────┘
```
- **Menu** → `EdgeSwipe.toggleLeft()` (abre left sidebar)
- **Inicio** → `home-dashboard.html`
- **Mercado** → `marketplace-search.html`
- **Widgets** → `EdgeSwipe.toggleRight()` (abre right sidebar)

---

*Always: backup before changes, read before editing, test before deploying*
