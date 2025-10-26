# 🚀 FASE 3: Pagos Reales - Week 1 Implementation Plan

**Start Date:** October 25, 2025
**Duration:** 7 days
**Goal:** Activate crypto payment infrastructure

---

## 📊 Current Status (Post-Audit)

### ✅ What Works:
- Web3 Dashboard UI deployed
- MetaMask detection functional
- "Connect Wallet" button live
- Crypto code exists in API

### ❌ What's Broken:
- Crypto endpoint has syntax issue (not wrapped properly)
- LTD token not connected to frontend
- No blockchain transaction verification
- No token balance display

---

## 🎯 Week 1: Quick Wins (Day-by-Day Plan)

### **Day 1: Fix & Enable Crypto Endpoints** ⏱️ 4-6 hours

**Tasks:**
1. Fix `/api/wallet/deposit/crypto` endpoint structure
2. Add `/api/crypto/balance` endpoint (check USDC/USDT/LTD balance)
3. Add `/api/crypto/transfer` endpoint (send tokens)
4. Test all endpoints with curl
5. Restart production API

**Files to Modify:**
- `/root/enhanced-api-production-complete.js` (production)

**Expected Result:**
```bash
curl -X POST https://api.latanda.online/api/wallet/deposit/crypto \
  -H "Authorization: Bearer TOKEN" \
  -d '{"user_id":"test","currency":"USDC","network":"polygon"}'
# Should return: deposit address + QR code
```

---

### **Day 2: LTD Token Integration** ⏱️ 6-8 hours

**Tasks:**
1. Create `ltd-token-integration.js` module
2. Add ethers.js library to frontend
3. Connect to LTD contract: `0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc`
4. Implement token balance checking
5. Display LTD balance in My Wallet

**Files to Create/Modify:**
- `/var/www/html/main/ltd-token-integration.js` (new)
- `/var/www/html/main/my-wallet.js` (modify)
- `/var/www/html/main/my-wallet.html` (modify)

**Code Snippet:**
```javascript
// LTD Token Integration
const LTD_TOKEN_ADDRESS = '0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc';
const LTD_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)"
];

async function getLTDBalance(userAddress) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(LTD_TOKEN_ADDRESS, LTD_ABI, provider);
    const balance = await contract.balanceOf(userAddress);
    const decimals = await contract.decimals();
    return ethers.utils.formatUnits(balance, decimals);
}
```

**Expected Result:**
- My Wallet shows: "200,000,000 LTD" (your current balance)

---

### **Day 3: USDC/USDT Payment Flow** ⏱️ 6-8 hours

**Tasks:**
1. Add USDC/USDT contract addresses (Polygon)
2. Create stablecoin payment UI
3. Implement deposit flow (user → La Tanda)
4. Add transaction confirmation tracking
5. Test with MetaMask on testnet

**USDC/USDT Contracts (Polygon Mainnet):**
```javascript
const STABLECOINS = {
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon USDC
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'  // Polygon USDT
};
```

**Files to Modify:**
- `/var/www/html/main/my-wallet.html` (add stablecoin deposit UI)
- `/var/www/html/main/my-wallet.js` (implement payment logic)

**Expected Result:**
- User clicks "Deposit USDC"
- MetaMask pops up
- User confirms transaction
- Balance updates after confirmation

---

### **Day 4: MetaMask End-to-End Testing** ⏱️ 4-6 hours

**Tasks:**
1. Connect wallet from web3-dashboard.html
2. Switch to Polygon Amoy testnet
3. Check LTD token balance
4. Send test LTD payment
5. Verify transaction on PolygonScan
6. Document any bugs

**Test Checklist:**
- [ ] MetaMask connects successfully
- [ ] Polygon Amoy network auto-switches
- [ ] LTD balance displays correctly
- [ ] Can send LTD tokens
- [ ] Transaction appears in My Wallet
- [ ] PolygonScan link works

---

### **Day 5: Transaction Verification System** ⏱️ 6-8 hours

**Tasks:**
1. Create blockchain monitoring script
2. Listen for LTD token transfers
3. Auto-update database on confirmation
4. Send email notification on payment
5. Add admin verification dashboard

