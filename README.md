# La Tanda Web3 Platform

La Tanda is a decentralized savings and lending platform built on Web3 principles. It enables community-based rotating savings groups (tandas) with blockchain transparency and mobile-first design.

## 📚 Resources

- [Developer Portal](https://latanda.online/dev-dashboard.html) — Dashboard and API key management
- [Swagger API Docs](https://latanda.online/docs) — Interactive API reference
- [Chain Explorer](https://latanda.online/explorer) — Blockchain transaction viewer
- [Postman Collection](postman-collection.json) — Importable API request examples

## 🚀 Development Setup

### Prerequisites
- Node.js v16+ (recommended)
- npm or yarn
- A modern browser (Chrome, Firefox, Edge)

### Local Server

Serve the project locally with a single command:

```bash
npx serve .
```

This starts a static HTTP server (default port 3000) that serves the HTML, JavaScript, and other assets directly. No build step is required.

### Configuration

The application reads runtime configuration from `js/firebase-config.js` (Firebase credentials) and uses `js/core/api-client.js` as the main API client. By default, it connects to the production backend at `https://latanda.online`. For development, you can override the base URL by setting `window.API_BASE_URL` before loading the app.

### Running with HTTPS (for PWA features)

Some Progressive Web App features require HTTPS. Use a tool like `ngrok` or `localtunnel` to expose your local server:

```bash
npx localtunnel --port 3000
```

## 📁 Project Structure

```
.
├── index.html              # Main entry point
├── invest.html             # Investment page
├── my-wallet.html          # User wallet page
├── terms-of-service.html   # Legal pages
├── privacy-policy.html
├── 50x.html                # Error pages
├── robots.txt
├── postman-collection.json # API test collection
├── js/
│   ├── core/               # Core modules
│   │   ├── api-client.js   # Main API client (LaTandaAPI)
│   │   ├── event-bus.js    # Global event bus
│   │   └── cache.js        # Client-side cache
│   ├── components/         # Reusable UI components
│   │   ├── transaction-modal.js
│   │   ├── notification-center.js
│   │   ├── network-switcher.js
│   │   ├── wallet-dropdown.js
│   │   └── loading-states.js
│   ├── sidebar/            # Sidebar module
│   │   ├── index.js        # Main entry (LaTandaSidebar)
│   │   ├── ui.js
│   │   ├── events.js
│   │   └── navigation.js
│   ├── hub/                # Hub Intelligence module
│   │   ├── hub-api-connector.js
│   │   ├── mia-assistant.js
│   │   ├── social-feed.js
│   │   ├── comments-modal.js
│   │   └── ...
│   ├── header/             # Header module
│   │   ├── index.js
│   │   ├── ui.js
│   │   ├── events.js
│   │   ├── dropdown.js
│   │   └── sync.js
│   ├── helpers/            # Utility helpers
│   │   ├── fetch-retry.js
│   │   ├── ios-pwa-prompt.js
│   │   ├── locale-helpers.js
│   │   └── error-i18n-interceptor.js
│   ├── onboarding/         # User onboarding system
│   │   └── onboarding-system.js
│   ├── payment-providers/  # Payment integrations
│   │   └── tigo-money.js
│   ├── lib/                # External libraries
│   │   └── ethers-5.7.umd.min.js
│   ├── firebase-config.js  # Firebase credentials
│   ├── marketplace-social.js  # Social marketplace module
│   ├── dashboard-api-connector.js # Dashboard data connector
│   ├── dashboard-sections-loader.js
│   ├── dashboard-polish.js
│   ├── groups-system.js
│   ├── global-search.js
│   ├── accessibility-enhancements.js
│   └── ...
├── css/                    # Stylesheets (if present)
├── .github/                # GitHub Actions workflows
│   └── workflows/
└── api-proxy-*.js          # API proxy for simulation/testing
```

### Key Files

- `js/core/api-client.js` — The primary API client (`LaTandaAPI`) with request deduplication, retry, and timeout. All production API calls go through this module.
- `js/firebase-config.js` — Firebase project credentials for authentication and real-time features.
- `js/dashboard-api-connector.js` — Connects dashboard components to live API endpoints with caching.
- `js/hub/hub-api-connector.js` — Parallel data fetcher for the Hub Intelligence dashboard.
- `js/marketplace-social.js` — Social marketplace logic (located in `js/` directory).

## 🤝 Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on pull requests, code style, and the bounty process. **Do not duplicate documentation from CONTRIBUTING.md here.**

## 🔒 Security

- Never commit sensitive API keys or secrets.
- Authentication tokens are stored in `localStorage` (key `auth_token`).
- All API requests include bearer token from local storage.
- For production, use environment variables or server-side proxy.

## 🧪 Testing

Automated checks run via GitHub Actions on PRs. You can run locally:

```bash
# Check HTML validity
# Check JavaScript syntax
# Validate JSON files
```

See `.github/workflows/README.md` for workflow details.

## 📄 License

Proprietary — see LICENSE file (if present).

---

*Last updated: 2025-04-11*