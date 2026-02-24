module.exports = {
  apps: [{
    name: "latanda-api",
    script: "./integrated-api-complete-95-endpoints.js",
    cwd: "/var/www/latanda.online",
    
    // Cluster mode - 2 instances for 2 CPU cores
    instances: 2,
    exec_mode: "cluster",
    node_args: "--max-old-space-size=384",
    
    // Environment
    env: {
      NODE_ENV: "production",
      PORT: 3002,
      TF_ENABLE_ONEDNN_OPTS: "0"  // Silence TensorFlow warnings
    },
    
    // Memory & restart management
    max_memory_restart: "500M",
    min_uptime: "10s",
    max_restarts: 10,
    restart_delay: 4000,
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Logs
    error_file: "/var/www/latanda.online/logs/pm2-error.log",
    out_file: "/var/www/latanda.online/logs/pm2-out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true,
    
    // Monitoring
    instance_var: "INSTANCE_ID",
    
    // Auto-restart on file changes (disabled in production)
    watch: false,
    ignore_watch: ["node_modules", "logs", "*.log", "uploads", "kyc-images", "receipts"]
  }]
};