**Implementation:**
```javascript
// Monitor LTD token transfers
const contract = new ethers.Contract(LTD_TOKEN_ADDRESS, LTD_ABI, provider);

contract.on('Transfer', (from, to, amount, event) => {
    console.log(`Transfer: ${from} → ${to}: ${amount} LTD`);
    // Update database
    // Send notification
});
```

**Files to Create:**
- `/root/blockchain-monitor.js` (new background service)

**Expected Result:**
- When someone sends LTD, database auto-updates
- Admin gets notification
- User sees "Payment confirmed" status

---

### **Day 6: Payment UI Polish** ⏱️ 4-6 hours

**Tasks:**
1. Add crypto payment buttons to My Wallet
2. Create "Pay with Crypto" modal
3. Show gas fee estimates
4. Add transaction history (blockchain)
5. Improve error handling

**UI Components:**
- "Deposit" dropdown: [Bank Transfer | USDC | USDT | LTD Token | Bitcoin]
- Transaction status indicators
- Gas fee calculator
- PolygonScan links

---

### **Day 7: Testing & Documentation** ⏱️ 4-6 hours

**Tasks:**
1. Full end-to-end testing (all payment methods)
2. Write user guide: "How to Pay with Crypto"
3. Write admin guide: "Crypto Payment Verification"
4. Create troubleshooting doc
5. Update ROADMAP.md (mark crypto payments ✅)

**Deliverables:**
- [ ] USER-GUIDE-CRYPTO-PAYMENTS.md
- [ ] ADMIN-GUIDE-CRYPTO-VERIFICATION.md
- [ ] TROUBLESHOOTING-CRYPTO.md

---

## 📦 Dependencies & Prerequisites

### **NPM Packages (Frontend):**
```bash
# Add to production
<script src="https://cdn.ethers.io/lib/ethers-5.7.umd.min.js"></script>
```

### **Environment Variables:**
```env
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
LTD_TOKEN_ADDRESS=0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc
ADMIN_WALLET_ADDRESS=0x58EA31ceba1B3DeFacB06A5B7fc7408656b91bf7
```

### **Alchemy/Infura (Optional but Recommended):**
- Create free account
- Get Polygon RPC endpoint
- Better reliability than public RPCs

---

## 🎯 Success Metrics (Week 1)

### **Technical:**
- [ ] All crypto endpoints return 200 (not 404)
- [ ] LTD balance displays correctly
- [ ] USDC/USDT payments work
- [ ] MetaMask connects smoothly
- [ ] Transactions verify within 30 seconds

### **User Experience:**
- [ ] "Pay with Crypto" button visible
- [ ] Clear instructions for first-time users
- [ ] Transaction status updates in real-time
- [ ] Error messages are helpful

### **Admin:**
- [ ] Can see all crypto transactions
- [ ] Can verify payments manually
- [ ] Can track pending transactions
- [ ] Dashboard shows crypto balances

---

## ⚠️ Potential Issues & Solutions

| Issue | Solution |
|-------|----------|
| MetaMask not installed | Show install prompt with link |
| Wrong network (Ethereum instead of Polygon) | Auto-prompt network switch |
| Insufficient gas (MATIC) | Show "Get MATIC" faucet link |
| Transaction pending forever | Add "Speed up" button (higher gas) |
| User doesn't have USDC | Show "Buy USDC" link (Moonpay/Ramp) |

---

## 🚀 Week 2 Preview (Blink + Lightning)

After Week 1 succeeds, we'll add:
- Blink API integration (El Salvador Bitcoin)
- Lightning Network invoices
- Instant bitcoin payments (<1 second)
- Bitcoin on-chain payments

---

## 📞 Support & Resources

**Polygon Documentation:**
- https://docs.polygon.technology/

**Ethers.js Docs:**
- https://docs.ethers.org/v5/

**LTD Token Contract:**
- https://amoy.polygonscan.com/token/0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc

**Test Faucets:**
- Polygon Amoy MATIC: https://faucet.polygon.technology/
- Testnet USDC: https://faucet.circle.com/

---

**Created:** October 25, 2025
**Status:** Ready to Start
**Est. Completion:** November 1, 2025
**Next Phase:** Week 2 - Blink + Lightning Integration
