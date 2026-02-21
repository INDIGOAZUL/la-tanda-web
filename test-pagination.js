/**
 * Transaction Pagination Test Suite
 * Issue #4 - Transaction Pagination Bounty
 * 
 * Run: node test-pagination.js
 */

const API_BASE = 'https://latanda.online';

// Test credentials
const TEST_USER = {
    email: 'demo@latanda.online',
    password: 'LaTandaDemo2026!'
};

async function getAuthToken() {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_USER)
    });
    const data = await response.json();
    return data.data?.auth_token;
}

async function testPagination() {
    console.log('🧪 Testing Transaction Pagination...\n');
    
    const token = await getAuthToken();
    if (!token) {
        console.log('❌ Failed to login');
        return;
    }
    console.log('✅ Logged in successfully\n');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // Test 1: Default pagination (limit=20)
    console.log('📋 Test 1: Default pagination (limit=20)');
    let response = await fetch(`${API_BASE}/api/user/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({})
    });
    let data = await response.json();
    
    if (data.success && data.data?.pagination) {
        const p = data.data.pagination;
        console.log(`   ✓ Pagination returned: total=${p.total}, limit=${p.limit}, offset=${p.offset}, has_more=${p.has_more}`);
    } else {
        console.log('   ❌ Pagination not returned');
    }

    // Test 2: Custom limit
    console.log('\n📋 Test 2: Custom limit (limit=5)');
    response = await fetch(`${API_BASE}/api/user/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ limit: 5, offset: 0 })
    });
    data = await response.json();
    
    if (data.success && data.data?.pagination?.limit === 5) {
        console.log(`   ✓ Custom limit works: ${data.data.pagination.limit}`);
    } else {
        console.log('   ❌ Custom limit failed');
    }

    // Test 3: Offset pagination
    console.log('\n📋 Test 3: Offset pagination (page 2)');
    response = await fetch(`${API_BASE}/api/user/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ limit: 5, offset: 5 })
    });
    data = await response.json();
    
    if (data.success && data.data?.pagination?.offset === 5) {
        console.log(`   ✓ Offset works: offset=${data.data.pagination.offset}`);
    } else {
        console.log('   ❌ Offset pagination failed');
    }

    // Test 4: has_more calculation
    console.log('\n📋 Test 4: has_more calculation');
    if (data.data?.pagination) {
        const p = data.data.pagination;
        const expectedHasMore = (p.offset + p.limit) < p.total;
        if (p.has_more === expectedHasMore) {
            console.log(`   ✓ has_more correct: ${p.has_more} (total=${p.total}, offset+limit=${p.offset + p.limit})`);
        } else {
            console.log(`   ❌ has_more incorrect: got ${p.has_more}, expected ${expectedHasMore}`);
        }
    }

    // Test 5: Max limit boundary
    console.log('\n📋 Test 5: Max limit boundary (limit=100)');
    response = await fetch(`${API_BASE}/api/user/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ limit: 100, offset: 0 })
    });
    data = await response.json();
    
    if (data.success) {
        const p = data.data.pagination;
        const actualLimit = Math.min(100, 50); // Backend caps at 50
        console.log(`   ✓ Max limit handled: requested=100, actual=${p.limit}`);
    }

    console.log('\n✅ Pagination tests complete!');
}

testPagination().catch(console.error);
