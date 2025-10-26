/**
 * 📡 API ENDPOINTS CONTINUATION
 * All remaining endpoints to add to api-server-enhanced.js
 * Copy this content to complete the enhanced server
 */

// ====================================
// 👤 USER PROFILE ROUTES
// ====================================

app.post('/api/auth/logout', authenticateToken, (req, res) => {
    // In a real implementation, you'd invalidate the token in the database
    logger.info('User logged out', { userId: req.user.userId });
    
    res.json({
        success: true,
        data: {
            message: 'Logged out successfully'
        },
        meta: {
            timestamp: new Date().toISOString()
        }
    });
});

app.get('/api/users/profile', authenticateToken, (req, res) => {
    try {
        const user = db.users.get(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 404
                }
            });
        }

        // Don't send password hash
        const { password_hash, ...userProfile } = user;
        
        res.json({
            success: true,
            data: {
                user: userProfile
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch profile',
                code: 500
            }
        });
    }
});

app.put('/api/users/profile', [
    body('name').optional().trim().isLength({ min: 2 }).escape(),
    body('phone').optional().isMobilePhone()
], authenticateToken, handleValidationErrors, (req, res) => {
    try {
        const user = db.users.get(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 404
                }
            });
        }

        // Update allowed fields
        const { name, phone, bio } = req.body;
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (bio) user.bio = bio;
        
        user.updated_at = new Date().toISOString();
        db.users.set(req.user.userId, user);

        logger.info('Profile updated', { userId: req.user.userId });

        const { password_hash, ...userProfile } = user;
        
        res.json({
            success: true,
            data: {
                user: userProfile,
                message: 'Profile updated successfully'
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update profile',
                code: 500
            }
        });
    }
});

// ====================================
// 💰 WALLET ROUTES
// ====================================

app.get('/api/wallet', authenticateToken, (req, res) => {
    try {
        const wallet = Array.from(db.wallets.values()).find(w => w.user_id === req.user.userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Wallet not found',
                    code: 404
                }
            });
        }

        res.json({
            success: true,
            data: {
                wallet: {
                    id: wallet.id,
                    balance: wallet.balance,
                    currency: wallet.currency,
                    crypto_balances: wallet.crypto_balances,
                    is_verified: wallet.is_verified,
                    created_at: wallet.created_at
                }
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Wallet fetch error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch wallet',
                code: 500
            }
        });
    }
});

app.get('/api/wallet/transactions', authenticateToken, (req, res) => {
    try {
        const transactions = Array.from(db.transactions.values())
            .filter(t => t.user_id === req.user.userId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 50); // Limit to recent 50 transactions

        res.json({
            success: true,
            data: {
                transactions,
                total: transactions.length
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Transactions fetch error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch transactions',
                code: 500
            }
        });
    }
});

app.post('/api/wallet/transfer', [
    body('amount').isFloat({ min: 0.01 }),
    body('to_address').notEmpty(),
    body('currency').isIn(['HNL', 'USD', 'LTD', 'BTC', 'ETH'])
], authenticateToken, handleValidationErrors, (req, res) => {
    try {
        const { amount, to_address, currency, notes } = req.body;
        
        const wallet = Array.from(db.wallets.values()).find(w => w.user_id === req.user.userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Wallet not found',
                    code: 404
                }
            });
        }

        // Check balance
        const currentBalance = currency === 'HNL' || currency === 'USD' ? 
            wallet.balance : wallet.crypto_balances[currency] || 0;
            
        if (currentBalance < amount) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Insufficient balance',
                    code: 400
                }
            });
        }

        // Create transaction
        const transactionId = uuidv4();
        const transaction = {
            id: transactionId,
            user_id: req.user.userId,
            type: 'transfer',
            amount: amount,
            currency: currency,
            to_address: to_address,
            from_address: wallet.address || 'internal',
            status: 'completed',
            notes: notes || '',
            created_at: new Date().toISOString(),
            confirmation_code: `CONF${Math.floor(Math.random() * 1000000)}`
        };

        db.transactions.set(transactionId, transaction);

        // Update wallet balance
        if (currency === 'HNL' || currency === 'USD') {
            wallet.balance -= amount;
        } else {
            wallet.crypto_balances[currency] -= amount;
        }
        db.wallets.set(wallet.id, wallet);

        logger.info('Transfer completed', { 
            userId: req.user.userId, 
            amount, 
            currency, 
            transactionId 
        });

        res.status(201).json({
            success: true,
            data: {
                transaction: {
                    id: transaction.id,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    status: transaction.status,
                    confirmation_code: transaction.confirmation_code,
                    created_at: transaction.created_at
                },
                message: 'Transfer completed successfully'
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        logger.error('Transfer error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Transfer failed',
                code: 500
            }
        });
    }
});

// ====================================
// 👥 GROUP MANAGEMENT ROUTES
// ====================================

