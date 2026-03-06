/* ============================================
   🔭 CHAIN EXPLORER ENHANCEMENTS
   ============================================ */

(function() {
    'use strict';
    
    // Add search functionality to the chain explorer
    function addSearchToExplorer() {
        const container = document.querySelector('.chain-explorer, .explorer');
        if (!container) return;
        
        // Add search bar
        const searchBar = document.createElement('div');
        searchBar.className = 'explorer-search';
        searchBar.style.cssText = 'margin-bottom: 20px;';
        searchBar.innerHTML = `
            <input type="text" id="tx-search-input" placeholder="Buscar transacción (tx hash)..." 
                style="width: 100%; padding: 12px 16px; border-radius: 8px; border: 1px solid #334155; 
                background: #1e293b; color: #fff; font-size: 14px;">
            <div id="tx-search-results" style="margin-top: 10px;"></div>
        `;
        
        const existingSearch = container.querySelector('input[placeholder*="Buscar"]');
        if (!existingSearch) {
            container.insertBefore(searchBar, container.firstChild);
        }
        
        // Search handler
        const searchInput = document.getElementById('tx-search-input');
        searchInput?.addEventListener('keyup', async (e) => {
            if (e.key === 'Enter' && searchInput.value.length > 5) {
                await searchTransaction(searchInput.value);
            }
        });
    }
    
    async function searchTransaction(hash) {
        const resultsDiv = document.getElementById('tx-search-results');
        resultsDiv.innerHTML = '<p style="color: #64748b;">Buscando...</p>';
        
        try {
            const response = await fetch(`/chain/api/cosmos/tx/v1beta1/txs/${hash}`);
            const data = await response.json();
            
            if (data.tx_response) {
                const tx = data.tx_response;
                resultsDiv.innerHTML = `
                    <div style="background: #1e293b; border: 1px solid #00d4aa; border-radius: 8px; padding: 16px;">
                        <p style="color: #fff; margin: 0 0 8px;"><strong>Hash:</strong> ${tx.txhash?.substring(0, 20)}...</p>
                        <p style="color: #94a3b8; margin: 0;"><strong>Block:</strong> ${tx.height}</p>
                        <p style="color: #94a3b8; margin: 0;"><strong>Gas:</strong> ${tx.gas_used}/${tx.gas_wanted}</p>
                    </div>
                `;
            } else {
                resultsDiv.innerHTML = '<p style="color: #f87171;">Transacción no encontrada</p>';
            }
        } catch (err) {
            resultsDiv.innerHTML = '<p style="color: #f87171;">Error al buscar</p>';
        }
    }
    
    // Add address page link
    function enhanceAddresses() {
        const addresses = document.querySelectorAll('[class*="address"]');
        addresses.forEach(addr => {
            if (addr.tagName === 'A') return;
            addr.style.cursor = 'pointer';
            addr.onclick = () => {
                const addrText = addr.textContent.trim();
                if (addrText.startsWith('ltd1')) {
                    window.location.href = `#address/${addrText}`;
                }
            };
        });
    }
    
    function init() {
        addSearchToExplorer();
        enhanceAddresses();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
