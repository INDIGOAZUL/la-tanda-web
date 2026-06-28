# La Tanda Web3 Platform

La Tanda is a decentralized rotating savings and credit platform built on Web3 principles. This repository contains the frontend web application for the La Tanda ecosystem.

---

## Development Setup

To run the project locally for development:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/la-tanda-web.git
   cd la-tanda-web
   ```

2. Serve the static files using any HTTP server. The simplest way is with `npx`:
   ```bash
   npx serve .
   ```
   This starts a local server (default: `http://localhost:3000`). Open the URL in your browser to see the app.

3. No build step or dependency installation is required — the frontend is pure HTML, CSS, and JavaScript.

> **Note:** The application expects a backend API running at `https://latanda.online`. For full functionality, ensure the API is accessible or use the built-in API proxy (see `api-proxy-working.js`).

---

## Project Structure

Key directories and files in the repository:

```
├── index.html                # Main entry point (single-page app)
├── 50x.html                  # Error page
├── invest.html               # Investment dashboard
├── terms-of-service.html
├── privacy-policy.html
├── commission-system.html
├── robots.txt
├── postman-collection.json   # API collection for testing
├── translation-system-design.js
├── api-proxy-updated.js      # Consolidated API proxy (v4)
├── api-proxy-working.js      # Enhanced API proxy (120+ endpoints)
├── real-time-api-integration.js
├── my-wallet.js              # Wallet management logic
├── js/                       # JavaScript source files
│   ├── core/                 # Core libraries
│   │   ├── api-client.js     # 🔥 Main API client (fetch wrapper with retry)
│   │   ├── event-bus.js      # Publish/subscribe event system
│   │   └── cache.js          # Client-side caching utilities
│   ├── sidebar/              # Sidebar navigation module
│   │   ├── index.js          # Entry point (facade)
│   │   ├── navigation.js
│   │   ├── ui.js
│   │   └── events.js
│   ├── header/               # Header module
│   │   ├── index.js
│   │   ├── ui.js
│   │   ├── dropdown.js
│   │   └── events.js
│   ├── hub/                  # Smart hub module
│   │   ├── hub-api-connector.js
│   │   └── ... (insights, widgets, etc.)
│   ├── components/           # Reusable UI components
│   │   ├── transaction-modal.js
│   │   ├── notification-center.js
│   │   ├── network-switcher.js
│   │   ├── wallet-dropdown.js
│   │   └── loading-states.js
│   ├── helpers/              # Utility helpers
│   ├── onboarding/           # User onboarding system
│   ├── payment-providers/    # Payment integrations (e.g., Tigo Money)
│   ├── lib/                  # Third-party libraries (ethers.min.js)
│   ├── utils/                # Utilities (rate-limiter.js, etc.)
│   ├── marketplace-social.js # Social marketplace logic
│   └── dashboard-api-connector.js
├── .github/workflows/        # CI/CD workflows
│   └── README.md             # Workflow documentation
├── CONTRIBUTING.md           # Contribution guidelines (see there for details)
└── README.md                 # This file
```

> ℹ️ For a complete list of files and their purposes, refer to the project structure in `CONTRIBUTING.md`.

---

## Links

- **Swagger API Documentation:** [https://latanda.online/docs](https://latanda.online/docs) (or `/api/docs`)
- **Developer Portal:** [https://latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- **Chain Explorer:** [https://explorer.latanda.online](https://explorer.latanda.online) (blockchain transaction viewer)
- **Live Application:** [https://latanda.online](https://latanda.online)

---

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct, pull request process, and bounty information.

---

## License

This project is licensed under the MIT License – see the LICENSE file for details.
