#!/usr/bin/env node

/**
 * JSON Demo User Cleanup Script
 * Removes demo users from JSON database for clean deployment
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = '/var/www/latanda.online/database.json';
const BACKUP_PATH = `/var/www/latanda.online/database.json.BEFORE-JSON-CLEANUP-${Date.now()}`;

// Users to KEEP (real users)
const USERS_TO_KEEP = [
    'user_001',              // Juan Pérez
    'user_002',              // María González  
    'user_4b21c52be3cc67dd'  // Nigel Banks (PostgreSQL account)
];

// Demo users to REMOVE (all @latanda.com emails + duplicate Nigel)
const DEMO_USERS_TO_REMOVE = [
    'user_f5869b0ea7c472fb',
    'user_d3e9037c6eff0d84',
    'user_05950690559bd915',
    'user_4311a63702fe1601',
    'user_aa673054d66e3e59',
    'user_b92f6b18f58d0106',
    'user_5f6a0d9819557711',
    '1762387098125',         // Duplicate Nigel Banks (Telegram ID)
    'user_c4f22607d9a2d590',
    'user_80e5dcd25d4b6bbd'
];

console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
console.log('║                    JSON DEMO USER CLEANUP SCRIPT                          ║');
console.log('║                  Week 3-4: PostgreSQL Migration                           ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
console.log('');

// Load database
console.log('📂 Loading JSON database...');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

console.log(`   Current users: ${db.users.length}`);
console.log('');

// Show users to remove
console.log('🗑️  Demo Users to Remove (10):');
console.log('');
db.users
    .filter(u => DEMO_USERS_TO_REMOVE.includes(u.id))
    .forEach(u => {
        console.log(`   - ${u.id}: ${u.name} (${u.email || 'no email'})`);
    });

console.log('');

// Show users to keep
console.log('✅ Users to KEEP (3):');
console.log('');
db.users
    .filter(u => USERS_TO_KEEP.includes(u.id) || u.id === 'user_001' || u.id === 'user_002')
    .forEach(u => {
        console.log(`   - ${u.id}: ${u.name} (${u.email || 'no email'})`);
    });

console.log('');
console.log('⚠️  IMPACT ANALYSIS:');
console.log('');
console.log(`   Current JSON users: ${db.users.length}`);
console.log(`   Demo users to remove: ${DEMO_USERS_TO_REMOVE.length}`);
console.log(`   Users after cleanup: ${db.users.length - DEMO_USERS_TO_REMOVE.length}`);
console.log('');
console.log('   BENEFIT: Perfect sync state for dual-write deployment');
console.log('     - PostgreSQL: 3 users');
console.log('     - JSON: 3 users (after cleanup)');
console.log('     - Perfect Matches: 2 (user_001, user_002)');
console.log('     - Clean slate for all new registrations!');
console.log('');

// Prompt for confirmation
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\x1b[33mDo you want to proceed with cleanup? [y/N]: \x1b[0m', (answer) => {
    if (answer.toLowerCase() !== 'y') {
        console.log('\x1b[33mCleanup cancelled.\x1b[0m');
        rl.close();
        process.exit(0);
    }

    console.log('');
    console.log('🔄 Starting cleanup...');
    console.log('');

    // Create backup
    console.log('📦 Creating backup...');
    fs.copyFileSync(DB_PATH, BACKUP_PATH);
    console.log(`   ✅ Backup created: ${BACKUP_PATH}`);
    console.log('');

    // Remove demo users
    const originalCount = db.users.length;
    db.users = db.users.filter(u => !DEMO_USERS_TO_REMOVE.includes(u.id));
    const removedCount = originalCount - db.users.length;

    console.log(`   Removed: \x1b[32m${removedCount}\x1b[0m users`);
    console.log('');

    // Save updated database
    console.log('💾 Saving updated database...');
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log('   ✅ Database updated');
    console.log('');

    // Final state
    console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
    console.log('║                         CLEANUP COMPLETE                                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
    console.log('');

    console.log('\x1b[34mFinal State:\x1b[0m');
    console.log(`  PostgreSQL users: 3`);
    console.log(`  JSON users: ${db.users.length}`);
    console.log('');

    console.log('\x1b[34mRemaining JSON users:\x1b[0m');
    db.users.forEach(u => {
        console.log(`  - ${u.id}: ${u.name} (${u.email || 'no email'})`);
    });
    console.log('');

    console.log('\x1b[32m✅ Run validation to verify clean state:\x1b[0m');
    console.log('  cd /var/www/latanda.online && node validate-user-consistency.js');
    console.log('');

    console.log('\x1b[36mExpected validation result:\x1b[0m');
    console.log('  PostgreSQL: 3 users');
    console.log('  JSON: 3 users');
    console.log('  Perfect Matches: 2 (user_001, user_002)');
    console.log('  PG-only: 1 (Nigel Banks)');
    console.log('  JSON-only: 1 (should be 0 or minimal)');
    console.log('  \x1b[32m✅ READY FOR DUAL-WRITE DEPLOYMENT!\x1b[0m');
    console.log('');

    rl.close();
});
