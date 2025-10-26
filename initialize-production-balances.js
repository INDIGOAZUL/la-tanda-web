#!/usr/bin/env node

/**
 * 🎯 Production User Balance Initialization Script
 *
 * This script:
 * 1. Converts mock/demo users → System Bots (for webhooks, automation, testing)
 * 2. Awards LTD tokens to real users based on actual activity
 * 3. Initializes wallet structure for crypto withdrawals
 *
 * Reward System (from grok-collaboration-overview.md):
 * - Participation: 50 LTD (initial registration)
 * - Activity: 25 LTD per engagement
 * - Group Contribution: 0.01 LTD per HNL contributed
 * - App Usage: 2 LTD per check-in (48h intervals)
 * - Achievements: 5-25 LTD for milestones
 */

const fs = require('fs');
const path = require('path');

const DATABASE_PATH = process.env.DB_PATH || '/root/database.json';
const BACKUP_PATH = `${DATABASE_PATH}.backup-${Date.now()}`;

console.log('🎯 La Tanda Production Balance Initialization\n');
console.log('=' . repeat(70));

// Load database
console.log('\n📂 Loading database from:', DATABASE_PATH);
const db = JSON.parse(fs.readFileSync(DATABASE_PATH, 'utf8'));

// Backup original
console.log('💾 Creating backup at:', BACKUP_PATH);
fs.writeFileSync(BACKUP_PATH, JSON.stringify(db, null, 2));

// ═══════════════════════════════════════════════════════════════════════
// REWARD CALCULATION RULES
// ═══════════════════════════════════════════════════════════════════════

function calculateUserLTD(user) {
    let totalLTD = 0;
    const reasons = [];

    // 1. Participation Reward (Registration)
    if (user.registration_date) {
        totalLTD += 50;
        reasons.push('Registration: +50 LTD');
    }

    // 2. Group Participation Reward
    const groupCount = user.groups?.length || 0;
    if (groupCount > 0) {
        const groupBonus = groupCount * 25;
        totalLTD += groupBonus;
        reasons.push(`Group Participation (${groupCount} groups): +${groupBonus} LTD`);
    }

    // 3. Contribution-based Reward (0.01 LTD per HNL contributed)
    const contributions = user.total_contributions || 0;
    if (contributions > 0) {
        const contributionReward = Math.floor(contributions * 0.01);
        totalLTD += contributionReward;
        reasons.push(`Contributions (${contributions} HNL): +${contributionReward} LTD`);
    }

    // 4. Verification Level Bonus
    const verificationBonus = {
        'basic': 10,
        'intermediate': 25,
        'advanced': 50,
        'kyc_verified': 100
    };
    const verificationLevel = user.verification_level || 'basic';
    const levelBonus = verificationBonus[verificationLevel] || 10;
    totalLTD += levelBonus;
    reasons.push(`Verification (${verificationLevel}): +${levelBonus} LTD`);

    // 5. Active User Bonus (has made contributions or is in groups)
    if (contributions > 0 || groupCount > 0) {
        totalLTD += 50;
        reasons.push('Active User Bonus: +50 LTD');
    }

    // 6. Early Adopter Bonus (for non-test users)
    const isTestUser = user.email?.includes('test') ||
                       user.email?.includes('demo') ||
                       user.name?.includes('Test') ||
                       user.name?.includes('Demo');

    if (!isTestUser && user.registration_date) {
        totalLTD += 100;
        reasons.push('Early Adopter Bonus: +100 LTD');
    }

    return { totalLTD, reasons };
}

// ═══════════════════════════════════════════════════════════════════════
// USER CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════

function classifyUser(user) {
    const email = user.email || '';
    const name = user.name || '';

    // System/Internal users (convert to bots)
    if (email.includes('test') && !email.includes('ebanksnigel')) {
        return 'test_bot';
    }

    if (name.includes('Demo User')) {
        return 'demo_bot';
    }

    if (email.includes('@latanda.test')) {
        return 'test_bot';
    }

    // Owner/Admin
    if (email === 'ebanksnigel@gmail.com' || email === 'handdraw32@gmail.com') {
        return 'owner';
    }

    // Real users with activity
    if ((user.total_contributions > 0) || (user.groups && user.groups.length > 0)) {
        return 'real_active';
    }

    // Real users without activity
    if (!email.includes('test') && !email.includes('demo') && !name.includes('Test')) {
        return 'real_inactive';
    }

    return 'demo_bot';
}

// ═══════════════════════════════════════════════════════════════════════
// PROCESS USERS
// ═══════════════════════════════════════════════════════════════════════

const stats = {
    real_active: 0,
    real_inactive: 0,
    owner: 0,
    test_bot: 0,
    demo_bot: 0,
    total_ltd_distributed: 0
};

console.log('\n🔄 Processing users...\n');

