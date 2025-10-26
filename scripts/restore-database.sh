#!/bin/bash

################################################################################
# PostgreSQL Database Restore Script for La Tanda
# 
# Usage: ./restore-database.sh [backup_file]
#
# Author: La Tanda Development Team
# Version: 1.0.0
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env.backup"

if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

DB_NAME="${DB_NAME:-latanda_db}"
DB_USER="${DB_USER:-latanda_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/latanda}"
LOG_DIR="${LOG_DIR:-/var/log/latanda}"
LOG_FILE="${LOG_DIR}/restore.log"

mkdir -p "$LOG_DIR"

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[${timestamp}] [${level}] ${message}" | tee -a "$LOG_FILE"
}

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/latanda_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    log "ERROR" "Backup file not found: $BACKUP_FILE"
    exit 1
fi

log "INFO" "Starting database restore"
log "INFO" "Backup file: $BACKUP_FILE"
log "INFO" "Target database: $DB_NAME"

read -p "This will overwrite the current database. Are you sure? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    log "INFO" "Restore cancelled by user"
    exit 0
fi

if [ -n "$DB_PASSWORD" ]; then
    export PGPASSWORD="$DB_PASSWORD"
fi

log "INFO" "Dropping existing database..."
dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" --if-exists "$DB_NAME" 2>> "$LOG_FILE" || true

log "INFO" "Creating new database..."
createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>> "$LOG_FILE"

log "INFO" "Restoring database from backup..."
gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>> "$LOG_FILE"

if [ -n "$DB_PASSWORD" ]; then
    unset PGPASSWORD
fi

log "SUCCESS" "Database restored successfully"
exit 0
