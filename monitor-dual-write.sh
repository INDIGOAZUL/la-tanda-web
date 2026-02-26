#!/bin/bash

# Real-time Dual-Write Monitoring Script
# Week 3-4: PostgreSQL Migration
# 
# Monitors new registrations and validates dual-write behavior

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/dual-write-monitor.log"
CHECK_INTERVAL=10  # seconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        INFO)    echo -e "${BLUE}[INFO]${NC} ${timestamp} - ${message}" | tee -a "$LOG_FILE" ;;
        SUCCESS) echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} - ${message}" | tee -a "$LOG_FILE" ;;
        WARNING) echo -e "${YELLOW}[WARNING]${NC} ${timestamp} - ${message}" | tee -a "$LOG_FILE" ;;
        ERROR)   echo -e "${RED}[ERROR]${NC} ${timestamp} - ${message}" | tee -a "$LOG_FILE" ;;
    esac
}

get_pg_user_count() {
    PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production \
        -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs
}

get_json_user_count() {
    node -e "
        const fs = require('fs');
        const db = JSON.parse(fs.readFileSync('/var/www/latanda.online/database.json', 'utf8'));
        console.log(db.users.length);
    " 2>/dev/null
}

get_recent_pg_users() {
    PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production \
        -t -c "SELECT user_id, name, email FROM users WHERE registration_date > NOW() - INTERVAL '$1 seconds' ORDER BY registration_date DESC;" 2>/dev/null
}

check_user_in_both_systems() {
    local user_id=$1
    
    # Check PostgreSQL
    local pg_exists=$(PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production \
        -t -c "SELECT COUNT(*) FROM users WHERE user_id = '$user_id';" 2>/dev/null | xargs)
    
    # Check JSON
    local json_exists=$(node -e "
        const fs = require('fs');
        const db = JSON.parse(fs.readFileSync('/var/www/latanda.online/database.json', 'utf8'));
        const exists = db.users.find(u => u.id === '$user_id');
        console.log(exists ? '1' : '0');
    " 2>/dev/null)
    
    if [[ "$pg_exists" == "1" && "$json_exists" == "1" ]]; then
        log SUCCESS "User $user_id exists in BOTH systems ✅"
        return 0
    elif [[ "$pg_exists" == "1" && "$json_exists" == "0" ]]; then
        log WARNING "User $user_id ONLY in PostgreSQL (missing in JSON)"
        return 1
    elif [[ "$pg_exists" == "0" && "$json_exists" == "1" ]]; then
        log WARNING "User $user_id ONLY in JSON (missing in PostgreSQL)"
        return 1
    else
        log ERROR "User $user_id NOT FOUND in either system"
        return 2
    fi
}

print_header() {
    clear
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║              DUAL-WRITE MONITORING - REAL-TIME DASHBOARD                  ║${NC}"
    echo -e "${CYAN}║                    Week 3-4: PostgreSQL Migration                         ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_stats() {
    local pg_count=$1
    local json_count=$2
    local diff=$((pg_count - json_count))
    
    echo -e "${BLUE}Current User Counts:${NC}"
    echo "  PostgreSQL: $pg_count users"
    echo "  JSON:       $json_count users"
    
    if [[ $diff -eq 0 ]]; then
        echo -e "  Status:     ${GREEN}✅ SYNCHRONIZED${NC}"
    elif [[ $diff -gt 0 ]]; then
        echo -e "  Status:     ${YELLOW}⚠ PostgreSQL has $diff more users${NC}"
    else
        echo -e "  Status:     ${YELLOW}⚠ JSON has ${diff#-} more users${NC}"
    fi
    echo ""
}

monitor_loop() {
    local iteration=0
    local last_pg_count=0
    local last_json_count=0
    
    log INFO "Starting dual-write monitoring (interval: ${CHECK_INTERVAL}s)"
    
    while true; do
        iteration=$((iteration + 1))
        
        print_header
        echo -e "${CYAN}Iteration: $iteration${NC}"
        echo -e "${CYAN}Time: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
        echo ""
        
        # Get current counts
        pg_count=$(get_pg_user_count)
        json_count=$(get_json_user_count)
        
        print_stats "$pg_count" "$json_count"
        
        # Detect new users
        if [[ $iteration -gt 1 ]]; then
            local new_pg=$((pg_count - last_pg_count))
            local new_json=$((json_count - last_json_count))
            
            if [[ $new_pg -gt 0 || $new_json -gt 0 ]]; then
                echo -e "${GREEN}📊 NEW REGISTRATIONS DETECTED:${NC}"
                echo "  PostgreSQL: +$new_pg"
                echo "  JSON:       +$new_json"
                echo ""
                
                # Get recent users from PostgreSQL
                echo -e "${BLUE}Recent PostgreSQL users (last ${CHECK_INTERVAL}s):${NC}"
                recent_users=$(get_recent_pg_users "$CHECK_INTERVAL")
                if [[ -n "$recent_users" ]]; then
                    echo "$recent_users"
                    
                    # Extract user IDs and check dual-write
                    echo ""
                    echo -e "${BLUE}Validating dual-write:${NC}"
                    while IFS='|' read -r user_id name email; do
                        user_id=$(echo "$user_id" | xargs)
                        check_user_in_both_systems "$user_id"
                    done <<< "$recent_users"
                else
                    echo "  (none)"
                fi
                echo ""
            fi
        fi
        
        last_pg_count=$pg_count
        last_json_count=$json_count
        
        echo -e "${CYAN}Next check in ${CHECK_INTERVAL} seconds... (Ctrl+C to stop)${NC}"
        sleep "$CHECK_INTERVAL"
    done
}

# Main
case "${1:-monitor}" in
    monitor)
        monitor_loop
        ;;
    
    check)
        print_header
        pg_count=$(get_pg_user_count)
        json_count=$(get_json_user_count)
        print_stats "$pg_count" "$json_count"
        ;;
    
    validate-user)
        if [[ -z "$2" ]]; then
            echo "Usage: $0 validate-user <user_id>"
            exit 1
        fi
        check_user_in_both_systems "$2"
        ;;
    
    *)
        echo "Usage: $0 {monitor|check|validate-user <user_id>}"
        exit 1
        ;;
esac
