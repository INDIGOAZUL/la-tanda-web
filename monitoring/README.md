# La Tanda Chain Monitoring Tools

This directory contains tools for monitoring the uptime and health of La Tanda Chain.

## Tools

### 1. Uptime Dashboard (`UptimeDashboard.tsx`)
A React component that displays the current slashing parameters and the status of all validators.
- Fetches data from `latanda.online` every minute.
- Highlights jailed validators in red.

### 2. Uptime Alert System (`latanda_uptime.ts`)
A Node.js script that periodically checks the chain health and sends alerts via Discord or Telegram if the API is unreachable or a validator is jailed.

#### Setup
Set the following environment variables:
- `DISCORD_WEBHOOK_URL` (optional)
- `TELEGRAM_BOT_TOKEN` (optional)
- `TELEGRAM_CHAT_ID` (optional)

#### Run
```bash
ts-node latanda_uptime.ts
```
