#!/bin/bash
# La Tanda Web3 - Completed File Backup Script
# Usage: ./backup-completed-file.sh filename.html

if [ $# -eq 0 ]; then
    echo "Usage: $0 <filename.html>"
    echo "Example: $0 home-dashboard.html"
    exit 1
fi

FILENAME=$1
BACKUP_DIR="./backups/completed"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
if [ -f "$FILENAME" ]; then
    cp "$FILENAME" "$BACKUP_DIR/${FILENAME}.backup"
    echo "✅ Backup created: $BACKUP_DIR/${FILENAME}.backup"
    
    # Also create timestamped version for history
    cp "$FILENAME" "$BACKUP_DIR/${FILENAME}_${TIMESTAMP}.backup"
    echo "✅ Timestamped backup: $BACKUP_DIR/${FILENAME}_${TIMESTAMP}.backup"
    
    # Update file permissions (read-only backup)
    chmod 444 "$BACKUP_DIR/${FILENAME}.backup"
    chmod 444 "$BACKUP_DIR/${FILENAME}_${TIMESTAMP}.backup"
    echo "🔒 Backup files protected (read-only)"
    
else
    echo "❌ Error: File '$FILENAME' not found"
    exit 1
fi

echo "📋 Don't forget to update SYSTEM-COMPLETION-RECORD.md"