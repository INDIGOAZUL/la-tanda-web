// ===== LOTTERY & TURN LOCK FUNCTIONS =====
// Added for tombola and locked positions feature

// Get current user ID (consistent with main system)
function getLotteryUserId() {
    // 1. Try latanda_user object first (main auth)
    try {
        var userJson = localStorage.getItem("latanda_user");
        if (userJson) {
            var user = JSON.parse(userJson);
            if (user && user.user_id) return user.user_id;
            if (user && user.id) return user.id;
        }
    } catch (e) {}
    
    // 2. Direct keys
    return localStorage.getItem("latanda_user_id") ||
           sessionStorage.getItem("latanda_user_id") ||
           localStorage.getItem("userId") ||
           localStorage.getItem("user_id") ||
           null;
}

// Toggle lock status for a turn position
function toggleTurnLock(index) {
    if (!turnsMembers || !turnsMembers[index]) return;
    turnsMembers[index].turn_locked = !turnsMembers[index].turn_locked;
    renderTurnsList();
}

// Start lottery countdown (10 seconds)
function startLotteryCountdown() {
    var unlockedCount = turnsMembers.filter(function(m) { return !m.turn_locked; }).length;
    if (unlockedCount === 0) {
        alert("No hay posiciones desbloqueadas para sortear. Desbloquea al menos una posicion.");
        return;
    }
    
    if (!confirm("Se sortearán " + unlockedCount + " posiciones no bloqueadas. Las posiciones con candado (🔒) no cambiarán.\n\n¿Iniciar tómbola?")) {
        return;
    }
    
    // Create countdown modal
    var countdownModal = document.createElement("div");
    countdownModal.id = "lotteryCountdownModal";
    countdownModal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 20000;";
    countdownModal.innerHTML = 
        "<div style=\"text-align: center;\">" +
            "<div style=\"font-size: 8rem; color: #f59e0b; font-weight: bold;\" id=\"countdownNumber\">10</div>" +
            "<div style=\"font-size: 1.5rem; color: white; margin-top: 20px;\">🎲 Preparando tómbola...</div>" +
            "<button onclick=\"cancelLottery()\" style=\"margin-top: 30px; padding: 10px 30px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;\">Cancelar</button>" +
        "</div>";
    document.body.appendChild(countdownModal);
    
    var count = 10;
    window.lotteryInterval = setInterval(function() {
        count--;
        var numberEl = document.getElementById("countdownNumber");
        if (numberEl) numberEl.textContent = count;
        
        if (count <= 0) {
            clearInterval(window.lotteryInterval);
            executeLottery();
        }
    }, 1000);
}

// Cancel lottery countdown
function cancelLottery() {
    if (window.lotteryInterval) {
        clearInterval(window.lotteryInterval);
    }
    var modal = document.getElementById("lotteryCountdownModal");
    if (modal) modal.remove();
}

// Execute the lottery via API
async function executeLottery() {
    var modal = document.getElementById("lotteryCountdownModal");
    if (modal) {
        modal.innerHTML = 
            "<div style=\"text-align: center;\">" +
                "<div style=\"font-size: 4rem;\">🎲</div>" +
                "<div style=\"font-size: 1.5rem; color: white; margin-top: 20px;\">Sorteando posiciones...</div>" +
            "</div>";
    }
    
    try {
        var userId = getLotteryUserId();
        console.log("[Lottery] User ID:", userId);
        console.log("[Lottery] Group ID:", manageTurnsGroupId);
        
        if (!userId) {
            throw new Error("No se pudo obtener el ID del usuario");
        }
        
        var apiBase = window.API_BASE_URL || "https://latanda.online";
        
        var response = await fetch(apiBase + "/api/groups/" + manageTurnsGroupId + "/lottery-assign?user_id=" + userId, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coordinator_id: userId })
        });
        
        var result = await response.json();
        console.log("[Lottery] API Response:", result);
        
        if (result.success) {
            // Show results animation
            showLotteryResults(result.data);
        } else {
            if (modal) modal.remove();
            var errorMsg = result.data?.error?.message || result.error || "Error desconocido";
            alert("Error en la tómbola: " + errorMsg);
        }
    } catch (error) {
        console.error("[Lottery] Error:", error);
        if (modal) modal.remove();
        alert("Error de conexión: " + error.message);
    }
}

// Show lottery results with animation
function showLotteryResults(data) {
    var modal = document.getElementById("lotteryCountdownModal");
    if (!modal) return;
    
    var assignmentsHtml = data.assignments.map(function(a) {
        return "<div style=\"display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; margin: 8px 0;\">" +
            "<div style=\"width: 36px; height: 36px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;\">" + a.new_position + "</div>" +
            "<div style=\"color: white; font-weight: 500;\">" + (a.display_name || "Usuario") + "</div>" +
        "</div>";
    }).join("");
    
    modal.innerHTML = 
        "<div style=\"text-align: center; max-width: 400px; width: 90%;\">" +
            "<div style=\"font-size: 4rem; margin-bottom: 16px;\">🎉</div>" +
            "<div style=\"font-size: 1.5rem; color: #10b981; font-weight: bold; margin-bottom: 8px;\">¡Tómbola completada!</div>" +
            "<div style=\"color: #9ca3af; margin-bottom: 20px;\">" + data.assigned_count + " posiciones asignadas • " + data.locked_count + " bloqueadas</div>" +
            "<div style=\"max-height: 300px; overflow-y: auto;\">" + assignmentsHtml + "</div>" +
            "<button onclick=\"closeLotteryAndRefresh()\" style=\"margin-top: 20px; padding: 12px 40px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600;\">Aceptar</button>" +
        "</div>";
}

// Close lottery modal and refresh turns list
async function closeLotteryAndRefresh() {
    var modal = document.getElementById("lotteryCountdownModal");
    if (modal) modal.remove();
    
    // Reload members to get updated positions
    await loadTurnsMembers(manageTurnsGroupId);
}

// Make functions global
window.getLotteryUserId = getLotteryUserId;
window.toggleTurnLock = toggleTurnLock;
window.startLotteryCountdown = startLotteryCountdown;
window.cancelLottery = cancelLottery;
window.executeLottery = executeLottery;
window.showLotteryResults = showLotteryResults;
window.closeLotteryAndRefresh = closeLotteryAndRefresh;

console.log("[Lottery] Lottery functions loaded v2");
