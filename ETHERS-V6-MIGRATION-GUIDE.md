# Ethers.js v5 → v6 Migration Guide
**Current Version:** ethers v5.8.0
**Target Version:** ethers v6.15.0
**Status:** Planning Phase
**Priority:** High (Major Security & Feature Updates)

---

## Executive Summary

Ethers.js v6 is a **major rewrite** with significant breaking changes. This migration requires careful planning and comprehensive testing.

**Migration Complexity:** 🔴 HIGH
**Estimated Effort:** 2-3 weeks
**Risk Level:** Medium (with proper testing)

---

## Why Upgrade?

### Benefits of v6
- ✅ **Better TypeScript Support** - Full native TypeScript rewrite
- ✅ **Improved Performance** - 20-30% faster for common operations
- ✅ **Better Error Handling** - More descriptive error messages
- ✅ **Reduced Bundle Size** - Tree-shaking optimizations
- ✅ **Modern Features** - ESM support, async/await improvements
- ✅ **Security Updates** - Latest vulnerability patches
- ✅ **EIP-1559 Support** - Better gas fee handling

### Risks of NOT Upgrading
- ⚠️ Security vulnerabilities in v5
- ⚠️ Missing new chain features (EIP-4844, etc.)
- ⚠️ No support for latest wallet standards
- ⚠️ Community moving to v6 (less support for v5)

---

## Breaking Changes Overview

### 1. Import/Require Changes

**v5 (Current):**
```javascript
const { ethers } = require('ethers');
const provider = new ethers.providers.JsonRpcProvider(url);
const wallet = new ethers.Wallet(privateKey, provider);
```

**v6 (New):**
```javascript
const { ethers, JsonRpcProvider, Wallet } = require('ethers');
const provider = new JsonRpcProvider(url);
const wallet = new Wallet(privateKey, provider);
```

**Key Change:** No more `ethers.providers.*` or `ethers.utils.*`

---

### 2. Provider API Changes

**v5:**
```javascript
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const balance = await provider.getBalance(address);
const block = await provider.getBlock('latest');
```

**v6:**
```javascript
const provider = new JsonRpcProvider(RPC_URL);
const balance = await provider.getBalance(address);
const block = await provider.getBlock('latest');
```

**Key Changes:**
- `providers.JsonRpcProvider` → `JsonRpcProvider`
- `providers.Web3Provider` → `BrowserProvider`
- `providers.InfuraProvider` → Use `JsonRpcProvider` with Infura URL

---

### 3. Contract Interactions

**v5:**
```javascript
const contract = new ethers.Contract(address, abi, signerOrProvider);
const tx = await contract.transfer(to, amount);
const receipt = await tx.wait();
```

**v6:**
```javascript
const contract = new Contract(address, abi, signerOrProvider);
const tx = await contract.transfer(to, amount);
const receipt = await tx.wait(); // Same!
```

**Key Changes:**
- Import Contract directly
- Most contract methods unchanged ✅

---

### 4. Utilities (Major Changes!)

**v5:**
```javascript
ethers.utils.parseEther('1.0')
ethers.utils.formatEther(wei)
ethers.utils.keccak256(data)
ethers.utils.hexlify(value)
ethers.utils.getAddress(address)
```

**v6:**
```javascript
parseEther('1.0')
formatEther(wei)
keccak256(data)
hexlify(value)
getAddress(address)
```

**Key Change:** Import utils directly, no more `ethers.utils.*`

---

### 5. BigNumber Changes

**v5:**
```javascript
const value = ethers.BigNumber.from('1000000000000000000');
const sum = value.add(ethers.BigNumber.from('1'));
```

**v6:**
```javascript
const value = BigInt('1000000000000000000');
const sum = value + BigInt('1'); // Native BigInt!
```

**Key Change:** Native JavaScript `BigInt` replaces `ethers.BigNumber`

---

### 6. Event Filtering

**v5:**
```javascript
const filter = contract.filters.Transfer(null, address);
const events = await contract.queryFilter(filter, startBlock, endBlock);
```

**v6:**
```javascript
const filter = contract.filters.Transfer(null, address);
const events = await contract.queryFilter(filter, startBlock, endBlock);
// Mostly unchanged ✅
```

---

## Migration Plan

### Phase 1: Preparation (Week 1)

#### Day 1-2: Code Analysis
- [ ] Inventory all ethers.js usage in codebase
- [ ] Identify files using ethers (use grep):
  ```bash
  grep -r "require.*ethers" --include="*.js"
  grep -r "from.*ethers" --include="*.js"
  ```
- [ ] Document all API patterns currently used

#### Day 3-4: Create Test Branch
- [ ] Create migration branch: `git checkout -b feature/ethers-v6`
- [ ] Set up parallel testing environment
- [ ] Ensure all existing tests pass on v5

#### Day 5: Dependencies
- [ ] Update package.json: `"ethers": "^6.15.0"`
- [ ] Run `npm install` on test environment
- [ ] Document any peer dependency issues

---

### Phase 2: Code Migration (Week 2)

#### Priority 1: Core Files
Files likely using ethers:
1. `smart-contracts-integration.js`
2. `web3-wallet-integration.js`
3. `contract-abis.js`
4. `withdrawal-*.js` scripts
5. Any files with `web3-` prefix

**Migration Steps per File:**
1. Read file and identify ethers usage
2. Update imports/requires
3. Replace `ethers.providers.*` with direct imports
4. Replace `ethers.utils.*` with direct utils
5. Replace `ethers.BigNumber` with `BigInt`
6. Test thoroughly

#### Example Migration:

