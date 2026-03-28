/**
 * Example: Rate Limiter Integration for Home Dashboard
 *
 * This file demonstrates how to integrate the Rate Limiter utility
 * into the existing home dashboard to prevent 429 errors.
 */

// ===================================
// 1. INITIALIZE RATE LIMITER
// ===================================

// Create rate limiter instances for different use cases
const dashboardLimiter = new RateLimiter({
    maxRetries: 3,
    baseDelay: 2000,
    cacheTTL: 30000  // 30 seconds cache for dashboard data
});

const realtimeLimiter = new RateLimiter({
    maxRetries: 2,
    baseDelay: 1000,
    cacheTTL: 5000   // 5 seconds cache for realtime data
});

// ===================================
// 2. WRAP EXISTING API CALLS
// ===================================

// BEFORE: Direct fetch without retry
/*
async function loadUserBalance() {
    const response = await fetch('/api/user/balance');
    return await response.json();
}
*/

// AFTER: With rate limiting and retry
async function loadUserBalance() {
    try {
        return await dashboardLimiter.fetchWithCache('/api/user/balance');
    } catch (error) {
        console.error('Failed to load user balance:', error);
        // Return fallback data
        return { balance: 0, currency: 'LTD' };
    }
}

// ===================================
// 3. UPDATE PERIODIC REFRESH FUNCTIONS
// ===================================

// BEFORE: Direct setInterval calls
/*
setInterval(async () => {
    const balance = await fetch('/api/user/balance');
    updateBalanceDisplay(balance);
}, 5000);
*/

// AFTER: With caching to reduce API calls
setInterval(async () => {
    try {
        // This will use cached data if available (30s TTL)
        const balance = await dashboardLimiter.fetchWithCache('/api/user/balance');
        updateBalanceDisplay(balance);
    } catch (error) {
        console.warn('Balance update failed:', error);
    }
}, 5000);  // Check every 5s, but API call only every 30s due to cache

// ===================================
// 4. DEBOUNCE SEARCH FUNCTIONALITY
// ===================================

function setupSearch() {
    const searchInput = document.querySelector('#dashboardSearch');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            if (query.length < 2) {
                clearSearchResults();
                return;
            }

            // Debounce API calls while user is typing
            dashboardLimiter.debounce('search', async () => {
                try {
                    const results = await realtimeLimiter.fetchWithRetry(
                        `/api/search?q=${encodeURIComponent(query)}`
                    );
                    displaySearchResults(results);
                } catch (error) {
                    console.error('Search failed:', error);
                    showSearchError();
                }
            }, 300);
        });
    }
}

// ===================================
// 5. BATCH LOAD DASHBOARD DATA
// ===================================

