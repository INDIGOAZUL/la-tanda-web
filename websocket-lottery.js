/**
 * WebSocket Server for La Tanda Live Lottery System
 * Provides real-time synchronized countdown and assignment animations
 * 
 * Created: 2025-12-26
 * Version: 1.0.0
 */

const WebSocket = require("ws");

// Store for active connections organized by group
const groupRooms = new Map(); // groupId -> Set of WebSocket connections
const userConnections = new Map(); // odUserId -> WebSocket connection

let wss = null;

/**
 * Initialize WebSocket server on existing HTTP server
 */
function initWebSocketServer(server) {
    wss = new WebSocket.Server({ 
        server,
        path: "/ws/lottery"
    });


    wss.on("connection", (ws, req) => {
        
        // Parse query params
        const url = new URL(req.url, "http://localhost");
        const token = url.searchParams.get("token");
        const groupId = url.searchParams.get("groupId");

        if (!groupId) {
            ws.close(4001, "groupId required");
            return;
        }

        // Verify JWT token - reject unauthenticated connections
        let userId;
        try {
            const jwt = require("jsonwebtoken");
            const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
            userId = String(decoded.userId || decoded.id || decoded.sub);
        } catch (err) {
            ws.send(JSON.stringify({ type: "error", message: "Autenticacion requerida" }));
            ws.close(4001, "Invalid token");
            return;
        }

        // Store connection info on the socket
        ws.groupId = groupId;
        ws.userId = userId;
        ws.isAlive = true;

        // Add to group room
        if (!groupRooms.has(groupId)) {
            groupRooms.set(groupId, new Set());
        }
        groupRooms.get(groupId).add(ws);

        // Track user connection
        if (userId) {
            userConnections.set(userId, ws);
        }


        // Send welcome message
        ws.send(JSON.stringify({
            type: "connected",
            message: "Conectado al sistema de tombola en vivo",
            groupId: groupId,
            roomSize: groupRooms.get(groupId).size
        }));

        // Broadcast room size update to all in room
        broadcastToGroup(groupId, {
            type: "room_update",
            roomSize: groupRooms.get(groupId).size
        });

        // Handle pong for heartbeat
        ws.on("pong", () => {
            ws.isAlive = true;
        });

        // Handle incoming messages
        ws.on("message", (message) => {
            try {
                const data = JSON.parse(message);
                handleMessage(ws, data);
            } catch (e) {
            }
        });

        // Handle disconnect
        ws.on("close", () => {
            if (ws.groupId && groupRooms.has(ws.groupId)) {
                groupRooms.get(ws.groupId).delete(ws);
                
                // Broadcast updated room size
                broadcastToGroup(ws.groupId, {
                    type: "room_update",
                    roomSize: groupRooms.get(ws.groupId).size
                });

                // Clean up empty rooms
                if (groupRooms.get(ws.groupId).size === 0) {
                    groupRooms.delete(ws.groupId);
                }
            }
            if (ws.userId) {
                userConnections.delete(ws.userId);
            }
        });

        ws.on("error", (error) => {
        });
    });

    // Heartbeat to detect dead connections
    const heartbeatInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on("close", () => {
        clearInterval(heartbeatInterval);
    });

    return wss;
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(ws, data) {
    switch (data.type) {
        case "ping":
            ws.send(JSON.stringify({ type: "pong" }));
            break;
        case "join_room":
            // Already handled on connection
            break;
        default:
    }
}

/**
 * Broadcast message to all connections in a group
 */
function broadcastToGroup(groupId, message) {
    if (!groupRooms.has(groupId)) return 0;
    
    const messageStr = JSON.stringify(message);
    let sent = 0;
    
    groupRooms.get(groupId).forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(messageStr);
            sent++;
        }
    });
    
    return sent;
}

/**
 * Send message to specific user
 */
function sendToUser(userId, message) {
    const ws = userConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        return true;
    }
    return false;
}

/**
 * Start live lottery countdown for a group
 * This broadcasts countdown ticks to all connected users
 */
function startLiveCountdown(groupId, countdownSeconds, groupName) {
    
    // Broadcast countdown start
    broadcastToGroup(groupId, {
        type: "countdown_start",
        groupId: groupId,
        groupName: groupName,
        totalSeconds: countdownSeconds,
        timestamp: Date.now()
    });

    let remaining = countdownSeconds;
    
    const countdownInterval = setInterval(() => {
        remaining--;
        
        broadcastToGroup(groupId, {
            type: "countdown_tick",
            remaining: remaining,
            timestamp: Date.now()
        });

        if (remaining <= 0) {
            clearInterval(countdownInterval);
            broadcastToGroup(groupId, {
                type: "countdown_complete",
                message: "Ejecutando tombola...",
                timestamp: Date.now()
            });
        }
    }, 1000);

    return countdownInterval;
}