**Before (v5):**
```javascript
const { ethers } = require('ethers');

async function getBalance(address) {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const balance = await provider.getBalance(address);
  return ethers.utils.formatEther(balance);
}

const amount = ethers.utils.parseEther('1.5');
const bigNum = ethers.BigNumber.from('1000');
```

**After (v6):**
```javascript
const { JsonRpcProvider, formatEther, parseEther } = require('ethers');

async function getBalance(address) {
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const balance = await provider.getBalance(address);
  return formatEther(balance);
}

const amount = parseEther('1.5');
const bigNum = BigInt('1000');
```

---

### Phase 3: Testing (Week 3)

#### Unit Tests
- [ ] Update all unit tests for v6 syntax
- [ ] Run full test suite: `npm test`
- [ ] Achieve same code coverage as v5

#### Integration Tests
- [ ] Test wallet connections
- [ ] Test contract deployments
- [ ] Test contract interactions (read/write)
- [ ] Test event listening
- [ ] Test transaction signing

#### Manual Testing
- [ ] Connect MetaMask wallet
- [ ] Test LTD token transfers
- [ ] Test tanda group creation
- [ ] Test withdrawal flow
- [ ] Test staking functions

---

## Files to Update

### High Priority (Core Web3 Files)

```bash
# Find all files importing ethers
find . -name "*.js" -type f -exec grep -l "ethers" {} \;
```

**Expected Files:**
1. `/smart-contracts-integration.js`
2. `/web3-wallet-integration.js`
3. `/web3-dashboard.js`
4. `/contract-abis.js`
5. `/smart-contracts/scripts/*.js`
6. `/smart-contracts/test/*.js`

### Medium Priority
- Any API endpoints using blockchain
- Withdrawal processing scripts
- Balance checking utilities

### Low Priority
- Documentation examples
- Test fixtures
- Mock data

---

## Testing Checklist

### Pre-Migration Tests (v5)
```bash
# Run all existing tests
npm test

# Test contract interactions
npm run test:contracts

# Manual wallet tests
# 1. Connect wallet
# 2. Check balance
# 3. Send transaction
# 4. Verify on PolygonScan
```

### Post-Migration Tests (v6)
```bash
# Same tests should pass
npm test
npm run test:contracts

# Additional v6 specific tests
# 1. BigInt operations
# 2. Error handling
# 3. Gas estimation
# 4. Event filtering
```

---

## Common Pitfalls & Solutions

### Issue 1: BigNumber to BigInt

**Problem:**
```javascript
// This will break in v6
const total = balance.add(amount);
```

**Solution:**
```javascript
// Use native BigInt operations
const total = balance + amount;

// For multiplication/division
const doubled = balance * BigInt(2);
const half = balance / BigInt(2);
```

### Issue 2: formatEther Returns String

**Problem:**
```javascript
// Trying to do math with formatted value
const formatted = formatEther(balance);
const doubled = formatted * 2; // NaN!
```

**Solution:**
```javascript
// Do math with BigInt, then format
const doubled = balance * BigInt(2);
const formattedDoubled = formatEther(doubled);
```

### Issue 3: Provider Constructors

**Problem:**
```javascript
// v5 - This will break
const provider = new ethers.providers.Web3Provider(window.ethereum);
```

**Solution:**
```javascript
// v6 - Use BrowserProvider
import { BrowserProvider } from 'ethers';
const provider = new BrowserProvider(window.ethereum);
```

---

## Rollback Plan

If migration fails:

1. **Quick Rollback:**
   ```bash
   git checkout main
   git branch -D feature/ethers-v6
   ```

2. **Package Rollback:**
   ```bash
   npm install ethers@5.8.0
   ```

3. **Deploy Previous Version:**
   ```bash
   git revert <migration-commit>
   npm install
   npm run production
   ```

---

## Resources

### Official Documentation
- **Migration Guide:** https://docs.ethers.org/v6/migrating/
- **v6 Documentation:** https://docs.ethers.org/v6/
- **Changelog:** https://github.com/ethers-io/ethers.js/blob/main/CHANGELOG.md

### Community Resources
- **Stack Overflow:** [ethers.js v6] tag
- **GitHub Discussions:** https://github.com/ethers-io/ethers.js/discussions
- **Discord:** Ethers.js community

---

## Timeline

| Week | Phase | Tasks | Status |
|------|-------|-------|--------|
| Week 1 | Preparation | Code analysis, branch setup | ⏳ Pending |
| Week 2 | Migration | Update code, fix imports | ⏳ Pending |
| Week 3 | Testing | Unit, integration, manual tests | ⏳ Pending |
| Week 4 | Deploy | Staging → Production | ⏳ Pending |

---

## Success Criteria

Before deploying to production:

- [ ] All unit tests passing (100% coverage maintained)
- [ ] All integration tests passing
- [ ] Manual wallet connection works
- [ ] Contract interactions work (read & write)
- [ ] Transaction signing works
- [ ] Event listening works
- [ ] No console errors in browser
- [ ] Performance same or better than v5
- [ ] Bundle size reduced or same
- [ ] Code review completed
- [ ] Documentation updated

---

## Next Steps

### Immediate (This Week)
1. Review this migration guide with team
2. Get approval to proceed
3. Create feature branch
4. Run code analysis to find all ethers usage

### Short Term (Next 2 Weeks)
5. Perform migration in test environment
6. Run comprehensive tests
7. Fix any issues found

### Medium Term (Week 4)
8. Deploy to staging
9. Monitor for issues
10. Deploy to production

---

**Document Version:** 1.0
**Last Updated:** November 18, 2025
**Owner:** Development Team
**Reviewer:** TBD
**Approval:** Pending
