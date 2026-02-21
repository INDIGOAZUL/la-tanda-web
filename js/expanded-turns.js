// Expanded Turns System v3.0
// Allows individual position ordering and locking

(function() {
    "use strict";
    
    window.expandedTurns = [];
    
    // Expand members into individual position slots
    window.expandMembersToPositions = function(members) {
        var expanded = [];
        members.forEach(function(member) {
            var numPos = parseInt(member.num_positions) || 1;
            var posLocks = member.position_locks || [];
            
            for (var slot = 0; slot < numPos; slot++) {
                var lockInfo = posLocks[slot] || {};
                expanded.push({
                    user_id: member.user_id,
                    name: member.name || member.full_name || member.username || "Usuario",
                    role: member.role,
                    slot_index: slot,
                    total_slots: numPos,
                    turn_locked: lockInfo.locked === true,
                    original_member: member
                });
            }
        });
        return expanded;
    };
    
    // Collapse expanded positions back to member format - PRESERVES ORDER
    window.collapsePositionsToMembers = function(expanded) {
        var memberMap = {};
        var memberOrder = [];  // Track order of first appearance
        
        // First pass: build member data in order of FIRST appearance
        expanded.forEach(function(pos, index) {
            var uid = pos.user_id;
            
            if (!memberMap[uid]) {
                memberMap[uid] = {
                    user_id: uid,
                    name: pos.name,
                    role: pos.role,
                    num_positions: 0,
                    turn_locked: false,
                    position_locks: [],
                    first_position: index  // Track where this member first appears
                };
                memberOrder.push(uid);  // Preserve order of first appearance
            }
            
            memberMap[uid].num_positions++;
            memberMap[uid].position_locks.push({
                slot: memberMap[uid].position_locks.length,
                turn_number: index + 1,
                locked: pos.turn_locked
            });
            
            if (pos.turn_locked) memberMap[uid].turn_locked = true;
        });
        
        // Return members in order of their first appearance in expanded list
        return memberOrder.map(function(uid) {
            return memberMap[uid];
        });
    };
    
    // Add a position for a member
    window.addPositionForMember = function(userId) {
        if (!window.expandedTurns) return;
        
        var userPositions = window.expandedTurns.filter(function(p) { return p.user_id === userId; });
        if (userPositions.length === 0) return;
        
        var lastPos = userPositions[userPositions.length - 1];
        var newTotalSlots = userPositions.length + 1;
        
        // Find index of last position for this user
        var lastIndex = window.expandedTurns.indexOf(lastPos);
        
        // Update total_slots for all existing positions
        window.expandedTurns.forEach(function(p) {
            if (p.user_id === userId) {
                p.total_slots = newTotalSlots;
            }
        });
        
        // Insert new position right after the last one for this user
        var newPos = {
            user_id: userId,
            name: lastPos.name,
            role: lastPos.role,
            slot_index: newTotalSlots - 1,
            total_slots: newTotalSlots,
            turn_locked: false,
            original_member: lastPos.original_member
        };
        
        window.expandedTurns.splice(lastIndex + 1, 0, newPos);
        
        if (typeof renderTurnsList === "function") renderTurnsList();
    };
    
    // Remove a position for a member (- button, requires at least 2 positions)
    window.removePositionForMember = function(userId, slotIndex) {
        if (!window.expandedTurns) return;

        var userPositions = window.expandedTurns.filter(function(p) { return p.user_id === userId; });
        if (userPositions.length <= 1) return;

        // Find and remove the specific position
        var posToRemove = userPositions.find(function(p) { return p.slot_index === slotIndex; });
        if (posToRemove) {
            var idx = window.expandedTurns.indexOf(posToRemove);
            if (idx > -1) {
                window.expandedTurns.splice(idx, 1);
            }
        }

        // Reindex slot_index for this user's remaining positions
        var newTotal = userPositions.length - 1;
        var slotCounter = 0;
        window.expandedTurns.forEach(function(p) {
            if (p.user_id === userId) {
                p.slot_index = slotCounter++;
                p.total_slots = newTotal;
            }
        });

        if (typeof renderTurnsList === "function") renderTurnsList();
    };

    // Remove ALL positions for a member (X button, removes from turns entirely)
    window.removeMemberFromTurns = function(userId) {
        if (!window.expandedTurns) return;

        var displayName = 'este miembro';
        var pos = window.expandedTurns.find(function(p) { return p.user_id === userId; });
        if (pos && pos.name && pos.name !== 'Usuario') displayName = pos.name;

        if (!confirm('Eliminar a ' + displayName + ' de los turnos?')) return;

        window.expandedTurns = window.expandedTurns.filter(function(p) { return p.user_id !== userId; });

        if (typeof renderTurnsList === "function") renderTurnsList();
    };
    
})();
