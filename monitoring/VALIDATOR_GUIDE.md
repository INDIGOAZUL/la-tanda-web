# Validator Onboarding Guide

This guide helps a La Tanda validator run the monitoring stack next to a node.

## Enable Tendermint Metrics

In the validator node `config.toml`, enable Prometheus metrics:

```toml
prometheus = true
prometheus_listen_addr = ":26660"
```

Restart the node after changing the config.

## Enable Cosmos REST Metrics

Expose the Cosmos REST service with metrics enabled. The stack expects metrics at:

```text
http://NODE_HOST:1317/metrics
```

Keep this endpoint private to the monitoring host when possible.

## Add Your Validator

Edit `prometheus/targets/validators.yml`:

```yaml
- labels:
    validator: your-validator-name
    network: latanda-testnet
  targets:
    - your-node-private-ip:26660
```

Edit `prometheus/targets/rest-api.yml`:

```yaml
- labels:
    validator: your-validator-name
    network: latanda-testnet
  targets:
    - your-node-private-ip:1317
```

Reload Prometheus:

```bash
curl -X POST http://localhost:9090/-/reload
```

## Alert Rules

### ValidatorJailed

Severity: critical

Fires when staking metrics report the validator as jailed. This should page the operator immediately.

### MissedBlocksCritical

Severity: critical

Fires when missed blocks exceed 4,000, which is 40% of the current `signed_blocks_window` value of 10,000. The chain uses `min_signed_per_window = 0.500000000000000000`, so validators are at jail risk after more than 5,000 missed blocks in the window.

### MissedBlocksWarning

Severity: warning

Fires when missed blocks exceed 2,000, which is 20% of the current `signed_blocks_window` value of 10,000. Check peer count, disk latency, process restarts, and validator logs.

### LowPeerCount

Severity: warning

Fires when CometBFT reports fewer than 3 peers for 10 minutes.

### ActiveGovernanceProposal

Severity: info

Fires when a new active governance proposal is detected, so the operator can review and vote.

## Security Notes

- Do not expose Prometheus or Alertmanager publicly without authentication.
- Put Grafana behind HTTPS if it is reachable from the internet.
- Use a strong `GRAFANA_ADMIN_PASSWORD`.
- Prefer private IPs or VPN addresses for validator targets.

## Troubleshooting

If dashboards are empty:

1. Check Prometheus targets at `http://SERVER_IP:9090/targets`.
2. Confirm the validator exposes `http://NODE_IP:26660/metrics`.
3. Confirm REST metrics expose `http://NODE_IP:1317/metrics`.
4. Check labels in the target files.
5. Restart Grafana if provisioning files were edited while it was running.
