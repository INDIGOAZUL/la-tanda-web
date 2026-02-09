# La Tanda — Cooperativa de Ahorro Digital

[![Live](https://img.shields.io/badge/Live-latanda.online-00FFFF)](https://latanda.online)
[![Version](https://img.shields.io/badge/Version-3.92.0-blue)](https://latanda.online)
[![API](https://img.shields.io/badge/API-140%2B%20endpoints-00FF80)](https://latanda.online/docs)
[![Security](https://img.shields.io/badge/Security-17%20audit%20rounds-red)](https://latanda.online)
[![Contracts](https://img.shields.io/badge/Contracts-Polygon%20Amoy-8B5CF6)](https://amoy.polygonscan.com)
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

### Seguridad (17 rondas de auditoria)
- JWT con rotacion de refresh tokens y blacklisting
- Zero `SELECT *`, `RETURNING *`, `Math.random()`, `body.user_id` IDOR en todo el codebase
- Rate limiting por zona (auth, API, general), CSP, SRI en CDN scripts
- bcrypt 12 rounds, `crypto.timingSafeEqual` para comparaciones sensibles
- WebSocket con autenticacion JWT
- API solo accesible via Nginx (127.0.0.1:3002)
- Usuario de DB dedicado (DML-only, sin superuser)
- Autovacuum tunado, timeouts de conexion, logging de queries lentas

---

## Stack Tecnico

| Capa | Tecnologia |
|------|------------|
| **Frontend** | Vanilla JS, HTML5, CSS3 (Glassmorphism), PWA con Service Worker (Workbox) |
| **Backend** | Node.js (native http), 140+ endpoints REST |
| **Base de Datos** | PostgreSQL 16 (30+ tablas, usuario `latanda_app` DML-only) |
| **Cache/Sessions** | Redis (rate limiting, token blacklist) |
| **Proceso** | PM2 cluster mode (2 instancias, max 384MB heap) |
| **Proxy** | Nginx (SSL, gzip_static, WebSocket proxy, security headers) |
| **IA** | Groq Llama 3.3 70B (asistente MIA) |
| **Blockchain** | Solidity, Hardhat, Polygon Amoy testnet (LTD ERC20) |

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
                ┌─────────┼─────────┐
                ▼         ▼         ▼
          ┌──────────┐ ┌─────┐ ┌──────┐
          │PostgreSQL│ │Redis│ │ Groq │
          │  16      │ │     │ │ LLM  │
          └──────────┘ └─────┘ └──────┘
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

140+ endpoints organizados en modulos:

| Modulo | Endpoints | Descripcion |
|--------|-----------|-------------|
| Auth | `/api/auth/*` | Login, registro, refresh, 2FA, verificacion |
| Groups | `/api/groups/*` | CRUD grupos, miembros, contribuciones, sorteo |
| Tandas | `/api/tandas/*` | Ciclos, turnos, pagos, coordinador |
| Wallet | `/api/wallet/*` | Balance, transacciones, retiros |
| Marketplace | `/api/marketplace/*` | Productos, categorias, proveedores |
| Social Feed | `/api/feed/social/*` | Posts, likes, comments, follow, trending |
| Admin | `/api/admin/*` | Dashboard, usuarios, auditoria, compliance |
| Lottery | `/api/lottery/*` | Predicciones, scraping, estadisticas |
| MIA | `/api/mia/*` | Chat con asistente IA |
| Uploads | `/api/upload/*` | Imagenes, videos, comprobantes |

**Documentacion interactiva:** [latanda.online/docs](https://latanda.online/docs) (Swagger UI)

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
├── *.html                    # 40+ paginas frontend (dashboard, wallet, marketplace, etc.)
├── css/                      # Estilos (dashboard-layout, mobile-drawer, hub/)
├── js/
│   ├── hub/                  # Modulos JS principales (social-feed, sidebar, contextual)
│   ├── lib/                  # Librerias (ethers.js)
│   └── components-loader.js  # Carga dinamica de componentes
├── smart-contracts/
│   ├── contracts/            # LTDToken, Vesting, Reserve (Solidity)
│   ├── scripts/              # Deploy scripts
│   └── test/                 # Contract tests (Hardhat)
├── packages/
│   └── sdk/                  # TypeScript SDK (en desarrollo)
├── .github/
│   ├── workflows/            # CI/CD (tests, deploy, bounty tracker)
│   └── ISSUE_TEMPLATE/       # Templates para bounties
└── docs/                     # Documentacion adicional
```

---

## Contribuir

### Bounties Activos

| Bounty | Recompensa | Estado |
|--------|------------|--------|
| TypeScript SDK | 300 LTD | [PR #29](https://github.com/INDIGOAZUL/la-tanda-web/pull/29) — En review |
| Transaction Pagination | 200 LTD | [Issue #4](https://github.com/INDIGOAZUL/la-tanda-web/issues/4) — Abierto |
| Admin Role Management | 500 LTD | [Issue #13](https://github.com/INDIGOAZUL/la-tanda-web/issues/13) — Abierto |
| Role Application UI | 400 LTD | [Issue #12](https://github.com/INDIGOAZUL/la-tanda-web/issues/12) — Abierto |

Ver todos: **[Issues con label `bounty`](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=is%3Aopen+label%3Abounty)**

### Como Contribuir

1. Revisa los [issues abiertos](https://github.com/INDIGOAZUL/la-tanda-web/issues) o [bounties](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=label%3Abounty)
2. Comenta en el issue que te interesa
3. Fork, trabaja en tu branch, abre PR referenciando el issue
4. Review por maintainers
5. Merge y recompensa en LTD tokens

### Guias

- [Developer Quickstart](./DEVELOPER-QUICKSTART.md)
- [API Docs (Swagger)](https://latanda.online/docs)
- [Smart Contract Docs](./smart-contracts/README.md)
- [Tokenomics & Rewards](./DEVELOPER-TOKENOMICS-REWARDS.md)

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

*Ultima actualizacion: Febrero 9, 2026*
