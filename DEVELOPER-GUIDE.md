# 🛠️ La Tanda: Developer Guide (v4.11)

Welcome to the official developer documentation for **La Tanda**. This guide is designed to provide a frictionless onboarding experience for engineers contributing to the world's most secure and scalable Rotating Savings and Credit Association (ROSCA) platform.

---

## 🏛️ Architecture Overview

La Tanda follows a modular, full-stack architecture optimized for financial reliability and real-time user interaction.

- **Backend:** Node.js & Express.js API. Implements strict JWT-based identity management and robust rate-limiting.
- **Frontend:** Responsive SPA architecture with vanilla JS and modern CSS, featuring real-time Web3 wallet integration.
- **Database Layer:** 
  - **PostgreSQL:** Primary relational store for financial ledgers and user data.
  - **Redis:** High-speed caching for sessions and real-time notification queues.
- **AI & Processing:** Integrated Tesseract.js for OCR receipt validation and TensorFlow.js/Face-API for KYC automation.
- **Blockchain Infrastructure:** Ethers.js bridge for interacting with La Tanda smart contracts (LTD Token, Group logic).

---

## 📋 Prerequisites

Before setting up the environment, ensure the following are installed:

- **Node.js:** v20.x+ (LTS recommended)
- **npm:** v10.x+
- **PostgreSQL:** v15.x+
- **Redis Server:** v7.x+
- **Git:** Latest version

---

## 🚀 Local Setup

### 1. Repository Initialization
```bash
git clone https://github.com/INDIGOAZUL/la-tanda-web.git
cd la-tanda-web
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Update the values with your local credentials (see [Environment Variables](#-environment-variables)).

### 3. Database Preparation
Initialize the PostgreSQL schemas and seed data:
```bash
psql -d latanda_db -f marketplace-schema.sql
psql -d latanda_db -f import-lottery.sql
```

### 4. Running the Application
```bash
# Development mode (with auto-reload)
npm run dev

# Production build and run
npm start
```

---

## 🔑 Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | API Listener Port | `3002` |
| `DATABASE_URL` | PostgreSQL connection string | `Required` |
| `JWT_SECRET` | Secret for signing access tokens | `Required` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `RPC_URL` | Blockchain Provider URL (Infura/Alchemy) | `Optional` |
| `TREASURY_PRIVATE_KEY` | Wallet key for automated payouts | `Optional` |
| `SMTP_USER` / `SMTP_PASS` | Email notification credentials | `Optional` |

---

## 🛠️ CLI Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server with Nodemon |
| `npm run lint` | Run ESLint checks across the codebase |
| `npm test` | Execute the full Jest test suite |
| `npm run test:coverage` | Generate unit test coverage report |
| `npm run test:integration` | Run database and API integration tests |

---

## 🧪 Testing & Quality

We maintain high standards for financial software. All PRs must pass the following:
- **Static Analysis:** `npm run lint` must return zero errors.
- **Unit Logic:** Ensure 80%+ coverage on core financial helpers (`npm run test:coverage`).
- **Security:** Use the `security-middleware.js` in all new routes to enforce authorization.

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feat/your-feature`.
2. Commit with intent: `git commit -m "feat: add innovative feature"`.
3. Push and open a PR against the `main` branch.

*For detailed bounty policies, see `BOUNTY-POLICY.md`.*
```


