# La Tanda Database Backup & Restore Guide

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Backup Process](#backup-process)
- [Restore Process](#restore-process)
- [Cloud Storage Integration](#cloud-storage-integration)
- [Monitoring & Logs](#monitoring--logs)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)
- [FAQ](#faq)

---

## Overview

This automated backup system provides enterprise-grade database protection for La Tanda's PostgreSQL database. It includes automated daily backups, compression, intelligent rotation, cloud storage integration, and comprehensive logging.

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Backup System Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Cron Trigger (Daily 2:00 AM)                           │
│           ↓                                                  │
│  2. backup-database.sh                                      │
│           ↓                                                  │
│  3. PostgreSQL pg_dump                                      │
│           ↓                                                  │
│  4. Gzip Compression                                        │
│           ↓                                                  │
│  5. Save to /var/backups/latanda/                          │
│           ↓                                                  │
│  6. Upload to Cloud (Optional)                             │
│           ├─→ AWS S3                                        │
│           └─→ Google Cloud Storage                          │
│           ↓                                                  │
│  7. Rotate Old Backups (30 days)                           │
│           ↓                                                  │
│  8. Send Notification                                       │
│           ├─→ Email                                         │
│           └─→ Logs                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

✅ **Automated Daily Backups** - Runs automatically via cron at 2:00 AM  
✅ **Gzip Compression** - Reduces backup size by 80-90%  
✅ **30-Day Retention** - Automatically deletes backups older than 30 days  
✅ **Cloud Storage** - Optional upload to AWS S3 or Google Cloud Storage  
✅ **Email Notifications** - Success/failure alerts  
✅ **Comprehensive Logging** - Detailed logs for audit and debugging  
✅ **Error Handling** - Automatic cleanup on failure  
✅ **Easy Restore** - Simple one-command restore process  
✅ **Security** - Password protection and secure credential management  

---

## Prerequisites

### Required Software

1. **PostgreSQL Client Tools**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install postgresql-client
   
   # CentOS/RHEL
   sudo yum install postgresql
   
   # macOS
   brew install postgresql
   ```

2. **Gzip** (usually pre-installed)
   ```bash
   # Verify installation
   gzip --version
   ```

3. **Bash** (version 4.0 or higher)
   ```bash
   bash --version
   ```

### Optional Software (for cloud storage)

4. **AWS CLI** (for S3 upload)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install awscli
   
   # macOS
   brew install awscli
   
   # Or use pip
   pip install awscli
   ```

5. **Google Cloud SDK** (for GCS upload)
   ```bash
   # Follow instructions at:
   # https://cloud.google.com/sdk/docs/install
   ```

### System Requirements

- **Disk Space**: At least 2x your database size for backups
- **Memory**: Minimum 512MB RAM
- **Permissions**: Write access to backup and log directories
- **Network**: Internet connection (for cloud uploads)

---

## Quick Start

Get up and running in 5 minutes:

```bash
# 1. Navigate to the project directory
cd /path/to/la-tanda-web-main

# 2. Copy the environment template
cp env.backup.example .env.backup

# 3. Edit configuration with your database credentials
nano .env.backup

# 4. Make scripts executable
chmod +x scripts/*.sh

# 5. Test the system
./scripts/test-backup-system.sh

# 6. Set up automated backups
sudo ./scripts/setup-cron.sh

# 7. Run your first backup (optional - test immediately)
./scripts/backup-database.sh
```

---

## Installation

### Step 1: Clone or Update Repository

If you haven't already, ensure you have the latest version:

```bash
cd /path/to/la-tanda-web-main
git pull origin main
```

### Step 2: Set Up Directory Structure

The backup system will create these directories automatically, but you can create them manually:

```bash
# Create backup directory
sudo mkdir -p /var/backups/latanda
sudo chown $USER:$USER /var/backups/latanda

# Create log directory
sudo mkdir -p /var/log/latanda
sudo chown $USER:$USER /var/log/latanda
```

### Step 3: Make Scripts Executable

```bash
chmod +x scripts/backup-database.sh
chmod +x scripts/restore-database.sh
chmod +x scripts/setup-cron.sh
chmod +x scripts/test-backup-system.sh
chmod +x scripts/setup-cloud-storage.sh
```

### Step 4: Verify Installation

```bash
./scripts/test-backup-system.sh
```

This will check all prerequisites and configuration.

---

## Configuration

### Basic Configuration

1. **Copy the environment template:**
   ```bash
   cp env.backup.example .env.backup
   ```

2. **Edit the configuration file:**
   ```bash
   nano .env.backup
   ```

3. **Configure database settings:**
   ```bash
   # Database Configuration
   DB_NAME=latanda_db
   DB_USER=latanda_user
   DB_HOST=localhost
   DB_PORT=5432
   DB_PASSWORD=your_secure_password_here
   
   # Backup Configuration
   BACKUP_DIR=/var/backups/latanda
   RETENTION_DAYS=30
   LOG_DIR=/var/log/latanda
   ```

### Advanced Configuration

#### Custom Backup Location

```bash
# Use a different backup directory
BACKUP_DIR=/mnt/external-drive/backups/latanda
```

#### Custom Retention Period

```bash
# Keep backups for 60 days instead of 30
RETENTION_DAYS=60
```

#### Email Notifications

```bash
# Enable email notifications
ENABLE_EMAIL=true
EMAIL_TO=admin@latanda.com
EMAIL_FROM=backup@latanda.com
SMTP_SERVER=smtp.gmail.com
```

**Note:** Email notifications require a configured mail server (postfix, sendmail, or similar).

---

## Usage

### Manual Backup

Run a backup manually at any time:

```bash
./scripts/backup-database.sh
```

**Output:**
```
[2025-01-22 14:30:00] [INFO] ==========================================
[2025-01-22 14:30:00] [INFO] Starting La Tanda Database Backup
[2025-01-22 14:30:00] [INFO] ==========================================
[2025-01-22 14:30:00] [INFO] Database: latanda_db
[2025-01-22 14:30:00] [INFO] Backup file: /var/backups/latanda/latanda_backup_20250122_143000.sql.gz
[2025-01-22 14:30:00] [INFO] Retention: 30 days
[2025-01-22 14:30:00] [INFO] Creating database dump...
[2025-01-22 14:30:15] [SUCCESS] Database backup completed successfully
[2025-01-22 14:30:15] [INFO] Backup size: 45M
```

### Automated Backups

Set up automated daily backups:

```bash
sudo ./scripts/setup-cron.sh
```

This creates a cron job that runs daily at 2:00 AM.

**Verify cron job:**
```bash
crontab -l
```

**Expected output:**
```
0 2 * * * /path/to/scripts/backup-database.sh >> /var/log/latanda/cron.log 2>&1
```

### View Available Backups

```bash
ls -lh /var/backups/latanda/
```

**Example output:**
```
-rw-r--r-- 1 user user 45M Jan 22 02:00 latanda_backup_20250122_020000.sql.gz
-rw-r--r-- 1 user user 44M Jan 21 02:00 latanda_backup_20250121_020000.sql.gz
-rw-r--r-- 1 user user 46M Jan 20 02:00 latanda_backup_20250120_020000.sql.gz
```

---

## Backup Process

### What Happens During a Backup?

1. **Initialization**
   - Creates backup and log directories if they don't exist
   - Loads configuration from `.env.backup`
   - Sets up error handling and logging

2. **Database Dump**
   - Connects to PostgreSQL using configured credentials
   - Performs a complete database dump using `pg_dump`
   - Includes all tables, data, and schema (23 tables for latanda_db)

3. **Compression**
   - Compresses the SQL dump using gzip
   - Typically reduces size by 80-90%
   - Example: 500MB database → 50MB backup file

4. **Cloud Upload** (if enabled)
   - Uploads compressed backup to AWS S3 or Google Cloud Storage
   - Uses standard storage class for S3 (STANDARD_IA)
   - Maintains same filename in cloud storage

5. **Rotation**
   - Finds backups older than retention period (default: 30 days)
   - Deletes old backups to save disk space
   - Logs all deletions

6. **Notification**
   - Sends email notification (if configured)
   - Logs success/failure with details
   - Records backup size and timing

### Backup File Naming Convention

```
latanda_backup_YYYYMMDD_HHMMSS.sql.gz
```

**Example:**
```
latanda_backup_20250122_143000.sql.gz
  ↑              ↑        ↑
  |              |        └─ Time: 14:30:00 (2:30 PM)
  |              └────────── Date: 2025-01-22
  └───────────────────────── Prefix
```

---

## Restore Process

### Quick Restore

Restore from the most recent backup:

```bash
# 1. List available backups
ls -lh /var/backups/latanda/

# 2. Restore from a specific backup
./scripts/restore-database.sh /var/backups/latanda/latanda_backup_20250122_020000.sql.gz
```

### Step-by-Step Restore

#### Step 1: Identify the Backup

```bash
# List all backups with details
ls -lht /var/backups/latanda/

# Or use the restore script to see available backups
./scripts/restore-database.sh
```

#### Step 2: Stop Application (Recommended)

Before restoring, stop your application to prevent data inconsistency:

```bash
# Stop your Node.js application
pm2 stop la-tanda

# Or if using systemd
sudo systemctl stop latanda
```

#### Step 3: Run Restore

```bash
./scripts/restore-database.sh /var/backups/latanda/latanda_backup_20250122_020000.sql.gz
```

**You will be prompted for confirmation:**
```
[2025-01-22 15:00:00] [INFO] Starting database restore
[2025-01-22 15:00:00] [INFO] Backup file: /var/backups/latanda/latanda_backup_20250122_020000.sql.gz
[2025-01-22 15:00:00] [INFO] Target database: latanda_db
This will overwrite the current database. Are you sure? (yes/no):
```

Type `yes` to proceed.

#### Step 4: Verify Restore

```bash
# Connect to database
psql -U latanda_user -d latanda_db

# Check table count
\dt

# Verify data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM tandas;

# Exit
\q
```

#### Step 5: Restart Application

```bash
# Restart your application
pm2 restart la-tanda

# Or if using systemd
sudo systemctl start latanda
```

### Restore from Cloud Storage

If you need to restore from cloud storage:

#### From AWS S3:

```bash
# 1. Download backup from S3
aws s3 cp s3://your-bucket/backups/latanda_backup_20250122_020000.sql.gz /tmp/

# 2. Restore from downloaded file
./scripts/restore-database.sh /tmp/latanda_backup_20250122_020000.sql.gz
```

#### From Google Cloud Storage:

```bash
# 1. Download backup from GCS
gsutil cp gs://your-bucket/backups/latanda_backup_20250122_020000.sql.gz /tmp/

# 2. Restore from downloaded file
./scripts/restore-database.sh /tmp/latanda_backup_20250122_020000.sql.gz
```

### Emergency Restore Procedure

If the restore script fails, you can restore manually:

```bash
# 1. Set password (if needed)
export PGPASSWORD='your_password'

# 2. Drop existing database
dropdb -h localhost -U latanda_user latanda_db

# 3. Create new database
createdb -h localhost -U latanda_user latanda_db

# 4. Restore from backup
gunzip -c /var/backups/latanda/latanda_backup_20250122_020000.sql.gz | \
  psql -h localhost -U latanda_user -d latanda_db

# 5. Unset password
unset PGPASSWORD
```

---

## Cloud Storage Integration

### AWS S3 Setup

#### Step 1: Install AWS CLI

```bash
# Ubuntu/Debian
sudo apt-get install awscli

# macOS
brew install awscli

# Or use pip
pip install awscli
```

#### Step 2: Configure AWS Credentials

```bash
aws configure
```

**Enter your credentials:**
```
AWS Access Key ID: YOUR_ACCESS_KEY
AWS Secret Access Key: YOUR_SECRET_KEY
Default region name: us-east-1
Default output format: json
```

#### Step 3: Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://latanda-backups --region us-east-1

# Verify bucket
aws s3 ls
```

#### Step 4: Configure Backup System

Edit `.env.backup`:

```bash
ENABLE_CLOUD_UPLOAD=true
CLOUD_PROVIDER=s3
S3_BUCKET=latanda-backups
S3_REGION=us-east-1
```

#### Step 5: Test Upload

```bash
./scripts/backup-database.sh
```

Check the logs to verify upload:
```bash
tail -f /var/log/latanda/backup.log
```

### Google Cloud Storage Setup

#### Step 1: Install Google Cloud SDK

```bash
# Follow instructions at:
# https://cloud.google.com/sdk/docs/install
```

#### Step 2: Authenticate

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

#### Step 3: Create GCS Bucket

```bash
# Create bucket
gsutil mb -p YOUR_PROJECT_ID gs://latanda-backups

# Verify bucket
gsutil ls
```

#### Step 4: Configure Backup System

Edit `.env.backup`:

```bash
ENABLE_CLOUD_UPLOAD=true
CLOUD_PROVIDER=gcs
GCS_BUCKET=latanda-backups
```

#### Step 5: Test Upload

```bash
./scripts/backup-database.sh
```

### Cloud Storage Best Practices

1. **Use Lifecycle Policies**
   - Move old backups to cheaper storage tiers
   - Automatically delete very old backups

2. **Enable Versioning**
   - Protect against accidental deletion
   - Keep multiple versions of backups

3. **Set Up Access Controls**
   - Use IAM roles with minimal permissions
   - Enable bucket encryption

4. **Monitor Costs**
   - Set up billing alerts
   - Review storage usage monthly

5. **Test Restores**
   - Periodically download and test backups
   - Verify data integrity

### Cloud Storage Costs (Estimated)

**AWS S3 (us-east-1):**
- Storage: $0.023/GB/month (Standard-IA)
- Upload: Free
- Download: $0.01/GB

**Google Cloud Storage:**
- Storage: $0.020/GB/month (Nearline)
- Upload: Free
- Download: $0.01/GB

**Example:** 50GB of backups = ~$1-2/month

---

## Monitoring & Logs

### Log Files

The backup system maintains detailed logs:

```bash
# Main backup log
/var/log/latanda/backup.log

# Restore log
/var/log/latanda/restore.log

# Cron execution log
/var/log/latanda/cron.log
```

### View Recent Logs

```bash
# View last 50 lines of backup log
tail -n 50 /var/log/latanda/backup.log

# Follow backup log in real-time
tail -f /var/log/latanda/backup.log

# Search for errors
grep ERROR /var/log/latanda/backup.log

# View today's backups
grep "$(date +%Y-%m-%d)" /var/log/latanda/backup.log
```

### Log Format

```
[YYYY-MM-DD HH:MM:SS] [LEVEL] Message
```

**Example:**
```
[2025-01-22 02:00:00] [INFO] Starting La Tanda Database Backup
[2025-01-22 02:00:15] [SUCCESS] Database backup completed successfully
[2025-01-22 02:00:20] [INFO] Backup uploaded to S3 successfully
```

### Monitoring Checklist

Daily:
- [ ] Check if backup ran successfully
- [ ] Verify backup file was created
- [ ] Check log for errors

Weekly:
- [ ] Review backup sizes (watch for unusual growth)
- [ ] Verify cloud uploads (if enabled)
- [ ] Check disk space usage

Monthly:
- [ ] Test a restore procedure
- [ ] Review retention policy
- [ ] Audit access logs
- [ ] Review cloud storage costs

### Automated Monitoring

Set up monitoring alerts using cron:

```bash
# Add to crontab
0 3 * * * /path/to/scripts/check-backup-status.sh
```

Create a simple monitoring script:

```bash
#!/bin/bash
# check-backup-status.sh

BACKUP_DIR="/var/backups/latanda"
TODAY=$(date +%Y%m%d)

if ls ${BACKUP_DIR}/latanda_backup_${TODAY}_*.sql.gz 1> /dev/null 2>&1; then
    echo "✓ Backup successful for $(date +%Y-%m-%d)"
else
    echo "✗ No backup found for $(date +%Y-%m-%d)" | mail -s "ALERT: Backup Missing" admin@latanda.com
fi
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Permission Denied

**Error:**
```
mkdir: cannot create directory '/var/backups/latanda': Permission denied
```

**Solution:**
```bash
# Create directories with proper permissions
sudo mkdir -p /var/backups/latanda /var/log/latanda
sudo chown $USER:$USER /var/backups/latanda /var/log/latanda
```

#### Issue 2: pg_dump Command Not Found

**Error:**
```
pg_dump: command not found
```

**Solution:**
```bash
# Install PostgreSQL client tools
# Ubuntu/Debian
sudo apt-get install postgresql-client

# CentOS/RHEL
sudo yum install postgresql

# macOS
brew install postgresql
```

#### Issue 3: Authentication Failed

**Error:**
```
pg_dump: error: connection to server failed: FATAL: password authentication failed
```

**Solution:**
```bash
# Check your .env.backup file
nano .env.backup

# Verify credentials
DB_PASSWORD=your_correct_password

# Test connection manually
psql -h localhost -U latanda_user -d latanda_db
```

#### Issue 4: Disk Space Full

**Error:**
```
gzip: write error: No space left on device
```

**Solution:**
```bash
# Check disk space
df -h

# Clean up old backups manually
rm /var/backups/latanda/latanda_backup_2024*.sql.gz

# Reduce retention period in .env.backup
RETENTION_DAYS=15
```

#### Issue 5: Cron Job Not Running

**Problem:** Backups not running automatically

**Solution:**
```bash
# Check if cron service is running
sudo systemctl status cron

# Start cron if stopped
sudo systemctl start cron

# Verify cron job exists
crontab -l

# Check cron logs
grep CRON /var/log/syslog

# Re-run setup
./scripts/setup-cron.sh
```

#### Issue 6: Cloud Upload Fails

**Error:**
```
Failed to upload backup to S3
```

**Solution:**
```bash
# Test AWS credentials
aws s3 ls

# Reconfigure AWS
aws configure

# Check bucket permissions
aws s3api get-bucket-acl --bucket your-bucket-name

# Test manual upload
aws s3 cp /var/backups/latanda/test.txt s3://your-bucket/
```

#### Issue 7: Backup File Corrupted

**Error during restore:**
```
gzip: stdin: invalid compressed data--format violated
```

**Solution:**
```bash
# Test backup file integrity
gunzip -t /var/backups/latanda/latanda_backup_20250122_020000.sql.gz

# If corrupted, use a different backup
ls -lht /var/backups/latanda/

# Download from cloud if available
aws s3 cp s3://your-bucket/backups/latanda_backup_20250121_020000.sql.gz /tmp/
```

### Debug Mode

Run backup script with verbose output:

```bash
# Enable debug mode
bash -x ./scripts/backup-database.sh
```

### Getting Help

If you encounter issues not covered here:

1. Check the logs: `/var/log/latanda/backup.log`
2. Run the test script: `./scripts/test-backup-system.sh`
3. Review PostgreSQL logs: `/var/log/postgresql/`
4. Search GitHub issues: [La Tanda Repository](https://github.com/your-repo)
5. Contact support: support@latanda.com

---

## Security Best Practices

### 1. Protect Configuration Files

```bash
# Set restrictive permissions on .env.backup
chmod 600 .env.backup

# Ensure only owner can read
ls -l .env.backup
# Should show: -rw------- 1 user user
```

### 2. Secure Backup Files

```bash
# Set permissions on backup directory
chmod 700 /var/backups/latanda

# Encrypt backups (optional)
# Add to backup script:
gpg --encrypt --recipient admin@latanda.com backup.sql.gz
```

### 3. Use PostgreSQL .pgpass File

Instead of storing passwords in `.env.backup`, use `.pgpass`:

```bash
# Create .pgpass file
echo "localhost:5432:latanda_db:latanda_user:your_password" > ~/.pgpass
chmod 600 ~/.pgpass

# Remove DB_PASSWORD from .env.backup
```

### 4. Rotate Cloud Storage Credentials

```bash
# Rotate AWS credentials every 90 days
aws iam create-access-key --user-name backup-user

# Update credentials
aws configure
```

### 5. Enable Audit Logging

```bash
# Log all backup operations
# Already included in backup-database.sh

# Review logs regularly
grep -i "backup\|restore" /var/log/latanda/*.log
```

### 6. Restrict Network Access

```bash
# If database is on remote server, use SSH tunnel
ssh -L 5432:localhost:5432 user@db-server

# Or configure PostgreSQL pg_hba.conf to allow only specific IPs
```

### 7. Test Disaster Recovery

```bash
# Quarterly disaster recovery drill:
# 1. Simulate data loss
# 2. Restore from backup
# 3. Verify data integrity
# 4. Document time to recover
```

### 8. Implement Backup Verification

Add checksum verification:

```bash
# Generate checksum after backup
sha256sum backup.sql.gz > backup.sql.gz.sha256

# Verify before restore
sha256sum -c backup.sql.gz.sha256
```

---

## FAQ

### General Questions

**Q: How long does a backup take?**  
A: Typically 1-5 minutes for databases under 1GB. Larger databases may take 10-30 minutes. The exact time depends on database size, server performance, and compression speed.

**Q: How much disk space do I need?**  
A: Plan for at least 2x your database size. For example, if your database is 500MB, compressed backups will be ~50MB each. With 30 days retention, you'll need ~1.5GB.

**Q: Can I change the backup schedule?**  
A: Yes. Edit the cron job:
```bash
crontab -e
# Change: 0 2 * * * to your preferred time
# Example for 3:30 AM: 30 3 * * *
```

**Q: Can I run multiple backups per day?**  
A: Yes. Add multiple cron entries:
```bash
0 2 * * * /path/to/backup-database.sh   # 2:00 AM
0 14 * * * /path/to/backup-database.sh  # 2:00 PM
```

**Q: What happens if a backup fails?**  
A: The script will:
- Log the error
- Clean up incomplete backup files
- Send email notification (if configured)
- Exit with error code

**Q: Can I backup specific tables only?**  
A: Yes. Modify the pg_dump command in `backup-database.sh`:
```bash
pg_dump -t users -t tandas -t transactions ...
```

### Restore Questions

**Q: How long does a restore take?**  
A: Usually 2-10 minutes for databases under 1GB. Larger databases may take 20-60 minutes.

**Q: Will restore overwrite my current database?**  
A: Yes. The restore script drops the existing database and creates a new one. Always backup current data before restoring.

**Q: Can I restore to a different database name?**  
A: Yes. Edit the restore script or specify manually:
```bash
gunzip -c backup.sql.gz | psql -d different_db_name
```

**Q: Can I restore specific tables only?**  
A: Yes, but it requires manual extraction:
```bash
# Extract specific table
gunzip -c backup.sql.gz | grep -A 10000 "CREATE TABLE users" > users.sql
psql -d latanda_db -f users.sql
```

### Cloud Storage Questions

**Q: Is cloud storage required?**  
A: No, it's optional. Local backups are sufficient for many use cases. Cloud storage provides additional protection against server failure.

**Q: Which cloud provider should I use?**  
A: Both AWS S3 and Google Cloud Storage are excellent. Choose based on:
- Your existing cloud infrastructure
- Cost preferences
- Geographic requirements

**Q: How much does cloud storage cost?**  
A: For 50GB of backups:
- AWS S3: ~$1.15/month
- Google Cloud Storage: ~$1.00/month

**Q: Can I use both S3 and GCS?**  
A: Not simultaneously with the current script, but you can modify it to upload to both providers.

### Security Questions

**Q: Are backups encrypted?**  
A: Backups are compressed but not encrypted by default. For encryption, add GPG encryption to the backup script or use cloud provider encryption.

**Q: Who can access the backups?**  
A: Only users with file system access to `/var/backups/latanda/` and cloud storage credentials can access backups.

**Q: How do I secure my database password?**  
A: Use PostgreSQL's `.pgpass` file instead of storing passwords in `.env.backup`. See [Security Best Practices](#security-best-practices).

**Q: Should I backup the backup scripts?**  
A: Yes, keep the scripts in version control (Git). The `.env.backup` file should NOT be committed to Git.

### Troubleshooting Questions

**Q: Backup script fails with "command not found"**  
A: Install required tools:
```bash
sudo apt-get install postgresql-client gzip
```

**Q: How do I view backup logs?**  
A: 
```bash
tail -f /var/log/latanda/backup.log
```

**Q: Cron job not running?**  
A: Check cron service and verify job:
```bash
sudo systemctl status cron
crontab -l
```

**Q: How do I test the backup system?**  
A: Run the test script:
```bash
./scripts/test-backup-system.sh
```

---

## Summary

You now have a complete, production-ready database backup system for La Tanda with:

✅ **Automated daily backups** via cron  
✅ **Gzip compression** reducing storage by 80-90%  
✅ **30-day rotation** automatically cleaning old backups  
✅ **Cloud storage integration** for AWS S3 and Google Cloud Storage  
✅ **Email notifications** for success/failure alerts  
✅ **Comprehensive logging** for audit and debugging  
✅ **Easy restore process** with one-command recovery  
✅ **Security best practices** for protecting sensitive data  

### Quick Reference Commands

```bash
# Run manual backup
./scripts/backup-database.sh

# Set up automated backups
sudo ./scripts/setup-cron.sh

# Test backup system
./scripts/test-backup-system.sh

# List available backups
ls -lh /var/backups/latanda/

# Restore from backup
./scripts/restore-database.sh /var/backups/latanda/latanda_backup_YYYYMMDD_HHMMSS.sql.gz

# View logs
tail -f /var/log/latanda/backup.log

# Set up cloud storage
./scripts/setup-cloud-storage.sh
```

### Support

For issues, questions, or contributions:
- **GitHub Issues**: [La Tanda Repository Issues](https://github.com/your-repo/issues)
- **Email**: support@latanda.com
- **Documentation**: This guide

---

**Version:** 1.0.0  
**Last Updated:** January 22, 2025  
**Maintainer:** La Tanda Development Team