app.get('/api/groups', authenticateToken, (req, res) => {
    try {
        const groups = Array.from(db.groups.values())
            .filter(g => g.status === 'active')
            .map(group => {
                const adminUser = db.users.get(group.admin_id);
                return {
                    ...group,
                    admin_name: adminUser ? adminUser.name : 'Unknown',
                    member_count: group.members ? group.members.length : 0
                };
            });

        res.json({
            success: true,
            data: groups,
            meta: {
                timestamp: new Date().toISOString(),
                total: groups.length
            }
        });
    } catch (error) {
        logger.error('Groups fetch error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch groups',
                code: 500
            }
        });
    }
});

app.post('/api/groups', [
    body('name').trim().isLength({ min: 3 }).escape(),
    body('contribution_amount').isFloat({ min: 1 }),
    body('max_members').isInt({ min: 2, max: 20 }),
    body('frequency').isIn(['weekly', 'monthly'])
], authenticateToken, handleValidationErrors, (req, res) => {
    try {
        const { name, description, contribution_amount, max_members, frequency, category } = req.body;

        const groupId = uuidv4();
        const group = {
            id: groupId,
            name,
            description: description || '',
            contribution_amount: parseFloat(contribution_amount),
            max_members: parseInt(max_members),
            frequency,
            category: category || 'general',
            admin_id: req.user.userId,
            members: [req.user.userId],
            status: 'active',
            created_at: new Date().toISOString(),
            location: 'Honduras',
            total_amount_collected: 0
        };

        db.groups.set(groupId, group);

        logger.info('Group created', { 
            groupId, 
            name, 
            adminId: req.user.userId 
        });

        res.status(201).json({
            success: true,
            data: {
                group: {
                    id: group.id,
                    name: group.name,
                    contribution_amount: group.contribution_amount,
                    frequency: group.frequency,
                    member_count: group.members.length,
                    max_members: group.max_members,
                    status: group.status,
                    created_at: group.created_at
                },
                message: 'Group created successfully'
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        logger.error('Group creation error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create group',
                code: 500
            }
        });
    }
});

app.post('/api/groups/:groupId/join', authenticateToken, (req, res) => {
    try {
        const { groupId } = req.params;
        const group = db.groups.get(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Group not found',
                    code: 404
                }
            });
        }

        if (group.members.includes(req.user.userId)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Already a member of this group',
                    code: 400
                }
            });
        }

        if (group.members.length >= group.max_members) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Group is full',
                    code: 400
                }
            });
        }

        group.members.push(req.user.userId);
        db.groups.set(groupId, group);

        logger.info('User joined group', { 
            userId: req.user.userId, 
            groupId 
        });

        res.json({
            success: true,
            data: {
                group: {
                    id: group.id,
                    name: group.name,
                    member_count: group.members.length,
                    your_position: group.members.length
                },
                message: 'Successfully joined group'
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        logger.error('Group join error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to join group',
                code: 500
            }
        });
    }
});

// ====================================
// 📋 KYC ROUTES
// ====================================

app.get('/api/kyc/status', authenticateToken, (req, res) => {
    try {
        const user = db.users.get(req.user.userId);
        const kycData = db.kyc.get(req.user.userId);

        res.json({
            success: true,
            data: {
                kyc_status: user?.kyc_status || 'pending',
                verification_level: user?.verification_level || 'basic',
                documents_submitted: kycData ? Object.keys(kycData.documents || {}).length : 0,
                last_update: kycData?.updated_at || null
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('KYC status error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch KYC status',
                code: 500
            }
        });
    }
});

app.post('/api/kyc/submit', [
    body('document_type').isIn(['id_card', 'passport', 'driver_license']),
    body('document_number').trim().notEmpty()
], authenticateToken, handleValidationErrors, (req, res) => {
    try {
        const { document_type, document_number, full_name, birth_date, address } = req.body;

        const kycId = uuidv4();
        const kycData = {
            id: kycId,
            user_id: req.user.userId,
            documents: {
                [document_type]: {
                    number: document_number,
                    verified: false,
                    submitted_at: new Date().toISOString()
                }
            },
            personal_info: {
                full_name,
                birth_date,
                address
            },
            status: 'under_review',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        db.kyc.set(req.user.userId, kycData);

        // Update user status
        const user = db.users.get(req.user.userId);
        if (user) {
            user.kyc_status = 'under_review';
            user.verification_level = 'pending';
            db.users.set(req.user.userId, user);
        }

        logger.info('KYC submitted', { 
            userId: req.user.userId, 
            documentType: document_type 
        });

        res.status(201).json({
            success: true,
            data: {
                kyc_id: kycId,
                status: 'under_review',
                message: 'KYC documents submitted successfully',
                estimated_review_time: '24-48 hours'
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        logger.error('KYC submission error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to submit KYC',
                code: 500
            }
        });
    }
});

// Continue in next file due to length...