# La Tanda Chain — Node Setup for Beginners

**You don't need to understand any of this deeply.** Just follow each step exactly as written. Copy and paste the commands. By the end, you'll have a running blockchain node.

---

## What You're Building

You're going to run a **node** — a computer that helps keep the La Tanda blockchain alive. Think of it like joining a network of computers that all agree on the same data. Your machine will download the blockchain, stay in sync, and help validate transactions.

**What you need:**
- A computer that stays on 24/7 (we'll rent one in the cloud — costs ~$6/month)
- About 30 minutes of your time
- This guide open in front of you

**What you DON'T need:**
- Programming knowledge
- A VPN
- A powerful computer at home

---

## STEP 1: Get a Server

You need a small cloud server (called a VPS). It's like renting a computer that lives in a data center and stays on forever.

### Option A: Hetzner (Recommended — cheapest)

1. Go to **https://www.hetzner.com/cloud/**
2. Click **"Sign Up"** — use your email, verify it
3. Add a payment method (credit card or PayPal)
4. Click **"+ Create Server"** (big button, top right)
5. Choose these settings:

| Setting | What to pick |
|---------|-------------|
| Location | Ashburn (US East) or whatever is closest to you |
| Image | **Ubuntu 24.04** |
| Type | **CX22** (2 vCPU, 4 GB RAM) — ~$4.50/month |
| Networking | Leave default (public IPv4) |
| SSH Keys | We'll set this up in Step 2 — skip for now, use **password** |
| Name | `latanda-node` (or whatever you want) |

6. Click **Create & Buy**
7. You'll see your server's **IP address** (looks like `123.45.67.89`) — **write this down**
8. You'll get the **root password** by email or on screen — **save this**

### Option B: DigitalOcean

1. Go to **https://www.digitalocean.com/**
2. Sign up, add payment
3. Click **Create** → **Droplets**
4. Pick: Ubuntu 24.04, **Basic**, **Regular (Disk type: SSD)**, **$6/month** (1 vCPU, 2GB) or **$12/month** (2 vCPU, 4GB — recommended)
5. Choose a datacenter region close to you
6. Set a **root password**
7. Click **Create Droplet**
8. Copy the **IP address**

### Option C: Vultr

1. Go to **https://www.vultr.com/**
2. Sign up, add payment
3. Deploy New Server → Cloud Compute
4. Pick: Ubuntu 24.04, **$6/month** plan (1 vCPU, 2GB) or **$12/month** (2 vCPU, 4GB)
5. Copy the **IP address** and **password**

---

## STEP 2: Connect to Your Server

Now you need to "log in" to your cloud server from your computer. You do this through a program called a **terminal**.

### If you're on Windows:

1. Press the **Windows key**, type **"PowerShell"**, open it
2. Type this command (replace `YOUR_IP` with the IP from Step 1):

```
ssh root@YOUR_IP
```

3. It will ask: `Are you sure you want to continue connecting?` → Type **yes** and press Enter
4. Enter the **password** from Step 1 (you won't see the characters as you type — that's normal, just type and press Enter)

### If you're on Mac:

1. Press **Cmd + Space**, type **"Terminal"**, open it
2. Type:

```
ssh root@YOUR_IP
```

3. Type **yes** when asked, then enter your **password**

### If you're on Linux:

You already know what a terminal is. Open one and:

```
ssh root@YOUR_IP
```

### You're Connected When You See:

Something like:
```
root@latanda-node:~#
```

That blinking cursor means you're inside your server. Everything you type now runs on that remote machine, not your local computer.

**If you get disconnected:** Just run `ssh root@YOUR_IP` again. The server keeps running even if you disconnect.

---

## STEP 3: Secure Your Server

Before we install anything, let's lock down the server so nobody else can get in.

### 3a. Update the system

Copy and paste this entire block (all 3 lines at once is fine):

```bash
apt update && apt upgrade -y
```

This updates all the software on the server. It might take 1-2 minutes. If it asks you anything, just press **Enter** to accept the default.

### 3b. Change the root password

```bash
passwd
```

Type a **strong password** (mix of letters, numbers, symbols, at least 12 characters). You'll type it twice. **Save this password somewhere safe.**

### 3c. Install a firewall

```bash
apt install -y ufw
```

Now open only the ports we need:

```bash
ufw allow 22/tcp comment "SSH"
ufw allow 26656/tcp comment "La Tanda Chain P2P"
ufw allow 26657/tcp comment "La Tanda Chain RPC"
```

Turn on the firewall:

```bash
ufw enable
```

It will ask `Command may disrupt existing SSH connections. Proceed with operation?` → Type **y** and press Enter.

Verify it's working:

```bash
ufw status
```

You should see something like:
```
Status: active
To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
26656/tcp                  ALLOW       Anywhere
26657/tcp                  ALLOW       Anywhere
```

### 3d. Install fail2ban (blocks hackers who try to guess your password)

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

That's it for security. Your server is now protected.

---

## STEP 4: Install the La Tanda Chain Node

This is the fun part. One command does everything:

```bash
wget -q https://latanda.online/chain/node-setup.sh -O node-setup.sh && chmod +x node-setup.sh && ./node-setup.sh
```

### What happens:

1. It checks your server meets requirements (RAM, disk space)
2. Installs necessary software (build tools, Go programming language)
3. Downloads and builds the blockchain software
4. Asks you for a **node name** (your moniker) — pick anything, like your name or `carlos-node`
5. Downloads the genesis file (the starting state of the blockchain)
6. Configures your node to find the main network
7. Opens firewall ports

**This takes about 3-5 minutes.** Let it run. Don't close the terminal.

When it's done, you'll see:

```
============================================
  La Tanda Chain Node Ready!
============================================

  Chain ID:   latanda-testnet-1
  Moniker:    your-node-name
  Home:       /root/.latanda
  Node ID:    abc123...
```

---

## STEP 5: Start Your Node

Now let's start the node and make it stay running even if you close the terminal.

### Install PM2 (keeps your node running forever):

```bash
apt install -y nodejs npm
npm install -g pm2
```

### Start the node:

```bash
pm2 start latandad --name latanda-chain -- start
pm2 save
pm2 startup
```

The last command (`pm2 startup`) will print a command that looks like:
```
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

**Copy that entire line and paste it**, then press Enter. This makes your node auto-start if the server reboots.

---

## STEP 6: Verify Your Node is Running

### Check PM2 status:

```bash
pm2 list
```

You should see `latanda-chain` with status **online**.

### Check if the node is syncing:

```bash
latandad status | jq '.sync_info'
```

You'll see something like:
```json
{
  "latest_block_height": "45",
  "catching_up": true
}
```

- **`catching_up: true`** = Your node is downloading blocks. This is normal. Wait a few minutes.
- **`catching_up: false`** = Your node is fully synced! You're part of the network.

### Check your block height is increasing:

Run this a few times with a few seconds between each:

```bash
latandad status | jq '.sync_info.latest_block_height'
```

The number should go up each time. That means blocks are being received.

### Check if you're connected to the genesis node:

```bash
curl -s localhost:26657/net_info | jq '.result.n_peers'
```

Should show **"1"** (or more). If it shows "0", wait a minute and try again — it takes a moment to find peers.

---

## STEP 7: See Your Node on the Explorer

Open this in your browser:

**https://latanda.online/chain/**

After your node connects, the **"Peers Conectados"** counter should increase. Your node is now part of the La Tanda network!

---

## You're Done!

Your node is:
- Running 24/7 on your cloud server
- Connected to the La Tanda blockchain
- Syncing every new block (~5 seconds)
- Auto-restarts if the server reboots

---

## Daily Commands Cheat Sheet

You don't need to do anything daily — the node runs itself. But if you ever want to check on it:

```bash
# Connect to your server (from your local computer)
ssh root@YOUR_IP

# Is my node running?
pm2 list

# What block am I on?
latandad status | jq '.sync_info.latest_block_height'

# Am I synced?
latandad status | jq '.sync_info.catching_up'
# false = synced, true = still catching up

# How many peers?
curl -s localhost:26657/net_info | jq '.result.n_peers'

# View node logs (last 50 lines)
pm2 logs latanda-chain --lines 50

# Restart the node (if something seems stuck)
pm2 restart latanda-chain

# Stop the node
pm2 stop latanda-chain

# Start the node again
pm2 start latanda-chain
```

---

## Troubleshooting

### "Connection refused" when I try to SSH
- Double-check the IP address
- Make sure the server is powered on (check your hosting dashboard)
- Wait 1-2 minutes after creating a new server

### The node won't start
```bash
pm2 logs latanda-chain --lines 50
```
Look for red error text. Common fixes:

```bash
# Reset and try again
pm2 stop latanda-chain
latandad comet unsafe-reset-all
pm2 start latanda-chain
```

### Node is stuck at 0 peers
- Make sure port 26656 is open: `ufw status`
- The genesis node might be temporarily down — wait and retry
- Re-add the seed:
```bash
sed -i 's|seeds = ".*"|seeds = "483a8110c3cd93c8dd3801d935151e98656f5b67@168.231.67.201:26656"|' ~/.latanda/config/config.toml
pm2 restart latanda-chain
```

### I closed the terminal — is my node still running?
**Yes!** PM2 keeps it running. Just SSH back in and check with `pm2 list`.

### I need help
- Contact: **contact@latanda.online**
- Explorer: **https://latanda.online/chain/**

---

## Cost Summary

| Item | Monthly Cost |
|------|-------------|
| Cloud server (Hetzner CX22) | ~$4.50 |
| Everything else | Free |

That's it. Less than a cup of coffee per month to run a blockchain node.

---

*La Tanda Chain — latanda-testnet-1 | Ray-Banks LLC*
