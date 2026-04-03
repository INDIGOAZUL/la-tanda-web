/* Smart Rewards Pill — loads reward status into header pill */
(function() {
    var pill = document.getElementById('rewardsPill');
    var text = document.getElementById('rewardsPillText');
    var badge = document.getElementById('rewardsPillBadge');
    if (!pill || !text) return;

    var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    if (!token) { text.textContent = 'Inicia sesion'; return; }

    fetch('/api/rewards/summary', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function(r) { return r.json(); })
        .then(function(res) {
            if (!res.success) { text.textContent = res.data.balance ? res.data.balance + ' LTD' : 'Recompensas'; return; }
            var d = res.data;
            var pendingCount = 0;
            var msgs = [];

            // Priority 1: Mining available
            if (d.mining.can_claim) {
                msgs.push({ icon: 'fa-hammer', text: 'Minar ahora', cls: 'rp-mine' });
                pendingCount++;
            }

            // Priority 2: Claimable streaks
            if (d.streak.claimable_ltd > 0) {
                msgs.push({ icon: 'fa-fire', text: 'Racha: +' + d.streak.claimable_ltd + ' LTD', cls: 'rp-claim' });
                pendingCount += d.streak.claimable.length;
            }

            // Priority 3: Onboarding pending
            if (d.onboarding.pending > 0 && d.onboarding.completed < d.onboarding.total) {
                msgs.push({ icon: 'fa-rocket', text: d.onboarding.completed + '/' + d.onboarding.total + ' onboarding', cls: 'rp-claim' });
                pendingCount++;
            }

            // Default: show balance
            msgs.push({ icon: 'fa-coins', text: d.balance.toFixed(1) + ' LTD', cls: 'rp-idle' });

            // Show highest priority message
            var msg = msgs[0];
            pill.className = 'lt-rewards-pill ' + msg.cls;
            text.innerHTML = '<i class="fas ' + msg.icon + ' lt-rp-icon"></i> ' + msg.text;

            // Badge shows pending count
            if (pendingCount > 0) {
                badge.textContent = pendingCount;
                badge.style.display = '';
            }

            // Rotate messages if more than 1 actionable
            if (msgs.length > 1) {
                var idx = 0;
                setInterval(function() {
                    idx = (idx + 1) % msgs.length;
                    var m = msgs[idx];
                    pill.className = 'lt-rewards-pill ' + m.cls;
                    text.innerHTML = '<i class="fas ' + m.icon + ' lt-rp-icon"></i> ' + m.text;
                }, 5000);
            }
        })
        .catch(function() {
            text.textContent = 'Recompensas';
        });
})();
