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
