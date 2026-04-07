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

## Que es una Tanda?

Una **tanda** (ROSCA — Rotating Savings and Credit Association) es un sistema de ahorro comunitario tradicional en Latinoamerica. Un grupo de personas acuerda contribuir una cantidad fija de dinero periodicamente. En cada ronda, un miembro recibe el fondo completo. Es banca sin banco — confianza comunitaria como infraestructura financiera.

La Tanda lleva este concepto a una plataforma digital con:
- Turnos automatizados y sorteo justo (tombola)
- Billetera con control de contribuciones y retiros
- Pagos verificados con comprobantes y OCR
- Penalizaciones y periodos de gracia configurables
- Historial transparente para todos los miembros

---

## Funcionalidades

### Cooperativa de Ahorro
- **Grupos y Tandas** — Crear, administrar, unirse. Sorteo de turnos, ciclos automaticos, contribuciones rastreadas
- **Billetera Digital** — Balance en Lempiras (HNL), contribuciones, retiros a cuenta bancaria, historial de transacciones
- **Marketplace** — Compra/venta de productos y servicios entre miembros de la comunidad
- **Red Social** — Feed con posts, media, GIFs, encuestas, ubicacion, modo incognito, mentions, hashtags
- **MIA** — Asistente IA (Groq Llama 3.3 70B) integrado en la plataforma
- **Predictor de Loteria** — Analisis de frecuencia y cadenas de Markov para La Diaria de Honduras
- **Mineria de Tokens** — Gana LTD por actividad diaria en la plataforma
- **KYC** — Verificacion de identidad con upload de documentos

### Seguridad (20+ rondas de auditoria)
- JWT con rotacion de refresh tokens y blacklisting
- Zero `SELECT *`, `RETURNING *`, `Math.random()`, `body.user_id` IDOR en todo el codebase
- Rate limiting por zona (auth 5/min, API 5/s, general 10/s), CSP, SRI en CDN scripts
- bcrypt 12 rounds, `crypto.timingSafeEqual` para comparaciones sensibles
- WebSocket con autenticacion JWT y heartbeat
- API solo accesible via Nginx (127.0.0.1:3002)
- Usuario de DB dedicado `latanda_app` (DML-only, sin superuser)
- Transacciones con `SELECT FOR UPDATE` en operaciones financieras

---

## Stack Tecnico

| Capa | Tecnologia |
|------|------------|
| **Frontend** | Vanilla JS, HTML5, CSS3 (Glassmorphism), PWA con Service Worker (Workbox) |
| **Backend** | Node.js (native http), 220+ endpoints REST |
| **Base de Datos** | PostgreSQL 16 (40+ tablas, usuario `latanda_app` DML-only) |
| **Cache/Sessions** | Redis (rate limiting, token blacklist) |
| **Proceso** | PM2 cluster mode (2 instancias, max 384MB heap) |
| **Proxy** | Nginx (SSL, gzip_static, WebSocket proxy, security headers) |
| **IA** | Groq Llama 3.3 70B (asistente MIA) |
| **Blockchain** | La Tanda Chain (Cosmos SDK / CometBFT), Polygon Amoy testnet (LTD ERC20) |

---

## Arquitectura

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

Desplegados en **Polygon Amoy Testnet** (Octubre 2025).

