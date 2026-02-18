/**
 * LA TANDA - Dashboard Real Data Patch
 * Conecta el dashboard existente con datos reales del backend
 * Version: 2.1 - Fixed timing issues
 */

(function() {
    'use strict';


    // Wait for DOM, API connector, AND carousel elements
    function waitForEverything(callback, maxAttempts = 50) {
        let attempts = 0;
        const check = () => {
            attempts++;
            const hasAPI = window.dashboardAPI;
            const hasDOM = document.readyState === 'complete';
            const hasCarousel = true; // Hub replaced carousel
            
            if (hasAPI && hasDOM && hasCarousel) {
                callback();
            } else if (attempts < maxAttempts) {
                setTimeout(check, 200);
            } else {
                // Try anyway
                if (hasAPI) callback();
            }
        };
        check();
    }

    waitForEverything(async function() {

        const api = window.dashboardAPI;
        
        // ============================================
        // UPDATE REAL DATA ON PAGE
        // ============================================

        async function updateDashboardWithRealData() {
            try {
                const data = await api.syncAll();
                
                if (!data) {
                    return;
                }
                
                    balance: data.balance,
                    tandasCount: data.tandasCount,
                    hasNextPayment: !!data.nextPayment
                });

                // Update carousel stats
                updateCarouselStats(data);

                // Update other displays
                updateBalanceDisplays(data.balance);
                updateTandasCount(data.tandasCount);
                updateNextPayment(data.nextPayment);
                updateProfileModalStats(data);

            } catch (error) {
            }
        }

        // ============================================
        // CAROUSEL STATS UPDATE
        // ============================================

        function updateCarouselStats(data) {
            if (!data) return;

            // Update carousel balance
            const carouselBalance = document.getElementById('carouselBalance');
            if (carouselBalance && data.balance) {
                const formatted = api.formatCurrency(data.balance.available);
                carouselBalance.textContent = formatted;
                carouselBalance.setAttribute('data-real', 'true');
            } else {
                // Element removed - Hub handles this now
            }

            // Update carousel savings
            const carouselSavings = document.getElementById('carouselSavings');
            if (carouselSavings && data.balance) {
                const savings = data.balance.total || data.balance.available || 0;
                const formatted = api.formatCurrency(savings);
                carouselSavings.textContent = formatted;
                carouselSavings.setAttribute('data-real', 'true');
            }

            // Update carousel tandas count
            const carouselTandas = document.getElementById('carouselTandas');
            const carouselTandasSub = document.getElementById('carouselTandasSub');
            if (carouselTandas && data.tandasCount) {
                carouselTandas.textContent = data.tandasCount.active.toString();
                carouselTandas.setAttribute('data-real', 'true');
                if (carouselTandasSub) {
                    const label = data.tandasCount.active === 1 ? 'grupo activo' : 'grupos activos';
                    carouselTandasSub.textContent = label;
                }
            }

            // Update carousel next payment
            const carouselNextPayment = document.getElementById('carouselNextPayment');
            const carouselNextPaymentSub = document.getElementById('carouselNextPaymentSub');
            if (carouselNextPayment) {
                if (data.nextPayment) {
                    carouselNextPayment.textContent = api.formatCurrency(data.nextPayment.amount);
                    carouselNextPayment.setAttribute('data-real', 'true');
                    if (carouselNextPaymentSub) {
                        const daysText = data.nextPayment.daysUntil === 1 ? 'en 1 día' : 'en ' + data.nextPayment.daysUntil + ' días';
                        carouselNextPaymentSub.textContent = daysText + ' - ' + data.nextPayment.tandaName;
                    }
                } else {
                    carouselNextPayment.textContent = '--';
                    if (carouselNextPaymentSub) {
                        carouselNextPaymentSub.textContent = 'sin pagos pendientes';
                    }
                }
            }
        }

        // ============================================
        // PROFILE MODAL STATS UPDATE
        // ============================================

        function updateProfileModalStats(data) {
            if (!data) return;

            const profileBalance = document.getElementById('profileBalance');
            if (profileBalance && data.balance) {
                profileBalance.textContent = api.formatCurrency(data.balance.available);
            }

            const profileTandas = document.getElementById('profileTandas');
            if (profileTandas && data.tandasCount) {
                profileTandas.textContent = data.tandasCount.active.toString();
            }
        }

        // ============================================
        // BALANCE UPDATES
        // ============================================

        function updateBalanceDisplays(balance) {
            if (!balance) return;

            const formattedBalance = api.formatCurrency(balance.available);
            
            document.querySelectorAll('.stat-number, .portfolio-value, .balance-amount').forEach(el => {
                const text = el.textContent || '';
                if (text.includes('24,567') || text.includes('24567')) {
                    el.textContent = formattedBalance;
                    el.setAttribute('data-real', 'true');
                }
            });

            const walletBalance = document.querySelector('.wallet-balance-amount, .header-balance');
            if (walletBalance) {
                walletBalance.textContent = formattedBalance;
            }
        }

        // ============================================
        // TANDAS COUNT UPDATES
        // ============================================

        function updateTandasCount(tandasCount) {
            if (!tandasCount) return;

            document.querySelectorAll('.stat-number, .stat-value').forEach(el => {
                const text = el.textContent || '';
                const parent = el.closest('.stat-card, .hero-stat, .stat-item');
                
                if (parent) {
                    const label = parent.textContent.toLowerCase();
                    if ((label.includes('tanda') || label.includes('grupo')) && !el.getAttribute('data-real')) {
                        if (/^\d+$/.test(text.trim()) && parseInt(text) > 5) {
                            el.textContent = tandasCount.active.toString();
                            el.setAttribute('data-real', 'true');
                        }
                    }
                }
            });
        }

        // ============================================
        // NEXT PAYMENT ALERT
        // ============================================

        function updateNextPayment(nextPayment) {
            if (!nextPayment) return;

            let alertEl = document.querySelector('.next-payment-real-alert');
            
            if (!alertEl) {
                const welcomeSection = document.querySelector('.welcome-section, .hero-section, .dashboard-header');
                if (welcomeSection) {
                    alertEl = document.createElement('div');
                    alertEl.className = 'next-payment-real-alert';
                    alertEl.style.cssText = 'background: rgba(236, 201, 75, 0.15); color: #ecc94b; padding: 12px 20px; border-radius: 10px; margin: 16px 0; display: flex; align-items: center; gap: 10px; font-size: 14px;';
                    welcomeSection.after(alertEl);
                }
            }

            if (alertEl) {
                const daysText = nextPayment.daysUntil === 1 ? '1 día' : nextPayment.daysUntil + ' días';
                alertEl.innerHTML = '<span>⏰</span> <span>Próximo pago: <strong>' + 
                    api.formatCurrency(nextPayment.amount) + '</strong> en ' + daysText + 
                    ' (' + nextPayment.tandaName + ')</span>';
            }
        }

        // ============================================
        // INITIALIZE
        // ============================================

        // Initial data load
        await updateDashboardWithRealData();

        // Retry after 2 seconds in case elements weren't ready
        setTimeout(updateDashboardWithRealData, 2000);

        // Set up sync cycle (every 30 seconds)
        setInterval(updateDashboardWithRealData, 30000);

        // Also update when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                updateDashboardWithRealData();
            }
        });

    });

})();
