#!/bin/bash

################################################################################
# Azure PostgreSQL Container Instance Setup Script
################################################################################
#
# This script creates a PostgreSQL 15 database using Azure Container Instances
# for the HRSA PPRS application.
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - Appropriate permissions on the Azure subscription
#
# Usage:
#   ./setup-postgres.sh
#
################################################################################

set -e  # Exit on error

# Configuration
RESOURCE_GROUP="RG-OpenSourcePOC"
CONTAINER_NAME="rei-pprs-db"
DNS_LABEL="rei-pprs-db"
LOCATION="eastus"
POSTGRES_IMAGE="postgres:17"
POSTGRES_USER="admin"
POSTGRES_PASSWORD="<YOUR_PASSWORD_HERE>"  # Replace with your actual password
POSTGRES_DB="rei_pprs_dev"
CPU="1"
MEMORY="2"
PORT="5432"

echo "=================================="
echo "PostgreSQL Container Setup"
echo "=================================="
echo ""
echo "Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Container Name: $CONTAINER_NAME"
echo "  Location: $LOCATION"
echo "  Database: $POSTGRES_DB"
echo "  Username: $POSTGRES_USER"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Error: Azure CLI is not installed"
    echo "   Install from: https://aka.ms/installazurecliwindows"
    exit 1
fi

# Check if logged in to Azure
echo "Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "❌ Error: Not logged in to Azure"
    echo "   Run: az login"
    exit 1
fi

echo "✅ Azure CLI authenticated"
echo ""

# Check if password has been set
if [ "$POSTGRES_PASSWORD" = "<YOUR_PASSWORD_HERE>" ]; then
    echo "❌ Error: Please set POSTGRES_PASSWORD in the script"
    echo "   Edit the script and replace <YOUR_PASSWORD_HERE> with your actual password"
    exit 1
fi

echo "✅ Password configured"
echo ""

# Create PostgreSQL Container Instance
echo "Creating PostgreSQL Container Instance..."
echo "This may take 1-2 minutes..."
echo ""

az container create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER_NAME" \
  --image "$POSTGRES_IMAGE" \
  --dns-name-label "$DNS_LABEL" \
  --ports "$PORT" \
  --os-type Linux \
  --cpu "$CPU" \
  --memory "$MEMORY" \
  --environment-variables \
    POSTGRES_USER="$POSTGRES_USER" \
    POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    POSTGRES_DB="$POSTGRES_DB" \
  --location "$LOCATION"

echo ""
echo "Waiting for container to start..."
sleep 30

# Get connection details
echo ""
echo "Retrieving connection details..."
FQDN=$(az container show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER_NAME" \
  --query ipAddress.fqdn \
  --output tsv)

IP=$(az container show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER_NAME" \
  --query ipAddress.ip \
  --output tsv)

echo ""
echo "=================================="
echo "✅ PostgreSQL Container Created!"
echo "=================================="
echo ""
echo "Connection Details:"
echo "-------------------"
echo "  Host: $FQDN"
echo "  IP Address: $IP"
echo "  Port: $PORT"
echo "  Database: $POSTGRES_DB"
echo "  Username: $POSTGRES_USER"
echo "  Password: $POSTGRES_PASSWORD"
echo ""
echo "Connection String:"
echo "-------------------"
echo "  postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$FQDN:$PORT/$POSTGRES_DB"
echo ""
echo "Test Connection:"
echo "-------------------"
echo "  psql -h $FQDN -p $PORT -U $POSTGRES_USER -d $POSTGRES_DB"
echo ""
echo "Backend .env Configuration:"
echo "-------------------"
echo "  AZURE_DB_HOST=$FQDN"
echo "  AZURE_DB_USER=$POSTGRES_USER"
echo "  AZURE_DB_PASSWORD=$POSTGRES_PASSWORD"
echo "  AZURE_DB_NAME=$POSTGRES_DB"
echo "  AZURE_DB_PORT=$PORT"
echo ""
echo "Next Steps:"
echo "-------------------"
echo "  1. Update backend/.env with the connection details above"
echo "  2. Initialize database tables:"
echo "     cd backend"
echo "     python database/init_db.py"
echo "     python database/seed_data.py"
echo "     psql \"postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$FQDN:$PORT/$POSTGRES_DB\" -f scripts/init_static_data.sql"
echo ""
