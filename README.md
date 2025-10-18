# 🚀 La Tanda Web3 Platform

[![Live Platform](https://img.shields.io/badge/Live-latanda.online-00FFFF)](https://latanda.online)
[![API Status](https://img.shields.io/badge/API-85%20endpoints-00FF80)](https://api.latanda.online)
[![Smart Contracts](https://img.shields.io/badge/Contracts-Polygon%20Amoy-8B5CF6)](https://amoy.polygonscan.com)
[![Open Source](https://img.shields.io/badge/Open%20Source-MIT-blue)](./LICENSE)
[![Bounties](https://img.shields.io/badge/Bounties-ACTIVE-FFD700)](./ACTIVE-BOUNTIES.md)

**Cooperativa de Ahorro Inteligente + Web3 DeFi Platform**

---

## 💰 DEVELOPERS: Earn LTD Tokens for Contributing!

🎉 **Join our Web3 revolution - Get paid in tokens for every contribution!**

| Contribution Type | Reward Range | Examples |
|-------------------|--------------|----------|
| 🐛 **Bug Fixes** | 25-100 LTD | Critical bugs = 100 LTD |
| ✨ **Features** | 100-500 LTD | Major features = 500 LTD |
| 📚 **Documentation** | 25-75 LTD | Comprehensive docs = 75 LTD |
| 🧪 **Testing** | 50-200 LTD | Full test suites = 200 LTD |

### 🚀 Quick Start (5 minutes)

```bash
# 1. Fork & Clone
git clone https://github.com/YOUR_USERNAME/la-tanda-web.git
cd la-tanda-web

# 2. Install dependencies
npm install

# 3. Run local development
npm run dev

# 4. Check active bounties
cat ACTIVE-BOUNTIES.md
```

📋 **[View Active Bounties](./ACTIVE-BOUNTIES.md)** - See what you can work on today!

⚡ **[Developer Quickstart](./DEVELOPER-QUICKSTART.md)** - Complete setup guide

💰 **[Rewards System](./DEVELOPER-TOKENOMICS-REWARDS.md)** - Full tokenomics details

---

## 🌟 Platform Overview

La Tanda is a revolutionary **Web3 financial platform** combining traditional tandas (rotating savings groups) with DeFi features.

### ✨ Key Features

- **🏦 Traditional Tandas** - Rotating savings groups with smart automation
- **💳 DeFi Integration** - Staking, lending, yield farming
- **🪙 LTD Token** - Native ERC20 token with vesting & governance
- **👥 Group Management** - Advanced tanda creation & administration
- **📊 Real-time Analytics** - Live dashboards and reporting
- **🔐 KYC/Compliance** - Built-in identity verification
- **💼 Multi-wallet Support** - Web3, Blink Lightning, traditional banking
- **📱 PWA Ready** - Works offline, installable on mobile

---

## 📊 Current Status

| Component | Status | Progress |
|-----------|--------|----------|
| **Web Platform** | ✅ LIVE | 100% |
| **API Backend** | ✅ ONLINE | 100% (85 endpoints) |
| **Smart Contracts** | ✅ DEPLOYED | 100% (Polygon Amoy) |
| **Mobile PWA** | ✅ READY | 100% |
| **Documentation** | ✅ COMPLETE | 100% |

**Overall:** 🟢 97% Production Ready

🔗 **Live Platform:** [https://latanda.online](https://latanda.online)

🔗 **API Documentation:** [https://api.latanda.online/docs](https://api.latanda.online/docs)

📈 **Roadmap:** [ROADMAP-TRACKER.html](./ROADMAP-TRACKER.html)

---

## 🛠️ Tech Stack

### Frontend
- **HTML5/CSS3/JavaScript** - Modern vanilla JS
- **Glassmorphism UI** - Beautiful, modern design
- **PWA** - Progressive Web App features
- **Responsive** - Mobile-first design

### Backend
- **Node.js + Express** - REST API (85 endpoints)
- **PostgreSQL** - Primary database (23 tables)
- **PM2** - Process management
- **Nginx** - Reverse proxy & load balancing

### Blockchain
- **Solidity** - Smart contracts
- **Hardhat** - Development environment
- **Polygon Amoy** - Testnet deployment
- **ERC20** - LTD token standard

---

## 🪙 Smart Contracts (Tokenomics V2.0)

**Deployed to Polygon Amoy Testnet** ✅ October 18, 2025

### Contract Addresses

1. **LTDToken.sol V2.0**
   - **Address:** `0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc`
   - **PolygonScan:** [View Contract](https://amoy.polygonscan.com/address/0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc)
   - Total Supply: 1,000,000,000 LTD
   - ERC20 with vesting support
   - Governance integration
   - **Status:** ✅ Deployed & Verified

2. **RoyalOwnershipVesting.sol**
   - **Address:** `0x7F21EC0A4B3Ec076eB4bc2924397C85B44a5082F`
   - **PolygonScan:** [View Contract](https://amoy.polygonscan.com/address/0x7F21EC0A4B3Ec076eB4bc2924397C85B44a5082F)
   - 4-year linear vesting
   - 1-year cliff
   - Anti-dump protection (2% monthly limit)
   - **Status:** ✅ Deployed (100M LTD allocated)

3. **FutureReserve.sol**
   - **Address:** `0xF136C790da0D76d75d36207d954A6E114A9c0bA2`
   - **PolygonScan:** [View Contract](https://amoy.polygonscan.com/address/0xF136C790da0D76d75d36207d954A6E114A9c0bA2)
   - DAO-controlled governance
   - 7-day timelock
   - Community proposals
   - **Status:** ✅ Deployed (50M LTD allocated)

### Token Distribution

```javascript
{
  "Participation": "20% (200M LTD)",
  "Staking & Governance": "30% (300M LTD)",
  "Development & Marketing": "25% (250M LTD)", // ← Bounty Budget
  "Liquidity": "10% (100M LTD)",
  "Royal Ownership (Vesting)": "10% (100M LTD)",
  "Future Reserve (DAO)": "5% (50M LTD)"
}
```

**Developer Bounty Budget:** 250M LTD (~2,000+ years sustainability) 🚀

---

## 📁 Project Structure

```
la-tanda-web/
├── smart-contracts/         # Solidity contracts + tests
│   ├── contracts/          # Smart contract source
│   ├── scripts/            # Deployment scripts
│   ├── test/              # Contract tests
│   └── hardhat.config.js  # Hardhat configuration
├── .github/                # GitHub workflows & templates
│   ├── workflows/         # CI/CD pipelines
│   └── ISSUE_TEMPLATE/    # Bounty issue templates
├── *.html                 # Frontend pages (9 sections)
├── *.css                  # Styling files
├── *.js                   # Frontend logic
├── ACTIVE-BOUNTIES.md     # Current bounties
├── DEVELOPER-QUICKSTART.md # Quick setup guide
└── ROADMAP-TRACKER.html   # Visual roadmap
```

---

## 🎯 Active Bounties (Updated Daily)

### 🔥 High Priority

1. **[Database Backup Automation](https://github.com/INDIGOAZUL/la-tanda-web/issues/XX)** - 100 LTD 🔴
   - Automated PostgreSQL backups
   - Compression & rotation
   - Cloud upload integration

2. **[API Rate Limiting](https://github.com/INDIGOAZUL/la-tanda-web/issues/XX)** - 250 LTD 🟡
   - Implement express-rate-limit
   - Prevent DDoS attacks
   - Custom error messages

3. **[Admin Analytics Dashboard](https://github.com/INDIGOAZUL/la-tanda-web/issues/XX)** - 500 LTD 🔴
   - Real-time metrics
   - User & tanda statistics
   - Financial reporting

📋 **[View All Bounties](./ACTIVE-BOUNTIES.md)**

---

## 🤝 Contributing

We welcome all contributors! Whether you're fixing bugs, adding features, or improving docs - there's a bounty for you.

### How to Contribute

1. **Check Active Bounties** - [ACTIVE-BOUNTIES.md](./ACTIVE-BOUNTIES.md)
2. **Claim an Issue** - Comment "I'd like to work on this"
3. **Fork & Clone** - Start working on your changes
4. **Submit PR** - Reference the issue number
5. **Get Reviewed** - Maintainers will review
6. **Merge & Earn** - Receive LTD tokens within 24h

### Contribution Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Reference issue numbers in commits
- Be respectful and collaborative

📖 **[Full Contributing Guide](./CONTRIBUTING.md)**

---

## 📚 Documentation

- **[Developer Quickstart](./DEVELOPER-QUICKSTART.md)** - Get started in 5 minutes
- **[API Documentation](https://api.latanda.online/docs)** - Complete API reference
- **[Smart Contract Docs](./smart-contracts/README.md)** - Solidity documentation
- **[Deployment Guide](./DEPLOYMENT-GUIDE.md)** - How to deploy
- **[Tokenomics](./DEVELOPER-TOKENOMICS-REWARDS.md)** - LTD token economics

---

## 🔐 Security

We take security seriously. If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email: security@latanda.online
3. Include detailed description
4. Receive priority bounty (up to 500 LTD)

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details

---

## 🌐 Links

- **Website:** [https://latanda.online](https://latanda.online)
- **API:** [https://api.latanda.online](https://api.latanda.online)
- **GitHub:** [https://github.com/INDIGOAZUL/la-tanda-web](https://github.com/INDIGOAZUL/la-tanda-web)
- **Twitter/X:** [https://x.com/TandaWeb3](https://x.com/TandaWeb3)
- **YouTube:** [https://www.youtube.com/channel/UCQitNp79J1-DvJKi334_8qw](https://www.youtube.com/channel/UCQitNp79J1-DvJKi334_8qw)
- **Roadmap:** [ROADMAP-TRACKER.html](./ROADMAP-TRACKER.html)

---

## 💬 Community

- **GitHub Discussions:** [Ask questions & share ideas](https://github.com/INDIGOAZUL/la-tanda-web/discussions)
- **Twitter/X:** [@TandaWeb3](https://x.com/TandaWeb3)
- **YouTube:** [La Tanda Channel](https://www.youtube.com/channel/UCQitNp79J1-DvJKi334_8qw)
- **Discord:** Coming soon

---

## 🙏 Acknowledgments

Built with ❤️ by the La Tanda community

Special thanks to all contributors who help make Web3 finance accessible to everyone!

---

**⭐ Star this repo if you find it useful!**

**🪙 Start contributing and earn LTD tokens today!**

---

*Generated: October 17, 2025*
*Last Updated: October 17, 2025*
