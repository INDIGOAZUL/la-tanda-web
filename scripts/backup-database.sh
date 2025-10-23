#!/bin/bash

################################################################################
# PostgreSQL Database Backup Script for La Tanda
# 
# Features:
# - Automated daily PostgreSQL dumps
# - Gzip compression
# - 30-day rotation policy
# - Cloud storage upload (AWS S3 / Google Cloud Storage)
# - Email notifications on success/failure
# - Comprehensive logging
# - Error handling and recovery
#
# Author: La Tanda Development Team
# Version: 1.0.0
################################################################################

set -euo pipefail

# ============================================================================
# CONFIGURATION - Load from environment or use defaults
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env.backup"

if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

# Database Configuration
DB_NAME="${DB_NAME:-latanda_db}"
DB_USER="${DB_USER:-latanda_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Backup Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/latanda}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
LOG_DIR="${LOG_DIR:-/var/log/latanda}"
LOG_FILE="${LOG_DIR}/backup.log"

# Cloud Storage Configuration
ENABLE_CLOUD_UPLOAD="${ENABLE_CLOUD_UPLOAD:-false}"
CLOUD_PROVIDER="${CLOUD_PROVIDER:-s3}"
S3_BUCKET="${S3_BUCKET:-}"
S3_REGION="${S3_REGION:-us-east-1}"
GCS_BUCKET="${GCS_BUCKET:-}"

# Notification Configuration
ENABLE_EMAIL="${ENABLE_EMAIL:-false}"
EMAIL_TO="${EMAIL_TO:-}"
EMAIL_FROM="${EMAIL_FROM:-backup@latanda.com}"
SMTP_SERVER="${SMTP_SERVER:-localhost}"

# Timestamp for backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/latanda_backup_${TIMESTAMP}.sql.gz"

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[${timestamp}] [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO" "$@"
}

log_error() {
    log "ERROR" "$@"
}

log_success() {
    log "SUCCESS" "$@"
}

send_notification() {
    local subject="$1"
    local body="$2"
    
    if [ "$ENABLE_EMAIL" = "true" ] && [ -n "$EMAIL_TO" ]; then
        echo "$body" | mail -s "$subject" -r "$EMAIL_FROM" "$EMAIL_TO" 2>/dev/null || {
            log_error "Failed to send email notification"
        }
    fi
}

cleanup_on_error() {
    log_error "Backup failed. Cleaning up..."
    if [ -f "$BACKUP_FILE" ]; then
        rm -f "$BACKUP_FILE"
        log_info "Removed incomplete backup file"
    fi
    send_notification "La Tanda Backup Failed" "Database backup failed at $(date). Check logs at $LOG_FILE"
    exit 1
}

# ============================================================================
# INITIALIZATION
# ============================================================================

trap cleanup_on_error ERR

mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

log_info "=========================================="
log_info "Starting La Tanda Database Backup"
log_info "=========================================="
log_info "Database: $DB_NAME"
log_info "Backup file: $BACKUP_FILE"
log_info "Retention: $RETENTION_DAYS days"

# ============================================================================
# BACKUP DATABASE
# ============================================================================

log_info "Creating database dump..."

if [ -n "$DB_PASSWORD" ]; then
    export PGPASSWORD="$DB_PASSWORD"
fi

pg_dump -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=plain \
        --no-owner \
        --no-acl \
        --verbose \
        2>> "$LOG_FILE" | gzip > "$BACKUP_FILE"

if [ -n "$DB_PASSWORD" ]; then
    unset PGPASSWORD
fi

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file was not created"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log_success "Database backup completed successfully"
log_info "Backup size: $BACKUP_SIZE"

# ============================================================================
# CLOUD UPLOAD
# ============================================================================

if [ "$ENABLE_CLOUD_UPLOAD" = "true" ]; then
    log_info "Uploading backup to cloud storage..."
    
    if [ "$CLOUD_PROVIDER" = "s3" ]; then
        if [ -z "$S3_BUCKET" ]; then
            log_error "S3_BUCKET not configured"
        else
            log_info "Uploading to AWS S3: s3://${S3_BUCKET}/backups/"
            
            if command -v aws &> /dev/null; then
                aws s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/backups/" \
                    --region "$S3_REGION" \
                    --storage-class STANDARD_IA \
                    2>> "$LOG_FILE"
                
                if [ $? -eq 0 ]; then
                    log_success "Backup uploaded to S3 successfully"
                else
                    log_error "Failed to upload backup to S3"
                fi
            else
                log_error "AWS CLI not installed. Skipping S3 upload."
            fi
        fi
        
    elif [ "$CLOUD_PROVIDER" = "gcs" ]; then
        if [ -z "$GCS_BUCKET" ]; then
            log_error "GCS_BUCKET not configured"
        else
            log_info "Uploading to Google Cloud Storage: gs://${GCS_BUCKET}/backups/"
            
            if command -v gsutil &> /dev/null; then
                gsutil cp "$BACKUP_FILE" "gs://${GCS_BUCKET}/backups/" 2>> "$LOG_FILE"
                
                if [ $? -eq 0 ]; then
                    log_success "Backup uploaded to GCS successfully"
                else
                    log_error "Failed to upload backup to GCS"
                fi
            else
                log_error "gsutil not installed. Skipping GCS upload."
            fi
        fi
    else
        log_error "Unknown cloud provider: $CLOUD_PROVIDER"
    fi
else
    log_info "Cloud upload disabled"
fi

# ============================================================================
# BACKUP ROTATION - Delete old backups
# ============================================================================

log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."

OLD_BACKUPS=$(find "$BACKUP_DIR" -name "latanda_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS)

if [ -n "$OLD_BACKUPS" ]; then
    echo "$OLD_BACKUPS" | while read -r old_backup; do
        log_info "Deleting old backup: $(basename "$old_backup")"
        rm -f "$old_backup"
    done
    
    DELETED_COUNT=$(echo "$OLD_BACKUPS" | wc -l)
    log_success "Deleted $DELETED_COUNT old backup(s)"
else
    log_info "No old backups to delete"
fi

REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "latanda_backup_*.sql.gz" -type f | wc -l)
log_info "Total backups retained: $REMAINING_BACKUPS"

# ============================================================================
# COMPLETION
# ============================================================================

END_TIME=$(date +"%Y-%m-%d %H:%M:%S")
log_info "=========================================="
log_success "Backup process completed successfully"
log_info "=========================================="
log_info "End time: $END_TIME"
log_info "Backup location: $BACKUP_FILE"
log_info "Backup size: $BACKUP_SIZE"

NOTIFICATION_BODY="La Tanda database backup completed successfully.

Database: $DB_NAME
Backup File: $BACKUP_FILE
Size: $BACKUP_SIZE
Time: $END_TIME
Retention: $RETENTION_DAYS days
Backups Retained: $REMAINING_BACKUPS

Cloud Upload: $ENABLE_CLOUD_UPLOAD"

if [ "$ENABLE_CLOUD_UPLOAD" = "true" ]; then
    NOTIFICATION_BODY="${NOTIFICATION_BODY}
Provider: $CLOUD_PROVIDER"
fi

send_notification "La Tanda Backup Successful" "$NOTIFICATION_BODY"

exit 0
