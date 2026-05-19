# La Tanda Validator Monitoring

This directory contains a self-contained Prometheus, Alertmanager, Grafana, and node_exporter stack for La Tanda Chain validators.

## Requirements

- Ubuntu 22.04 or newer
- Docker Engine 24+
- Docker Compose v2
- Open inbound access to Grafana only if you intend to expose it publicly
- La Tanda node metrics enabled on `:26660`
- Cosmos SDK REST metrics available on `:1317/metrics`

## Quick Start

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set:

   - `GRAFANA_ADMIN_PASSWORD`
   - `ALERT_WEBHOOK_URL`

3. Add validator metrics targets:

   ```bash
   nano prometheus/targets/validators.yml
   nano prometheus/targets/rest-api.yml
   ```

4. Start the stack:

   ```bash
   docker compose up -d
   ```

5. Open Grafana:

   ```text
   http://SERVER_IP:3000
   ```

Dashboards are provisioned automatically under the `La Tanda Chain` folder. Prometheus keeps at least 30 days of local time series data.

## Services

| Service | Port | Purpose |
| --- | --- | --- |
| Grafana | `3000` | Dashboards and visual review |
| Prometheus | `9090` | Metrics scraping and alert evaluation |
| Alertmanager | `9093` | Alert grouping and webhook routing |
| node_exporter | `9100` | Host CPU, memory, disk, and network metrics |

## Target Configuration

Prometheus uses file service discovery so operators can update targets without editing the main Prometheus config.

Example `prometheus/targets/validators.yml`:

```yaml
- labels:
    validator: genesis
    network: latanda-testnet
  targets:
    - 10.0.0.10:26660
```

Example `prometheus/targets/rest-api.yml`:

```yaml
- labels:
    validator: genesis
    network: latanda-testnet
  targets:
    - 10.0.0.10:1317
```

After changing target files, reload Prometheus:

```bash
curl -X POST http://localhost:9090/-/reload
```

## Dashboards

- **Validator Overview**: voting power, jail status, missed blocks, uptime, and peer count.
- **Block Production**: latest height, block interval, height progression, and produced block indicators.
- **Network Health**: validator count, bonded stake, active governance proposal indicators, and network availability.
- **Node Performance**: CPU, memory, disk, and network I/O from node_exporter.

## Alert Routing

Alertmanager sends all alerts to `ALERT_WEBHOOK_URL`. Critical alerts repeat every 30 minutes until resolved; non-critical alerts repeat every 4 hours.

If the webhook points to Discord, use a bridge that accepts Alertmanager webhook payloads or a webhook transformer. Alertmanager sends generic JSON, not Discord's native message shape.

## Operations

View running services:

```bash
docker compose ps
```

Tail logs:

```bash
docker compose logs -f prometheus alertmanager grafana
```

Upgrade safely:

```bash
docker compose pull
docker compose up -d
```

