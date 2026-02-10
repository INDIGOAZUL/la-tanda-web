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

- **auth** - Login, register, token management
- **wallet** - Balance, transactions, send funds
- **tandas** - Group management, cycles
- **marketplace** - Products, search, orders
- **lottery** - Fair member selection

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
