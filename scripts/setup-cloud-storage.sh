#!/bin/bash

################################################################################
# Cloud Storage Setup Helper for La Tanda Backups
#
# This script helps configure AWS S3 or Google Cloud Storage
#
# Author: La Tanda Development Team
# Version: 1.0.0
################################################################################

set -euo pipefail

echo "=========================================="
echo "La Tanda Cloud Storage Setup"
echo "=========================================="
echo ""
echo "Choose your cloud provider:"
echo "1) AWS S3"
echo "2) Google Cloud Storage"
echo "3) Skip cloud storage"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Setting up AWS S3..."
        echo ""
        
        if ! command -v aws &> /dev/null; then
            echo "AWS CLI is not installed."
            echo ""
            echo "Install AWS CLI:"
            echo "  Ubuntu/Debian: sudo apt-get install awscli"
            echo "  macOS: brew install awscli"
            echo "  Or visit: https://aws.amazon.com/cli/"
            echo ""
            exit 1
        fi
        
        echo "AWS CLI found!"
        echo ""
        echo "Configure AWS credentials:"
        aws configure
        
        echo ""
        read -p "Enter S3 bucket name: " bucket_name
        read -p "Enter AWS region (default: us-east-1): " region
        region=${region:-us-east-1}
        
        echo ""
        echo "Creating S3 bucket if it doesn't exist..."
        aws s3 mb "s3://${bucket_name}" --region "$region" 2>/dev/null || echo "Bucket already exists or error occurred"
        
        echo ""
        echo "Add these lines to your .env.backup file:"
        echo ""
        echo "ENABLE_CLOUD_UPLOAD=true"
        echo "CLOUD_PROVIDER=s3"
        echo "S3_BUCKET=${bucket_name}"
        echo "S3_REGION=${region}"
        echo ""
        ;;
        
    2)
        echo ""
        echo "Setting up Google Cloud Storage..."
        echo ""
        
        if ! command -v gsutil &> /dev/null; then
            echo "gsutil is not installed."
            echo ""
            echo "Install Google Cloud SDK:"
            echo "  Visit: https://cloud.google.com/sdk/docs/install"
            echo ""
            exit 1
        fi
        
        echo "gsutil found!"
        echo ""
        echo "Authenticate with Google Cloud:"
        gcloud auth login
        
        echo ""
        read -p "Enter GCS bucket name: " bucket_name
        read -p "Enter project ID: " project_id
        
        echo ""
        echo "Creating GCS bucket if it doesn't exist..."
        gsutil mb -p "$project_id" "gs://${bucket_name}" 2>/dev/null || echo "Bucket already exists or error occurred"
        
        echo ""
        echo "Add these lines to your .env.backup file:"
        echo ""
        echo "ENABLE_CLOUD_UPLOAD=true"
        echo "CLOUD_PROVIDER=gcs"
        echo "GCS_BUCKET=${bucket_name}"
        echo ""
        ;;
        
    3)
        echo ""
        echo "Skipping cloud storage setup."
        echo "You can configure it later by editing .env.backup"
        echo ""
        ;;
        
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo "=========================================="
echo "Setup complete!"
echo "=========================================="
