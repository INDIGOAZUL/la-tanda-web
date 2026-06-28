# La Tanda Web

**Decentralized community savings and lending platform (Web3)**

## Development Setup

To run the project locally:

```bash
# Clone the repository
git clone https://github.com/la-tanda/la-tanda-web.git
cd la-tanda-web

# Serve the static files with a local HTTP server
npx serve .
```

The app will be available at `http://localhost:3000` (or the port shown by `serve`).

> **Note:** This project is a static web app. No build step is required. The `npx serve .` command starts a lightweight server that serves the HTML, CSS, and JavaScript files directly.

## Project Structure

| Directory / File | Description |
|------------------|-------------|
| `js/` | Core JavaScript modules organized by feature (components, header, sidebar, hub, helpers, core, payment-providers, onboarding) |
| `index.html` | Main dashboard entry point |
| `my-wallet.html` | Wallet page |
| `invest.html` | Investment page |
| `terms-of-service.html` | Terms of service |
| `privacy-policy.html` | Privacy policy |
| `commission-system.html` | Commission system documentation |
| `groups-advanced-system.min.js` | Minified group system logic (legacy) |
| `api-proxy-updated.js` | Consolidated API proxy (production) |
| `api-proxy-working.js` | Enhanced API proxy with 120+ simulated endpoints |
| `real-time-api-integration.js` | Real-time dashboard API connector |
| `postman-collection.json` | Postman API collection for testing |
| `robots.txt` | Search engine crawling rules |
| `50x.html` | Error page for 50x HTTP status |

The `js/` directory contains sub-folders:
- `components/` – Reusable UI components (transaction-modal, notification-center, etc.)
- `core/` – API client, event bus, cache utilities
- `header/` – Header module (UI, events, dropdown, sync)
- `sidebar/` – Sidebar module (navigation, UI, events)
- `hub/` – Hub intelligence (API connector, widget modules, social feed)
- `helpers/` – Utilities (locale helpers, fetch-retry, error i18n interceptor)
- `onboarding/` – Onboarding system
- `payment-providers/` – Payment gateway integrations (e.g., Tigo Money)
- `lib/` – External libraries (e.g., ethers.js)

## Resources

- **Dev Portal:** [https://latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- **Swagger API Docs:** [https://latanda.online/docs](https://latanda.online/docs)
- **Chain Explorer:** [https://latanda.online/explorer](https://latanda.online/explorer)
- **Postman Collection:** [`postman-collection.json`](./postman-collection.json)

## Contributing

Please see [`CONTRIBUTING.md`](./CONTRIBUTING.md) for detailed contribution guidelines.
