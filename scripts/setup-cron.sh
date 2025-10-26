#!/bin/bash

################################################################################
# Cron Job Setup Script for La Tanda Database Backups
#
# This script sets up automated daily backups at 2:00 AM
#
# Author: La Tanda Development Team
# Version: 1.0.0
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup-database.sh"

echo "Setting up cron job for La Tanda database backups..."

if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "ERROR: Backup script not found at $BACKUP_SCRIPT"
    exit 1
fi

chmod +x "$BACKUP_SCRIPT"
chmod +x "${SCRIPT_DIR}/restore-database.sh"

CRON_JOB="0 2 * * * ${BACKUP_SCRIPT} >> /var/log/latanda/cron.log 2>&1"

(crontab -l 2>/dev/null | grep -v "backup-database.sh"; echo "$CRON_JOB") | crontab -

echo "Cron job installed successfully!"
echo "Backup will run daily at 2:00 AM"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To edit cron jobs: crontab -e"
echo "To remove cron job: crontab -r"
echo ""
echo "Manual backup: $BACKUP_SCRIPT"
echo "Manual restore: ${SCRIPT_DIR}/restore-database.sh <backup_file>"
