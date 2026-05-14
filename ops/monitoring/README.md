# La Tanda Chain - Validator Monitoring Stack

This directory contains the production-ready monitoring stack for La Tanda Chain validators, fulfilling the requirements for comprehensive metric tracking and dashboarding.

## Architecture

The stack consists of three primary components deployed via Docker Compose:
1. **Prometheus**: Time-series database for scraping and storing metrics.
2. **Grafana**: Visualization platform pre-provisioned to connect to Prometheus.
3. **Node Exporter**: Hardware and OS metrics exporter for the host machine.

## Prerequisites
- Docker and Docker Compose installed on the validator node.
- The validator node must expose its metrics endpoint (default is usually `:26660` for Cosmos SDK/Tendermint).

## Deployment

1. Review the target configuration in `prometheus/prometheus.yml` to ensure it points to your active validator node's metric port.
2. Spin up the stack:
   ```bash
   docker-compose up -d
   ```
3. Access Grafana at `http://<your-node-ip>:3000`.
   - **User**: `admin`
   - **Password**: `la_tanda_admin_secure` (Update this in `docker-compose.yml` for production)

## Dashboards
Grafana is pre-provisioned with the Prometheus datasource. You can import community Cosmos SDK or Tendermint dashboards (like ID: `14611` or `11015`) directly into Grafana to instantly visualize blocks, peers, and consensus health.
