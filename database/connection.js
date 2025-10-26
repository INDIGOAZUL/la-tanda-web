/**
 * PostgreSQL Database Connection for La Tanda
 * Production-ready database connection with pool management
 */

const { Pool } = require('pg');
const winston = require('winston');

// Configure logger for database
const dbLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'latanda-database' },
    transports: [
        new winston.transports.File({ filename: 'logs/database.log' }),
        new winston.transports.Console()
    ]
});

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'latanda_production',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    
    // Connection pool settings
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    
    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
};

// Create connection pool
const pool = new Pool(dbConfig);

// Pool event handlers
pool.on('connect', (client) => {
    dbLogger.info('New database client connected', {
        processId: client.processID,
        timestamp: new Date().toISOString()
    });
});

pool.on('error', (err, client) => {
    dbLogger.error('Database pool error', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });
});

pool.on('remove', (client) => {
    dbLogger.info('Database client removed from pool', {
        processId: client.processID,
        timestamp: new Date().toISOString()
    });
});

// Database utility functions
class Database {
    constructor() {
        this.pool = pool;
        this.logger = dbLogger;
    }

    /**
     * Execute a query with parameters
     * @param {string} text - SQL query text
     * @param {Array} params - Query parameters
     * @returns {Promise<Object>} Query result
     */
    async query(text, params = []) {
        const start = Date.now();
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(text, params);
            const duration = Date.now() - start;
            
            this.logger.debug('Database query executed', {
                query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                duration: `${duration}ms`,
                rows: result.rowCount,
                timestamp: new Date().toISOString()
            });
            
            return result;
        } catch (error) {
            const duration = Date.now() - start;
            
            this.logger.error('Database query failed', {
                query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                error: error.message,
                duration: `${duration}ms`,
                params: params.length,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Execute a transaction
     * @param {Function} callback - Transaction callback function
     * @returns {Promise<any>} Transaction result
     */
    async transaction(callback) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            
            this.logger.info('Database transaction completed successfully');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            
            this.logger.error('Database transaction failed, rolled back', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Test database connection
     * @returns {Promise<boolean>} Connection status
     */
    async testConnection() {
        try {
            const result = await this.query('SELECT NOW() as current_time, version() as pg_version');
            
            this.logger.info('Database connection test successful', {
                currentTime: result.rows[0].current_time,
                pgVersion: result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1],
                timestamp: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            this.logger.error('Database connection test failed', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            return false;
        }
    }

    /**
     * Get database statistics
     * @returns {Promise<Object>} Database stats
     */
    async getStats() {
        try {
            const queries = [
                'SELECT COUNT(*) as total_users FROM users',
                'SELECT COUNT(*) as total_groups FROM groups',
                'SELECT COUNT(*) as total_contributions FROM contributions',
                'SELECT COUNT(*) as total_transactions FROM transactions'
            ];

            const results = await Promise.all(
                queries.map(query => this.query(query))
            );

            return {
                users: parseInt(results[0].rows[0].total_users),
                groups: parseInt(results[1].rows[0].total_groups),
                contributions: parseInt(results[2].rows[0].total_contributions),
                transactions: parseInt(results[3].rows[0].total_transactions),
                poolStats: {
                    totalCount: this.pool.totalCount,
                    idleCount: this.pool.idleCount,
                    waitingCount: this.pool.waitingCount
                }
            };
        } catch (error) {
            this.logger.error('Failed to get database stats', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Close all database connections
     * @returns {Promise<void>}
     */
    async close() {
        try {
            await this.pool.end();
            this.logger.info('Database connection pool closed successfully');
        } catch (error) {
            this.logger.error('Error closing database connection pool', {
                error: error.message
            });
            throw error;
        }
    }
}

// Create and export database instance
const db = new Database();

// Test connection on startup
db.testConnection().then(success => {
    if (success) {
        console.log('✅ PostgreSQL database connected successfully');
    } else {
        console.error('❌ PostgreSQL database connection failed');
        process.exit(1);
    }
}).catch(error => {
    console.error('❌ Database initialization error:', error.message);
    process.exit(1);
});

module.exports = db;