/**
 * Broadcast lottery execution start
 */
function broadcastLotteryStart(groupId, groupName) {
    broadcastToGroup(groupId, {
        type: "lottery_executing",
        groupId: groupId,
        groupName: groupName,
        message: "Mezclando turnos...",
        timestamp: Date.now()
    });
}

/**
 * Broadcast individual turn assignment (one by one animation)
 */
function broadcastTurnAssignment(groupId, position, userId, userName, totalPositions, delay = 0) {
    setTimeout(() => {
        broadcastToGroup(groupId, {
            type: "turn_assigned",
            position: position,
            userId: userId,
            userName: userName,
            totalPositions: totalPositions,
            timestamp: Date.now()
        });

        // Also send personal notification to the user
        sendToUser(userId, {
            type: "your_turn_assigned",
            position: position,
            totalPositions: totalPositions,
            message: `Tu turno asignado es #${position} de ${totalPositions}`,
            timestamp: Date.now()
        });
    }, delay);
}

/**
 * Broadcast lottery completion with all results
 */
function broadcastLotteryComplete(groupId, results, groupName) {
    broadcastToGroup(groupId, {
        type: "lottery_complete",
        groupId: groupId,
        groupName: groupName,
        results: results,
        totalPositions: results.length,
        message: "Tombola completada!",
        timestamp: Date.now()
    });
}

/**
 * Execute full lottery sequence with real-time broadcasting
 * @param {string} groupId - Group ID
 * @param {string} groupName - Group name for display
 * @param {Array} members - Array of {user_id, name} objects in order
 * @param {number} countdownSeconds - Seconds for countdown
 * @param {number} assignmentDelay - Delay between each assignment (ms)
 */
async function executeLiveLottery(groupId, groupName, members, countdownSeconds = 10, assignmentDelay = 800) {

    // 1. Start countdown
    await new Promise((resolve) => {
        let remaining = countdownSeconds;
        
        broadcastToGroup(groupId, {
            type: "countdown_start",
            groupId: groupId,
            groupName: groupName,
            totalSeconds: countdownSeconds,
            timestamp: Date.now()
        });

        const interval = setInterval(() => {
            remaining--;
            
            broadcastToGroup(groupId, {
                type: "countdown_tick",
                remaining: remaining,
                timestamp: Date.now()
            });

            if (remaining <= 0) {
                clearInterval(interval);
                resolve();
            }
        }, 1000);
    });

    // 2. Broadcast mixing animation
    broadcastLotteryStart(groupId, groupName);
    await sleep(2000); // 2 seconds mixing animation

    // 3. Broadcast each assignment one by one
    const results = [];
    for (let i = 0; i < members.length; i++) {
        const member = members[i];
        
        // Format name with position indicator if member has multiple positions
        var displayName = member.name;
        if (member.total_positions && member.total_positions > 1) {
            displayName = member.name + " " + member.position_number + "/" + member.total_positions;
        }
        const position = i + 1;
        
        results.push({
            position: position,
            user_id: member.user_id,
            name: displayName
        });

        broadcastToGroup(groupId, {
            type: "turn_assigned",
            position: position,
            userId: member.user_id,
            userName: displayName,
            totalPositions: members.length,
            timestamp: Date.now()
        });

        // Send personal notification
        sendToUser(member.user_id, {
            type: "your_turn_assigned",
            position: position,
            totalPositions: members.length,
            message: `Tu turno asignado es #${position} de ${members.length}`,
            timestamp: Date.now()
        });

        await sleep(assignmentDelay);
    }

    // 4. Broadcast completion
    await sleep(500);
    broadcastLotteryComplete(groupId, results, groupName);

    return results;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get room statistics
 */
function getRoomStats(groupId) {
    if (!groupRooms.has(groupId)) {
        return { connected: 0, exists: false };
    }
    return {
        connected: groupRooms.get(groupId).size,
        exists: true
    };
}

/**
 * Get all room statistics
 */
function getAllStats() {
    const stats = {
        totalConnections: 0,
        rooms: {}
    };
    
    groupRooms.forEach((connections, groupId) => {
        stats.rooms[groupId] = connections.size;
        stats.totalConnections += connections.size;
    });
    
    return stats;
}

module.exports = {
    initWebSocketServer,
    broadcastToGroup,
    sendToUser,
    startLiveCountdown,
    broadcastLotteryStart,
    broadcastTurnAssignment,
    broadcastLotteryComplete,
    executeLiveLottery,
    getRoomStats,
    getAllStats
};
