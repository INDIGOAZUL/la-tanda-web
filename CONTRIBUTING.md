# 🤝 Contributing to La Tanda

Thank you for your interest in contributing to La Tanda! We welcome all contributions and offer LTD token rewards for merged Pull Requests.

---

## 💰 Bounty Program

We pay contributors in LTD tokens for every merged PR!

**Reward Structure:**
- 🐛 **Bug Fixes:** 25-100 LTD
- ✨ **Features:** 100-500 LTD
- 📚 **Documentation:** 25-75 LTD
- 🧪 **Testing:** 50-200 LTD

**Active Bounties:** See [ACTIVE-BOUNTIES.md](./ACTIVE-BOUNTIES.md)

---

## 🚀 Quick Start

New to contributing? Check our **[Developer Quickstart Guide](./DEVELOPER-QUICKSTART.md)** for a 5-minute setup!

---

## 📋 Contribution Process

### 1. Find Something to Work On

**Option A: Claim a Bounty**
- Browse [active bounties](https://github.com/INDIGOAZUL/la-tanda-web/issues?q=is%3Aissue+is%3Aopen+label%3Abounty)
- Comment "I'd like to work on this" to claim
- Wait for confirmation from maintainers

**Option B: Report a Bug**
- Create a [bug report issue](https://github.com/INDIGOAZUL/la-tanda-web/issues/new?template=bug-bounty.md)
- Include steps to reproduce
- If accepted, it becomes a bounty!

**Option C: Propose a Feature**
- Create a [feature request issue](https://github.com/INDIGOAZUL/la-tanda-web/issues/new?template=feature-bounty.md)
- Discuss with maintainers
- If approved, work on implementation

### 2. Set Up Your Development Environment

```bash
# Fork the repository on GitHub
# Then clone your fork:
git clone https://github.com/YOUR_USERNAME/la-tanda-web.git
cd la-tanda-web

# Create a new branch
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

**Follow Our Coding Standards:**
- HTML: Semantic HTML5, kebab-case classes
- CSS: Use CSS variables, consistent naming
- JavaScript: ES6+, error handling, comments
- Solidity: Follow style guide, add NatSpec

**Test Your Changes:**
- Test locally (http://localhost:8080)
- Test in multiple browsers
- Test on mobile devices
- Run smart contract tests (`npx hardhat test`)

### 4. Commit Your Changes

**Commit Message Format:**
```
type(scope): brief description

Longer description if needed

Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(wallet): add transaction pagination

- Implement server-side pagination
- Add Previous/Next navigation
- Test with 100+ transactions

Fixes #4
```

```
fix(groups): resolve member joining bug

- Fix API endpoint error
- Add proper error handling
- Update validation logic

Fixes #42
```

### 5. Submit a Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name
```

**On GitHub:**
1. Go to the original repository
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template

**PR Template:**
```markdown
## Description
Brief description of what this PR does

## Related Issue
Fixes #123

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Tested locally
- [ ] Tested in Chrome/Firefox/Safari
- [ ] Tested on mobile
- [ ] All tests passing

## Screenshots
(if applicable)

## LTD Payment Address
0xYourPolygonAmoyAddress
```

### 6. Code Review

**What to Expect:**
- Maintainers review within 24-48 hours
- You may receive feedback or change requests
- Address feedback promptly
- Be respectful and collaborative

**Common Review Comments:**
- "Please add tests for this function"
- "Can you update the documentation?"
- "Let's follow the existing code style here"
- "Great work! Just a few minor changes needed"

### 7. Get Merged & Paid!

Once approved:
1. ✅ PR gets merged
2. 💰 LTD tokens sent within 24h
3. 🎉 You're a contributor!

---

## 📏 Code Quality Standards

### General Guidelines

**DO:**
- ✅ Follow existing code patterns
- ✅ Add comments for complex logic
- ✅ Test your changes thoroughly
- ✅ Update documentation
- ✅ Use descriptive variable names
- ✅ Handle errors gracefully

**DON'T:**
- ❌ Submit untested code
- ❌ Break existing functionality
- ❌ Ignore coding standards
- ❌ Add unnecessary dependencies
- ❌ Include console.log() in production code
- ❌ Hardcode sensitive data

### HTML Standards

```html
<!-- ✅ Good -->
<div class="wallet-container">
  <h2 class="wallet-title">My Wallet</h2>
  <button class="action-btn btn-primary">Send</button>
</div>

<!-- ❌ Bad -->
<div class="WalletContainer">
  <h2 style="color: blue;">My Wallet</h2>
  <button onclick="send()">Send</button>
</div>
```

### CSS Standards

```css
/* ✅ Good - Use CSS variables */
.wallet-balance {
  color: var(--text-primary);
  background: var(--bg-secondary);
  border-radius: 12px;
}

/* ❌ Bad - Hardcoded values */
.wallet-balance {
  color: #f8fafc;
  background: #1e293b;
  border-radius: 12px;
}
```

### JavaScript Standards

```javascript
// ✅ Good - Modern ES6+, error handling
async function fetchBalance(userId) {
  try {
    const response = await fetch(`/api/user/balance?id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch balance');
    const data = await response.json();
    return data.balance;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
}

// ❌ Bad - No error handling, old syntax
function fetchBalance(userId) {
  var response = fetch('/api/user/balance?id=' + userId);
  return response.json().balance;
}
```

### Solidity Standards

```solidity
// ✅ Good - NatSpec comments, proper structure
/// @notice Transfers tokens with vesting
/// @param to Address to transfer to
/// @param amount Amount to transfer
/// @return success Whether transfer succeeded
function transferWithVesting(
    address to,
    uint256 amount
) external returns (bool success) {
    require(to != address(0), "Invalid address");
    require(amount > 0, "Amount must be > 0");
    // Implementation...
    return true;
}

// ❌ Bad - No comments, poor naming
function t(address a, uint256 b) external returns (bool) {
    _transfer(msg.sender, a, b);
    return true;
}
```

---

## 🧪 Testing Requirements

### Frontend Testing

**Manual Testing Checklist:**
- [ ] Visual appearance matches design
- [ ] All buttons/links work
- [ ] Forms validate correctly
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Works in Chrome, Firefox, Safari

**Browser Testing:**
- Chrome 88+
- Firefox 87+
- Safari 14+
- Mobile browsers

### Smart Contract Testing

**Required for all contract changes:**
```bash
cd smart-contracts
npm install
npx hardhat test

# All tests must pass!
```

**Coverage Requirements:**
- Core functions: 100% coverage
- Helper functions: 80% coverage
- Overall: 90%+ coverage

---

## 📝 Documentation Requirements

### Code Documentation

**JavaScript/TypeScript:**
```javascript
/**
 * Calculates total rewards for a user
 * @param {string} userId - User's unique identifier
 * @param {number} period - Period in months
 * @returns {Promise<number>} Total rewards in LTD
 */
async function calculateRewards(userId, period) {
  // Implementation
}
```

**Solidity:**
```solidity
/// @notice Vests tokens over time
/// @dev Uses linear vesting with cliff
/// @param beneficiary Address receiving vested tokens
/// @param amount Total amount to vest
/// @param duration Vesting duration in seconds
function createVesting(
    address beneficiary,
    uint256 amount,
    uint256 duration
) external;
```

### Feature Documentation

When adding a new feature, update:
- [ ] README.md (if user-facing)
- [ ] ACTIVE-BOUNTIES.md (if creating bounty)
- [ ] Inline code comments
- [ ] API documentation (if adding endpoints)

---

## 🔒 Security Guidelines

### Never Commit:
- ❌ Private keys or mnemonics
- ❌ API keys or secrets
- ❌ Database credentials
- ❌ .env files
- ❌ User data

### Always:
- ✅ Validate all user input
- ✅ Sanitize data before display
- ✅ Use prepared statements for SQL
- ✅ Check authentication/authorization
- ✅ Handle errors without exposing internals

### Reporting Security Issues

**Found a security vulnerability?**
- ❌ **DO NOT** create a public issue
- ✅ Email: security@latanda.online
- ✅ Include detailed description
- ✅ Receive priority bounty (up to 500 LTD)

---

## 🏷️ Issue Labels

Understanding our labels:

- `bounty` - Rewards available for this issue
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `high-priority` - Should be worked on soon
- `infrastructure` - Infrastructure/DevOps tasks
- `security` - Security-related issues

---

## 💬 Community Guidelines

### Code of Conduct

**Be:**
- ✅ Respectful and inclusive
- ✅ Constructive in feedback
- ✅ Patient with newcomers
- ✅ Collaborative and helpful

**Don't:**
- ❌ Use offensive language
- ❌ Harass or discriminate
- ❌ Spam or self-promote
- ❌ Share others' private information

### Communication Channels

- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** Questions and general discussion
- **Pull Request Comments:** Code review discussions
- **Twitter/X:** [@TandaWeb3](https://x.com/TandaWeb3)

---

## 🎯 Bounty-Specific Guidelines

### Claiming a Bounty

1. **Comment to claim:** "I'd like to work on this"
2. **Wait for confirmation:** Maintainer will assign you
3. **Start working:** You have 7 days to submit PR
4. **If you need more time:** Comment on the issue
5. **If you can't finish:** Let us know so others can claim

### Multiple Contributors

- One person per bounty (first to claim gets it)
- If inactive for 7 days, bounty reopens
- Collaboration is encouraged for large bounties

### Bounty Payment

**Requirements:**
- PR must be merged (not just approved)
- Code must meet all acceptance criteria
- Wallet address must be provided

**Timeline:**
- Review: 24-48 hours
- Merge: After approval
- Payment: Within 24 hours of merge

**Network:**
- Polygon Amoy Testnet (currently)
- Will migrate to Polygon mainnet later

---

## 📚 Additional Resources

### Documentation
- [Developer Quickstart](./DEVELOPER-QUICKSTART.md) - 5-min setup
- [README](./README.md) - Project overview
- [Active Bounties](./ACTIVE-BOUNTIES.md) - Current rewards
- [Smart Contracts](./smart-contracts/README.md) - Contract docs

### Platform
- Live: https://latanda.online
- Staging: https://indigoazul.github.io/la-tanda-web/
- API: https://api.latanda.online

### Contracts
- LTDToken: [0x8633...9cFc](https://amoy.polygonscan.com/address/0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc)
- Vesting: [0x7F21...082F](https://amoy.polygonscan.com/address/0x7F21EC0A4B3Ec076eB4bc2924397C85B44a5082F)
- Reserve: [0xF136...0bA2](https://amoy.polygonscan.com/address/0xF136C790da0D76d75d36207d954A6E114A9c0bA2)

---

## ❓ FAQ

**Q: Do I need to ask before working on something?**
A: For bounties, yes - claim the issue first. For small fixes, you can submit directly.

**Q: How long does review take?**
A: 24-48 hours for most PRs.

**Q: Can I work on multiple bounties?**
A: Yes, but one at a time is recommended.

**Q: What if I don't finish in time?**
A: Just comment on the issue - we're flexible!

**Q: When do I get paid?**
A: Within 24 hours of your PR being merged.

**Q: What wallet do I need?**
A: MetaMask or any Polygon-compatible wallet.

**Q: Is this real money?**
A: Currently testnet tokens. Will migrate to mainnet later with real value.

---

## 🙏 Thank You!

Your contributions help make La Tanda better for everyone. Whether it's a bug fix, new feature, or documentation improvement - every contribution matters!

**First 10 contributors get "Founding Contributor" recognition!**

---

**Questions?** Ask in [GitHub Discussions](https://github.com/INDIGOAZUL/la-tanda-web/discussions)

**Ready to contribute?** Check [Active Bounties](./ACTIVE-BOUNTIES.md)!

---

*Last Updated: October 18, 2025*
*Bounty Budget: 250M LTD*
*Sustainability: 2,000+ years*
