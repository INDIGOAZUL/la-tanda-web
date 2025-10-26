#!/usr/bin/env node

/**
 * 🔗 LA TANDA REAL API SERVER
 * Servidor API real para todas las secciones del sistema
 * FASE 2: Integración completa funcional
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'latanda-web3-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// In-memory database (in production, use MongoDB/PostgreSQL)
const db = {
    users: new Map(),
    groups: new Map(),
    transactions: new Map(),
    kyc: new Map(),
    wallets: new Map(),
    notifications: new Map(),
    nfts: new Map(),
    commissions: new Map()
};

// Initialize some demo data
initializeDemoData();

// ====================================
// 🔐 AUTHENTICATION MIDDLEWARE
// ====================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// ====================================
// 📊 SYSTEM STATUS
// ====================================

app.get('/api/system/status', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'operational',
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            services: {
                auth: 'online',
                payments: 'online',
                groups: 'online',
                wallet: 'online',
                kyc: 'online',
                marketplace: 'online'
            }
        },
        message: 'La Tanda API funcionando correctamente'
    });
});

// ====================================
// 🔐 AUTHENTICATION ENDPOINTS
// ====================================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y contraseña son requeridos'
            });
        }

        // Check if user exists
        const existingUser = Array.from(db.users.values()).find(u => u.email === email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'El usuario ya existe'
            });
        }

        // Create user
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = {
            id: userId,
            name,
            email,
            phone: phone || '',
            password: hashedPassword,
            role: 'member',
            kycStatus: 'pending',
            walletAddress: generateWalletAddress(),
            createdAt: new Date().toISOString(),
            isActive: true
        };

        db.users.set(userId, user);

        // Create wallet
        const walletId = uuidv4();
        db.wallets.set(walletId, {
            id: walletId,
            userId,
            balance: 0,
            currency: 'USD',
            cryptoBalances: {
                LTD: 100, // Welcome bonus
                BTC: 0,
                ETH: 0
            },
            transactions: [],
            createdAt: new Date().toISOString()
        });

        // Generate token
        const token = jwt.sign(
            { userId, email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            data: {
                auth_token: token,
                user: {
                    id: userId,
                    name,
                    email,
                    role: user.role,
                    kycStatus: user.kycStatus,
                    walletAddress: user.walletAddress
                }
            },
            message: 'Usuario registrado exitosamente'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Find user
        const user = Array.from(db.users.values()).find(u => u.email === email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            data: {
                auth_token: token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    kycStatus: user.kycStatus,
                    walletAddress: user.walletAddress
                }
            },
            message: 'Login exitoso'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
    // In a real implementation, you might want to blacklist the token
    res.json({
        success: true,
        message: 'Logout exitoso'
    });
});

// ====================================
// 👤 USER ENDPOINTS
// ====================================

app.get('/api/users/profile', authenticateToken, (req, res) => {
    const user = db.users.get(req.user.userId);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }

    res.json({
        success: true,
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            kycStatus: user.kycStatus,
            walletAddress: user.walletAddress,
            createdAt: user.createdAt
        }
    });
});

app.put('/api/users/profile', authenticateToken, (req, res) => {
    const user = db.users.get(req.user.userId);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }

    const { name, phone } = req.body;
    
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.updatedAt = new Date().toISOString();

    db.users.set(req.user.userId, user);

    res.json({
        success: true,
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        },
        message: 'Perfil actualizado exitosamente'
    });
});

// ====================================
// 💰 WALLET ENDPOINTS
// ====================================

app.get('/api/wallet', authenticateToken, (req, res) => {
    const wallet = Array.from(db.wallets.values()).find(w => w.userId === req.user.userId);
    if (!wallet) {
        return res.status(404).json({
            success: false,
            message: 'Wallet no encontrado'
        });
    }

    res.json({
        success: true,
        data: wallet
    });
});

app.get('/api/wallet/transactions', authenticateToken, (req, res) => {
    const transactions = Array.from(db.transactions.values())
        .filter(t => t.userId === req.user.userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
        success: true,
        data: transactions
    });
});

app.post('/api/wallet/transfer', authenticateToken, (req, res) => {
    try {
        const { toAddress, amount, currency = 'USD', type = 'transfer' } = req.body;

        if (!toAddress || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Dirección destino y monto válido son requeridos'
            });
        }

        const wallet = Array.from(db.wallets.values()).find(w => w.userId === req.user.userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet no encontrado'
            });
        }

        if (wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Saldo insuficiente'
            });
        }

        // Create transaction
        const transactionId = uuidv4();
        const transaction = {
            id: transactionId,
            userId: req.user.userId,
            type,
            amount,
            currency,
            fromAddress: wallet.id,
            toAddress,
            status: 'completed',
            hash: generateTransactionHash(),
            createdAt: new Date().toISOString()
        };

        // Update wallet balance
        wallet.balance -= amount;
        wallet.transactions.push(transactionId);

        db.transactions.set(transactionId, transaction);
        db.wallets.set(wallet.id, wallet);

        res.json({
            success: true,
            data: transaction,
            message: 'Transferencia realizada exitosamente'
        });

    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({
            success: false,
            message: 'Error procesando transferencia'
        });
    }
});

// ====================================
// 👥 GROUPS ENDPOINTS
// ====================================

app.get('/api/groups', authenticateToken, (req, res) => {
    const userGroups = Array.from(db.groups.values())
        .filter(group => 
            group.members.includes(req.user.userId) || 
            group.createdBy === req.user.userId
        );

    res.json({
        success: true,
        data: userGroups
    });
});

app.post('/api/groups', authenticateToken, (req, res) => {
    try {
        const { name, description, maxMembers = 10, contributionAmount, frequency = 'monthly' } = req.body;

        if (!name || !contributionAmount) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y monto de contribución son requeridos'
            });
        }

        const groupId = uuidv4();
        const group = {
            id: groupId,
            name,
            description: description || '',
            maxMembers,
            contributionAmount,
            frequency,
            createdBy: req.user.userId,
            members: [req.user.userId],
            status: 'active',
            currentRound: 1,
            totalRounds: maxMembers,
            nextPaymentDate: calculateNextPaymentDate(frequency),
            createdAt: new Date().toISOString()
        };

        db.groups.set(groupId, group);

        res.status(201).json({
            success: true,
            data: group,
            message: 'Grupo creado exitosamente'
        });

    } catch (error) {
        console.error('Group creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando grupo'
        });
    }
});

app.post('/api/groups/:groupId/join', authenticateToken, (req, res) => {
    const { groupId } = req.params;
    const group = db.groups.get(groupId);

    if (!group) {
        return res.status(404).json({
            success: false,
            message: 'Grupo no encontrado'
        });
    }

    if (group.members.includes(req.user.userId)) {
        return res.status(400).json({
            success: false,
            message: 'Ya eres miembro de este grupo'
        });
    }

    if (group.members.length >= group.maxMembers) {
        return res.status(400).json({
            success: false,
            message: 'Grupo lleno'
        });
    }

    group.members.push(req.user.userId);
    group.updatedAt = new Date().toISOString();
    db.groups.set(groupId, group);

    res.json({
        success: true,
        data: group,
        message: 'Te has unido al grupo exitosamente'
    });
});

// ====================================
// 📋 KYC ENDPOINTS
// ====================================

app.get('/api/kyc/status', authenticateToken, (req, res) => {
    const user = db.users.get(req.user.userId);
    const kycData = db.kyc.get(req.user.userId);

    res.json({
        success: true,
        data: {
            status: user.kycStatus,
            level: kycData?.level || 'basic',
            verifiedFields: kycData?.verifiedFields || [],
            submittedAt: kycData?.submittedAt,
            reviewedAt: kycData?.reviewedAt
        }
    });
});

app.post('/api/kyc/submit', authenticateToken, (req, res) => {
    try {
        const { documentType, documentNumber, fullName, dateOfBirth, address } = req.body;

        if (!documentType || !documentNumber || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Información de KYC incompleta'
            });
        }

        const kycData = {
            userId: req.user.userId,
            level: 'intermediate',
            documentType,
            documentNumber,
            fullName,
            dateOfBirth,
            address,
            status: 'under_review',
            verifiedFields: ['email'],
            submittedAt: new Date().toISOString()
        };

        db.kyc.set(req.user.userId, kycData);

        // Update user status
        const user = db.users.get(req.user.userId);
        user.kycStatus = 'under_review';
        db.users.set(req.user.userId, user);

        res.json({
            success: true,
            data: kycData,
            message: 'Información KYC enviada para revisión'
        });

    } catch (error) {
        console.error('KYC submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error procesando KYC'
        });
    }
});

// ====================================
// 🏪 MARKETPLACE ENDPOINTS
// ====================================

app.get('/api/marketplace/nfts', (req, res) => {
    const nfts = Array.from(db.nfts.values());
    res.json({
        success: true,
        data: nfts
    });
});

app.post('/api/marketplace/nft/create', authenticateToken, (req, res) => {
    try {
        const { name, description, price, imageUrl, category = 'art' } = req.body;

        if (!name || !price) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y precio son requeridos'
            });
        }

        const nftId = uuidv4();
        const nft = {
            id: nftId,
            name,
            description: description || '',
            price,
            imageUrl: imageUrl || `https://picsum.photos/400/400?random=${nftId}`,
            category,
            creator: req.user.userId,
            owner: req.user.userId,
            isForSale: true,
            tokenId: generateTokenId(),
            createdAt: new Date().toISOString()
        };

        db.nfts.set(nftId, nft);

        res.status(201).json({
            success: true,
            data: nft,
            message: 'NFT creado exitosamente'
        });

    } catch (error) {
        console.error('NFT creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando NFT'
        });
    }
});

// ====================================
// 💼 COMMISSIONS ENDPOINTS
// ====================================

app.get('/api/commissions', authenticateToken, (req, res) => {
    const commissions = Array.from(db.commissions.values())
        .filter(c => c.userId === req.user.userId);

    const totalEarned = commissions.reduce((sum, c) => sum + c.amount, 0);

    res.json({
        success: true,
        data: {
            commissions,
            totalEarned,
            thisMonth: commissions
                .filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth())
                .reduce((sum, c) => sum + c.amount, 0)
        }
    });
});

// ====================================
// 🔔 NOTIFICATIONS ENDPOINTS
// ====================================

app.get('/api/notifications', authenticateToken, (req, res) => {
    const notifications = Array.from(db.notifications.values())
        .filter(n => n.userId === req.user.userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
        success: true,
        data: notifications
    });
});

app.post('/api/notifications/mark-read', authenticateToken, (req, res) => {
    const { notificationIds } = req.body;

    notificationIds.forEach(id => {
        const notification = db.notifications.get(id);
        if (notification && notification.userId === req.user.userId) {
            notification.isRead = true;
            notification.readAt = new Date().toISOString();
            db.notifications.set(id, notification);
        }
    });

    res.json({
        success: true,
        message: 'Notificaciones marcadas como leídas'
    });
});

// ====================================
// 📊 ANALYTICS ENDPOINTS
// ====================================

app.get('/api/analytics/dashboard', authenticateToken, (req, res) => {
    const wallet = Array.from(db.wallets.values()).find(w => w.userId === req.user.userId);
    const userGroups = Array.from(db.groups.values())
        .filter(g => g.members.includes(req.user.userId));
    const userTransactions = Array.from(db.transactions.values())
        .filter(t => t.userId === req.user.userId);
    const userCommissions = Array.from(db.commissions.values())
        .filter(c => c.userId === req.user.userId);

    res.json({
        success: true,
        data: {
            balance: wallet?.balance || 0,
            cryptoBalance: wallet?.cryptoBalances || {},
            activeGroups: userGroups.length,
            totalTransactions: userTransactions.length,
            totalCommissions: userCommissions.reduce((sum, c) => sum + c.amount, 0),
            monthlyActivity: generateMonthlyActivity(userTransactions)
        }
    });
});

// ====================================
// 🚀 START SERVER
// ====================================

app.listen(PORT, () => {
    console.log(`🚀 La Tanda Real API Server running on port ${PORT}`);
    console.log(`📊 System Status: http://localhost:${PORT}/api/system/status`);
    console.log(`📚 Available endpoints: ${Object.keys(db).length} collections initialized`);
});

// ====================================
// 🛠️ UTILITY FUNCTIONS
// ====================================

function initializeDemoData() {
    // Demo user
    const demoUserId = 'demo-user-123';
    const demoUser = {
        id: demoUserId,
        name: 'Usuario Demo',
        email: 'demo@latanda.com',
        password: bcrypt.hashSync('demo123', 10),
        role: 'member',
        kycStatus: 'verified',
        walletAddress: 'LTD1x' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        isActive: true
    };
    db.users.set(demoUserId, demoUser);

    // Demo wallet
    const demoWalletId = 'demo-wallet-123';
    db.wallets.set(demoWalletId, {
        id: demoWalletId,
        userId: demoUserId,
        balance: 1250.75,
        currency: 'USD',
        cryptoBalances: {
            LTD: 500,
            BTC: 0.001,
            ETH: 0.05
        },
        transactions: [],
        createdAt: new Date().toISOString()
    });

    // Demo group
    const demoGroupId = 'demo-group-123';
    db.groups.set(demoGroupId, {
        id: demoGroupId,
        name: 'Tanda Familiar',
        description: 'Grupo de ahorro familiar mensual',
        maxMembers: 5,
        contributionAmount: 100,
        frequency: 'monthly',
        createdBy: demoUserId,
        members: [demoUserId],
        status: 'active',
        currentRound: 1,
        totalRounds: 5,
        nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
    });

    // Demo NFTs
    for (let i = 1; i <= 3; i++) {
        const nftId = `demo-nft-${i}`;
        db.nfts.set(nftId, {
            id: nftId,
            name: `La Tanda NFT #${i}`,
            description: `Edición limitada #${i} del ecosistema La Tanda`,
            price: 50 + (i * 25),
            imageUrl: `https://picsum.photos/400/400?random=${i}`,
            category: 'collectible',
            creator: demoUserId,
            owner: demoUserId,
            isForSale: true,
            tokenId: 1000 + i,
            createdAt: new Date().toISOString()
        });
    }

    // Demo commissions
    const commissionId = 'demo-commission-123';
    db.commissions.set(commissionId, {
        id: commissionId,
        userId: demoUserId,
        type: 'referral',
        amount: 25.50,
        description: 'Comisión por referir nuevo miembro',
        groupId: demoGroupId,
        status: 'paid',
        createdAt: new Date().toISOString()
    });

    console.log('✅ Demo data initialized');
}

function generateWalletAddress() {
    return 'LTD1x' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function generateTransactionHash() {
    return '0x' + Math.random().toString(16).substr(2, 64);
}

function generateTokenId() {
    return Math.floor(Math.random() * 999999) + 100000;
}

function calculateNextPaymentDate(frequency) {
    const now = new Date();
    switch (frequency) {
        case 'weekly':
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        case 'monthly':
            return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();
        case 'biweekly':
            return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
        default:
            return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
}

function generateMonthlyActivity(transactions) {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthTransactions = transactions.filter(t => {
            const tDate = new Date(t.createdAt);
            return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
        });
        
        months.push({
            month: date.toLocaleDateString('es', { month: 'short' }),
            transactions: monthTransactions.length,
            amount: monthTransactions.reduce((sum, t) => sum + t.amount, 0)
        });
    }
    
    return months;
}

module.exports = app;