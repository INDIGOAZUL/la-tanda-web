# La Tanda Web3 Platform

[La Tanda](https://latanda.online) is a decentralized savings and lending platform built on Web3 technology. This repository contains the frontend web application.

## Table of Contents
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Links](#links)
- [Contributing](#contributing)

## Development Setup

To serve the application locally, you need Node.js (v14+). Use the following commands:

```bash
# Clone the repository
git clone https://github.com/la-tanda/la-tanda-web.git
cd la-tanda-web

# Serve the static files using a simple HTTP server
npx serve .
```

The app will be available at `http://localhost:3000` (or the port specified by serve).

> Note: The application is a static frontend. For full functionality (API calls, real-time data), you need to run the backend services separately or use the production API endpoints.

## Project Structure

- `index.html` - Main entry point
- `js/` - JavaScript modules organized by feature:
  - `core/` - Core utilities (API client, event bus, cache)
  - `components/` - UI components (wallet dropdown, notification center, etc.)
  - `header/` - Header module
  - `sidebar/` - Sidebar navigation
  - `hub/` - Intelligent Hub module
  - `helpers/` - Helper utilities (fetch retry, iOS PWA prompt)
  - `onboarding/` - Onboarding system
  - `lib/` - Third-party libraries (ethers.js)
- `docs/` - API documentation (auto-generated)
- `assets/` - Static assets (images, icons)
- `styles/` - CSS stylesheets
- `api-proxy-updated.js` - Main API proxy file (consolidated endpoint handling)

> For a detailed description of the codebase, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Links

- **Live Platform**: [https://latanda.online](https://latanda.online)
- **Developer Portal**: [https://latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- **API Documentation (Swagger UI)**: [https://latanda.online/docs](https://latanda.online/docs)
- **Chain Explorer**: [https://latanda.online/explorer](https://latanda.online/explorer) (if available)

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines, bounty program details, and code of conduct.