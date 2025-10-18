# 💰 Active Bounties - Earn LTD Tokens

**Last Updated:** October 18, 2025
**Total Bounty Budget:** 250M LTD (Development & Marketing allocation)
**Active Bounties:** 6
**Total Rewards Available:** 1,550 LTD (+375 LTD in bonuses)

---

## 🚀 Quick Start

1. **Browse Bounties** - Check the list below
2. **Pick One** - Choose a bounty that matches your skills
3. **Claim It** - Comment "I'd like to work on this" on the GitHub issue
4. **Build It** - Fork, implement, test
5. **Submit PR** - Reference the issue number
6. **Get Paid** - Receive LTD tokens within 24h of merge

---

## 🔥 High Priority Bounties

### 1. [Admin Analytics Dashboard](https://github.com/INDIGOAZUL/la-tanda-web/issues/3) - 500 LTD 🔴

**Complexity:** Major
**Estimated Time:** 8-12 hours
**Skills Required:** JavaScript, Chart.js, API integration, UI design

Create a comprehensive admin analytics dashboard with real-time metrics, user statistics, tanda performance, and financial reporting.

**Deliverables:**
- Real-time metrics cards (active users, tandas, transactions)
- Interactive charts (user growth, transaction volume)
- Tanda performance analytics
- Financial reporting section
- System health monitoring
- Auto-refresh every 30 seconds
- Mobile responsive design
- ADMIN-ANALYTICS-GUIDE.md

**Bonus:** +100 LTD for exportable reports (PDF/CSV)

---

### 2. [WebSocket Real-time Updates](https://github.com/INDIGOAZUL/la-tanda-web/issues/5) - 350 LTD 🟡

**Complexity:** Major
**Estimated Time:** 6-10 hours
**Skills Required:** Node.js, Socket.io, WebSockets, JWT authentication

Implement WebSocket connections for real-time updates across the platform, eliminating constant polling.

**Deliverables:**
- WebSocket server with Socket.io
- JWT authentication for connections
- Real-time transaction notifications
- Live balance updates
- Tanda status updates in real-time
- Connection status indicator
- Automatic reconnection handling
- WEBSOCKET-IMPLEMENTATION.md

**Bonus:** +100 LTD for real-time group chat implementation

---

### 3. [API Rate Limiting](https://github.com/INDIGOAZUL/la-tanda-web/issues/2) - 250 LTD 🟡

**Complexity:** Medium
**Estimated Time:** 4-6 hours
**Skills Required:** Node.js, Express, Redis, Security

Implement API rate limiting to prevent DDoS attacks, brute force attempts, and API abuse.

**Deliverables:**
- `express-rate-limit` middleware configured
- Different limits for different endpoint types:
  - Auth endpoints: 5 attempts per 15 minutes
  - General API: 100 requests per 15 minutes
  - Public endpoints: 30 requests per minute
- Redis storage for distributed systems
- IP whitelist for trusted sources
- Custom error messages with retry-after info
- Rate limit violation logging
- RATE-LIMITING-CONFIG.md

**Bonus:** +50 LTD for monitoring dashboard

---

### 4. [Transaction Pagination](https://github.com/INDIGOAZUL/la-tanda-web/issues/4) - 200 LTD 🟢

**Complexity:** Medium
**Estimated Time:** 3-5 hours
**Skills Required:** JavaScript, API design, Frontend optimization

Implement pagination for transaction history to improve performance with large transaction lists.

**Deliverables:**
- Backend API pagination support (page/limit parameters)
- Frontend pagination UI (20 transactions per page)
- Previous/Next page navigation
- Jump to specific page functionality
- Show total pages and current page
- Loading indicator during page changes
- Mobile responsive
- Performance improvement demonstrated
- PAGINATION-IMPLEMENTATION.md

**Bonus:** +50 LTD for infinite scroll implementation

---

### 5. [Mobile PWA Optimization](https://github.com/INDIGOAZUL/la-tanda-web/issues/6) - 150 LTD 🟢

**Complexity:** Medium
**Estimated Time:** 4-6 hours
**Skills Required:** PWA, Service Workers, Performance optimization, Mobile UX

Optimize the Progressive Web App experience for mobile devices.

**Deliverables:**
- Enhanced service worker caching strategy
- Offline fallback pages
- Install prompt optimization
- Push notification support
- Image lazy loading and compression
- Touch gesture improvements
- Mobile-specific UI adjustments
- Lighthouse PWA score improved by 20+ points
- Tested on iOS Safari and Android Chrome
- PWA-OPTIMIZATION-GUIDE.md

**Bonus:** +50 LTD for Lighthouse PWA score above 90

---

### 6. [Database Backup Automation](https://github.com/INDIGOAZUL/la-tanda-web/issues/1) - 100 LTD 🟢

**Complexity:** Small
**Estimated Time:** 2-3 hours
**Skills Required:** Bash scripting, PostgreSQL, Cron, DevOps

Create automated PostgreSQL database backup system with compression, rotation, and cloud storage.

**Deliverables:**
- Bash script for automated pg_dump
- Cron job configuration (daily at 2 AM)
- Backup compression with gzip
- Old backup rotation (keep last 30 days)
- Error handling and logging
- BACKUP-RESTORE-GUIDE.md with restore instructions

