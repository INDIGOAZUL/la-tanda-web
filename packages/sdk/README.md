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
Full-featured module for lottery games, tickets, and prediction engine.
- `listGames()` / `getGameDetail(id)`: Browse the available lottery catalog.
- `buyTickets(drawId, numbers)`: Securely purchase tickets for upcoming draws.
- `listUserTickets()`: Track your active and past tickets.
- `submitPrediction(gameId, numbers)`: Submit picks to the prediction engine.
- `getPredictorStats()`: View hit-rates and prediction performance.

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

## Publishing

To publish a new version of the SDK, follow these steps:

1. Update the version in `package.json` (e.g., `npm version patch`).
2. Run `npm run build` to ensure the distribution files are fresh.
3. Run `npm run test` to verify that all 120+ tests pass.
4. Use `npm pack` to inspect the contents of the tarball.
5. Once verified, use `npm publish --access public` (requires maintainer permissions).
6. Tag the release in Git to match the version: `git tag @latanda/sdk@x.y.z && git push --tags`.

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
