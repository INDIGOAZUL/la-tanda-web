# La Tanda Web

A decentralized marketplace for local goods and services, powered by the La Tanda protocol. This repository contains the front-end application.

## Links

- [Dev Portal](https://latanda.online/dev-dashboard.html) — developer resources and onboarding
- [Swagger UI](https://api.latanda.online/swagger) — live API documentation
- [Chain Explorer](https://explorer.latanda.online) — view on-chain activity

## Development Setup

To run the project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/INDIGOAZUL/la-tanda-web.git
   cd la-tanda-web
   ```
2. Serve the files using a static server:
   ```bash
   npx serve .
   ```
3. Open http://localhost:3000 in your browser.

No build step is required; the project uses vanilla HTML, CSS, and JavaScript.

## Project Structure

Key directories and files (mirrors CONTRIBUTING.md):

```
la-tanda-web/
├── index.html    # Main entry point
├── css/          # Stylesheets
├── js/           # Frontend logic
│   ├── api.js         # Main API client
│   ├── marketplace-social.js
│   ├── ui.js          # UI interactions
│   └── utils.js       # Helpers
├── img/          # Static images
├── lib/          # Third-party libraries
├── .github/      # CI/CD and templates
└── README.md
```

For a complete production overview, refer to the [Dev Portal](https://latanda.online/dev-dashboard.html).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
