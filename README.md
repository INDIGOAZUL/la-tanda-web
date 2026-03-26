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

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Git

### Local Development
```bash
# Clone the repository
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web

# Serve locally (no build step required)
npx serve .
# Or with Python
python -m http.server 3000
```

The app will be available at `http://localhost:3000` (or the port shown in your terminal).

### Project Structure
```
la-tanda-web/
├── html/              # Static HTML pages
│   ├── js/            # JavaScript modules
│   └── css/           # Stylesheets
├── js/                # Root-level JavaScript (marketplace-social.js, etc.)
├── css/               # Root-level CSS
├── admin-*.html       # Admin panel pages
├── marketplace-*.html # Marketplace pages
├── wallet.html        # Wallet interface
├── feed.html          # Social feed
├── lottery.html       # Lottery predictor
└── api/               # API documentation

# Key JavaScript files:
# - marketplace-api.js — Main marketplace API
# - lottery-api.js — Lottery API
# - api-adapter.js — API adapter layer
# - js/marketplace-social.js — Social features
# - js/core/api-client.js — Core API client
```

**Note:** `marketplace-social.js` lives in `js/` directory. Main API files include `marketplace-api.js`, `lottery-api.js`, and `api-adapter.js`.

### API Documentation
- **Swagger UI:** https://latanda.online/api/swagger (API reference)
- **Dev Portal:** https://latanda.online/dev-dashboard.html (Developer documentation)
- **Chain Explorer:** https://latanda.online/chain/ (Blockchain explorer)

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

---

## Contributing

We pay contributors in **LTD tokens** for merged PRs. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the contribution process and tier system.

**Quick start:**
1. Check open issues with the `bounty` label
2. Comment on the issue to claim it
3. Fork, branch, PR
4. Get paid in LTD after merge

---

## License

MIT — see [LICENSE](./LICENSE) for full text.

---

*Built for Honduras. Used by real people moving real money.*
