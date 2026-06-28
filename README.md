# La Tanda Web3 Platform

A decentralized group savings platform built with web technologies. This repository contains the frontend application for the La Tanda Web3 ecosystem.

## Development Setup

To serve the project locally with hot-reload:

```bash
npx serve .
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app is a static site; no build step is required.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- npm or yarn

## Project Structure

```
.
├── js/                    # Main JavaScript source
│   ├── core/              # Core utilities (API client, event bus, cache)
│   ├── header/            # Header UI module
│   ├── sidebar/           # Sidebar navigation module
│   ├── hub/               # Hub dashboard module
│   ├── components/        # Reusable UI components
│   ├── helpers/           # Helper utilities (fetch, locale, error handling)
│   ├── onboarding/        # Onboarding system
│   ├── payment-providers/ # Payment provider integrations
│   └── lib/               # External libraries (e.g., ethers)
├── index.html             # Entry point
├── favicon.ico
└── ...
```

For a detailed breakdown, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Key Links

- **Dev Portal**: [https://latanda.online/dev-dashboard.html](https://latanda.online/dev-dashboard.html)
- **Swagger API Docs**: [https://latanda.online/docs](https://latanda.online/docs)
- **Chain Explorer**: [https://latanda.online/explorer](https://latanda.online/explorer)

## Verification

> **Where does `marketplace-social.js` live — in `js/` or at the HTML root?**  
> **Answer:** It lives in `js/` (`js/marketplace-social.js`).

> **What is the name of the main API file?**  
> **Answer:** `api-proxy-updated.js` (the consolidated API proxy serving all endpoints).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