**Bonus:** +25 LTD for cloud upload integration (S3, DigitalOcean Spaces, etc.)

---

## 📊 Bounty Summary

| Issue # | Title | Reward | Bonus | Complexity | Status |
|---------|-------|--------|-------|------------|--------|
| [#3](https://github.com/INDIGOAZUL/la-tanda-web/issues/3) | Admin Analytics Dashboard | 500 LTD | +100 | 🔴 Major | 🟢 Open |
| [#5](https://github.com/INDIGOAZUL/la-tanda-web/issues/5) | WebSocket Real-time Updates | 350 LTD | +100 | 🔴 Major | 🟢 Open |
| [#2](https://github.com/INDIGOAZUL/la-tanda-web/issues/2) | API Rate Limiting | 250 LTD | +50 | 🟡 Medium | 🟢 Open |
| [#4](https://github.com/INDIGOAZUL/la-tanda-web/issues/4) | Transaction Pagination | 200 LTD | +50 | 🟡 Medium | 🟢 Open |
| [#6](https://github.com/INDIGOAZUL/la-tanda-web/issues/6) | Mobile PWA Optimization | 150 LTD | +50 | 🟡 Medium | 🟢 Open |
| [#1](https://github.com/INDIGOAZUL/la-tanda-web/issues/1) | Database Backup Automation | 100 LTD | +25 | 🟢 Small | 🟢 Open |

**Total Base Rewards:** 1,550 LTD
**Total Bonus Potential:** +375 LTD
**Grand Total:** 1,925 LTD

---

## 🎯 How It Works

### 1. Choose a Bounty
Browse the active bounties above and pick one that matches your skills and interests.

### 2. Claim the Issue
Comment "I'd like to work on this" on the GitHub issue to claim it. First come, first served!

### 3. Fork & Implement
```bash
git clone https://github.com/YOUR_USERNAME/la-tanda-web.git
cd la-tanda-web
# Implement the feature/fix
```

### 4. Submit Pull Request
```bash
git add .
git commit -m "feat: implement [feature name] (#ISSUE_NUMBER)"
git push origin main
# Create PR on GitHub
```

### 5. Review & Merge
Maintainers will review your PR within 24-48 hours. Address any feedback, and once approved, your PR will be merged.

### 6. Get Paid
Within 24 hours of merge, you'll receive LTD tokens to your wallet address (provided in PR description).

---

## 📋 Contribution Guidelines

### Code Quality
- Follow existing code style and conventions
- Use shared-components.css for buttons and common UI elements
- Write clean, commented code
- Test thoroughly before submitting

### Testing Requirements
- Test on multiple browsers (Chrome, Firefox, Safari)
- Test on mobile devices (iOS and Android)
- Provide screenshots/videos of functionality
- Include test cases for new features

### Documentation
- Update or create relevant documentation files
- Add inline comments for complex logic
- Include setup/usage instructions
- Provide examples where applicable

### PR Requirements
- Reference issue number in PR title: `feat: implement X (#ISSUE_NUMBER)`
- Describe changes in PR description
- Provide your LTD wallet address in PR description
- Include screenshots/videos if UI changes
- List testing performed

---

## 🪙 Payment Process

### Wallet Requirements
- Provide your Polygon Amoy testnet wallet address
- Ensure you can receive ERC20 tokens
- Use MetaMask or compatible Web3 wallet

### Payment Timeline
- PR merged → Tokens sent within 24 hours
- Bonuses paid if bonus criteria met
- Payment confirmed in PR comments

### Token Distribution
- Tokens sent to your provided wallet address
- Transaction hash posted in PR comments
- Verify on PolygonScan: https://amoy.polygonscan.com

---

## 🚀 Getting Started

### Prerequisites
```bash
# Install Node.js 16+
node --version

# Install npm dependencies
npm install

# Start local development server
npm run dev
```

### Development Workflow
1. Create feature branch: `git checkout -b feature/issue-NUMBER`
2. Make changes and test locally
3. Commit with descriptive message
4. Push to your fork
5. Create Pull Request to main branch

### Resources
- **[Developer Quickstart](./DEVELOPER-QUICKSTART.md)** - 5-minute setup guide
- **[API Documentation](https://api.latanda.online/docs)** - Complete API reference
- **[Smart Contract Docs](./smart-contracts/README.md)** - Solidity documentation
- **[Contributing Guide](./CONTRIBUTING.md)** - Full contribution guidelines

---

## 💬 Questions?

- **GitHub Discussions:** [Ask questions & share ideas](https://github.com/INDIGOAZUL/la-tanda-web/discussions)
- **Issues:** Comment on the bounty issue for clarification
- **Twitter/X:** [@TandaWeb3](https://x.com/TandaWeb3)
- **YouTube:** [La Tanda Channel](https://www.youtube.com/channel/UCQitNp79J1-DvJKi334_8qw)
- **Discord:** Coming soon

---

## 🎉 Success Stories

*As contributors complete bounties, we'll showcase their work here!*

---

**Ready to start earning LTD tokens?**

1. Pick a bounty from the list above
2. Click the issue link
3. Comment "I'd like to work on this"
4. Start building!

**Total available this month:** 1,925 LTD 🚀

---

*Last updated: October 18, 2025*
*Next bounty refresh: October 25, 2025*
