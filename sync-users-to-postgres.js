/**
 * Sync Users from JSON to PostgreSQL
 * One-time migration script
 */

const fs = require('fs');
const path = require('path');
const db = require('./db-postgres.js');

const dbFile = path.join(__dirname, 'database.json');

async function syncUsers() {
    console.log('🔄 Starting user synchronization from JSON to PostgreSQL...');
    
    // Load JSON database
    const jsonData = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    const users = jsonData.users || [];
    
    console.log(`📊 Found ${users.length} users in JSON database`);
    
    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
        try {
            // Check if user already exists
            const existing = await db.getUserById(user.id);
            
            if (existing) {
                console.log(`⏭️  User ${user.id} (${user.name}) already exists - skipping`);
                skippedCount++;
                continue;
            }
            
            // Create user in PostgreSQL
            const pgUserData = {
                id: user.id || user.user_id,
                telegram_id: user.telegram_id || null,
                name: user.name || 'Unknown',
                email: user.email || null,
                phone: user.phone || null,
                verification_level: user.verified ? 'verified' : 'basic',
                registration_date: user.created_at || new Date().toISOString(),
                status: user.status || 'active',
                total_contributions: user.ltd_balance || 0,
                avatar_url: user.avatar_url || null,
                push_token: null,
                app_version: null,
                device_type: null,
                last_app_access: null,
                notification_preferences: {},
                app_settings: {}
            };
            
            await db.createUser(pgUserData);
            console.log(`✅ Synced user ${user.id} (${user.name})`);
            syncedCount++;
            
        } catch (error) {
            console.error(`❌ Failed to sync user ${user.id}: ${error.message}`);
            errorCount++;
        }
    }
    
    console.log('\n📈 Synchronization Summary:');
    console.log(`   ✅ Synced: ${syncedCount}`);
    console.log(`   ⏭️  Skipped (already exist): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total: ${users.length}`);
    
    process.exit(0);
}

syncUsers().catch(err => {
    console.error('💥 Sync failed:', err);
    process.exit(1);
});
