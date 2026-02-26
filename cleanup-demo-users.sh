#!/bin/bash

# Cleanup Demo Users Script
# Removes demo users from Sep 14-18, 2025 for cleaner deployment

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    DEMO USER CLEANUP SCRIPT                               ║${NC}"
echo -e "${BLUE}║                  Week 3-4: PostgreSQL Migration                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Demo users to remove (Sep 14-18, 2025)
DEMO_USERS=(
    "user_ea71ca1d51ace6ad"  # Sep 14
    "user_b8239811922994c5"  # Sep 15
    "user_7a2dd0f418d145bb"  # Sep 15
    "user_393cc26e7d5c55cf"  # Sep 15
    "user_1062abcecb746ef4"  # Sep 15
    "user_863b42dae5494684"  # Sep 16
    "user_40b9af7d9f6c6dc7"  # Sep 16
    "user_ab19c1f0391d8103"  # Sep 16
    "user_4074781c5af5eb89"  # Sep 16
    "user_b9345308f1ec4a12"  # Sep 16
    "user_d4d26d93d128522d"  # Sep 18
    "user_f2c6cd195fdb749c"  # Sep 18
)

echo -e "${YELLOW}📋 Demo Users to Remove (12 total):${NC}"
echo ""
echo "All users created Sep 14-18, 2025:"
echo "  - All have @latanda.com emails"
echo "  - All named 'Demo User'"
echo "  - Early testing data before production deployment"
echo ""

PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production -c "
SELECT user_id, name, email, registration_date::date
FROM users
WHERE user_id IN (
    'user_ea71ca1d51ace6ad',
    'user_b8239811922994c5',
    'user_7a2dd0f418d145bb',
    'user_393cc26e7d5c55cf',
    'user_1062abcecb746ef4',
    'user_863b42dae5494684',
    'user_40b9af7d9f6c6dc7',
    'user_ab19c1f0391d8103',
    'user_4074781c5af5eb89',
    'user_b9345308f1ec4a12',
    'user_d4d26d93d128522d',
    'user_f2c6cd195fdb749c'
)
ORDER BY registration_date;
" 2>&1

echo ""
echo -e "${YELLOW}⚠ IMPACT ANALYSIS:${NC}"
echo ""

# Count current users
CURRENT_COUNT=$(PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production \
    -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)

echo "Current PostgreSQL users: $CURRENT_COUNT"
echo "Demo users to remove: ${#DEMO_USERS[@]}"
echo "Users after cleanup: $((CURRENT_COUNT - ${#DEMO_USERS[@]}))"
echo ""
echo -e "${GREEN}BENEFIT: Clean state for dual-write validation${NC}"
echo "  - All new registrations will be dual-write only"
echo "  - No pre-migration data to confuse validation"
echo "  - Clear baseline for monitoring"
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

REMOVED=0
FAILED=0

for user_id in "${DEMO_USERS[@]}"; do
    echo -n "Removing ${user_id}... "
    
    RESULT=$(PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production \
        -c "DELETE FROM users WHERE user_id = '$user_id';" 2>&1 | grep "^DELETE")
    
    if [[ $RESULT == "DELETE 1" ]]; then
        echo -e "${GREEN}✅${NC}"
        REMOVED=$((REMOVED + 1))
    else
        echo -e "${RED}❌${NC}"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                         CLEANUP COMPLETE                                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Results:${NC}"
echo "  Removed: ${GREEN}${REMOVED}${NC} users"
echo "  Failed:  ${RED}${FAILED}${NC} users"
echo ""

# Final counts
FINAL_COUNT=$(PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production \
    -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)

echo -e "${BLUE}Final State:${NC}"
echo "  PostgreSQL users: ${FINAL_COUNT}"
echo "  JSON users: $(node -e "
    const fs = require('fs');
    const db = JSON.parse(fs.readFileSync('/var/www/latanda.online/database.json', 'utf8'));
    console.log(db.users.length);
  " 2>/dev/null)"
echo ""

# List remaining users
echo -e "${BLUE}Remaining PostgreSQL users (should only be real/synced users):${NC}"
PGPASSWORD='latanda123' psql -h localhost -U postgres -d latanda_production \
    -c "SELECT user_id, name, email FROM users ORDER BY registration_date;" 2>&1

echo ""
echo -e "${GREEN}✅ Run validation to verify clean state:${NC}"
echo "  cd /var/www/latanda.online && node validate-user-consistency.js"
echo ""
echo -e "${CYAN}Expected after cleanup:${NC}"
echo "  PostgreSQL: 3 users (user_001, user_002, Nigel Banks)"
echo "  JSON: 12 users (unchanged)"
echo "  Perfect Matches: 2"
echo "  Ready for dual-write deployment!"