db.users = db.users.map(user => {
    const classification = classifyUser(user);
    stats[classification]++;

    const updatedUser = {
        ...user,
        user_type: classification,
        ltd_balance: 0,
        crypto_balances: { LTD: 0 },
        wallet_address: null,
        ltd_earned_total: 0,
        ltd_withdrawn_total: 0,
        reward_history: []
    };

    // Calculate LTD for each user type
    switch (classification) {
        case 'real_active':
            const { totalLTD, reasons } = calculateUserLTD(user);
            updatedUser.ltd_balance = totalLTD;
            updatedUser.ltd_earned_total = totalLTD;
            updatedUser.reward_history = reasons.map(r => ({
                date: new Date().toISOString(),
                reason: r,
                amount: parseInt(r.match(/\+(\d+)/)[1])
            }));
            stats.total_ltd_distributed += totalLTD;

            console.log(`✅ ${user.name} (${user.email})`);
            console.log(`   Classification: REAL ACTIVE USER`);
            console.log(`   LTD Balance: ${totalLTD} LTD`);
            reasons.forEach(r => console.log(`   - ${r}`));
            console.log('');
            break;

        case 'owner':
            // Give owner extra for testing + admin privileges
            updatedUser.ltd_balance = 10000;
            updatedUser.ltd_earned_total = 10000;
            updatedUser.user_type = 'admin';
            updatedUser.is_admin = true;
            updatedUser.reward_history = [{
                date: new Date().toISOString(),
                reason: 'Admin/Owner Account Initialization',
                amount: 10000
            }];
            stats.total_ltd_distributed += 10000;

            console.log(`👑 ${user.name} (${user.email})`);
            console.log(`   Classification: OWNER/ADMIN`);
            console.log(`   LTD Balance: 10,000 LTD`);
            console.log('');
            break;

        case 'real_inactive':
            // Real users without activity get participation reward only
            updatedUser.ltd_balance = 60; // 50 registration + 10 verification
            updatedUser.ltd_earned_total = 60;
            updatedUser.reward_history = [
                { date: new Date().toISOString(), reason: 'Registration', amount: 50 },
                { date: new Date().toISOString(), reason: 'Basic Verification', amount: 10 }
            ];
            stats.total_ltd_distributed += 60;

            console.log(`🆕 ${user.name} (${user.email})`);
            console.log(`   Classification: REAL INACTIVE USER`);
            console.log(`   LTD Balance: 60 LTD (registration + verification)`);
            console.log('');
            break;

        case 'test_bot':
        case 'demo_bot':
            // System bots for testing/webhooks/automation
            updatedUser.ltd_balance = 100; // Small amount for testing
            updatedUser.ltd_earned_total = 100;
            updatedUser.user_type = 'system_bot';
            updatedUser.is_bot = true;
            updatedUser.bot_purpose = classification === 'test_bot' ? 'testing' : 'demo_data';
            updatedUser.reward_history = [{
                date: new Date().toISOString(),
                reason: 'System Bot Initialization',
                amount: 100
            }];
            stats.total_ltd_distributed += 100;

            console.log(`🤖 ${user.name} (${user.email})`);
            console.log(`   Classification: SYSTEM BOT (${updatedUser.bot_purpose})`);
            console.log(`   LTD Balance: 100 LTD (testing purposes)`);
            console.log('');
            break;
    }

    return updatedUser;
});

// ═══════════════════════════════════════════════════════════════════════
// INITIALIZE WITHDRAWAL SYSTEM
// ═══════════════════════════════════════════════════════════════════════

if (!db.withdrawals) {
    db.withdrawals = [];
}

if (!db.withdrawal_history) {
    db.withdrawal_history = [];
}

db.system_metadata = {
    ...db.system_metadata,
    balances_initialized_at: new Date().toISOString(),
    initialization_script_version: '1.0.0',
    total_users: db.users.length,
    total_ltd_distributed: stats.total_ltd_distributed,
    reward_system_version: 'v2.0',
    treasury_address: '0x58EA31ceba1B3DeFacB06A5B7fc7408656b91bf7',
    ltd_token_address: '0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc'
};

// ═══════════════════════════════════════════════════════════════════════
// SAVE DATABASE
// ═══════════════════════════════════════════════════════════════════════

console.log('\n' + '='.repeat(70));
console.log('\n📊 INITIALIZATION SUMMARY\n');
console.log(`Total Users: ${db.users.length}`);
console.log(`  - Real Active Users: ${stats.real_active}`);
console.log(`  - Real Inactive Users: ${stats.real_inactive}`);
console.log(`  - Owners/Admins: ${stats.owner}`);
console.log(`  - System Bots: ${stats.test_bot + stats.demo_bot}`);
console.log('');
console.log(`Total LTD Distributed: ${stats.total_ltd_distributed.toLocaleString()} LTD`);
console.log(`Treasury Balance: 200,000,000 LTD`);
console.log(`Remaining: ${(200000000 - stats.total_ltd_distributed).toLocaleString()} LTD`);
console.log('');

// Save updated database
console.log('💾 Saving updated database...');
fs.writeFileSync(DATABASE_PATH, JSON.stringify(db, null, 2));

console.log('✅ Database updated successfully!');
console.log('');
console.log('📋 Next Steps:');
console.log('  1. Restart API server: pm2 restart enhanced-api-production-complete');
console.log('  2. Verify balances: node -e "const db=require(\'./database.json\');console.log(db.users.filter(u=>u.ltd_balance>0).length)"');
console.log('  3. Test withdrawal from latanda.online/ltd-token-economics.html');
console.log('');
console.log('💾 Backup saved at:', BACKUP_PATH);
console.log('');
console.log('🎉 FASE 3 INITIALIZATION COMPLETE!');
console.log('='.repeat(70));
