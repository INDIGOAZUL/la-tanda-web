module.exports = {
  apps: [{
    name: 'n8n',
    script: 'npm',
    args: 'start',
    cwd: '/home/ebanksnigel/n8n-local',
    env: {
      N8N_ENCRYPTION_KEY: 'KxHUHsA8hPT5mrErp0hSp94h+NwcX3uU',
      NODE_ENV: 'production',
      N8N_RUNNERS_ENABLED: 'true',
      N8N_HOST: 'localhost',
      N8N_PORT: 5678,
      N8N_PROTOCOL: 'http',
      N8N_WEB_HOOK_URL: 'https://n8n.latanda.online',
      N8N_TRUST_PROXY: 'true',  // Added to fix the X-Forwarded-For error
      // Security settings
      N8N_USER_MANAGEMENT_DISABLED: 'false',
      N8N_BASIC_AUTH_ACTIVE: 'true',
      N8N_DIAGNOSTICS_ENABLED: 'false',
      // Database configuration (PostgreSQL)
      DB_TYPE: 'postgresdb',
      DB_POSTGRESDB_DATABASE: 'latanda_db',
      DB_POSTGRESDB_HOST: 'localhost',
      DB_POSTGRESDB_PORT: '5432',
      DB_POSTGRESDB_USER: 'latanda',
      DB_POSTGRESDB_PASSWORD: 'latanda123',
    },
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
};