

#!/bin/bash
#
# La Tanda Chain Validator Monitoring Setup
#
# This script sets up a complete monitoring stack for La Tanda Chain validators
# including Prometheus, Grafana, and Node Exporter.
#
# Usage: ./setup-monitoring.sh [options]
#
# Options:
#   --help              Show this help message
#   --clean             Remove existing monitoring stack
#   --validator-host    Specify validator host (default: host.docker.internal)
#   --validator-port    Specify validator metrics port (default: 26660)
#   --grafana-user      Specify Grafana admin username (default: admin)
#   --grafana-password  Specify Grafana admin password (default: admin)

set -o errexit
set -o nounset
set -o pipefail

# Default configuration
VALIDATOR_HOST="${VALIDATOR_HOST:-host.docker.internal}"
VALIDATOR_PORT="${VALIDATOR_PORT:-26660}"
GRAFANA_ADMIN_USER="${GRAFANA_ADMIN_USER:-admin}"
GRAFANA_ADMIN_PASSWORD="${GRAFANA_ADMIN_PASSWORD:-admin}"
ACTION="up"

# Function to display help
show_help() {
    echo "La Tanda Chain Validator Monitoring Setup"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help              Show this help message"
    echo "  --clean             Remove existing monitoring stack"
    echo "  --validator-host    Specify validator host (default: host.docker.internal)"
    echo "  --validator-port    Specify validator metrics port (default: 26660)"
    echo "  --grafana-user      Specify Grafana admin username (default: admin)"
    echo "  --grafana-password  Specify Grafana admin password (default: admin)"
    echo ""
    echo "Environment variables can also be used to set these values."
    exit 0
}

# Function to validate Docker is installed and running
validate_docker() {
    if ! command -v docker &> /dev/null; then
        echo "ERROR: Docker is not installed. Please install Docker first."
        echo "See: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo "ERROR: Docker daemon is not running. Please start Docker."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo "ERROR: Docker Compose is not installed. Please install Docker Compose."
        echo "See: https://docs.docker.com/compose/install/"
        exit 1
    fi
}

# Function to update Prometheus configuration
update_prometheus_config() {
    echo "Updating Prometheus configuration..."
    sed -i "s|host.docker.internal:[0-9]\+|${VALIDATOR_HOST}:${VALIDATOR_PORT}|g" prometheus/prometheus.yml

    # Create .env file for Docker Compose
    cat > .env <<EOF
GRAFANA_ADMIN_USER=${GRAFANA_ADMIN_USER}
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
EOF
}

# Function to start monitoring stack
start_stack() {
    echo "Starting monitoring stack..."
    update_prometheus_config

    # Pull latest images
    docker-compose pull

    # Start containers
    docker-compose up -d

    # Verify containers are running
    echo ""
    echo "Verifying container status..."
    if ! docker-compose ps | grep -q "Up"; then
        echo "ERROR: Some containers failed to start. Check logs with: docker-compose logs"
        exit 1
    fi

    # Print access information
    print_access_info
}

# Function to clean up monitoring stack
clean_stack() {
    echo "Stopping and removing monitoring stack..."
    docker-compose down -v
    rm -f .env
    echo "Monitoring stack has been removed."
}

# Function to print access information
print_access_info() {
    echo ""
    echo "✅ Monitoring stack is now running:"
    echo ""
    echo "  Grafana:       http://localhost:3000"
    echo "                Username: ${GRAFANA_ADMIN_USER}"
    echo "                Password: ${GRAFANA_ADMIN_PASSWORD}"
    echo ""
    echo "  Prometheus:    http://localhost:9090"
    echo ""
    echo "  Node Exporter: http://localhost:9100/metrics"
    echo ""
    echo "  Validator:    ${VALIDATOR_HOST}:${VALIDATOR_PORT}"
    echo ""
    echo "To stop the monitoring stack, run: docker-compose down"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --help)
            show_help
            ;;
        --clean)
            ACTION="clean"
            shift
            ;;
        --validator-host)
            VALIDATOR_HOST="$2"
            shift 2
            ;;
        --validator-port)
            VALIDATOR_PORT="$2"
            shift 2
            ;;
        --grafana-user)
            GRAFANA_ADMIN_USER="$2"
            shift 2
            ;;
        --grafana-password)
            GRAFANA_ADMIN_PASSWORD="$2"
            shift 2
            ;;
        *)
            echo "ERROR: Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Main execution
validate_docker

case "$ACTION" in
    up)
        start_stack
        ;;
    clean)
        clean_stack
        ;;
    *)
        echo "ERROR: Invalid action"
        exit 1
        ;;
esac

exit 0

