



# La Tanda Chain Validator Monitoring Stack

This repository provides a complete monitoring solution for La Tanda Chain validators using Prometheus, Grafana, and Node Exporter.

## Features

- **Comprehensive Monitoring**: Track block height, peer connections, system resources, and network metrics
- **Alerting**: Built-in alerts for critical validator health issues
- **Easy Setup**: Single command deployment with Docker Compose
- **Customizable**: Adjustable configuration for different validator setups
- **Persistent Storage**: Data persistence for Prometheus and Grafana

## Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│   ┌─────────────┐    ┌─────────────┐    ┌───────────────────────────────────┐   │
│   │             │    │             │    │                               │   │
│   │  Validator  │───▶│ Prometheus │◀───┤           Grafana            │   │
│   │    Node     │    │             │    │                               │   │
│   │             │    └─────────────┘    └───────────────────────────────┘   │
│     ▲                                                                         │
│     │                                                                         │
│   ┌─┴───────────┐                                                             │
│   │             │                                                             │
│   │ Node Exporter│                                                             │
│   │             │                                                             │
│   └─────────────┘                                                             │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Requirements

- Docker (v20.10+)
- Docker Compose (v1.29+)
- Linux-based system (for Node Exporter)
- 2GB+ RAM
- 2 CPU cores

## Quick Start

1. Clone this repository:
   ```bash
   git clone https://github.com/your-repo/latanda-monitoring.git
   cd latanda-monitoring
   ```

2. Run the setup script:
   ```bash
   chmod +x setup-monitoring.sh
   ./setup-monitoring.sh
   ```

3. Access the dashboards:
   - Grafana: http://localhost:3000 (username: admin, password: admin)
   - Prometheus: http://localhost:9090
   - Node Exporter: http://localhost:9100/metrics

## Configuration

### Environment Variables

You can customize the monitoring stack using environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `VALIDATOR_HOST` | `host.docker.internal` | Validator node hostname |
| `VALIDATOR_PORT` | `26660` | Validator metrics port |
| `GRAFANA_ADMIN_USER` | `admin` | Grafana admin username |
| `GRAFANA_ADMIN_PASSWORD` | `admin` | Grafana admin password |

Example:
```bash
VALIDATOR_HOST=my-validator.example.com VALIDATOR_PORT=26661 ./setup-monitoring.sh
```

### Command Line Options

The setup script also accepts command line arguments:

```bash
./setup-monitoring.sh --help
```

## Customization

### Prometheus Configuration

Edit `prometheus/prometheus.yml` to:
- Add additional scrape targets
- Adjust scrape intervals
- Modify alert rules

### Grafana Dashboards

1. Add new dashboards by placing JSON files in `grafana/provisioning/dashboards/`
2. Update the dashboard provider configuration in `grafana/provisioning/dashboards/validator-dashboard.yml`

### Alerts

Edit `prometheus/alert.rules` to:
- Add new alert rules
- Adjust threshold values
- Modify alert severity levels

## Maintenance

### Updating

To update to the latest container images:

```bash
docker-compose pull
docker-compose up -d
```

### Backup

To backup your monitoring data:

```bash
# Backup Prometheus data
docker run --rm --volumes-from prometheus -v $(pwd):/backup busybox tar cvf /backup/prometheus-data.tar /prometheus

# Backup Grafana data
docker run --rm --volumes-from grafana -v $(pwd):/backup busybox tar cvf /backup/grafana-data.tar /var/lib/grafana
```

### Restore

To restore from backup:

```bash
# Restore Prometheus data
docker run --rm --volumes-from prometheus -v $(pwd):/backup busybox tar xvf /backup/prometheus-data.tar -C /

# Restore Grafana data
docker run --rm --volumes-from grafana -v $(pwd):/backup busybox tar xvf /backup/grafana-data.tar -C /
```

## Troubleshooting

### Common Issues

1. **Containers won't start**:
   - Check logs: `docker-compose logs`
   - Verify ports are available: `netstat -tulnp`
   - Check Docker resource allocation

2. **No metrics in Grafana**:
   - Verify Prometheus targets: http://localhost:9090/targets
   - Check validator node metrics endpoint
   - Verify network connectivity between containers

3. **High resource usage**:
   - Adjust resource limits in `docker-compose.yml`
   - Increase retention period in Prometheus configuration
   - Add more filters to metric collection

### Debugging Commands

```bash
# View container logs
docker-compose logs [service]

# Check container status
docker-compose ps

# Enter a container shell
docker-compose exec [service] sh

# Restart specific service
docker-compose restart [service]
```

## Security Considerations

1. **Change default credentials**:
   ```bash
   ./setup-monitoring.sh --grafana-user myuser --grafana-password mysecurepassword
   ```

2. **Restrict access**:
   - Use a reverse proxy with authentication
   - Configure firewall rules to restrict access to ports
   - Consider using VPN for remote access

3. **Regular updates**:
   - Keep container images updated
   - Monitor for security vulnerabilities in dependencies

## Metrics Reference

### Validator Metrics

| Metric | Description | Type |
|--------|-------------|------|
| `tendermint_consensus_height` | Current block height | Gauge |
| `tendermint_p2p_peers` | Number of connected peers | Gauge |
| `tendermint_consensus_missed_blocks_counter` | Number of missed blocks | Counter |
| `tendermint_p2p_peer_receive_bytes_total` | Bytes received from peers | Counter |
| `tendermint_p2p_peer_send_bytes_total` | Bytes sent to peers | Counter |

### System Metrics

| Metric | Description | Type |
|--------|-------------|------|
| `node_cpu_seconds_total` | CPU usage by mode | Counter |
| `node_memory_MemFree_bytes` | Free memory | Gauge |
| `node_memory_MemTotal_bytes` | Total memory | Gauge |
| `node_filesystem_avail_bytes` | Available disk space | Gauge |
| `node_network_receive_bytes_total` | Network bytes received | Counter |
| `node_network_transmit_bytes_total` | Network bytes transmitted | Counter |
| `node_hwmon_temp_celsius` | System temperature | Gauge |

## Contributing

We welcome contributions to improve this monitoring stack! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Setup

```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Run tests
./scripts/test.sh
```

### Code Style

- Use consistent indentation (2 spaces)
- Add comments for complex configurations
- Keep container images up-to-date
- Document new features and changes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and feature requests, please open an issue on GitHub.

For general questions about La Tanda Chain, visit:
- [La Tanda Chain Documentation](https://docs.latanda.io)
- [La Tanda Community Forum](https://community.latanda.io)

---

© 2023 La Tanda Chain Contributors



