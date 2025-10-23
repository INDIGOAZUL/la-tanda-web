#!/bin/bash

################################################################################
# Test Script for La Tanda Backup System
#
# This script verifies that all components are properly configured
#
# Author: La Tanda Development Team
# Version: 1.0.0
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env.backup"

echo "=========================================="
echo "La Tanda Backup System Test"
echo "=========================================="
echo ""

ERRORS=0

echo "1. Checking required commands..."
for cmd in pg_dump psql gzip gunzip find; do
    if command -v $cmd &> /dev/null; then
        echo "   ✓ $cmd found"
    else
        echo "   ✗ $cmd not found"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

echo "2. Checking backup script..."
if [ -f "${SCRIPT_DIR}/backup-database.sh" ]; then
    echo "   ✓ backup-database.sh exists"
    if [ -x "${SCRIPT_DIR}/backup-database.sh" ]; then
        echo "   ✓ backup-database.sh is executable"
    else
        echo "   ✗ backup-database.sh is not executable"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ✗ backup-database.sh not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "3. Checking restore script..."
if [ -f "${SCRIPT_DIR}/restore-database.sh" ]; then
    echo "   ✓ restore-database.sh exists"
    if [ -x "${SCRIPT_DIR}/restore-database.sh" ]; then
        echo "   ✓ restore-database.sh is executable"
    else
        echo "   ✗ restore-database.sh is not executable"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ✗ restore-database.sh not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "4. Checking configuration..."
if [ -f "$ENV_FILE" ]; then
    echo "   ✓ .env.backup exists"
    source "$ENV_FILE"
    
    if [ -n "${DB_NAME:-}" ]; then
        echo "   ✓ DB_NAME configured: $DB_NAME"
    else
        echo "   ✗ DB_NAME not configured"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ -n "${DB_USER:-}" ]; then
        echo "   ✓ DB_USER configured: $DB_USER"
    else
        echo "   ✗ DB_USER not configured"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ⚠ .env.backup not found (will use defaults)"
    echo "   ℹ Copy env.backup.example to .env.backup and configure"
fi
echo ""

echo "5. Checking directories..."
BACKUP_DIR="${BACKUP_DIR:-/var/backups/latanda}"
LOG_DIR="${LOG_DIR:-/var/log/latanda}"

if [ -d "$BACKUP_DIR" ]; then
    echo "   ✓ Backup directory exists: $BACKUP_DIR"
else
    echo "   ⚠ Backup directory will be created: $BACKUP_DIR"
fi

if [ -d "$LOG_DIR" ]; then
    echo "   ✓ Log directory exists: $LOG_DIR"
else
    echo "   ⚠ Log directory will be created: $LOG_DIR"
fi
echo ""

echo "6. Checking cloud storage tools (optional)..."
if command -v aws &> /dev/null; then
    echo "   ✓ AWS CLI found"
else
    echo "   ℹ AWS CLI not found (optional for S3 upload)"
fi

if command -v gsutil &> /dev/null; then
    echo "   ✓ gsutil found"
else
    echo "   ℹ gsutil not found (optional for GCS upload)"
fi
echo ""

echo "7. Checking cron job..."
if crontab -l 2>/dev/null | grep -q "backup-database.sh"; then
    echo "   ✓ Cron job is configured"
    echo "   Current schedule:"
    crontab -l 2>/dev/null | grep "backup-database.sh" | sed 's/^/     /'
else
    echo "   ⚠ Cron job not configured"
    echo "   Run: ./scripts/setup-cron.sh"
fi
echo ""

echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo "✓ All critical checks passed!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Configure .env.backup with your database credentials"
    echo "2. Run: ./scripts/setup-cron.sh"
    echo "3. Test backup: ./scripts/backup-database.sh"
    exit 0
else
    echo "✗ Found $ERRORS error(s)"
    echo "=========================================="
    echo "Please fix the errors above before proceeding."
    exit 1
fi
