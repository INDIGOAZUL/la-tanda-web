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

220+ endpoints organizados en modulos:

| Modulo | Endpoints | Descripcion |
|--------|-----------|-------------|
| Auth | `/api/auth/*` | Login, registro, refresh, 2FA, verificacion |
| Groups | `/api/groups/*` | CRUD grupos, miembros, contribuciones, sorteo |
| Tandas | `/api/tandas/*` | Ciclos, turnos, pagos, coordinador |
| Wallet | `/api/wallet/*` | Balance, transacciones, retiros, depositos |
| Marketplace | `/api/marketplace/*` | Productos, servicios, tiendas, reservas, disputas, suscripciones |
| Social Feed | `/api/feed/social/*` | Posts, likes, comments, follow, trending, bookmarks, view tracking |
| Admin | `/api/admin/*` | Dashboard, usuarios, auditoria, compliance |
| Lottery | `/api/lottery/*` | Predicciones, scraping, estadisticas, WebSocket en vivo |
| MIA | `/api/mia/*` | Chat con asistente IA |
| Uploads | `/api/upload/*` | Imagenes, videos, comprobantes |

**Documentacion interactiva:** [latanda.online/docs](https://latanda.online/docs) (Swagger UI)
**Portal de desarrolladores:** [latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html) (sandbox, WebSocket, SDK, chain)

---

## Desarrollo Local

```bash
# Clonar
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web

# Frontend (archivos estaticos)
# Abrir cualquier .html en el navegador o servir con:
npx serve .

# Smart contracts
cd smart-contracts
npm install
npx hardhat compile
npx hardhat test
```

> **Nota:** El backend (API + DB) corre en el servidor de produccion. Para desarrollo backend se requiere acceso SSH al servidor.

---

## Estructura del Proyecto

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

## Contribuir

### Bounties Activos

Ver todos: **[Issues con label `bounty`](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=is%3Aopen+label%3Abounty)**

### Como Contribuir

1. Lee **[CONTRIBUTING.md](./CONTRIBUTING.md)** — especialmente la seccion "Codebase Patterns"
2. Revisa los [bounties abiertos](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=label%3Abounty)
3. Comenta en el issue que te interesa
4. Fork, trabaja en tu branch, abre PR referenciando el issue
5. Review por maintainers (24-48h)
6. Merge y recompensa en LTD tokens

### Guias

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Codebase patterns, security rules, file structure
- [Developer Quickstart](./DEVELOPER-QUICKSTART.md) — Setup en 5 minutos
- [Dev Portal](https://latanda.online/dev-dashboard.html) — Sandbox, WebSocket, SDK, chain docs
- [API Docs (Swagger)](https://latanda.online/docs) — 220+ endpoints interactivos

---

## Seguridad

Si descubres una vulnerabilidad de seguridad:

1. **NO** abras un issue publico
2. Contacta: security@latanda.online
3. Incluye descripcion detallada y pasos para reproducir
4. Bounty prioritario (hasta 500 LTD)

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


## Developer Onboarding (Bounty #50)

### Development Setup

```bash
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web
npx serve .
# open http://localhost:3000
```

- Frontend is static HTML/JS/CSS served from repo root.
- Production API is available via `https://latanda.online`.
- API docs (Swagger UI): `https://latanda.online/docs`
- Developer Portal: `https://latanda.online/dev-dashboard.html`
- Chain Explorer: `https://latanda.online/chain/`

### Project Structure (developer-focused)

- `*.html` (repo root): main app pages.
- `marketplace-social.js` (repo root): Marketplace singleton module.
- `js/hub/social-feed.js`: SocialFeed singleton.
- `integrated-api-complete-95-endpoints.js`: main API server file.
- `css/`: styling modules.
- `docs/swagger/openapi.json`: OpenAPI spec.
- `smart-contracts/`: Solidity contracts and Hardhat tests.

### Verification Answers (for bounty claim)

- `marketplace-social.js` lives at the **HTML root** (not in `js/`).
- Main API file: **`integrated-api-complete-95-endpoints.js`**.
