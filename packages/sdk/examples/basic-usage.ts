/**
 * Example usage of @latanda/sdk v1.0.0 (Phase 2)
 * Run with: npx ts-node examples/basic-usage.ts
 */

import { LaTandaClient, AuthenticationError } from '../src/index';

async function main() {
    const client = new LaTandaClient({
        baseUrl: 'https://latanda.online',
        timeout: 10000,
    });

    console.log('🚀 Starting La Tanda SDK (Fintech/Cooperative) Demo...');

    try {
        // 1. Authentication
        console.log('\n🔐 Authenticating...');
        const auth = await client.auth.login({
            email: 'your-email@example.com',
            password: 'your-password',
        });
        console.log(`✅ Logged in as: ${auth.user.name} (Role: ${auth.user.role})`);

        // 2. Check Wallet (HNL Single-Currency)
        console.log('\n💰 Checking Wallet Balance...');
        const balance = await client.wallet.getBalance();
        console.log(`- Balance: ${balance.amount} ${balance.currency}`);
        console.log(`- Available: ${balance.available}`);

        // 3. Browse Tandas (Savings Circles)
        console.log('\n👥 Browsing Public Savings Circles...');
        const groups = await client.tandas.listGroups({ limit: 5 });
        if (groups.length > 0) {
            const g = groups[0];
            console.log(`📍 Found Group: "${g.name}"`);
            console.log(`   Contribution: ${g.contribution_amount} HNL`);
            console.log(`   Members: ${g.current_members}/${g.max_members}`);

            // 4. Join and Contribute
            console.log('\n🤝 Joining Group...');
            await client.tandas.joinGroup(g.id);

            console.log('💸 Making first contribution...');
            const tx = await client.tandas.contribute(g.id, g.contribution_amount);
            console.log(`✅ Contribution successful! Transaction ID: ${tx.transaction_id}`);
        }

        // 5. Social Feed Interaction
        console.log('\n🎭 Fetching Social Feed...');
        const posts = await client.feed.getPosts({ limit: 3 });
        if (posts.length > 0) {
            console.log(`📰 Latest post by ${posts[0].author_name}: "${posts[0].content}"`);
            await client.feed.toggleLike(posts[0].id);
            console.log('❤️ Liked the post!');
        }

        // 6. Lottery Prediction Engine
        console.log('\n🎲 Checking Lottery Stats...');
        const stats = await client.lottery.getStats();
        console.log(`🎱 Total Predictions Today: ${stats.total_spins}`);

        // 7. Phase 2: Marketplace Provider (Mi Tienda)
        console.log('\n🏪 Checking Provider Status...');
        try {
            const profile = await client.providers.getProfile();
            console.log(`✅ Business Profile Found: "${profile.business_name}"`);
        } catch {
            console.log('ℹ️ No marketplace provider profile found for this user.');
        }

        // 8. Phase 2: Notifications
        console.log('\n🔔 Checking Notifications...');
        const unread = await client.notifications.getUnreadCount();
        console.log(`unread notifications: ${unread.unread_count}`);

        console.log('\n✨ Demo completed successfully!');
        console.log('\n💡 Tip: Check out our documentation @ https://latanda.online/docs for the full API reference.');

    } catch (err) {
        if (err instanceof AuthenticationError) {
            console.error('❌ Error: Invalid credentials! Please update the email and password placeholders.');
        } else {
            console.error('❌ Unexpected Error during demo:', err instanceof Error ? err.message : err);
        }
    }
}

// Run the demo
main().catch(console.error);
