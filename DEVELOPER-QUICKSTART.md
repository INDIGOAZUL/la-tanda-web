# 🚀 Developer Quickstart Guide

**Get started contributing to La Tanda in 5 minutes!**

---

## 💰 Earn LTD Tokens for Contributing

Welcome! We pay contributors in LTD tokens for every merged PR.

**Active Bounties:** https://github.com/INDIGOAZUL/la-tanda-web/blob/main/ACTIVE-BOUNTIES.md

| Type | Rewards |
|------|---------|
| 🐛 Bug Fixes | 25-100 LTD |
| ✨ Features | 100-500 LTD |
| 📚 Documentation | 25-75 LTD |
| 🧪 Testing | 50-200 LTD |

---

## ⚡ Quick Setup (5 Minutes)

### 1. Fork & Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/la-tanda-web.git
cd la-tanda-web
```

### 2. Install Dependencies (Optional)

For smart contract development:
```bash
cd smart-contracts
npm install
```

### 3. Run Local Development

**Frontend (Simple HTTP Server):**
```bash
# Option A: Python (recommended)
python3 -m http.server 8080

# Option B: Node.js
npx http-server -p 8080

# Option C: PHP
php -S localhost:8080
```

**Access the platform:**
- Main: http://localhost:8080/
- Dashboard: http://localhost:8080/home-dashboard.html
- Wallet: http://localhost:8080/my-wallet.html

### 4. Make Your Changes

```bash
# Create a new branch
git checkout -b feature/your-feature-name

# Make your changes
# ... edit files ...

# Test locally
# Open http://localhost:8080 in your browser
```

### 5. Submit Your PR

```bash
# Commit your changes
git add .
git commit -m "feat: add your feature description"

# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Include your wallet address for payment!
```

---

## 📂 Project Structure

```
la-tanda-web/
├── *.html                 # Frontend pages
├── *.css                  # Styling files
├── *.js                   # Frontend logic
├── smart-contracts/       # Solidity contracts
│   ├── contracts/        # Smart contract source
│   ├── scripts/          # Deployment scripts
│   └── test/            # Contract tests
├── ACTIVE-BOUNTIES.md    # Current bounties
├── CONTRIBUTING.md       # Contribution guidelines
└── README.md            # Project overview
```

---

## 🎯 Where to Start

### 1. Check Active Bounties

Browse available bounties:
https://github.com/INDIGOAZUL/la-tanda-web/issues?q=is%3Aissue+is%3Aopen+label%3Abounty

### 2. Claim an Issue

Comment on the issue: **"I'd like to work on this"**

### 3. Read the Requirements

Each bounty has:
- Problem description
- Proposed solution
- Acceptance criteria
- Reward amount

### 4. Start Coding!

Follow the technical approach in the issue.

---

## 🔧 Recommended Development Tools

### Chrome DevTools 141+ (NEW! ✨)

**Why:** Latest Chrome has AI-powered debugging features

**Install:** [Chrome 141+ or Chrome Dev/Canary](https://www.google.com/chrome/dev/)

**Features:**
1. **🤖 AI Insight** - Debug network performance with Gemini AI
   - Performance panel → Record → Network tree → "Debug with AI"
   - Ask: "Why is this page slow?" or "Optimize loading order"

2. **💬 AI Chat Export** - Document debugging sessions
   - Export entire AI conversation
   - Share insights with team on GitHub issues

3. **⚙️ Performance Track Config** - Save your setup
   - Configure once, use forever
   - Consistent metrics across team

**Quick Start:**
```bash
# 1. Open DevTools (F12)
# 2. Go to Performance tab
# 3. Record page load
# 4. Click "Debug with AI" in Network tree
# 5. Ask AI for optimization suggestions
```

**Learn more:** [Chrome DevTools 141 Release Notes](https://developer.chrome.com/blog/new-in-devtools-141/)

---

## 🧪 Testing Your Changes

### Frontend Testing

1. **Visual Testing:**
   - Open http://localhost:8080
   - Test in Chrome, Firefox, Safari
   - Test on mobile (responsive design)

2. **Functionality Testing:**
   - Click all buttons
   - Fill out forms
   - Test navigation

3. **Performance Testing (Chrome 141+):**
   - Open DevTools (F12) → Performance tab
   - Record page load
   - Use "Debug with AI" for optimization tips
   - Export findings to share with team

### Smart Contract Testing

```bash
cd smart-contracts
npm install

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy-v2-amoy.js --network localhost
```

---

## 🎨 Code Style Guidelines

### HTML
- Use semantic HTML5 elements
- Maintain consistent class naming (kebab-case)

### CSS
- Use existing CSS variables for colors:
  - `--tanda-cyan`: #00FFFF
  - `--tanda-cyan-light`: #7FFFD8
  - `--bg-primary`: #0f172a
  - `--bg-secondary`: #1e293b

### JavaScript
- Use modern ES6+ features
- Add error handling for all API calls
- Follow existing code patterns

### Solidity
- Follow Solidity style guide
- Add comprehensive NatSpec comments
- Write tests for all functions

---

## 📚 Key Files to Know

### Frontend Development

**Main Dashboard:**
- `index.html` - Landing page
- `home-dashboard.html` - User dashboard
- `web3-dashboard.html` - DeFi features

**Wallet & Transactions:**
- `my-wallet.html` - Wallet interface
- `my-wallet.js` - Wallet logic

**Groups & Tandas:**
- `groups-advanced-system.html` - Group management
- `groups-advanced-system.js` - Group logic

**Styling:**
- `web3-dashboard.css` - Main styling
- `shared-components.css` - Shared components

### Smart Contract Development

**Contracts:**
- `smart-contracts/contracts/LTDToken.sol` - ERC20 token
- `smart-contracts/contracts/RoyalOwnershipVesting.sol` - Vesting
- `smart-contracts/contracts/FutureReserve.sol` - DAO governance

**Tests:**
- `smart-contracts/test/` - All contract tests

**Deployment:**
- `smart-contracts/scripts/deploy-v2-amoy.js` - Deployment script

---

## 🔧 Common Tasks

### Add a New Feature

1. Create HTML file (if needed): `new-feature.html`
2. Create CSS file: `new-feature.css`
3. Create JS file: `new-feature.js`
4. Test locally
5. Submit PR

### Fix a Bug

1. Identify the file with the bug
2. Make the fix
3. Test the fix
4. Document the change
5. Submit PR

### Update Documentation

1. Edit the relevant `.md` file
2. Preview in GitHub
3. Submit PR

---

## 💰 Getting Paid

### 1. Include Your Wallet Address

In your PR description, add:
```
💰 LTD Payment Address: 0xYourPolygonAddress
```

### 2. Wait for Review

Maintainers will review within 24-48 hours.

### 3. Get Merged

Once approved, your PR will be merged.

### 4. Receive Payment

LTD tokens sent within 24 hours of merge!

**Network:** Polygon Amoy Testnet
**Token:** LTDToken (0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc)

---

## 🆘 Need Help?

### Questions?

- **GitHub Discussions:** https://github.com/INDIGOAZUL/la-tanda-web/discussions
- **Issue Comments:** Ask on the bounty issue
- **Documentation:** Check README.md and CONTRIBUTING.md

### Resources

- **Full Documentation:** [README.md](./README.md)
- **Active Bounties:** [ACTIVE-BOUNTIES.md](./ACTIVE-BOUNTIES.md)
- **Contributing Guide:** [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Smart Contracts:** [smart-contracts/README.md](./smart-contracts/README.md)

### Live Platform

- **Production:** https://latanda.online
- **Staging:** https://indigoazul.github.io/la-tanda-web/
- **API:** https://api.latanda.online
- **Contracts:** https://amoy.polygonscan.com/address/0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc

---

## ✅ Checklist Before Submitting PR

- [ ] Code follows project style guidelines
- [ ] All files properly formatted
- [ ] Tested locally (works in browser)
- [ ] No console errors
- [ ] Mobile responsive (if UI changes)
- [ ] Wallet address included in PR description
- [ ] Issue number referenced (#123)
- [ ] Clear commit messages

---

## 🎉 First Contribution?

Welcome! Here's what happens:

1. **You submit PR** → We review (24-48h)
2. **We give feedback** → You make changes (if needed)
3. **PR gets merged** → Congratulations!
4. **You get paid** → LTD tokens sent (within 24h)
5. **You're a contributor!** → Join our community

**First 10 contributors get special "Founding Contributor" recognition!**

---

## 📊 Contribution Stats

Want to track your contributions?

```bash
# Your commits
git log --author="YourName" --oneline

# Your stats
git log --author="YourName" --shortstat --no-merges
```

---

## 🚀 Ready to Start?

1. **Pick a bounty:** https://github.com/INDIGOAZUL/la-tanda-web/issues?q=label%3Abounty
2. **Claim it:** Comment "I'd like to work on this"
3. **Build it:** Follow this guide
4. **Submit PR:** Get paid in LTD tokens!

**Questions?** Ask in GitHub Discussions!

---

*Last Updated: October 18, 2025*
*Platform Status: 97% Production Ready*
*Smart Contracts: Deployed to Polygon Amoy*