async function loadDashboardData() {
    try {
        // Load all dashboard data with retry and caching
        const [
            userBalance,
            activeTandas,
            recentTransactions,
            ltdPrice,
            stakingRewards
        ] = await Promise.all([
            dashboardLimiter.fetchWithCache('/api/user/balance'),
            dashboardLimiter.fetchWithCache('/api/tandas/active'),
            dashboardLimiter.fetchWithCache('/api/transactions/recent'),
            dashboardLimiter.fetchWithCache('/api/market/ltd-price'),
            dashboardLimiter.fetchWithCache('/api/user/staking-rewards')
        ]);

        // Update dashboard with loaded data
        updateDashboard({
            balance: userBalance,
            tandas: activeTandas,
            transactions: recentTransactions,
            ltdPrice: ltdPrice,
            stakingRewards: stakingRewards
        });

        console.log('✅ Dashboard data loaded successfully');

    } catch (error) {
        console.error('❌ Dashboard data loading failed:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// ===================================
// 6. QUEUE FORM SUBMISSIONS
// ===================================

async function submitTandaCreationForm(formData) {
    const submitButton = document.querySelector('#createTandaBtn');

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';

        // Queue the request to prevent overwhelming the API
        const result = await dashboardLimiter.enqueue(async () => {
            return await dashboardLimiter.fetchWithRetry('/api/tandas/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(formData)
            });
        });

        showNotification('¡Tanda creada exitosamente!', 'success');

        // Clear cache to force fresh data
        dashboardLimiter.clearCache();

        // Reload dashboard data
        await loadDashboardData();

        return result;

    } catch (error) {
        if (error.message.includes('Rate limit')) {
            showNotification(
                'Demasiadas solicitudes. Por favor espera un momento.',
                'warning'
            );
        } else if (error.message.includes('queue full')) {
            showNotification(
                'Sistema ocupado. Por favor intenta de nuevo.',
                'warning'
            );
        } else {
            showNotification('Error al crear tanda', 'error');
        }
        throw error;

    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-plus"></i> Crear Tanda';
    }
}

// ===================================
// 7. REALTIME UPDATES WITH BACKOFF
// ===================================

function startRealtimeUpdates() {
    const updateIntervals = {
        cryptoPrices: 8000,      // Every 8 seconds
        blockchainStatus: 20000, // Every 20 seconds
        transactions: 12000      // Every 12 seconds
    };

    // Crypto prices with caching
    setInterval(async () => {
        try {
            const prices = await realtimeLimiter.fetchWithCache('/api/market/prices');
            updateCryptoPrices(prices);
        } catch (error) {
            console.warn('Failed to update crypto prices:', error);
        }
    }, updateIntervals.cryptoPrices);

    // Blockchain status with caching
    setInterval(async () => {
        try {
            const status = await realtimeLimiter.fetchWithCache('/api/blockchain/status');
            updateBlockchainStatus(status);
        } catch (error) {
            console.warn('Failed to update blockchain status:', error);
        }
    }, updateIntervals.blockchainStatus);

    // Recent transactions with caching
    setInterval(async () => {
        try {
            const txs = await realtimeLimiter.fetchWithCache('/api/transactions/recent');
            updateRecentTransactions(txs);
        } catch (error) {
            console.warn('Failed to update transactions:', error);
        }
    }, updateIntervals.transactions);

    console.log('✅ Realtime updates started with rate limiting');
}

// ===================================
// 8. SMART CACHE MANAGEMENT
// ===================================

// Clear cache on user logout
function handleLogout() {
    dashboardLimiter.clearCache();
    realtimeLimiter.clearCache();
    // ... rest of logout logic
}

// Clear specific cache entries after mutations
async function handleDataMutation(type) {
    switch (type) {
        case 'tanda_created':
        case 'tanda_updated':
            // Clear tandas cache
            dashboardLimiter.clearCache();
            break;

        case 'transaction_completed':
            // Clear transaction cache
            dashboardLimiter.clearCache();
            break;

        case 'user_updated':
            // Clear user data cache
            dashboardLimiter.clearCache();
            break;
    }

    // Reload affected data
    await loadDashboardData();
}

// ===================================
// 9. MONITORING & DEBUGGING
// ===================================

// Log cache statistics periodically
if (window.location.search.includes('debug=true')) {
    setInterval(() => {
        console.log('📊 Dashboard Limiter Stats:', dashboardLimiter.getCacheStats());
        console.log('📊 Realtime Limiter Stats:', realtimeLimiter.getCacheStats());
    }, 30000);
}

// Add to window for debugging
window.rateLimiterDebug = {
    dashboard: dashboardLimiter,
    realtime: realtimeLimiter,
    clearAll: () => {
        dashboardLimiter.clearCache();
        realtimeLimiter.clearCache();
        console.log('✅ All caches cleared');
    },
    stats: () => {
        return {
            dashboard: dashboardLimiter.getCacheStats(),
            realtime: realtimeLimiter.getCacheStats()
        };
    }
};

// ===================================
// 10. INITIALIZE ON PAGE LOAD
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing dashboard with rate limiting...');

    // Load initial data
    await loadDashboardData();

    // Start realtime updates
    startRealtimeUpdates();

    // Setup search
    setupSearch();

    console.log('✅ Dashboard initialized with rate limiting protection');
});

// ===================================
// HELPER FUNCTIONS (placeholders)
// ===================================

function updateBalanceDisplay(balance) {
    // Update UI with balance
    const balanceEl = document.querySelector('[data-balance-ltd]');
    if (balanceEl) {
        balanceEl.textContent = `${balance.balance.toFixed(2)} ${balance.currency}`;
    }
}

function updateDashboard(data) {
    // Update all dashboard sections
    console.log('Updating dashboard with:', data);
}

function displaySearchResults(results) {
    console.log('Search results:', results);
}

function clearSearchResults() {
    console.log('Clearing search results');
}

function showSearchError() {
    showNotification('Error en la búsqueda', 'error');
}

function updateCryptoPrices(prices) {
    console.log('Updating crypto prices:', prices);
}

function updateBlockchainStatus(status) {
    console.log('Updating blockchain status:', status);
}

function updateRecentTransactions(transactions) {
    console.log('Updating recent transactions:', transactions);
}

function showNotification(message, type) {
    console.log(`[${type.toUpperCase()}] ${message}`);
}

console.log('✅ Rate Limiter integration example loaded');
