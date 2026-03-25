# La Tanda — Cooperativa de Ahorro Digital

[![Live](https://img.shields.io/badge/Live-latanda.online-00FFFF)](https://latanda.online)
[![Version](https://img.shields.io/badge/Version-4.12.0-blue)](https://latanda.online)
[![API](https://img.shields.io/badge/API-220%2B%20endpoints-00FF80)](https://latanda.online/docs)
[![Security](https://img.shields.io/badge/Security-20%2B%20audit%20rounds-red)](https://latanda.online)
[![Chain](https://img.shields.io/badge/Chain-latanda--testnet--1-FF6B35)](https://latanda.online/chain/)
[![License](https://img.shields.io/badge/License-MIT-blue)](./LICENSE)

**Plataforma fintech de ahorro cooperativo (tandas/ROSCAs) para comunidades en Honduras.**

La Tanda digitaliza las tandas tradicionales — grupos de ahorro rotativo donde cada miembro contribuye periodicamente y recibe el fondo completo en su turno. La plataforma agrega gestion automatizada, billetera digital, marketplace comunitario, red social, y prediccion de loteria.

**[latanda.online](https://latanda.online)** — En produccion con usuarios reales.

---

## What is La Tanda?

A **tanda** (ROSCA — Rotating Savings and Credit Association) is a traditional community savings system across Latin America. A group of people agrees to contribute a fixed amount of money periodically. Each round, one member receives the full pool. It's banking without a bank — community trust as financial infrastructure.

La Tanda brings this concept to a digital platform with:
- Automated turn rotation and fair lottery (tombola)
- Digital wallet with contribution and withdrawal tracking
- Payment verification with receipts and OCR
- Configurable penalties and grace periods
- Transparent history for all members

---

## Features

### Savings Cooperative
- **Groups & Tandas** — Create, manage, join. Turn lottery, automatic cycles, tracked contributions
- **Digital Wallet** — Balance in Lempiras (HNL), contributions, bank withdrawals, transaction history
- **Marketplace** — Buy/sell products and services between community members
- **Social Feed** — Posts, media, GIFs, polls, location, incognito mode, mentions, hashtags
- **MIA** — AI assistant (Groq Llama 3.3 70B) integrated into the platform
- **Lottery Predictor** — Frequency analysis and Markov chains for La Diaria de Honduras
- **Token Mining** — Earn LTD through daily platform activity
- **KYC** — Identity verification with document upload

### Security (20+ audit rounds)
- JWT with refresh token rotation and blacklisting
- Zero `SELECT *`, `RETURNING *`, `Math.random()`, `body.user_id` IDOR across entire codebase
- Rate limiting by zone (auth 5/min, API 5/s, general 10/s), CSP, SRI on CDN scripts
- bcrypt 12 rounds, `crypto.timingSafeEqual` for sensitive comparisons
- WebSocket with JWT authentication and heartbeat
- API only accessible via Nginx (127.0.0.1:3002)
- Dedicated DB user `latanda_app` (DML-only, no superuser)
- Transactions with `SELECT FOR UPDATE` on financial operations

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vanilla JS, HTML5, CSS3 (Glassmorphism), PWA with Service Worker (Workbox) |
| **Backend** | Node.js (native http), 220+ REST endpoints in a single file |
| **Database** | PostgreSQL 16 (40+ tables, `latanda_app` DML-only user) |
| **Cache/Sessions** | Redis (rate limiting, token blacklist) |
| **Process** | PM2 cluster mode (2 instances, max 384MB heap) |
| **Proxy** | Nginx (SSL, gzip_static, WebSocket proxy, security headers) |
| **AI** | Groq Llama 3.3 70B (MIA assistant) |
| **Blockchain** | La Tanda Chain (Cosmos SDK / CometBFT), Polygon Amoy testnet (LTD ERC20) |

---

## Architecture

```
                    ┌─────────────┐
                    │   Browser   │
                    │  (PWA/SW)   │
                    └──────┬──────┘
                           │ HTTPS
                    ┌──────┴──────┐
                    │    Nginx    │
                    │  SSL/gzip   │
                    │ rate limits │
                    └──┬───┬───┬──┘
                       │   │   │
              ┌────────┘   │   └────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  Static  │ │ API x2   │ │ WebSocket│
        │  Files   │ │ (PM2)    │ │ Lottery  │
        │ /main/   │ │ :3002    │ │ :3002/ws │
        └──────────┘ └────┬─────┘ └──────────┘
                          │
                ┌─────────┼─────────┬─────────┐
                ▼         ▼         ▼         ▼
          ┌──────────┐ ┌─────┐ ┌──────┐ ┌─────────┐
          │PostgreSQL│ │Redis│ │ Groq │ │La Tanda │
          │  16      │ │     │ │ LLM  │ │ Chain   │
          └──────────┘ └─────┘ └──────┘ └─────────┘
```

---

## Smart Contracts

Deployed on **Polygon Amoy Testnet** (October 2025).

| Contract | Address | Function |
|----------|---------|----------|
| **LTDToken V2.0** | [`0x863321...d9cFc`](https://amoy.polygonscan.com/address/0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc) | ERC20, 1B supply, vesting, governance |
| **RoyalOwnershipVesting** | [`0x7F21EC...082F`](https://amoy.polygonscan.com/address/0x7F21EC0A4B3Ec076eB4bc2924397C85B44a5082F) | 4-year linear vesting, 1-year cliff, 2% monthly limit |
| **FutureReserve** | [`0xF136C7...0bA2`](https://amoy.polygonscan.com/address/0xF136C790da0D76d75d36207d954A6E114A9c0bA2) | DAO governance, 7-day timelock |

**Token distribution:** Participation 20% | Staking & Governance 30% | Development 25% | Liquidity 10% | Vesting 10% | DAO Reserve 5%

> LTD tokens are on testnet. They will be exchangeable 1:1 for mainnet LTD at launch.

---

## API

220+ endpoints organized in modules:

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | `/api/auth/*` | Login, registration, refresh, 2FA, verification |
| Groups | `/api/groups/*` | CRUD groups, members, contributions, lottery |
| Tandas | `/api/tandas/*` | Cycles, turns, payments, coordinator |
| Wallet | `/api/wallet/*` | Balance, transactions, withdrawals, deposits |
| Marketplace | `/api/marketplace/*` | Products, services, stores, reservations, disputes, subscriptions |
| Social Feed | `/api/feed/social/*` | Posts, likes, comments, follow, trending, bookmarks, view tracking |
| Admin | `/api/admin/*` | Dashboard, users, auditing, compliance |
| Lottery | `/api/lottery/*` | Predictions, scraping, statistics, live WebSocket |
| MIA | `/api/mia/*` | AI assistant chat |
| Uploads | `/api/upload/*` | Images, videos, receipts |

**Interactive docs:** [latanda.online/docs](https://latanda.online/docs) (Swagger UI)
**Developer portal:** [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html) (sandbox, WebSocket, SDK, chain)

> **All endpoints live in a single file:** `integrated-api-complete-95-endpoints.js`. This is a vanilla Node.js HTTP server — **no Express**. Do not create separate route files.

---

## Development Setup

### Prerequisites

- **Node.js** 16+ (for smart contract compilation and local serving)
- **Git** (for cloning and contributing)
- A modern browser (Chrome, Firefox, Safari)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web

# 2. Serve the frontend locally
npx serve .
# Opens at http://localhost:3000
# All HTML pages are static — open any .html file directly
```

The frontend calls the **production API** at `latanda.online`. No local backend setup is needed for frontend development.

### Smart Contracts (optional)

```bash
cd smart-contracts
npm install
npx hardhat compile
npx hardhat test
```

### Key Development Notes

- **No build step required** — the frontend is plain HTML/CSS/JS with no bundler
- **No local backend needed** — the frontend connects to the production API
- **Backend access** requires SSH to the production server (maintainer-granted)
- Check the [Swagger UI](https://latanda.online/docs) to verify endpoint paths before coding
- Check the [Dev Portal](https://latanda.online/dev-dashboard.html) for sandbox tools, WebSocket testing, and SDK docs
- Check the [Chain Explorer](https://latanda.online/chain/) for blockchain data

---

## Project Structure

```
la-tanda-web/
├── *.html                          # 30+ frontend pages (home-dashboard, auth, explorar, etc.)
├── marketplace-social.js           # Marketplace SPA logic (AT ROOT, NOT in js/)
├── marketplace-social.html         # Marketplace page (AT ROOT)
├── integrated-api-complete-95-endpoints.js  # ALL backend endpoints — single file, vanilla Node.js
├── js/
│   ├── hub/                        # Core frontend modules
│   │   ├── social-feed.js          # Social feed (SocialFeed singleton)
│   │   ├── contextual-widgets.js   # Sidebar widgets
│   │   ├── sidebar-widgets.js      # Sidebar data
│   │   └── comments-modal.js       # Comments system
│   ├── core/                       # Shared utilities
│   ├── header/                     # Header components
│   ├── sidebar/                    # Sidebar logic
│   ├── onboarding/                 # Onboarding flows
│   ├── utils/                      # Utility functions
│   ├── lib/                        # Libraries (ethers.js)
│   └── components-loader.js        # Dynamic component loading (sidebar, header injection)
├── css/
│   ├── hub/                        # Hub styles (social-feed.css)
│   ├── components/                 # Component styles
│   ├── dashboard-layout.css        # Main layout
│   └── groups-page.css             # Groups/Tandas styles
├── chain/                          # La Tanda Chain explorer (self-contained SPA)
├── docs/swagger/openapi.json       # OpenAPI spec (220+ paths)
├── smart-contracts/
│   ├── contracts/                  # LTDToken, Vesting, Reserve (Solidity)
│   ├── scripts/                    # Deploy scripts
│   └── test/                       # Contract tests (Hardhat)
├── .github/
│   ├── workflows/                  # CI/CD
│   ├── ISSUE_TEMPLATE/             # Bounty templates
│   └── PULL_REQUEST_TEMPLATE.md    # PR checklist
├── CONTRIBUTING.md                 # Contribution guide + codebase patterns
└── DEVELOPER-QUICKSTART.md         # Quick setup guide
```

### Critical File Paths

> ⚠️ **Getting file paths wrong is the #1 reason PRs are rejected.**

| File | Location | Common Mistake |
|------|----------|----------------|
| `marketplace-social.js` | **Root** (`./marketplace-social.js`) | ❌ Putting it in `js/` |
| `SocialFeed` module | `js/hub/social-feed.js` | ❌ Looking at root |
| All API endpoints | `integrated-api-complete-95-endpoints.js` | ❌ Creating separate route files |
| Dynamic components | `js/components-loader.js` | ❌ Creating standalone component files |

---

## Contributing

### Active Bounties

Browse all: **[Issues labeled `bounty`](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=is%3Aopen+label%3Abounty)**

### How to Contribute

1. Read **[CONTRIBUTING.md](./CONTRIBUTING.md)** — especially the "Codebase Patterns" section
2. Browse [open bounties](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=label%3Abounty) by tier ([tier-0](https://github.com/INDIGOAZUL/la-tanda-web/labels/tier-0), [tier-1](https://github.com/INDIGOAZUL/la-tanda-web/labels/tier-1), [tier-2](https://github.com/INDIGOAZUL/la-tanda-web/labels/tier-2))
3. Comment on the issue with your approach and answer the verification question
4. Wait for maintainer assignment (unassigned PRs are auto-closed)
5. Fork, work on your branch, open a PR referencing the issue (`Closes #XX`)
6. Review by maintainers (24-48h), then merge and LTD token reward

### Guides

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Codebase patterns, security rules, file structure
- **[Developer Quickstart](./DEVELOPER-QUICKSTART.md)** — Setup in 5 minutes
- **[Dev Portal](https://latanda.online/dev-dashboard.html)** — Sandbox, WebSocket, SDK, chain docs
- **[API Docs (Swagger)](https://latanda.online/docs)** — 220+ interactive endpoints

---

## Security

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Contact: security@latanda.online
3. Include detailed description and steps to reproduce
4. Priority bounty (up to 500 LTD)

---

## Links

| | |
|---|---|
| **Platform** | [latanda.online](https://latanda.online) |
| **API Docs** | [latanda.online/docs](https://latanda.online/docs) |
| **Chain Explorer** | [latanda.online/chain](https://latanda.online/chain/) |
| **Dev Portal** | [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html) |
| **GitHub** | [github.com/INDIGOAZUL/la-tanda-web](https://github.com/INDIGOAZUL/la-tanda-web) |
| **Twitter/X** | [@TandaWeb3](https://x.com/TandaWeb3) |
| **YouTube** | [La Tanda Channel](https://www.youtube.com/channel/UCQitNp79J1-DvJKi334_8qw) |
| **Discussions** | [GitHub Discussions](https://github.com/INDIGOAZUL/la-tanda-web/discussions) |

---

## License

MIT — See [LICENSE](./LICENSE)

---

Built from Roatan, Honduras. Financial inclusion through technology and community.

*Last updated: March 25, 2026*
