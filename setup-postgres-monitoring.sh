#!/bin/bash

# PostgreSQL Performance Monitoring Setup
# Week 3-4: PostgreSQL Migration

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           PostgreSQL Performance Monitoring Setup                         ║${NC}"
echo -e "${CYAN}║                  Week 3-4: PostgreSQL Migration                           ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check PostgreSQL config location
PG_CONF=$(PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production \
    -t -c "SHOW config_file;" 2>/dev/null | xargs)

echo -e "${BLUE}PostgreSQL Config: ${PG_CONF}${NC}"
echo ""

# Step 1: Enable slow query logging
echo -e "${YELLOW}=== Step 1: Checking Slow Query Logging ===${NC}"
echo ""

SLOW_QUERY_STATUS=$(PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production \
    -t -c "SHOW log_min_duration_statement;" 2>/dev/null | xargs)

echo "Current log_min_duration_statement: ${SLOW_QUERY_STATUS}"

if [ "$SLOW_QUERY_STATUS" == "-1" ]; then
    echo -e "${YELLOW}⚠ Slow query logging is DISABLED${NC}"
    echo ""
    echo "To enable, add to postgresql.conf:"
    echo "  log_min_duration_statement = 1000  # Log queries taking > 1 second"
    echo "  log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '"
    echo "  log_directory = 'pg_log'"
    echo "  log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'"
    echo "  logging_collector = on"
else
    echo -e "${GREEN}✅ Slow query logging is ENABLED (${SLOW_QUERY_STATUS}ms threshold)${NC}"
fi

echo ""

# Step 2: Check logging configuration
echo -e "${YELLOW}=== Step 2: Current Logging Configuration ===${NC}"
echo ""

PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production << 'SQL'
SELECT 
    name,
    setting,
    unit,
    short_desc
FROM pg_settings
WHERE name IN (
    'log_min_duration_statement',
    'log_connections',
    'log_disconnections',
    'log_duration',
    'log_statement',
    'logging_collector',
    'log_directory',
    'log_filename'
)
ORDER BY name;
SQL

echo ""

# Step 3: Check connection pool stats
echo -e "${YELLOW}=== Step 3: Current Connection Statistics ===${NC}"
echo ""

PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production << 'SQL'
SELECT 
    COUNT(*) as total_connections,
    COUNT(*) FILTER (WHERE state = 'active') as active,
    COUNT(*) FILTER (WHERE state = 'idle') as idle,
    COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity
WHERE datname = 'latanda_production';
SQL

echo ""

# Step 4: Database size and table statistics
echo -e "${YELLOW}=== Step 4: Database Statistics ===${NC}"
echo ""

PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production << 'SQL'
SELECT 
    pg_size_pretty(pg_database_size('latanda_production')) as database_size;

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
SQL

echo ""

# Step 5: Create monitoring queries
echo -e "${YELLOW}=== Step 5: Creating Monitoring Queries ===${NC}"
echo ""

cat > /var/www/latanda.online/pg-monitor-queries.sql << 'QUERIES'
-- PostgreSQL Monitoring Queries
-- Run these periodically to monitor performance

-- 1. Active queries
SELECT 
    pid,
    usename,
    application_name,
    state,
    query_start,
    NOW() - query_start as duration,
    query
FROM pg_stat_activity
WHERE state != 'idle'
AND datname = 'latanda_production'
ORDER BY query_start;

-- 2. Slow queries (if logging enabled)
-- Check log files in $PGDATA/pg_log/

-- 3. Table bloat and statistics
SELECT
    schemaname,
    tablename,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- 4. Index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 5. Database size growth
SELECT
    pg_size_pretty(pg_database_size('latanda_production')) as current_size;

-- 6. Connection pool utilization
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE state = 'active') as active,
    COUNT(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
WHERE datname = 'latanda_production';
QUERIES

echo -e "${GREEN}✅ Monitoring queries saved to: /var/www/latanda.online/pg-monitor-queries.sql${NC}"
echo ""

# Step 6: Create simple monitoring script
cat > /var/www/latanda.online/pg-quick-stats.sh << 'STATS'
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
STATS

chmod +x /var/www/latanda.online/pg-quick-stats.sh
echo -e "${GREEN}✅ Quick stats script created: /var/www/latanda.online/pg-quick-stats.sh${NC}"
echo ""

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    MONITORING SETUP COMPLETE                              ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}Quick Commands:${NC}"
echo "  ./pg-quick-stats.sh                    - Quick statistics"
echo "  psql ... -f pg-monitor-queries.sql     - Run all monitoring queries"
echo ""