| Contrato | Address | Funcion |
|----------|---------|---------|
| **LTDToken V2.0** | [`0x863321...d9cFc`](https://amoy.polygonscan.com/address/0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc) | ERC20, 1B supply, vesting, governance |
| **RoyalOwnershipVesting** | [`0x7F21EC...082F`](https://amoy.polygonscan.com/address/0x7F21EC0A4B3Ec076eB4bc2924397C85B44a5082F) | 4-year linear vesting, 1-year cliff, 2% monthly limit |
| **FutureReserve** | [`0xF136C7...0bA2`](https://amoy.polygonscan.com/address/0xF136C790da0D76d75d36207d954A6E114A9c0bA2) | DAO governance, 7-day timelock |

**Distribucion de tokens:** Participation 20% | Staking & Governance 30% | Development 25% | Liquidity 10% | Vesting 10% | DAO Reserve 5%

> Los tokens LTD estan en testnet. Seran intercambiables 1:1 por mainnet LTD al lanzamiento.

---

## API

220+ endpoints organized in modules:

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | `/api/auth/*` | Login, register, refresh, 2FA, verification |
| Groups | `/api/groups/*` | CRUD groups, members, contributions, lottery draw |
| Tandas | `/api/tandas/*` | Cycles, turns, payments, coordinator |
| Wallet | `/api/wallet/*` | Balance, transactions, withdrawals, deposits |
| Marketplace | `/api/marketplace/*` | Products, services, stores, reservations, disputes, subscriptions |
| Social Feed | `/api/feed/social/*` | Posts, likes, comments, follow, trending, bookmarks, view tracking |
| Admin | `/api/admin/*` | Dashboard, users, audit, compliance |
| Lottery | `/api/lottery/*` | Predictions, scraping, statistics, live WebSocket |
| MIA | `/api/mia/*` | AI assistant chat |
| Uploads | `/api/upload/*` | Images, videos, receipts |

**Interactive API docs:** [latanda.online/docs](https://latanda.online/docs) (Swagger UI)
**Developer portal:** [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html) (sandbox, WebSocket, SDK, chain)

---

## Development Setup

```bash
# Clone
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web

# Frontend (static files)
# Open any .html in the browser, or serve locally with:
npx serve .

# Smart contracts
cd smart-contracts
npm install
npx hardhat compile
npx hardhat test
```

> **Note:** The backend (API + DB) runs on the production server. Backend development requires SSH access to the server.

---

## Project Structure

```
la-tanda-web/
├── *.html                        # 30+ paginas frontend (home-dashboard, explorar, etc.)
├── marketplace-social.js         # Marketplace SPA (AT ROOT, not in js/)
├── marketplace-social.html       # Marketplace HTML (AT ROOT)
├── js/
│   ├── hub/                      # Core modules
│   │   ├── social-feed.js        # Social feed (SocialFeed singleton)
│   │   ├── contextual-widgets.js # Sidebar widgets
│   │   ├── sidebar-widgets.js    # Sidebar data
│   │   └── comments-modal.js     # Comments system
│   ├── core/                     # Shared utilities
│   ├── header/                   # Header components
│   ├── sidebar/                  # Sidebar logic
│   ├── onboarding/               # Onboarding flows
│   ├── utils/                    # Utility functions
│   ├── lib/                      # Libraries (ethers.js)
│   └── components-loader.js      # Dynamic component loading
├── css/
│   ├── hub/                      # Hub styles (social-feed.css)
│   ├── components/               # Component styles
│   ├── dashboard-layout.css      # Main layout
│   └── groups-page.css           # Groups/Tandas styles
├── chain/                        # La Tanda Chain explorer + files
├── docs/swagger/openapi.json     # OpenAPI spec (220+ paths)
├── smart-contracts/
│   ├── contracts/                # LTDToken, Vesting, Reserve (Solidity)
│   ├── scripts/                  # Deploy scripts
│   └── test/                     # Contract tests (Hardhat)
├── .github/
│   ├── workflows/                # CI/CD
│   ├── ISSUE_TEMPLATE/           # Bounty templates
│   └── PULL_REQUEST_TEMPLATE.md  # PR checklist
├── CONTRIBUTING.md               # Contribution guide + codebase patterns
└── DEVELOPER-QUICKSTART.md       # Quick setup guide
```

> **Important:** `marketplace-social.js` lives at the root alongside the HTML files, NOT inside `js/`. The `SocialFeed` module lives at `js/hub/social-feed.js`. Getting file paths wrong is the #1 reason PRs are rejected.

---

## Contributing

### Active Bounties

See all: **[Issues with `bounty` label](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=is%3Aopen+label%3Abounty)**

### How to Contribute

1. Read **[CONTRIBUTING.md](./CONTRIBUTING.md)** — especially the "Codebase Patterns" section
2. Browse [open bounties](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=label%3Abounty)
3. Comment on the issue you're interested in
4. Fork, work on your branch, open a PR referencing the issue
5. Maintainer review (24-48h)
6. Merge and reward in LTD tokens

### Guides

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Codebase patterns, security rules, file structure
- [Developer Quickstart](./DEVELOPER-QUICKSTART.md) — Setup in 5 minutes
- [Dev Portal](https://latanda.online/dev-dashboard.html) — Sandbox, WebSocket, SDK, chain docs
- [API Docs (Swagger)](https://latanda.online/docs) — 220+ interactive endpoints

---

## Security

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Contact: security@latanda.online
3. Include a detailed description and steps to reproduce
4. Priority bounty (up to 500 LTD)

---

## Links

| | |
|---|---|
| **Plataforma** | [latanda.online](https://latanda.online) |
| **API Docs** | [latanda.online/docs](https://latanda.online/docs) |
| **GitHub** | [github.com/INDIGOAZUL/la-tanda-web](https://github.com/INDIGOAZUL/la-tanda-web) |
| **Twitter/X** | [@TandaWeb3](https://x.com/TandaWeb3) |
| **YouTube** | [La Tanda Channel](https://www.youtube.com/channel/UCQitNp79J1-DvJKi334_8qw) |
| **Discussions** | [GitHub Discussions](https://github.com/INDIGOAZUL/la-tanda-web/discussions) |

---

## Licencia

MIT — Ver [LICENSE](./LICENSE)

---

Construido desde Roatan, Honduras. Inclusion financiera a traves de tecnologia y comunidad.

*Ultima actualizacion: Marzo 3, 2026*
