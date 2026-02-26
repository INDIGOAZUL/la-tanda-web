#!/bin/bash
# Quick PostgreSQL statistics

echo "=== PostgreSQL Quick Stats ==="
echo ""

PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production -c "
SELECT 
    'Database Size' as metric,
    pg_size_pretty(pg_database_size('latanda_production')) as value
UNION ALL
SELECT 
    'Total Connections',
    COUNT(*)::text
FROM pg_stat_activity
WHERE datname = 'latanda_production'
UNION ALL
SELECT
    'Active Queries',
    COUNT(*)::text
FROM pg_stat_activity
WHERE datname = 'latanda_production' AND state = 'active'
UNION ALL
SELECT
    'Total Users',
    COUNT(*)::text
FROM users
UNION ALL
SELECT
    'Total Groups',
    COUNT(*)::text
FROM groups;
"
