#!/bin/bash

# Cleanup Test Users Script
# Week 3-4: PostgreSQL Migration
# Removes test users created during dual-write testing

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TEST USER CLEANUP SCRIPT                               ║${NC}"
echo -e "${BLUE}║                  Week 3-4: PostgreSQL Migration                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test users to remove (from today's dual-write testing)
TEST_USERS=(
    "user_b92df70fa5411d09"  # Test User Fixed
    "user_ef189a03ac901542"  # Second Test User
    "user_691110edaa327e95"  # Third Test User
)

# Also the first test user from Week 1-2
WEEK1_TEST_USER="user_d46a159b46bf1a04"  # test@latanda.com

echo -e "${YELLOW}📋 Test Users to Remove:${NC}"
echo ""
echo "Week 3-4 Test Users (3):"
echo "  - user_b92df70fa5411d09 (test-fixed@latanda.com)"
echo "  - user_ef189a03ac901542 (test2@latanda.com)"
echo "  - user_691110edaa327e95 (test3@latanda.com)"
echo ""
echo "Week 1-2 Test User (1):"
echo "  - user_d46a159b46bf1a04 (test@latanda.com)"
echo ""

read -p "$(echo -e ${YELLOW}Do you want to proceed with cleanup? [y/N]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cleanup cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Starting cleanup...${NC}"
echo ""

# Function to delete user from PostgreSQL
delete_from_pg() {
    local user_id=$1
    echo -e "${BLUE}Removing from PostgreSQL: ${user_id}${NC}"
    
    PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production \
        -c "DELETE FROM users WHERE user_id = '$user_id';" 2>&1 | grep -v "^DELETE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Removed from PostgreSQL${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to remove from PostgreSQL${NC}"
        return 1
    fi
}

# Clean up Week 3-4 test users (PostgreSQL only - they were never in JSON)
echo -e "${YELLOW}=== Week 3-4 Test Users ===${NC}"
for user_id in "${TEST_USERS[@]}"; do
    echo ""
    delete_from_pg "$user_id"
done

# Clean up Week 1-2 test user (PostgreSQL only - need to verify if in JSON)
echo ""
echo -e "${YELLOW}=== Week 1-2 Test User ===${NC}"
echo ""
delete_from_pg "$WEEK1_TEST_USER"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                         CLEANUP COMPLETE                                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verify final counts
echo -e "${BLUE}Final User Counts:${NC}"
echo ""

pg_count=$(PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production \
    -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)

echo "PostgreSQL: $pg_count users"
echo ""

# List remaining test/demo users
echo -e "${BLUE}Remaining users with @latanda.com emails (if any):${NC}"
PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production \
    -c "SELECT user_id, name, email FROM users WHERE email LIKE '%@latanda.com' ORDER BY email;" 2>&1 | grep -v "^(" | head -20

echo ""
echo -e "${GREEN}Done! Run validation script to verify:${NC}"
echo "  cd /var/www/latanda.online && node validate-user-consistency.js"
