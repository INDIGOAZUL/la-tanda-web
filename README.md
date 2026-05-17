# La Tanda Web

Public frontend mirror for La Tanda, a Web3 ecosystem for social features, digital tandas, marketplace activity, LTD mining, on-chain reputation, La Tanda Chain, and the MIA AI financial assistant.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Chain](https://img.shields.io/badge/chain-latanda--testnet--1-00d4ff)](https://latanda.online/chain/)
[![Supply](https://img.shields.io/badge/supply-200M%20LTD%20fixed-ffd700)](https://latanda.online/whitepaper.html)
[![Inflation](https://img.shields.io/badge/inflation-0%25-22c55e)](https://latanda.online/whitepaper.html)
[![Mainnet](https://img.shields.io/badge/mainnet-Q1%202027-8b5cf6)](https://latanda.online/chain/)

## What This Repository Contains

This repository contains the static web frontend for La Tanda. It includes HTML pages, shared JavaScript modules, CSS assets, chain resources, and developer-facing integration references.

Primary public resources:

- Website: https://latanda.online
- Swagger UI: https://latanda.online/docs/
- Dev Portal: https://latanda.online/dev-dashboard.html
- Chain Explorer: https://latanda.online/chain/
- Whitepaper: https://latanda.online/whitepaper.html
- Tokenomics: https://latanda.online/ltd-token-economics.html

## Development Setup

This is a static frontend mirror. You can serve it locally with any static file server.

```bash
npx serve .
```

Then open the local URL printed by `serve`, usually:

```text
http://localhost:3000
```

Useful local pages:

- `index.html` - main landing page
- `dev-dashboard.html` - developer portal
- `marketplace-social.html` - marketplace and social marketplace UI
- `chain/index.html` - La Tanda Chain page
- `whitepaper.html` - whitepaper page

No build step is required for basic static preview. Do not commit `.env` files or credentials.

## Project Structure

```text
la-tanda-web/
├── *.html                  # Top-level static pages for the public frontend
├── assets/                 # General static assets
├── chain/                  # La Tanda Chain resources and chain landing page
├── components/             # Shared HTML component fragments
├── css/                    # Stylesheets
├── examples/               # Example integration files
├── group/                  # Group-related static pages or assets
├── html/                   # Additional HTML resources
├── images/                 # Image assets
├── img/                    # Additional image assets
├── js/                     # Shared JavaScript modules and components
├── middleware/             # Middleware-related frontend/support files
├── negocio/                # Business/storefront pages
├── packages/               # Package support files
├── translations/           # Translation resources
├── utils/                  # Utility scripts
├── workflows/              # Workflow-related files
├── marketplace-social.js   # Root-level marketplace/social marketplace implementation
└── postman-collection.json # API testing collection
```

Some paths such as `avatars`, `covers`, and `docs` are symlinks in this mirror and may resolve only in the deployed server environment.

## Marketplace Frontend Notes

The marketplace social implementation lives at the repository root:

```text
marketplace-social.js
```

It is not inside `js/`. It calls marketplace API routes such as:

- `/api/marketplace/categories`
- `/api/marketplace/stats`
- `/api/marketplace/products`
- `/api/marketplace/services`
- `/api/marketplace/providers`
- `/api/marketplace/providers/register`

The corresponding page is:

```text
marketplace-social.html
```

## API and Integration Resources

- Swagger UI: https://latanda.online/docs/
- Dev Portal: https://latanda.online/dev-dashboard.html
- Postman collection: [`postman-collection.json`](./postman-collection.json)
- Authentication entry point: `/api/auth/login`
- Marketplace endpoints: `/api/marketplace/...`

The public Dev Portal references the Swagger UI, API endpoint catalog, and developer integration resources.

## Chain Resources

- Chain page: https://latanda.online/chain/
- Community explorer: https://exp.utsa.tech/latanda/staking
- Testnet chain ID: `latanda-testnet-1`
- Token denom: `ultd`
- Address prefix: `ltd`
- Expected block time: about 5 seconds

Chain-related static resources live in the [`chain/`](./chain/) directory.

## Contributing

La Tanda uses GitHub Issues for bounty work. Follow the instructions in the specific issue you are claiming.

Before opening a pull request:

1. Read the issue requirements carefully.
2. Answer any codebase verification question from the issue.
3. Keep the change scoped to the requested files.
4. Do not commit credentials, `.env` files, or generated secrets.
5. Use one pull request per bounty.

For documentation bounties, keep text developer-facing, concise, and in English.

## Important Safety Rules

- Never commit `.env` or credentials.
- Never use `rsync --delete` with this repository.
- Do not modify `api-proxy-enhanced.js` without coordinating with maintainers.
- Keep pull requests narrowly scoped to the issue.

## License

MIT License. See [LICENSE](./LICENSE).
