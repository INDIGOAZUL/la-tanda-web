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

## 🚀 Development Setup

### Quick Start

```bash
# Clone the repository
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web

# Install dependencies (if needed)
npm install

# Serve locally
npx serve .

# Open in browser
open http://localhost:3000
```

### Requirements

- Node.js 18+ (for `npx serve`)
- Modern browser (Chrome, Firefox, Edge)
- No build step required — vanilla JS

### Local Development

The project is a static PWA (Progressive Web App) with no build process. Simply serve the files and open in browser.

**Note:** Some features require backend API access. For full local development, see [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md).

---

## 📁 Project Structure

```
la-tanda-web/
├── index.html              # Main entry point
├── auth.html               # Authentication pages
├── home-dashboard.html     # User dashboard
├── my-wallet.html          # Wallet interface
├── groups-advanced-system.html  # Groups management
├── marketplace-social.html # Marketplace + social feed
├── lottery-predictor.html  # Lottery prediction tool
├── admin-panel-v2.html     # Admin panel
├── dev-dashboard.html      # Developer portal
│
├── js/                     # JavaScript modules
│   ├── auth.js             # Authentication logic
│   ├── api-proxy.js        # API client
│   ├── db-postgres.js      # Database helpers
│   ├── marketplace-social.js  # Marketplace + social
│   ├── lottery-api.js      # Lottery system
│   └── ...                 # 100+ JS modules
│
├── css/                    # Stylesheets
│   ├── styles.css          # Main styles
│   ├── auth-styles.css     # Auth page styles
│   └── ...                 # Component styles
│
├── assets/                 # Images, icons, fonts
├── components/             # Reusable UI components
├── smart-contracts/        # Blockchain contracts
├── chain/                  # Cosmos SDK blockchain
├── database/               # DB schemas, migrations
├── docs/                   # Documentation
├── tests/                  # Test files
│
├── DEPLOYMENT-GUIDE.md     # Production deployment
├── CONTRIBUTING.md         # Contribution guidelines
├── ARCHITECTURE.md         # System architecture
└── README.md               # This file
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `js/` | Frontend JavaScript modules (auth, API, wallet, groups, marketplace, lottery) |
| `css/` | Stylesheets for all pages and components |
| `assets/` | Images, icons, fonts, media files |
| `components/` | Reusable UI components (modals, forms, cards) |
| `smart-contracts/` | Solidity contracts for LTD token, groups, payouts |
| `chain/` | Cosmos SDK blockchain for La Tanda Chain |
| `database/` | PostgreSQL schemas, migrations, seed data |
| `docs/` | API documentation, guides, tutorials |
| `tests/` | Unit tests, integration tests, E2E tests |

### Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main landing page and app shell |
| `auth.html` | Login, registration, 2FA flows |
| `home-dashboard.html` | User dashboard with metrics |
| `my-wallet.html` | Wallet interface (deposits, withdrawals, balance) |
| `groups-advanced-system.html` | Group creation, management, payouts |
| `marketplace-social.html` | Community marketplace + social feed |
| `lottery-predictor.html` | Lottery prediction using Markov chains |
| `admin-panel-v2.html` | Admin panel for user management, KYC, payouts |
| `dev-dashboard.html` | Developer portal with API docs, bounty info |

---

## 🔗 Important Links

- **[Live App](https://latanda.online)** — Production deployment
- **[Swagger UI](https://latanda.online/docs)** — API documentation (220+ endpoints)
- **[Dev Portal](https://latanda.online/dev-dashboard.html)** — Developer resources
- **[Chain Explorer](https://latanda.online/chain/)** — Blockchain explorer
- **[Contributing Guide](./CONTRIBUTING.md)** — How to contribute and earn LTD
- **[Architecture](./ARCHITECTURE.md)** — System design and diagrams
- **[Deployment Guide](./DEPLOYMENT-GUIDE.md)** — Production deployment instructions

---

## 🏆 Bounty Program

We pay contributors in **LTD tokens** for merged PRs. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Quick Links

- [Tier 0 Issues](https://github.com/INDIGOAZUL/la-tanda-web/labels/tier-0) — Docs, translation, tests (10-50 LTD)
- [Tier 1 Issues](https://github.com/INDIGOAZUL/la-tanda-web/labels/tier-1) — Frontend features (50-150 LTD)
- [Tier 2 Issues](https://github.com/INDIGOAZUL/la-tanda-web/labels/tier-2) — Guided features (150-500 LTD)

### How to Claim

1. Pick a bounty issue
2. Comment with your approach + answer the verification question
3. Wait for maintainer assignment
4. Submit PR within 7 days
5. Get paid in LTD tokens on merge!

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vanilla JS, HTML5, CSS3 (Glassmorphism), PWA with Service Worker (Workbox) |
| **Backend** | Node.js (native http), 220+ REST endpoints |
| **Database** | PostgreSQL 16 (40+ tables, DML-only user `latanda_app`) |
| **Cache/Sessions** | Redis (rate limiting, token blacklist) |
| **Process** | PM2 cluster mode (2 instances, max 384MB heap) |
| **Proxy** | Nginx (SSL, gzip_static, WebSocket proxy, security headers) |
| **AI** | Groq Llama 3.3 70B (MIA assistant) |
| **Blockchain** | La Tanda Chain (Cosmos SDK / CometBFT), Polygon Amoy testnet (LTD ERC20) |

---

## 🏛️ Architecture

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

## 📜 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 📞 Contact

- **Website:** [latanda.online](https://latanda.online)
- **GitHub:** [INDIGOAZUL/la-tanda-web](https://github.com/INDIGOAZUL/la-tanda-web)
- **Dev Portal:** [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)

---

**Built with ❤️ for the unbanked communities of Honduras.**
