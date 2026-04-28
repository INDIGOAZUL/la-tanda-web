# @latanda/sdk

TypeScript SDK for the La Tanda platform - fintech tools for rotating savings (Tandas), payments, and community marketplace.

## Installation

```bash
npm install @latanda/sdk
```

## Quick Start

```typescript
import { LaTandaClient } from '@latanda/sdk';

const client = new LaTandaClient({
  baseUrl: 'https://latanda.online',
});

// Login
const { user, auth_token } = await client.auth.login({
  email: 'your-email@example.com',
  password: 'your-password',
});

// Get wallet balance (HNL)
const balance = await client.wallet.getBalance();

// List public savings circles
const groups = await client.tandas.listGroups();
```

## Modules

### 🔐 Authentication (`auth`)
Secure login, registration, and session management.
- `login(creds)`: Authenticate and persist session.
- `getCurrentUser()`: Fetches full profile from `/user/profile`.
- `refreshToken()`: Automatic session extension with recursion guard.

### 💰 Wallet (`wallet`)
HNL (Lempira) balance and payment processing.
- `getBalance()`: Get current HNL balance and available funds.
- `getHistory(filters)`: View transaction history (GET).
- `withdrawToBank(data)` / `withdrawToMobile(data)`: Initiate withdrawals.
- `setPin(pin)` / `verifyPin(pin)`: Secure transaction authorization.

### 👥 Groups & Tandas (`tandas`)
Rotating savings circles with group management and contribution tracking.
- `listGroups(filters)`: Find public groups for recruitment.
- `createGroup(data)`: Start a new circle.
- `contribute(groupId, amount)`: Make a contribution to the current round.
- `runTombola(groupId)`: Perform fair turn randomization for the circle.

### 🎭 Social Feed (`feed`)
Community interaction layer.
- `listSocialFeed()`: Fetch latest updates from the community.
- `likePost(id)` / `addComment(id, text)`: Native social interactions.
- `bookmarkPost(id)` / `listBookmarks()`: User engagement tools.

### 🎲 Lottery (`lottery`)
Honduras national lottery prediction engine.
- `getStats()`: Real-time prediction statistics.
- `spin()`: Execute a paid prediction spin.
- `getJaladores()`: Look up "pulling numbers" context.

### 🏪 Marketplace & Providers (`marketplace`, `providers`)
Buy/sell products and manage business profiles.
- `listProducts()`: Search community listings.
- `registerProvider(data)`: Create a business profile (Mi Tienda).
- `getProfile()`: Manage your provider credentials and status.

### 🆔 Verification & KYC (`verification`)
Secure identity verification flows.
- `uploadDocument(file, type)`: Submit identity documents for review.
- `processOCR(data)`: Automated data extraction from documents.
- `getStatus()`: Track your verification progress.

---

## Error Handling

The SDK uses specialized error classes for various failure modes:

```typescript
try {
  await client.auth.login({ email, password });
} catch (err) {
  if (err instanceof AuthenticationError) {
    console.error('Bad credentials');
  } else if (err instanceof ValidationError) {
    console.error('Invalid input:', err.fields);
  }
}
```

## License

MIT
