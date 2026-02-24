/**
 * LA TANDA - Unified Database Interface
 * Hybrid: PostgreSQL for users/groups, JSON for other collections
 * Gradual migration strategy
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const postgres = require('./db-postgres.js');

const dbFile = path.join(__dirname, 'database.json');

// In-memory cache of JSON database
let jsonDatabase = null;

// Load JSON database
const loadJsonDatabase = () => {
    try {
        if (!jsonDatabase && fs.existsSync(dbFile)) {
            const data = fs.readFileSync(dbFile, 'utf8');
            jsonDatabase = JSON.parse(data);
            // JSON database loaded
        }
        return jsonDatabase;
    } catch (error) {
        // Failed to load JSON database
        return null;
    }
};

// Save JSON database (for non-migrated collections)
const saveJsonDatabase = () => {
    try {
        if (jsonDatabase) {
            fs.writeFileSync(dbFile, JSON.stringify(jsonDatabase, null, 2));
            // JSON database saved
        }
    } catch (error) {
        // Failed to save JSON database
    }
};

// Initialize
loadJsonDatabase();

// Auto-save JSON every 5 minutes
setInterval(saveJsonDatabase, 5 * 60 * 1000);
process.on('SIGINT', () => { saveJsonDatabase(); process.exit(0); });
process.on('SIGTERM', () => { saveJsonDatabase(); process.exit(0); });

/**
 * Unified Database Interface
 * Routes data access to PostgreSQL or JSON based on collection
 */
class UnifiedDatabase {
    constructor() {
        this.migratedCollections = ['users', 'groups']; // Collections moved to PostgreSQL
    }
    
    // ============================================
    // USER OPERATIONS (PostgreSQL)
    // ============================================
    
    async getUsers() {
        return await postgres.getUsers();
    }
    
    async getUserById(userId) {
        return await postgres.getUserById(userId);
    }
    
    async createUser(userData) {
        return await postgres.createUser(userData);
    }
    
    async updateUser(userId, updates) {
        return await postgres.updateUser(userId, updates);
    }

    async getUserByEmail(email) {
        return await postgres.getUserByEmail(email);
    }

    async updateUserPassword(userId, passwordHash) {
        return await postgres.updateUserPassword(userId, passwordHash);
    }

    async setPasswordResetToken(userId, token, expiresAt) {
        return await postgres.setPasswordResetToken(userId, token, expiresAt);
    }

    async getPasswordResetToken(userId) {
        return await postgres.getPasswordResetToken(userId);
    }

    async getUserByResetToken(token) {
        return await postgres.getUserByResetToken(token);
    }
    async setEmailVerificationCode(userId, code, expiresAt) {
        return await postgres.setEmailVerificationCode(userId, code, expiresAt);
    }

    async verifyEmailCode(userId, code) {
        return await postgres.verifyEmailCode(userId, code);
    }
    
    // Legacy sync: Get users from JSON (deprecated)
    getUsersFromJSON() {
        const db = loadJsonDatabase();
        return db?.users || [];
    }
    
    // ============================================
    // GROUP OPERATIONS (PostgreSQL)
    // ============================================
    
    async getGroups() {
        return await postgres.getGroups();
    }
    
    async getGroupById(groupId) {
        return await postgres.getGroupById(groupId);
    }
    
    async createGroup(groupData) {
        return await postgres.createGroup(groupData);
    }
    
    async updateGroup(groupId, updates) {
        return await postgres.updateGroup(groupId, updates);
    }

    // ============================================
    // GROUP MEMBERS OPERATIONS (PostgreSQL)
    // ============================================
    
    async getGroupMembers(groupId) {
        return await postgres.getGroupMembers(groupId);
    }
    
    async addGroupMember(memberData) {
        return await postgres.addGroupMember(memberData);
    }
    
    async updateGroupMember(groupId, userId, updates) {
        return await postgres.updateGroupMember(groupId, userId, updates);
    }
    
    async removeGroupMember(groupId, userId) {
        return await postgres.removeGroupMember(groupId, userId);
    }

    // ============================================
    // CONTRIBUTION OPERATIONS (PostgreSQL)
    // ============================================

    async getGroupContributions(groupId, options) {
        return await postgres.getGroupContributions(groupId, options);
    }

    async createContribution(contributionData) {
        return await postgres.createContribution(contributionData);
    }

    async updateContribution(contributionId, updates) {
        return await postgres.updateContribution(contributionId, updates);
    }

    // ============================================
    // INVITATION OPERATIONS (PostgreSQL)
    // ============================================

    async createGroupInvitation(data) {
        return await postgres.createGroupInvitation(data);
    }

    async getGroupInvitations(groupId, status) {
        return await postgres.getGroupInvitations(groupId, status);
    }

    async getInvitationByToken(token) {
        return await postgres.getInvitationByToken(token);
    }

    async updateInvitationStatus(id, status) {
        return await postgres.updateInvitationStatus(id, status);
    }
    
    // Legacy sync: Get groups from JSON (deprecated)
    getGroupsFromJSON() {
        const db = loadJsonDatabase();
        return db?.groups || [];
    }
    
    // ============================================
    // OTHER COLLECTIONS (JSON - Not yet migrated)
    // ============================================
    
    getCollection(collectionName) {
        const db = loadJsonDatabase();
        return db?.[collectionName] || [];
    }
    
    setCollection(collectionName, data) {
        const db = loadJsonDatabase();
        if (db) {
            db[collectionName] = data;
            saveJsonDatabase();
        }
    }
    
    addToCollection(collectionName, item) {
        const db = loadJsonDatabase();
        if (db) {
            if (!db[collectionName]) {
                db[collectionName] = [];
            }
            db[collectionName].push(item);
            saveJsonDatabase();
        }
    }
    
    updateInCollection(collectionName, itemId, updates, idField = 'id') {
        const db = loadJsonDatabase();
        if (db && db[collectionName]) {
            const index = db[collectionName].findIndex(item => item[idField] === itemId);
            if (index !== -1) {
                db[collectionName][index] = { ...db[collectionName][index], ...updates };
                saveJsonDatabase();
                return true;
            }
        }
        return false;
    }
    
    removeFromCollection(collectionName, itemId, idField = 'id') {
        const db = loadJsonDatabase();
        if (db && db[collectionName]) {
            db[collectionName] = db[collectionName].filter(item => item[idField] !== itemId);
            saveJsonDatabase();
            return true;
        }
        return false;
    }
    
    // ============================================
    // DIRECT ACCESS (for backwards compatibility)
    // ============================================
    
    getRawDatabase() {
        return loadJsonDatabase();
    }
    
    saveRawDatabase() {
        saveJsonDatabase();
    }
}

module.exports = new UnifiedDatabase();
