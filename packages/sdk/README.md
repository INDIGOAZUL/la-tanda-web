# @latanda/sdk

TypeScript SDK for the La Tanda Web3 platform - auth, wallet, tandas, marketplace, and lottery.

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

// Get wallet balance
const balance = await client.wallet.getBalance();

// List groups
const groups = await client.tandas.listGroups();
```

## Modules

### 🔐 Authentication (`auth`)
Hardened login, registration, and session management.
- `login(creds)`: Secure login with placeholder-ready creds.
- `getCurrentUser()`: Fetches full profile from `/auth/me`.
- `refreshToken()`: Automatic session extension with recursion guard.

### 💰 Wallet (`wallet`)
Lempira (HNL) centric balance and payment processing. **No crypto required.**
- `getBalances()`: List all asset balances (HNL, USD).
- `getHistory(filters)`: POST-based transaction history.
- `processPayment(req)`: Withdrawals, transfers, and contributions.

### 👥 Groups (`tandas`)
Rotating savings circles with role-based participation.
- `listGroups(filters)`: Find public recruitment groups.
- `createGroup(data)`: Start a new circle with custom frequency.
- `joinGroup(id)` / `contribute(id, amt)`: Simple participation flow.

### 🏪 Marketplace (`marketplace`)
Community-driven product listings.
- `listProducts(filters)`: Search by category, price, or seller.
- `createProduct(data)`: List items for sale.

### 🎭 Social Feed (`feed`)
Interaction layer for community engagement.
- `getPosts()`: Fetch social updates.
- `toggleLike(id)` / `addComment(id, text)`: Native social interactions.

### 🎲 Lottery (`lottery`)
Fair member selection using backend-secured entropy.
- `listDraws()`: Track upcoming and past lottery results.
- `performDraw(groupId)`: Trigger automated, fair winner selection.

## Error Handling

```typescript
import { LaTandaClient, AuthenticationError, ValidationError } from '@latanda/sdk';

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
