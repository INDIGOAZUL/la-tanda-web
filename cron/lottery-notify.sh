#!/bin/bash
# Lottery subscription notifications cron wrapper
# Reads INTERNAL_API_KEY from .env at runtime (not hardcoded)
source <(grep INTERNAL_API_KEY /var/www/latanda.online/.env)
curl -s -X POST 'http://localhost:3002/api/lottery/cron/subscription-notifications'   -H "x-internal-api-key: ${INTERNAL_API_KEY}"   >> /var/log/lottery-notifications.log 2>&1
