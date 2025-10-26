/**
 * 💳 LA TANDA PAYMENT GATEWAY INTEGRATION SYSTEM
 * Complete payment gateway management and processing API endpoints
 */

const { body, param, query } = require('express-validator');

// ====================================
// 💳 PAYMENT GATEWAY MANAGEMENT ENDPOINTS
// ====================================

// Get available payment gateways
app.get('/api/payment/gateways', authenticateToken, requireRole(['administrator']), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                id,
                gateway_name,
                gateway_type,
                provider_name,
                is_active,
                is_default,
                priority_order,
                supports_recurring,
                supports_refunds,
                min_amount,
                max_amount,
                fixed_fee,
                percentage_fee,
                supported_currencies,
                default_currency,
                health_status,
                error_rate_percentage,
                last_health_check,
                created_at
            FROM payment_gateways
            ORDER BY priority_order ASC, gateway_name ASC
        `);

        res.json({
            success: true,
            data: {
                gateways: result.rows,
                count: result.rows.length
            }
        });

    } catch (error) {
        logger.error('Get payment gateways error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get payment gateways', code: 500 }
        });
    }
});

// Create payment gateway configuration
app.post('/api/payment/gateways', authenticateToken, requireRole(['administrator']), [
    body('gateway_name').isLength({ min: 2, max: 100 }).withMessage('Gateway name required'),
    body('gateway_type').isIn(['stripe', 'paypal', 'bank_transfer', 'mobile_money', 'crypto', 'local_processor']).withMessage('Valid gateway type required'),
    body('provider_name').isLength({ min: 2, max: 100 }).withMessage('Provider name required'),
    body('is_active').optional().isBoolean().withMessage('Active status must be boolean'),
    body('percentage_fee').optional().isFloat({ min: 0, max: 1 }).withMessage('Percentage fee must be between 0 and 1')
], handleValidationErrors, async (req, res) => {
    try {
        const {
            gateway_name, gateway_type, provider_name, is_active = true,
            api_base_url, public_key, private_key, merchant_id,
            min_amount = 1.00, max_amount, fixed_fee = 0.00, percentage_fee = 0.029,
            supported_currencies = ['HNL', 'USD'], default_currency = 'HNL',
            supports_recurring = false, supports_refunds = true
        } = req.body;

        // Check for duplicate gateway name
        const duplicateCheck = await db.query(`
            SELECT id FROM payment_gateways WHERE gateway_name = $1
        `, [gateway_name]);

        if (duplicateCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'Gateway name already exists', code: 400 }
            });
        }

        // Create gateway
        const result = await db.query(`
            INSERT INTO payment_gateways (
                gateway_name, gateway_type, provider_name, is_active,
                api_base_url, public_key, private_key, merchant_id,
                min_amount, max_amount, fixed_fee, percentage_fee,
                supported_currencies, default_currency,
                supports_recurring, supports_refunds,
                created_by
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
            ) RETURNING id, gateway_name, gateway_type, provider_name
        `, [
            gateway_name, gateway_type, provider_name, is_active,
            api_base_url, public_key, private_key, merchant_id,
            min_amount, max_amount, fixed_fee, percentage_fee,
            supported_currencies, default_currency,
            supports_recurring, supports_refunds,
            req.user.id
        ]);

        logger.info('Payment gateway created', {
            gateway_id: result.rows[0].id,
            gateway_name: result.rows[0].gateway_name,
            gateway_type: result.rows[0].gateway_type,
            created_by: req.user.id
        });

        res.status(201).json({
            success: true,
            data: {
                gateway: result.rows[0]
            },
            message: 'Payment gateway created successfully'
        });

    } catch (error) {
        logger.error('Create payment gateway error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to create payment gateway', code: 500 }
        });
    }
});

// Select optimal gateway for payment
app.post('/api/payment/gateways/select', authenticateToken, [
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Valid currency code required'),
    body('payment_type').optional().isLength({ min: 2 }).withMessage('Valid payment type required'),
    body('country_code').optional().isLength({ min: 2, max: 2 }).withMessage('Valid country code required')
], handleValidationErrors, async (req, res) => {
    try {
        const { amount, currency = 'HNL', payment_type = 'card', country_code = 'HN' } = req.body;

        // Select optimal gateway
        const gatewayResult = await db.query(`
            SELECT select_optimal_gateway($1, $2, $3, $4) as gateway_id
        `, [amount, currency, payment_type, country_code]);

        const gatewayId = gatewayResult.rows[0].gateway_id;

        if (!gatewayId) {
            return res.status(400).json({
                success: false,
                error: { message: 'No suitable payment gateway found', code: 400 }
            });
        }

        // Get gateway details and calculate fees
        const gatewayDetails = await db.query(`
            SELECT 
                id, gateway_name, gateway_type, provider_name,
                min_amount, max_amount, fixed_fee, percentage_fee,
                supported_currencies, default_currency
            FROM payment_gateways 
            WHERE id = $1
        `, [gatewayId]);

        const feeCalculation = await db.query(`
            SELECT calculate_gateway_fees($1, $2) as fee_breakdown
        `, [gatewayId, amount]);

        res.json({
            success: true,
            data: {
                selected_gateway: gatewayDetails.rows[0],
                fee_breakdown: feeCalculation.rows[0].fee_breakdown,
                selection_criteria: {
                    amount,
                    currency,
                    payment_type,
                    country_code
                }
            }
        });

    } catch (error) {
        logger.error('Select payment gateway error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to select payment gateway', code: 500 }
        });
    }
});

// ====================================
// 💸 PAYMENT TRANSACTION PROCESSING ENDPOINTS
// ====================================

// Create payment transaction
app.post('/api/payment/transactions/create', authenticateToken, [
    body('contribution_id').isUUID().withMessage('Valid contribution ID required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Valid currency code required'),
    body('gateway_id').optional().isUUID().withMessage('Valid gateway ID required'),
    body('payment_method_details').optional().isObject().withMessage('Payment method details must be object')
], handleValidationErrors, async (req, res) => {
    try {
        const {
            contribution_id, amount, currency = 'HNL',
            gateway_id, payment_method_details = {}
        } = req.body;

        // Verify contribution belongs to user or user is admin
        const contributionCheck = await db.query(`
            SELECT c.*, g.name as group_name
            FROM contributions c
            JOIN groups g ON c.group_id = g.id
            WHERE c.id = $1 AND (c.user_id = $2 OR $3 = 'administrator')
        `, [contribution_id, req.user.id, req.user.role]);

        if (contributionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied to contribution', code: 403 }
            });
        }

        const contribution = contributionCheck.rows[0];

        if (contribution.status === 'completed') {
            return res.status(400).json({
                success: false,
                error: { message: 'Contribution already paid', code: 400 }
            });
        }

        // Select gateway if not provided
        let selectedGatewayId = gateway_id;
        if (!selectedGatewayId) {
            const gatewayResult = await db.query(`
                SELECT select_optimal_gateway($1, $2, 'card', 'HN') as gateway_id
            `, [amount, currency]);
            selectedGatewayId = gatewayResult.rows[0].gateway_id;
        }

        if (!selectedGatewayId) {
            return res.status(400).json({
                success: false,
                error: { message: 'No suitable payment gateway available', code: 400 }
            });
        }

        // Create payment attempt record
        const paymentAttemptResult = await db.query(`
            INSERT INTO payment_attempts (
                contribution_id, amount, currency, status,
                processor, attempted_at
            ) VALUES (
                $1, $2, $3, 'pending', 'gateway', NOW()
            ) RETURNING id
        `, [contribution_id, amount, currency]);

        const paymentAttemptId = paymentAttemptResult.rows[0].id;

        // Create gateway transaction
        const transactionResult = await db.query(`
            SELECT create_gateway_transaction($1, $2, $3, $4, $5, $6, $7) as transaction_id
        `, [
            contribution_id,
            paymentAttemptId,
            selectedGatewayId,
            amount,
            currency,
            req.ip,
            JSON.stringify(payment_method_details)
        ]);

        const transactionId = transactionResult.rows[0].transaction_id;

        // Get created transaction details
        const transactionDetails = await db.query(`
            SELECT 
                gt.*,
                pg.gateway_name,
                pg.provider_name,
                pg.gateway_type
            FROM gateway_transactions gt
            JOIN payment_gateways pg ON gt.gateway_id = pg.id
            WHERE gt.id = $1
        `, [transactionId]);

        logger.info('Payment transaction created', {
            transaction_id: transactionId,
            contribution_id,
            gateway_id: selectedGatewayId,
            amount,
            currency,
            user_id: req.user.id
        });

        res.status(201).json({
            success: true,
            data: {
                transaction: transactionDetails.rows[0],
                next_action: 'redirect_to_gateway', // In production, this would be gateway-specific
                client_secret: 'placeholder_secret' // In production, this would be from gateway
            },
            message: 'Payment transaction created successfully'
        });

    } catch (error) {
        logger.error('Create payment transaction error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to create payment transaction', code: 500 }
        });
    }
});

// Update transaction status (for webhook or manual updates)
app.put('/api/payment/transactions/:transactionId/status', authenticateToken, requireRole(['administrator', 'system']), [
    param('transactionId').isUUID().withMessage('Valid transaction ID required'),
    body('status').isIn(['pending', 'processing', 'requires_action', 'requires_confirmation', 'succeeded', 'failed', 'canceled']).withMessage('Valid status required'),
    body('gateway_transaction_id').optional().isLength({ min: 1 }).withMessage('Gateway transaction ID required'),
    body('failure_reason').optional().isLength({ max: 255 }).withMessage('Failure reason must be under 255 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { status, gateway_transaction_id, gateway_response = {}, failure_reason } = req.body;

        // Update transaction status
        const updateResult = await db.query(`
            SELECT update_gateway_transaction_status($1, $2, $3, $4, $5) as success
        `, [
            transactionId,
            status,
            gateway_transaction_id,
            JSON.stringify(gateway_response),
            failure_reason
        ]);

        if (!updateResult.rows[0].success) {
            return res.status(400).json({
                success: false,
                error: { message: 'Failed to update transaction status', code: 400 }
            });
        }

        // If successful, update related contribution
        if (status === 'succeeded') {
            await db.query(`
                UPDATE contributions 
                SET status = 'completed', paid_date = NOW()
                WHERE id = (
                    SELECT contribution_id FROM gateway_transactions WHERE id = $1
                )
            `, [transactionId]);

            await db.query(`
                UPDATE payment_attempts 
                SET status = 'completed', completed_at = NOW()
                WHERE id = (
                    SELECT payment_attempt_id FROM gateway_transactions WHERE id = $1
                )
            `, [transactionId]);
        }

        logger.info('Payment transaction status updated', {
            transaction_id: transactionId,
            new_status: status,
            gateway_transaction_id,
            updated_by: req.user.id
        });

        res.json({
            success: true,
            data: {
                transaction_id: transactionId,
                status: status
            },
            message: 'Transaction status updated successfully'
        });

    } catch (error) {
        logger.error('Update transaction status error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to update transaction status', code: 500 }
        });
    }
});

// Get payment transaction details
app.get('/api/payment/transactions/:transactionId', authenticateToken, [
    param('transactionId').isUUID().withMessage('Valid transaction ID required')
], handleValidationErrors, async (req, res) => {
    try {
        const { transactionId } = req.params;

        // Get transaction details
        const result = await db.query(`
            SELECT 
                gt.*,
                pg.gateway_name,
                pg.provider_name,
                pg.gateway_type,
                c.user_id as contribution_user_id,
                g.name as group_name
            FROM gateway_transactions gt
            JOIN payment_gateways pg ON gt.gateway_id = pg.id
            LEFT JOIN contributions c ON gt.contribution_id = c.id
            LEFT JOIN groups g ON c.group_id = g.id
            WHERE gt.id = $1
        `, [transactionId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Transaction not found', code: 404 }
            });
        }

        const transaction = result.rows[0];

        // Verify access
        if (transaction.contribution_user_id !== req.user.id && req.user.role !== 'administrator') {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied to transaction', code: 403 }
            });
        }

        res.json({
            success: true,
            data: {
                transaction: transaction
            }
        });

    } catch (error) {
        logger.error('Get payment transaction error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get payment transaction', code: 500 }
        });
    }
});

// ====================================
// 🔗 WEBHOOK MANAGEMENT ENDPOINTS
// ====================================

// Receive webhook from payment gateway
app.post('/api/payment/webhooks/:gatewayName', [
    param('gatewayName').isLength({ min: 2 }).withMessage('Valid gateway name required')
], handleValidationErrors, async (req, res) => {
    try {
        const { gatewayName } = req.params;
        const payload = req.body;
        const signature = req.headers['stripe-signature'] || req.headers['paypal-signature'] || req.headers['signature'];

        // Get gateway by name
        const gatewayResult = await db.query(`
            SELECT id, webhook_secret FROM payment_gateways 
            WHERE gateway_name = $1 AND is_active = TRUE
        `, [gatewayName]);

        if (gatewayResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Gateway not found or inactive', code: 404 }
            });
        }

        const gateway = gatewayResult.rows[0];

        // Process webhook
        const webhookResult = await db.query(`
            SELECT process_webhook_event($1, $2, $3, $4, $5) as webhook_id
        `, [
            gateway.id,
            payload.type || payload.event_type || 'unknown',
            JSON.stringify(payload),
            signature,
            req.ip
        ]);

        const webhookId = webhookResult.rows[0].webhook_id;

        logger.info('Webhook received', {
            webhook_id: webhookId,
            gateway_name: gatewayName,
            event_type: payload.type || payload.event_type,
            source_ip: req.ip
        });

        // Respond quickly to gateway
        res.status(200).json({
            success: true,
            webhook_id: webhookId,
            message: 'Webhook received'
        });

        // Process webhook asynchronously (in production, use a queue)
        setImmediate(async () => {
            try {
                // Update webhook as processed
                await db.query(`
                    UPDATE payment_webhooks 
                    SET processing_status = 'processed', 
                        processed_at = NOW() 
                    WHERE id = $1
                `, [webhookId]);
            } catch (error) {
                logger.error('Webhook processing error:', error);
            }
        });

    } catch (error) {
        logger.error('Webhook receive error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to process webhook', code: 500 }
        });
    }
});

// Get webhook events for a gateway
app.get('/api/payment/gateways/:gatewayId/webhooks', authenticateToken, requireRole(['administrator']), [
    param('gatewayId').isUUID().withMessage('Valid gateway ID required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isLength({ min: 2 }).withMessage('Valid status required')
], handleValidationErrors, async (req, res) => {
    try {
        const { gatewayId } = req.params;
        const { limit = 20, status } = req.query;

        // Build query with optional status filter
        let query = `
            SELECT 
                id, webhook_event_id, event_type, processing_status,
                signature_valid, received_at, processed_at,
                processing_attempts, error_count, last_error
            FROM payment_webhooks
            WHERE gateway_id = $1
        `;

        const params = [gatewayId];

        if (status) {
            query += ` AND processing_status = $${params.length + 1}`;
            params.push(status);
        }

        query += ` ORDER BY received_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: {
                webhooks: result.rows,
                count: result.rows.length,
                filters: { status }
            }
        });

    } catch (error) {
        logger.error('Get gateway webhooks error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get gateway webhooks', code: 500 }
        });
    }
});

module.exports = {
    // Export any utility functions if needed
};