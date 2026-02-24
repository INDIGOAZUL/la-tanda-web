/**
 * La Tanda Marketplace API Module
 * Version: 4.6.1
 *
 * Categories:
 * - GET  /api/marketplace/categories
 *
 * Services:
 * - GET  /api/marketplace/services
 * - GET  /api/marketplace/services/:id
 * - POST /api/marketplace/services (create - requires provider)
 *
 * Products:
 * - GET  /api/marketplace/products
 * - GET  /api/marketplace/products/:id
 * - GET  /api/marketplace/products/my (auth required)
 * - POST /api/marketplace/products (auth required)
 * - PUT  /api/marketplace/products/:id (auth required)
 * - DELETE /api/marketplace/products/:id (auth required)
 * - POST /api/marketplace/products/:id/buy (auth required)
 *
 * Product Orders:
 * - GET  /api/marketplace/product-orders (auth required)
 * - PUT  /api/marketplace/product-orders/:id/status (seller auth)
 *
 * Providers:
 * - GET  /api/marketplace/providers
 * - GET  /api/marketplace/providers/:id
 * - POST /api/marketplace/providers/register
 * - GET  /api/marketplace/providers/me
 * - PUT  /api/marketplace/providers/me
 *
 * Bookings:
 * - GET  /api/marketplace/bookings
 * - GET  /api/marketplace/bookings/:id
 * - POST /api/marketplace/bookings
 * - PUT  /api/marketplace/bookings/:id/status
 *
 * Reviews:
 * - GET  /api/marketplace/reviews/:serviceId
 * - GET  /api/marketplace/providers/:id/reviews
 * - POST /api/marketplace/reviews
 *
 * Subscriptions:
 * - GET  /api/marketplace/subscription
 * - POST /api/marketplace/subscription/upgrade
 *
 * Favorites:
 * - GET  /api/marketplace/favorites
 * - POST /api/marketplace/favorites
 * - DELETE /api/marketplace/favorites
 *
 * Stats:
 * - GET  /api/marketplace/stats
 *
 * Referral/Affiliate:
 * - GET  /api/marketplace/referrals/my-code
 * - GET  /api/marketplace/referrals/link/:id?type=service|product
 * - POST /api/marketplace/referrals/track
 * - GET  /api/marketplace/referrals/history
 * - POST /api/marketplace/referrals/payout
 * - GET  /api/marketplace/referrals/payouts
 *
 * Portfolio/CV:
 * - GET  /api/marketplace/portfolio/cv/me (auth required)
 * - PUT  /api/marketplace/portfolio/cv/me (auth required)
 * - DELETE /api/marketplace/portfolio/cv/me (auth required)
 * - POST /api/marketplace/portfolio/cv/parse (auth required)
 * - POST /api/marketplace/portfolio/cv/generate-summary (auth required)
 * - GET  /api/marketplace/portfolio/:handle (public)
 */

const { Pool } = require('pg');
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");

// Image upload configuration
const UPLOAD_DIR = "/var/www/html/main/uploads/products";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGES_PER_PRODUCT = 5;

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_IMAGES_PER_PRODUCT
    },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Tipo de archivo no permitido. Use JPG, PNG, WebP o GIF."), false);
        }
    }
});

/**
 * Process and save uploaded image
 * @param {Buffer} buffer - Image buffer
 * @param {string} filename - Original filename
 * @returns {Promise<string>} - Saved image path
 */
async function processAndSaveImage(buffer, filename) {
    const timestamp = Date.now();
    const ext = path.extname(filename).toLowerCase();
    const baseName = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, "_");
    const newFilename = `${baseName}_${timestamp}.webp`;
    const outputPath = path.join(UPLOAD_DIR, newFilename);
    
    // Process image with sharp - resize and convert to webp
    await sharp(buffer)
        .resize(800, 800, {
            fit: "inside",
            withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toFile(outputPath);
    
    // Return public URL path
    return `/uploads/products/${newFilename}`;
}

/**
 * Process and save thumbnail
 * @param {Buffer} buffer - Image buffer
 * @param {string} filename - Original filename
 * @returns {Promise<string>} - Saved thumbnail path
 */
async function processAndSaveThumbnail(buffer, filename) {
    const timestamp = Date.now();
    const ext = path.extname(filename).toLowerCase();
    const baseName = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, "_");
    const newFilename = `${baseName}_${timestamp}_thumb.webp`;
    const outputPath = path.join(UPLOAD_DIR, newFilename);
    
    // Create thumbnail
    await sharp(buffer)
        .resize(200, 200, {
            fit: "cover"
        })
        .webp({ quality: 70 })
        .toFile(outputPath);
    
    return `/uploads/products/${newFilename}`;
}

/**
 * Delete image file
 * @param {string} imagePath - Public image path
 */
function deleteImageFile(imagePath) {
    try {
        if (!imagePath || typeof imagePath !== 'string') return;
        const fullPath = path.resolve('/var/www/html/main', imagePath);
        // v4.2.0: Path traversal guard
        if (!fullPath.startsWith('/var/www/html/main/uploads/')) return;
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (error) {
        // Best-effort file cleanup — non-critical if file is already gone or inaccessible
    }
}

// Database connection (uses same pool as main API)
let pool;

function initMarketplaceAPI(dbPool) {
    pool = dbPool;
}

// =====================================================
// LTD WALLET FUNCTIONS
// =====================================================

/**
 * Get user's LTD balance from wallet
 */
async function getLTDBalance(userId) {
    try {
        const result = await pool.query(
            'SELECT crypto_balances FROM user_wallets WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return 0;
        }

        const balances = result.rows[0].crypto_balances || { LTD: 0 };
        return parseFloat(balances.LTD) || 0;
    } catch (error) {
        return 0;
    }
}

/**
 * Debit (subtract) LTD tokens from user's wallet
 */
async function debitLTDTokens(userId, amount, reason) {
    // v4.2.0: Transaction + FOR UPDATE to prevent double-spend
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const walletResult = await client.query(
            'SELECT id, crypto_balances FROM user_wallets WHERE user_id = $1 FOR UPDATE',
            [userId]
        );

        if (walletResult.rows.length === 0) {
            throw new Error('Wallet not found');
        }

        const currentBalances = walletResult.rows[0].crypto_balances || { BTC: 0, ETH: 0, LTD: 0 };
        const currentLTD = parseFloat(currentBalances.LTD) || 0;

        if (currentLTD < amount) {
            throw new Error('Saldo LTD insuficiente');
        }

        currentBalances.LTD = currentLTD - amount;

        await client.query(
            'UPDATE user_wallets SET crypto_balances = $1, updated_at = NOW() WHERE user_id = $2',
            [JSON.stringify(currentBalances), userId]
        );

        await client.query(`
            INSERT INTO wallet_transactions (user_id, type, amount, currency, description, status)
            VALUES ($1, 'debit', $2, 'LTD', $3, 'completed')
        `, [userId, amount, reason]);

        await client.query('COMMIT');
        return { success: true, newBalance: currentBalances.LTD };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Credit (add) LTD tokens to user's wallet
 */
async function creditLTDTokens(userId, amount, reason) {
    // v4.2.0: Transaction + FOR UPDATE to prevent lost credits
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const walletResult = await client.query(
            'SELECT id, crypto_balances FROM user_wallets WHERE user_id = $1 FOR UPDATE',
            [userId]
        );

        if (walletResult.rows.length === 0) {
            await client.query(`
                INSERT INTO user_wallets (user_id, balance, currency, crypto_balances)
                VALUES ($1, 0, 'HNL', $2)
            `, [userId, JSON.stringify({ BTC: 0, ETH: 0, LTD: amount })]);
        } else {
            const currentBalances = walletResult.rows[0].crypto_balances || { BTC: 0, ETH: 0, LTD: 0 };
            currentBalances.LTD = (parseFloat(currentBalances.LTD) || 0) + amount;

            await client.query(
                'UPDATE user_wallets SET crypto_balances = $1, updated_at = NOW() WHERE user_id = $2',
                [JSON.stringify(currentBalances), userId]
            );
        }

        await client.query(`
            INSERT INTO wallet_transactions (user_id, type, amount, currency, description, status)
            VALUES ($1, 'credit', $2, 'LTD', $3, 'completed')
        `, [userId, amount, reason]);

        await client.query('COMMIT');
        return { success: true };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Transfer LTD tokens between users (for referral commissions)
 */
async function transferLTD(fromUserId, toUserId, amount, reason) {
    // Use a transaction for atomicity
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check sender balance
        const senderWallet = await client.query(
            'SELECT crypto_balances FROM user_wallets WHERE user_id = $1 FOR UPDATE',
            [fromUserId]
        );

        if (senderWallet.rows.length === 0) {
            throw new Error('Sender wallet not found');
        }

        const senderBalances = senderWallet.rows[0].crypto_balances || { LTD: 0 };
        const senderLTD = parseFloat(senderBalances.LTD) || 0;

        if (senderLTD < amount) {
            throw new Error(`Insufficient balance. Have: ${senderLTD} LTD, Need: ${amount} LTD`);
        }

        // Deduct from sender
        senderBalances.LTD = senderLTD - amount;
        await client.query(
            'UPDATE user_wallets SET crypto_balances = $1, updated_at = NOW() WHERE user_id = $2',
            [JSON.stringify(senderBalances), fromUserId]
        );

        // Add to recipient (create wallet if needed)
        const recipientWallet = await client.query(
            'SELECT crypto_balances FROM user_wallets WHERE user_id = $1 FOR UPDATE',
            [toUserId]
        );

        if (recipientWallet.rows.length === 0) {
            await client.query(`
                INSERT INTO user_wallets (user_id, balance, currency, crypto_balances)
                VALUES ($1, 0, 'HNL', $2)
            `, [toUserId, JSON.stringify({ BTC: 0, ETH: 0, LTD: amount })]);
        } else {
            const recipientBalances = recipientWallet.rows[0].crypto_balances || { LTD: 0 };
            recipientBalances.LTD = (parseFloat(recipientBalances.LTD) || 0) + amount;
            await client.query(
                'UPDATE user_wallets SET crypto_balances = $1, updated_at = NOW() WHERE user_id = $2',
                [JSON.stringify(recipientBalances), toUserId]
            );
        }

        // Record transactions for both users
        await client.query(`
            INSERT INTO wallet_transactions (user_id, type, amount, currency, description, status, related_user_id)
            VALUES
                ($1, 'transfer_out', $3, 'LTD', $4, 'completed', $2),
                ($2, 'transfer_in', $3, 'LTD', $4, 'completed', $1)
        `, [fromUserId, toUserId, amount, reason]);

        await client.query('COMMIT');

        return { success: true, amount };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Check if seller has enough balance to cover potential commission
 * Returns warning if balance is low
 */
async function checkSellerCommissionCapacity(sellerId, productPrice, commissionPercent) {
    const maxCommission = (productPrice * commissionPercent) / 100;
    const balance = await getLTDBalance(sellerId);

    return {
        balance,
        maxCommission,
        hasCapacity: balance >= maxCommission,
        warning: balance < maxCommission ?
            `Tu balance (${balance} LTD) es menor que la comision maxima (${maxCommission.toFixed(2)} LTD). Deposita LTD para pagar comisiones de referidos.` :
            null
    };
}

// =====================================================
// CATEGORIES
// =====================================================

async function getCategories() {
    const result = await pool.query(`
        SELECT category_id, name, name_es, icon, description, sort_order
        FROM marketplace_categories
        WHERE is_active = true
        ORDER BY sort_order ASC
    `);
    return result.rows;
}

// =====================================================
// SERVICES
// =====================================================

async function getServices(filters = {}) {
    const { category, city, minPrice, maxPrice, search, limit = 20, offset = 0, featured } = filters;

    let whereClause = ' WHERE 1=1';
    const filterParams = [];
    let paramIndex = 1;

    if (category) {
        whereClause += ` AND category_id = $${paramIndex++}`;
        filterParams.push(category);
    }

    if (city) {
        whereClause += ` AND city ILIKE $${paramIndex++}`;
        filterParams.push(`%${city}%`);
    }

    if (minPrice) {
        whereClause += ` AND price >= $${paramIndex++}`;
        filterParams.push(minPrice);
    }

    if (maxPrice) {
        whereClause += ` AND price <= $${paramIndex++}`;
        filterParams.push(maxPrice);
    }

    if (search) {
        whereClause += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR provider_name ILIKE $${paramIndex})`;
        filterParams.push(`%${search}%`);
        paramIndex++;
    }

    if (featured === true || featured === 'true') {
        whereClause += ` AND is_featured = true`;
    }

    // Main query with LIMIT/OFFSET
    const queryParams = [...filterParams, limit, offset];
    const query = `
        SELECT service_id, title, short_description, description, price_type, price, price_max, currency, duration_hours, images, status, is_featured, avg_rating, total_reviews, booking_count, created_at, category_id, category_name, category_icon, provider_id, provider_name, provider_image, provider_verified, provider_rating, provider_jobs, city, service_areas, provider_user_name FROM marketplace_service_listings
        ${whereClause}
        ORDER BY is_featured DESC, avg_rating DESC, booking_count DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const result = await pool.query(query, queryParams);

    // Count query reuses the same WHERE filters (no LIMIT/OFFSET)
    const countResult = await pool.query(
        `SELECT COUNT(*) FROM marketplace_service_listings ${whereClause}`,
        filterParams
    );

    return {
        services: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit,
        offset
    };
}

async function getServiceById(serviceId) {
    const result = await pool.query(`
        SELECT service_id, title, short_description, description, price_type, price, price_max, currency, duration_hours, images, status, is_featured, avg_rating, total_reviews, booking_count, created_at, category_id, category_name, category_icon, provider_id, provider_name, provider_image, provider_verified, provider_rating, provider_jobs, city, service_areas, provider_user_name FROM marketplace_service_listings
        WHERE service_id = $1
    `, [serviceId]);

    if (result.rows.length === 0) {
        return null;
    }

    // Increment view count
    await pool.query(`
        UPDATE marketplace_services
        SET view_count = view_count + 1
        WHERE service_id = $1
    `, [serviceId]);

    return result.rows[0];
}

async function createService(providerId, serviceData) {
    const {
        category_id, title, description, short_description,
        price_type, price, price_max, currency, duration_hours, images, tags
    } = serviceData;

    // v4.2.0: Input validation
    if (!title || typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 200) {
        throw new Error('Titulo requerido (1-200 caracteres)');
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || !isFinite(parsedPrice) || parsedPrice <= 0 || parsedPrice > 1000000) {
        throw new Error('Precio invalido');
    }
    const validPriceTypes = ['fixed', 'hourly', 'negotiable', 'free'];
    const safePriceType = validPriceTypes.includes(price_type) ? price_type : 'fixed';
    const safeDesc = typeof description === 'string' ? description.substring(0, 5000) : '';
    const safeShortDesc = typeof short_description === 'string' ? short_description.substring(0, 500) : '';

    const validCurrencies = ['HNL', 'USD', 'LTD'];
    const safeCurrency = validCurrencies.includes(currency) ? currency : 'HNL';

    const result = await pool.query(`
        INSERT INTO marketplace_services (
            provider_id, category_id, title, description, short_description,
            price_type, price, price_max, currency, duration_hours, images, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING service_id, provider_id, category_id, title, price_type, price, currency, status, created_at
    `, [
        providerId, category_id, title.trim().substring(0, 200), safeDesc, safeShortDesc,
        safePriceType, parsedPrice, parseFloat(price_max) || null,
        safeCurrency,
        parseFloat(duration_hours) || null,
        Array.isArray(images) ? images.slice(0, 10) : [],
        Array.isArray(tags) ? tags.slice(0, 20) : []
    ]);

    return result.rows[0];
}

async function updateService(serviceId, providerId, serviceData) {
    const {
        title, description, short_description, price_type, price,
        price_max, duration_hours, images, tags, status
    } = serviceData;

    const result = await pool.query(`
        UPDATE marketplace_services
        SET title = COALESCE($3, title),
            description = COALESCE($4, description),
            short_description = COALESCE($5, short_description),
            price_type = COALESCE($6, price_type),
            price = COALESCE($7, price),
            price_max = COALESCE($8, price_max),
            duration_hours = COALESCE($9, duration_hours),
            images = COALESCE($10, images),
            tags = COALESCE($11, tags),
            status = COALESCE($12, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE service_id = $1 AND provider_id = $2
        RETURNING service_id, provider_id, title, price_type, price, status, updated_at
    `, [serviceId, providerId, title, description, short_description,
        price_type, price, price_max, duration_hours, images, tags, status]);

    return result.rows[0];
}

// =====================================================
// PRODUCTS
// =====================================================

async function getProducts(filters = {}) {
    const { category, location, minPrice, maxPrice, search, limit = 20, offset = 0, featured, sellerId } = filters;

    let whereClause = ' WHERE p.is_active = true';
    // Parallel count clause without table alias (products table only)
    let countWhere = ' WHERE is_active = true';
    const filterParams = [];
    let paramIndex = 1;

    if (category) {
        whereClause += ` AND p.category_id = $${paramIndex}`;
        countWhere += ` AND category_id = $${paramIndex}`;
        paramIndex++;
        filterParams.push(category);
    }

    if (location) {
        whereClause += ` AND p.location ILIKE $${paramIndex}`;
        countWhere += ` AND location ILIKE $${paramIndex}`;
        paramIndex++;
        filterParams.push(`%${location}%`);
    }

    if (minPrice) {
        whereClause += ` AND p.price >= $${paramIndex}`;
        countWhere += ` AND price >= $${paramIndex}`;
        paramIndex++;
        filterParams.push(minPrice);
    }

    if (maxPrice) {
        whereClause += ` AND p.price <= $${paramIndex}`;
        countWhere += ` AND price <= $${paramIndex}`;
        paramIndex++;
        filterParams.push(maxPrice);
    }

    if (search) {
        whereClause += ` AND (p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
        countWhere += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        filterParams.push(`%${search}%`);
        paramIndex++;
    }

    if (featured === true || featured === 'true') {
        whereClause += ` AND p.is_featured = true`;
        countWhere += ` AND is_featured = true`;
    }

    if (sellerId) {
        whereClause += ` AND p.seller_id = $${paramIndex}`;
        countWhere += ` AND seller_id = $${paramIndex}`;
        paramIndex++;
        filterParams.push(sellerId);
    }

    // Main query with JOINs + LIMIT/OFFSET
    const queryParams = [...filterParams, limit, offset];
    const query = `
        SELECT p.id, p.seller_id, p.category_id, p.title, p.description, p.price, p.currency, p.quantity, p.images, p.condition, p.shipping_available, p.shipping_price, p.location, p.is_featured, p.referral_enabled, p.referral_commission_percent, p.views_count, p.created_at,
               u.name as seller_name,
               u.avatar_url as seller_avatar,
               c.name_es as category_name,
               c.icon as category_icon
        FROM marketplace_products p
        LEFT JOIN users u ON p.seller_id = u.user_id
        LEFT JOIN marketplace_categories c ON p.category_id = c.category_id
        ${whereClause}
        ORDER BY p.is_featured DESC, p.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const result = await pool.query(query, queryParams);

    // Safety parse: ensure images is always an array
    for (const row of result.rows) {
        if (typeof row.images === 'string') {
            try { row.images = JSON.parse(row.images); } catch { row.images = []; }
        }
        if (!Array.isArray(row.images)) row.images = [];
    }

    // Count query reuses same WHERE filters (no JOINs needed, no LIMIT/OFFSET)
    const countResult = await pool.query(
        `SELECT COUNT(*) FROM marketplace_products ${countWhere}`,
        filterParams
    );

    return {
        products: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit,
        offset
    };
}

async function getProductById(productId) {
    const result = await pool.query(`
        SELECT p.id, p.seller_id, p.category_id, p.title, p.description, p.price, p.currency, p.quantity, p.images, p.specifications, p.condition, p.shipping_available, p.shipping_price, p.location, p.is_featured, p.referral_enabled, p.referral_commission_percent, p.views_count, p.created_at, p.updated_at,
               u.name as seller_name,
               u.avatar_url as seller_avatar,
               c.name_es as category_name,
               c.icon as category_icon
        FROM marketplace_products p
        LEFT JOIN users u ON p.seller_id = u.user_id
        LEFT JOIN marketplace_categories c ON p.category_id = c.category_id
        WHERE p.id = $1
    `, [productId]);

    if (result.rows.length === 0) {
        return null;
    }

    // Safety parse: ensure images is always an array
    const product = result.rows[0];
    if (typeof product.images === 'string') {
        try { product.images = JSON.parse(product.images); } catch { product.images = []; }
    }
    if (!Array.isArray(product.images)) product.images = [];

    // Increment views
    await pool.query(`UPDATE marketplace_products SET views_count = views_count + 1 WHERE id = $1`, [productId]);

    return product;
}

async function createProduct(sellerId, productData) {
    const {
        category_id, title, description, price, currency = 'LTD',
        quantity = 1, images = [], specifications = {}, condition = 'new',
        shipping_available = false, shipping_price = 0, location,
        referral_commission_percent = 5
    } = productData;

    // v4.2.0: Input validation
    if (!title || typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 200) {
        throw new Error('Titulo requerido (1-200 caracteres)');
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || !isFinite(parsedPrice) || parsedPrice <= 0 || parsedPrice > 1000000) {
        throw new Error('Precio invalido');
    }
    const parsedQty = parseInt(quantity);
    if (!Number.isInteger(parsedQty) || parsedQty < 1 || parsedQty > 10000) {
        throw new Error('Cantidad invalida');
    }
    const validConditions = ['new', 'like_new', 'used', 'fair'];
    if (!validConditions.includes(condition)) {
        throw new Error('Condicion invalida');
    }
    // Cap commission percent 0-20
    const safeCommission = Math.max(0, Math.min(20, parseFloat(referral_commission_percent) || 5));
    const safeDesc = typeof description === 'string' ? description.substring(0, 5000) : '';

    const result = await pool.query(`
        INSERT INTO marketplace_products
        (seller_id, category_id, title, description, price, currency,
         quantity, images, specifications, condition, shipping_available,
         shipping_price, location, referral_commission_percent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, seller_id, category_id, title, price, currency, quantity, condition, referral_commission_percent, created_at
    `, [sellerId, category_id, title.trim().substring(0, 200), safeDesc, parsedPrice, currency,
        parsedQty, JSON.stringify(Array.isArray(images) ? images.slice(0, 10) : []),
        JSON.stringify(typeof specifications === 'object' && specifications ? specifications : {}),
        condition, !!shipping_available, Math.max(0, parseFloat(shipping_price) || 0),
        typeof location === 'string' ? location.substring(0, 200) : null,
        safeCommission]);

    return result.rows[0];
}

async function updateProduct(productId, sellerId, productData) {
    // Verify ownership
    const check = await pool.query(`SELECT seller_id FROM marketplace_products WHERE id = $1`, [productId]);
    if (check.rows.length === 0 || check.rows[0].seller_id !== sellerId) {
        throw new Error('Product not found or unauthorized');
    }

    const {
        title, description, price, quantity, images, specifications,
        condition, shipping_available, shipping_price, location,
        is_active, referral_commission_percent
    } = productData;

    // v4.2.0: Cap commission percent
    const safeRefCommission = referral_commission_percent != null ? Math.max(0, Math.min(20, parseFloat(referral_commission_percent) || 5)) : undefined;


    const result = await pool.query(`
        UPDATE marketplace_products SET
            title = COALESCE($3, title),
            description = COALESCE($4, description),
            price = COALESCE($5, price),
            quantity = COALESCE($6, quantity),
            images = COALESCE($7, images),
            specifications = COALESCE($8, specifications),
            condition = COALESCE($9, condition),
            shipping_available = COALESCE($10, shipping_available),
            shipping_price = COALESCE($11, shipping_price),
            location = COALESCE($12, location),
            is_active = COALESCE($13, is_active),
            referral_commission_percent = COALESCE($14, referral_commission_percent),
            updated_at = NOW()
        WHERE id = $1 AND seller_id = $2
        RETURNING id, seller_id, title, price, quantity, condition, updated_at
    `, [productId, sellerId, title, description, price, quantity,
        images ? JSON.stringify(images) : null, specifications ? JSON.stringify(specifications) : null,
        condition, shipping_available, shipping_price, location, is_active, safeRefCommission]);

    return result.rows[0];
}

async function deleteProduct(productId, sellerId) {
    const result = await pool.query(`
        UPDATE marketplace_products SET is_active = false, updated_at = NOW()
        WHERE id = $1 AND seller_id = $2
        RETURNING id
    `, [productId, sellerId]);

    return result.rows.length > 0;
}

async function getMyProducts(sellerId) {
    const result = await pool.query(`
        SELECT p.id, p.seller_id, p.category_id, p.title, p.description, p.price, p.currency, p.quantity, p.images, p.condition, p.shipping_available, p.shipping_price, p.location, p.is_featured, p.is_active, p.referral_enabled, p.referral_commission_percent, p.views_count, p.created_at, p.updated_at,
               c.name_es as category_name,
               c.icon as category_icon,
               (SELECT COUNT(*) FROM marketplace_product_orders WHERE product_id = p.id) as total_orders,
               (SELECT COALESCE(SUM(total_price), 0) FROM marketplace_product_orders WHERE product_id = p.id AND status = 'delivered') as total_revenue
        FROM marketplace_products p
        LEFT JOIN marketplace_categories c ON p.category_id = c.category_id
        WHERE p.seller_id = $1
        ORDER BY p.created_at DESC
    `, [sellerId]);

    return result.rows;
}

// =====================================================
// PRODUCT ORDERS
// =====================================================

async function createProductOrder(buyerId, orderData) {
    const { product_id, quantity = 1, payment_method, shipping_address, referral_code, notes } = orderData;

    // v4.2.0: Input validation
    const qty = parseInt(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
        throw new Error('Cantidad invalida');
    }
    const safeNotes = typeof notes === 'string' ? notes.substring(0, 500) : '';

    // v4.2.0: Transaction with FOR UPDATE to prevent stock oversell
    const orderClient = await pool.connect();
    try {
    await orderClient.query('BEGIN');

    // Lock product row
    const product = await orderClient.query(
        'SELECT id, seller_id, title, price, currency, quantity, referral_enabled, referral_commission_percent FROM marketplace_products WHERE id = $1 AND is_active = true FOR UPDATE',
        [product_id]
    );
    if (product.rows.length === 0) {
        throw new Error('Product not found');
    }

    const p = product.rows[0];

    // v4.2.0: Block self-purchase
    if (p.seller_id === buyerId) {
        throw new Error('No puedes comprar tu propio producto');
    }

    if (p.quantity < qty) {
        throw new Error('Insufficient stock');
    }

    const unit_price = parseFloat(p.price);
    const total_price = unit_price * qty;

    // Process referral commission if referral code provided
    let referrerId = null;
    let commissionAmount = 0;
    let commissionPaid = false;

    if (referral_code) {
        // Find referrer by code
        const referrerResult = await pool.query(`
            SELECT rc.user_id, u.name as referrer_name
            FROM marketplace_referral_codes rc
            JOIN users u ON rc.user_id = u.user_id
            WHERE rc.referral_code = $1 AND rc.is_active = true
        `, [referral_code]);

        if (referrerResult.rows.length > 0) {
            referrerId = referrerResult.rows[0].user_id;

            // Don't pay commission if referrer is the seller or buyer
            if (referrerId !== p.seller_id && referrerId !== buyerId) {
                const commissionPercent = parseFloat(p.referral_commission_percent) || 5;
                commissionAmount = (total_price * commissionPercent) / 100;

                // Try to transfer commission from seller to referrer
                try {
                    await transferLTD(
                        p.seller_id,
                        referrerId,
                        commissionAmount,
                        `Comision por venta de "${p.title}" (Orden #${product_id})`
                    );
                    commissionPaid = true;
                } catch (transferError) {
                    // Log but don't fail the order - commission will be pending
                    commissionPaid = false;
                }
            }
        }
    }

    // Create order with referral info (inside transaction)
    const result = await orderClient.query(`
        INSERT INTO marketplace_product_orders
        (product_id, buyer_id, seller_id, quantity, unit_price, total_price, payment_method, shipping_address, referral_code, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, product_id, buyer_id, seller_id, quantity, unit_price, total_price, status, payment_method, referral_code, created_at
    `, [product_id, buyerId, p.seller_id, qty, unit_price, total_price, payment_method,
        JSON.stringify(shipping_address || {}), referral_code, safeNotes]);

    const order = result.rows[0];

    // Record referral conversion if applicable
    if (referrerId && commissionAmount > 0) {
        try {
            await orderClient.query(`
                INSERT INTO marketplace_product_referrals
                (order_id, product_id, referrer_id, buyer_id, seller_id, referral_code,
                 order_amount, commission_percent, commission_amount, commission_paid)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                order.id, product_id, referrerId, buyerId, p.seller_id, referral_code,
                total_price, parseFloat(p.referral_commission_percent) || 5, commissionAmount, commissionPaid
            ]);

            // Update referrer's stats
            await orderClient.query(`
                UPDATE marketplace_referral_codes
                SET total_conversions = total_conversions + 1,
                    total_earnings = total_earnings + $2
                WHERE user_id = $1
            `, [referrerId, commissionPaid ? commissionAmount : 0]);
        } catch (refError) {
        }
    }

    // Decrease stock (inside transaction — atomic with order creation)
    await orderClient.query(`UPDATE marketplace_products SET quantity = quantity - $2 WHERE id = $1`, [product_id, qty]);

    await orderClient.query('COMMIT');

    // Add commission info to response
    order.referral_info = {
        referrer_id: referrerId,
        commission_amount: commissionAmount,
        commission_paid: commissionPaid
    };

    return order;

    } catch (orderError) {
        await orderClient.query('ROLLBACK');
        throw orderError;
    } finally {
        orderClient.release();
    }
}

async function getProductOrders(userId, role = 'buyer', filters = {}) {
    const { status, limit = 20, offset = 0 } = filters;

    let query = `
        SELECT o.id, o.product_id, o.buyer_id, o.seller_id, o.quantity, o.unit_price, o.total_price,
               o.status, o.payment_method, o.tracking_number, o.referral_code, o.notes,
               o.created_at, o.updated_at,
               p.title as product_title,
               p.images as product_images,
               buyer.name as buyer_name,
               seller.name as seller_name
        FROM marketplace_product_orders o
        JOIN marketplace_products p ON o.product_id = p.id
        LEFT JOIN users buyer ON o.buyer_id = buyer.user_id
        LEFT JOIN users seller ON o.seller_id = seller.user_id
        WHERE ${role === 'seller' ? 'o.seller_id' : 'o.buyer_id'} = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (status) {
        query += ` AND o.status = $${paramIndex++}`;
        params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
}

async function updateProductOrderStatus(orderId, sellerId, newStatus, trackingNumber = null) {
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(newStatus)) {
        throw new Error('Invalid status');
    }

    const result = await pool.query(`
        UPDATE marketplace_product_orders SET
            status = $3,
            tracking_number = COALESCE($4, tracking_number),
            updated_at = NOW()
        WHERE id = $1 AND seller_id = $2
        RETURNING id, product_id, buyer_id, seller_id, quantity, total_price, status, tracking_number, updated_at
    `, [orderId, sellerId, newStatus, trackingNumber]);

    if (result.rows.length === 0) {
        throw new Error('Order not found or unauthorized');
    }

    return result.rows[0];
}

// =====================================================
// PROVIDERS
// =====================================================

async function getProviders(filters = {}) {
    const { city, verified, limit = 20, offset = 0 } = filters;

    let query = `
        SELECT p.provider_id, p.user_id, p.business_name, p.description, p.profile_image, p.phone, p.whatsapp, p.city, p.neighborhood, p.service_areas, p.is_verified, p.status, p.avg_rating, p.total_reviews, p.completed_jobs, p.response_rate, p.response_time_hours, p.instant_booking, p.social_links, p.shop_type, p.store_layout, p.store_theme, p.created_at, u.name as user_name, u.avatar_url, u.handle
        FROM marketplace_providers p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.status = 'active'
    `;
    const params = [];
    let paramIndex = 1;

    if (city) {
        query += ` AND p.city ILIKE $${paramIndex++}`;
        params.push(`%${city}%`);
    }

    if (verified === true || verified === 'true') {
        query += ` AND p.is_verified = true`;
    }

    query += ` ORDER BY p.is_verified DESC, p.avg_rating DESC, p.completed_jobs DESC`;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
}

async function getProviderById(providerId) {
    const result = await pool.query(`
        SELECT p.provider_id, p.user_id, p.business_name, p.description, p.profile_image, p.phone, p.whatsapp, p.email, p.city, p.neighborhood, p.service_areas, p.is_verified, p.verified_at, p.status, p.avg_rating, p.total_reviews, p.completed_jobs, p.response_rate, p.response_time_hours, p.instant_booking, p.auto_accept_bookings, p.social_links, p.shop_type, p.store_layout, p.store_theme, p.created_at, p.updated_at, u.name as user_name, u.avatar_url
        FROM marketplace_providers p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.provider_id = $1
    `, [providerId]);

    if (result.rows.length === 0) {
        return null;
    }

    // Get provider's services
    const servicesResult = await pool.query(`
        SELECT s.service_id, s.provider_id, s.category_id, s.title, s.description, s.short_description, s.price_type, s.price, s.price_max, s.currency, s.duration_hours, s.duration_min_hours, s.duration_max_hours, s.availability, s.advance_booking_hours, s.max_booking_days, s.images, s.status, s.is_featured, s.featured_until, s.view_count, s.booking_count, s.avg_rating, s.total_reviews, s.tags, s.created_at, s.updated_at, s.referral_enabled, s.referral_commission_percent, c.name_es AS category_name, c.icon AS category_icon
        FROM marketplace_services s
        LEFT JOIN marketplace_categories c ON s.category_id = c.category_id
        WHERE s.provider_id = $1 AND s.status = 'active'
        ORDER BY s.is_featured DESC, s.booking_count DESC
    `, [providerId]);

    return {
        ...result.rows[0],
        services: servicesResult.rows
    };
}

async function getProviderByUserId(userId) {
    const result = await pool.query(`
        SELECT mp.provider_id, mp.user_id, mp.business_name, mp.description, mp.profile_image, mp.phone, mp.whatsapp, mp.email, mp.city, mp.neighborhood, mp.service_areas, mp.is_verified, mp.verified_at, mp.verified_by, mp.status, mp.avg_rating, mp.total_reviews, mp.completed_jobs, mp.response_rate, mp.response_time_hours, mp.instant_booking, mp.auto_accept_bookings, mp.social_links, mp.shop_type, mp.store_layout, mp.store_theme, mp.created_at, mp.updated_at, u.handle, u.name AS full_name
        FROM marketplace_providers mp
        JOIN users u ON u.user_id = mp.user_id
        WHERE mp.user_id = $1
    `, [userId]);
    return result.rows[0] || null;
}

async function registerProvider(userId, providerData) {
    const {
        business_name, description, phone, whatsapp, email,
        city, neighborhood, service_areas, social_links, shop_type,
        store_layout, store_theme
    } = providerData;

    if (!business_name || typeof business_name !== 'string' || !business_name.trim()) {
        throw new Error('Nombre del negocio es requerido');
    }

    // Validate shop_type
    const validShopTypes = ['services', 'products'];
    if (!shop_type || !validShopTypes.includes(shop_type)) {
        throw new Error('Tipo de tienda invalido');
    }

    // Validate store_layout and store_theme
    const validLayouts = ['classic', 'showcase', 'compact'];
    const validThemes = ['dark', 'cyan', 'gold', 'green', 'coral', 'purple'];
    const safeLayout = validLayouts.includes(store_layout) ? store_layout : 'classic';
    const safeTheme = validThemes.includes(store_theme) ? store_theme : 'dark';

    // Check if user already has a provider profile
    const existing = await getProviderByUserId(userId);
    if (existing) {
        throw new Error('User already has a provider profile');
    }

    // Sanitize social_links
    let sanitizedSocialLinks = {};
    if (social_links && typeof social_links === 'object' && !Array.isArray(social_links)) {
        const allowedKeys = ['github', 'linkedin', 'website', 'facebook', 'instagram', 'twitter'];
        for (const key of allowedKeys) {
            if (social_links[key] && typeof social_links[key] === 'string') {
                const val = social_links[key].trim().slice(0, 500);
                if (val.startsWith('https://') || val.startsWith('http://')) {
                    sanitizedSocialLinks[key] = val;
                }
            }
        }
    }

    const result = await pool.query(`
        INSERT INTO marketplace_providers (
            user_id, business_name, description, phone, whatsapp, email,
            city, neighborhood, service_areas, social_links, shop_type, store_layout, store_theme, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active')
        RETURNING provider_id, user_id, business_name, city, shop_type, store_layout, store_theme, status, created_at
    `, [
        userId, business_name.trim().slice(0, 255), description ? String(description).slice(0, 2000) : null,
        phone ? String(phone).slice(0, 20) : null, whatsapp ? String(whatsapp).slice(0, 20) : null,
        email ? String(email).slice(0, 255) : null,
        city || 'Tegucigalpa', neighborhood ? String(neighborhood).slice(0, 100) : null,
        service_areas || [], JSON.stringify(sanitizedSocialLinks), shop_type, safeLayout, safeTheme
    ]);

    return result.rows[0];
}

async function updateProvider(providerId, userId, providerData) {
    const {
        business_name, description, phone, whatsapp, email,
        city, neighborhood, service_areas, profile_image, social_links,
        store_layout, store_theme
    } = providerData;

    // Validate social_links if provided
    let sanitizedSocialLinks = undefined;
    if (social_links !== undefined) {
        if (typeof social_links === 'object' && social_links !== null && !Array.isArray(social_links)) {
            sanitizedSocialLinks = {};
            const allowedKeys = ['github', 'linkedin', 'website', 'facebook', 'instagram', 'twitter'];
            for (const key of allowedKeys) {
                if (social_links[key] && typeof social_links[key] === 'string') {
                    const val = social_links[key].trim().slice(0, 500);
                    if (val.startsWith('https://') || val.startsWith('http://')) {
                        sanitizedSocialLinks[key] = val;
                    }
                }
            }
        }
    }

    // Validate store_layout if provided
    let safeLayout = undefined;
    if (store_layout !== undefined) {
        const validLayouts = ['classic', 'showcase', 'compact'];
        if (!validLayouts.includes(store_layout)) {
            throw new Error('Layout invalido');
        }
        safeLayout = store_layout;
    }

    // Validate store_theme if provided
    let safeTheme = undefined;
    if (store_theme !== undefined) {
        const validThemes = ['dark', 'cyan', 'gold', 'green', 'coral', 'purple'];
        if (!validThemes.includes(store_theme)) {
            throw new Error('Tema invalido');
        }
        safeTheme = store_theme;
    }

    const result = await pool.query(`
        UPDATE marketplace_providers
        SET business_name = COALESCE($3, business_name),
            description = COALESCE($4, description),
            phone = COALESCE($5, phone),
            whatsapp = COALESCE($6, whatsapp),
            email = COALESCE($7, email),
            city = COALESCE($8, city),
            neighborhood = COALESCE($9, neighborhood),
            service_areas = COALESCE($10, service_areas),
            profile_image = COALESCE($11, profile_image),
            social_links = COALESCE($12, social_links),
            store_layout = COALESCE($13, store_layout),
            store_theme = COALESCE($14, store_theme),
            updated_at = CURRENT_TIMESTAMP
        WHERE provider_id = $1 AND user_id = $2
        RETURNING provider_id, user_id, business_name, description, phone, whatsapp, email, city, neighborhood, service_areas, profile_image, social_links, shop_type, store_layout, store_theme, status, updated_at
    `, [providerId, userId, business_name, description, phone, whatsapp,
        email, city, neighborhood, service_areas, profile_image,
        sanitizedSocialLinks ? JSON.stringify(sanitizedSocialLinks) : undefined,
        safeLayout, safeTheme]);

    return result.rows[0];
}

// =====================================================
// PORTFOLIO / CV
// =====================================================

const PORTFOLIO_LIMITS = {
    experience: 20, education: 10, skills: 30,
    certifications: 15, projects: 15, languages: 10
};
const SKILL_LEVELS = ['basico', 'intermedio', 'avanzado', 'experto'];
const LANGUAGE_LEVELS = ['basico', 'intermedio', 'avanzado', 'nativo'];

function sanitizePortfolioData(data) {
    const clean = {};

    if (data.professional_title != null) {
        clean.professional_title = String(data.professional_title).trim().slice(0, 255);
    }
    if (data.summary != null) {
        clean.summary = String(data.summary).trim().slice(0, 2000);
    }
    if (typeof data.allow_downloads === 'boolean') {
        clean.allow_downloads = data.allow_downloads;
    }
    if (typeof data.is_public === 'boolean') {
        clean.is_public = data.is_public;
    }

    // Experience
    if (Array.isArray(data.experience)) {
        clean.experience = data.experience.slice(0, PORTFOLIO_LIMITS.experience).map(e => ({
            company: String(e.company || '').trim().slice(0, 255),
            position: String(e.position || '').trim().slice(0, 255),
            start_date: /^\d{4}-\d{2}$/.test(String(e.start_date || '')) ? String(e.start_date) : '',
            end_date: e.current ? null : (/^\d{4}-\d{2}$/.test(String(e.end_date || '')) ? String(e.end_date) : null),
            current: !!e.current,
            description: String(e.description || '').trim().slice(0, 1000)
        })).filter(e => e.company && e.position);
    }

    // Education
    if (Array.isArray(data.education)) {
        clean.education = data.education.slice(0, PORTFOLIO_LIMITS.education).map(e => {
            const startYear = parseInt(e.start_year);
            const endYear = e.end_year != null ? parseInt(e.end_year) : null;
            return {
                institution: String(e.institution || '').trim().slice(0, 255),
                degree: String(e.degree || '').trim().slice(0, 255),
                field: String(e.field || '').trim().slice(0, 255),
                start_year: (startYear >= 1950 && startYear <= 2050) ? startYear : null,
                end_year: (endYear >= 1950 && endYear <= 2050) ? endYear : null
            };
        }).filter(e => e.institution && e.degree);
    }

    // Skills
    if (Array.isArray(data.skills)) {
        clean.skills = data.skills.slice(0, PORTFOLIO_LIMITS.skills).map(s => ({
            name: String(s.name || '').trim().slice(0, 100),
            level: SKILL_LEVELS.includes(s.level) ? s.level : 'intermedio'
        })).filter(s => s.name);
    }

    // Certifications
    if (Array.isArray(data.certifications)) {
        clean.certifications = data.certifications.slice(0, PORTFOLIO_LIMITS.certifications).map(c => {
            const year = parseInt(c.year);
            let url = null;
            if (c.url) {
                const u = String(c.url).trim().slice(0, 500);
                if (u.startsWith('https://') || u.startsWith('http://')) url = u;
            }
            return {
                name: String(c.name || '').trim().slice(0, 255),
                issuer: String(c.issuer || '').trim().slice(0, 255),
                year: (year >= 1950 && year <= 2050) ? year : null,
                url
            };
        }).filter(c => c.name && c.issuer);
    }

    // Projects
    if (Array.isArray(data.projects)) {
        clean.projects = data.projects.slice(0, PORTFOLIO_LIMITS.projects).map(p => {
            let url = null, image_url = null;
            if (p.url) {
                const u = String(p.url).trim().slice(0, 500);
                if (u.startsWith('https://') || u.startsWith('http://')) url = u;
            }
            if (p.image_url) {
                const u = String(p.image_url).trim().slice(0, 500);
                if (u.startsWith('https://') || u.startsWith('http://') || u.startsWith('/uploads/')) image_url = u;
            }
            return {
                title: String(p.title || '').trim().slice(0, 255),
                description: String(p.description || '').trim().slice(0, 1000),
                url,
                image_url
            };
        }).filter(p => p.title);
    }

    // Languages
    if (Array.isArray(data.languages)) {
        clean.languages = data.languages.slice(0, PORTFOLIO_LIMITS.languages).map(l => ({
            language: String(l.language || '').trim().slice(0, 100),
            level: LANGUAGE_LEVELS.includes(l.level) ? l.level : 'intermedio'
        })).filter(l => l.language);
    }

    return clean;
}

// AI-powered CV parsing via Groq
async function parseCVWithAI(pdfText) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const MIA_MODEL = process.env.MIA_MODEL || 'llama-3.3-70b-versatile';

    if (!GROQ_API_KEY) {
        throw new Error('AI service not configured');
    }

    const truncatedText = pdfText.slice(0, 8000);

    const prompt = `Eres un experto en recursos humanos. Analiza el siguiente texto extraido de un CV/curriculum y extrae la informacion en formato JSON estricto con estas secciones:

{
  "professional_title": "titulo profesional inferido",
  "summary": "resumen profesional de 2-3 oraciones",
  "experience": [{ "company": "", "position": "", "start_date": "YYYY-MM", "end_date": "YYYY-MM", "current": false, "description": "" }],
  "education": [{ "institution": "", "degree": "", "field": "", "start_year": 2020, "end_year": 2024 }],
  "skills": [{ "name": "", "level": "basico|intermedio|avanzado|experto" }],
  "certifications": [{ "name": "", "issuer": "", "year": 2024 }],
  "projects": [{ "title": "", "description": "" }],
  "languages": [{ "language": "", "level": "basico|intermedio|avanzado|nativo" }]
}

SOLO responde con el JSON, sin texto adicional. Si una seccion no tiene datos, usa array vacio [].
Si no puedes determinar un nivel de habilidad, usa "intermedio".
Fechas en formato YYYY-MM. Si solo hay ano, usa YYYY-01.

Texto del CV:
${truncatedText}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: MIA_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 4096
        })
    });

    if (!response.ok) {
        throw new Error('AI service error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('AI returned invalid format');
    }

    return JSON.parse(jsonMatch[0]);
}

// AI-powered professional summary generation via Groq
async function generateSummaryWithAI(portfolioData) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const MIA_MODEL = process.env.MIA_MODEL || 'llama-3.3-70b-versatile';

    if (!GROQ_API_KEY) {
        throw new Error('AI service not configured');
    }

    const title = String(portfolioData.professional_title || '').slice(0, 255);
    const experience = (portfolioData.experience || []).slice(0, 5).map(e =>
        `${e.position || ''} en ${e.company || ''}`
    ).join(', ');
    const skills = (portfolioData.skills || []).slice(0, 10).map(s => s.name || '').join(', ');
    const education = (portfolioData.education || []).slice(0, 3).map(e =>
        `${e.degree || ''} en ${e.institution || ''}`
    ).join(', ');

    const prompt = `Genera un resumen profesional conciso (maximo 300 palabras) en espanol para una persona con este perfil:
- Titulo: ${title}
- Experiencia: ${experience}
- Habilidades: ${skills}
- Educacion: ${education}

El resumen debe ser directo, sin adornos, describiendo que hace la persona y con que tecnologias/herramientas trabaja.
SOLO responde con el texto del resumen, sin comillas ni formato adicional.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: MIA_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 512
        })
    });

    if (!response.ok) {
        throw new Error('AI service error');
    }

    const data = await response.json();
    const summary = (data.choices[0]?.message?.content || '').trim().slice(0, 2000);
    return summary;
}

async function getPortfolioByUserId(userId) {
    const result = await pool.query(`
        SELECT p.portfolio_id, p.user_id, p.professional_title, p.summary,
               p.experience, p.education, p.skills, p.certifications,
               p.projects, p.languages, p.allow_downloads, p.is_public,
               p.created_at, p.updated_at,
               u.name AS full_name, u.email, u.handle, u.avatar_url
        FROM user_portfolios p
        JOIN users u ON u.user_id = p.user_id
        WHERE p.user_id = $1
    `, [userId]);
    return result.rows[0] || null;
}

async function upsertPortfolio(userId, data) {
    const clean = sanitizePortfolioData(data);
    const result = await pool.query(`
        INSERT INTO user_portfolios (user_id, professional_title, summary,
            experience, education, skills, certifications, projects, languages,
            allow_downloads, is_public)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_id) DO UPDATE SET
            professional_title = EXCLUDED.professional_title,
            summary = EXCLUDED.summary,
            experience = EXCLUDED.experience,
            education = EXCLUDED.education,
            skills = EXCLUDED.skills,
            certifications = EXCLUDED.certifications,
            projects = EXCLUDED.projects,
            languages = EXCLUDED.languages,
            allow_downloads = EXCLUDED.allow_downloads,
            is_public = EXCLUDED.is_public,
            updated_at = CURRENT_TIMESTAMP
        RETURNING portfolio_id, user_id, professional_title, summary,
                  experience, education, skills, certifications,
                  projects, languages, allow_downloads, is_public,
                  created_at, updated_at
    `, [
        userId,
        clean.professional_title || null,
        clean.summary || null,
        JSON.stringify(clean.experience || []),
        JSON.stringify(clean.education || []),
        JSON.stringify(clean.skills || []),
        JSON.stringify(clean.certifications || []),
        JSON.stringify(clean.projects || []),
        JSON.stringify(clean.languages || []),
        clean.allow_downloads !== undefined ? clean.allow_downloads : false,
        clean.is_public !== undefined ? clean.is_public : true
    ]);
    return result.rows[0];
}

// =====================================================
// BOOKINGS
// =====================================================

async function getBookings(userId, role = 'customer', filters = {}) {
    const { status, limit = 20, offset = 0 } = filters;

    let query;
    const params = [userId, limit, offset];

    if (role === 'provider') {
        // Get provider's bookings
        query = `
            SELECT b.booking_id, b.booking_code, b.service_id, b.provider_id, b.customer_id, b.status,
                   b.scheduled_date, b.scheduled_time, b.quoted_price, b.customer_notes,
                   b.created_at, b.updated_at,
                   s.title as service_title, s.images as service_images,
                   u.name as customer_name, u.avatar_url as customer_avatar
            FROM marketplace_bookings b
            JOIN marketplace_services s ON b.service_id = s.service_id
            JOIN marketplace_providers p ON b.provider_id = p.provider_id
            JOIN users u ON b.customer_id = u.user_id
            WHERE p.user_id = $1
        `;
    } else {
        // Get customer's bookings
        query = `
            SELECT b.booking_id, b.booking_code, b.service_id, b.provider_id, b.customer_id, b.status,
                   b.scheduled_date, b.scheduled_time, b.quoted_price, b.discount_amount, b.currency,
                   b.payment_status, b.created_at, b.updated_at,
                   s.title as service_title, s.images as service_images,
                   p.business_name as provider_name, p.profile_image as provider_image,
                   u.name as provider_user_name
            FROM marketplace_bookings b
            JOIN marketplace_services s ON b.service_id = s.service_id
            JOIN marketplace_providers p ON b.provider_id = p.provider_id
            JOIN users u ON p.user_id = u.user_id
            WHERE b.customer_id = $1
        `;
    }

    if (status) {
        // v4.2.0: Parameterized (was SQL injection via string interpolation)
        const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
        if (validStatuses.includes(status)) {
            query += ` AND b.status = $${params.length + 1}`;
            params.push(status);
        }
    }

    query += ` ORDER BY b.scheduled_date DESC, b.scheduled_time DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const result = await pool.query(query, params);
    return result.rows;
}

async function getBookingById(bookingId, userId) {
    const result = await pool.query(`
        SELECT b.booking_id, b.booking_code, b.service_id, b.provider_id, b.customer_id, b.status,
               b.scheduled_date, b.scheduled_time, b.duration_hours as booking_duration,
               b.quoted_price, b.final_price, b.discount_amount, b.currency,
               b.payment_status, b.customer_notes, b.provider_notes,
               b.confirmed_at, b.started_at, b.completed_at, b.cancelled_at, b.cancellation_reason,
               b.created_at, b.updated_at,
               s.title as service_title, s.description as service_description,
               s.images as service_images, s.price_type, s.duration_hours,
               p.business_name as provider_name, p.profile_image as provider_image,
               p.phone as provider_phone, p.whatsapp as provider_whatsapp,
               pu.name as provider_user_name,
               cu.name as customer_name
        FROM marketplace_bookings b
        JOIN marketplace_services s ON b.service_id = s.service_id
        JOIN marketplace_providers p ON b.provider_id = p.provider_id
        JOIN users pu ON p.user_id = pu.user_id
        JOIN users cu ON b.customer_id = cu.user_id
        WHERE b.booking_id = $1
          AND (b.customer_id = $2 OR p.user_id = $2)
    `, [bookingId, userId]);

    return result.rows[0] || null;
}

async function createBooking(customerId, bookingData) {
    const {
        service_id, scheduled_date, scheduled_time,
        service_address, service_city, service_neighborhood,
        location_notes, customer_notes, discount_code
    } = bookingData;

    // Get service and provider info
    const serviceResult = await pool.query(`
        SELECT s.service_id, s.provider_id, s.title, s.price, s.price_type, s.duration_hours, s.status,
               p.provider_id as p_provider_id, p.user_id as provider_user_id
        FROM marketplace_services s
        JOIN marketplace_providers p ON s.provider_id = p.provider_id
        WHERE s.service_id = $1 AND s.status = 'active'
    `, [service_id]);

    if (serviceResult.rows.length === 0) {
        throw new Error('Service not found or not available');
    }

    const service = serviceResult.rows[0];

    // Check user subscription for booking permission
    const subResult = await pool.query(`
        SELECT tier FROM marketplace_subscriptions WHERE user_id = $1
    `, [customerId]);

    const userTier = subResult.rows[0]?.tier || 'free';
    if (userTier === 'free') {
        throw new Error('Upgrade to Plan or Premium to book services');
    }

    // Calculate price
    let quotedPrice = service.price;
    if (service.price_type === 'hourly' && service.duration_hours) {
        quotedPrice = service.price * service.duration_hours;
    }

    // Apply discount for premium users
    let discountAmount = 0;
    if (userTier === 'premium') {
        discountAmount = quotedPrice * 0.10; // 10% discount
    }

    const result = await pool.query(`
        INSERT INTO marketplace_bookings (
            service_id, provider_id, customer_id,
            scheduled_date, scheduled_time, duration_hours,
            service_address, service_city, service_neighborhood, location_notes,
            quoted_price, discount_amount, discount_code, customer_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING booking_id, booking_code, service_id, provider_id, customer_id, status, scheduled_date, scheduled_time, quoted_price, discount_amount, created_at
    `, [
        service_id, service.provider_id, customerId,
        scheduled_date, scheduled_time, service.duration_hours,
        service_address, service_city || 'Tegucigalpa', service_neighborhood, location_notes,
        quotedPrice, discountAmount, discount_code, customer_notes
    ]);

    // TODO: Send notification to provider

    return result.rows[0];
}

async function updateBookingStatus(bookingId, userId, newStatus, notes) {
    // Verify user has permission (is customer or provider)
    const booking = await getBookingById(bookingId, userId);
    if (!booking) {
        throw new Error('Booking not found or access denied');
    }

    const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': []
    };

    if (!validTransitions[booking.status]?.includes(newStatus)) {
        throw new Error(`Cannot change status from ${booking.status} to ${newStatus}`);
    }

    const updateFields = {
        'confirmed': 'confirmed_at = CURRENT_TIMESTAMP',
        'in_progress': 'started_at = CURRENT_TIMESTAMP',
        'completed': 'completed_at = CURRENT_TIMESTAMP',
        'cancelled': 'cancelled_at = CURRENT_TIMESTAMP, cancelled_by = $3, cancellation_reason = $4'
    };

    // v4.2.0: Parameterized to prevent SQL injection
    const updateParams = [bookingId, newStatus];
    if (newStatus === 'cancelled') {
        updateParams.push(userId, (notes || '').substring(0, 1000));
    }
    const result = await pool.query(`
        UPDATE marketplace_bookings
        SET status = $2,
            ${updateFields[newStatus]},
            updated_at = CURRENT_TIMESTAMP
        WHERE booking_id = $1
        RETURNING booking_id, booking_code, service_id, provider_id, customer_id, status, scheduled_date, scheduled_time, quoted_price, updated_at
    `, updateParams);

    // TODO: Send notification

    return result.rows[0];
}

// =====================================================
// REVIEWS
// =====================================================

async function getReviews(serviceId, limit = 10, offset = 0) {
    const result = await pool.query(`
        SELECT r.review_id, r.booking_id, r.service_id, r.provider_id, r.reviewer_id, r.review_type, r.overall_rating, r.quality_rating, r.punctuality_rating, r.communication_rating, r.value_rating, r.title, r.comment, r.provider_response, r.status, r.is_verified_purchase, r.helpful_count, r.created_at, u.name as reviewer_name, u.avatar_url as reviewer_avatar
        FROM marketplace_reviews r
        JOIN users u ON r.reviewer_id = u.user_id
        WHERE r.service_id = $1 AND r.status = 'published'
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
    `, [serviceId, limit, offset]);

    return result.rows;
}

async function getProviderReviews(providerId, limit = 5) {
    const result = await pool.query(`
        SELECT r.review_id, r.overall_rating, r.title, r.comment, r.created_at,
               u.name as reviewer_name, u.avatar_url as reviewer_avatar
        FROM marketplace_reviews r
        JOIN users u ON r.reviewer_id = u.user_id
        WHERE r.provider_id = $1 AND r.status = 'published'
        ORDER BY r.created_at DESC
        LIMIT $2
    `, [providerId, Math.min(limit, 10)]);
    return result.rows;
}

async function createReview(bookingId, reviewerId, reviewData) {
    const {
        overall_rating, quality_rating, punctuality_rating,
        communication_rating, value_rating, title, comment
    } = reviewData;

    // Verify booking exists and is completed
    const bookingResult = await pool.query(`
        SELECT b.booking_id, b.service_id, b.provider_id, b.customer_id, b.status, b.customer_reviewed,
               s.service_id as s_service_id, p.provider_id as p_provider_id
        FROM marketplace_bookings b
        JOIN marketplace_services s ON b.service_id = s.service_id
        JOIN marketplace_providers p ON b.provider_id = p.provider_id
        WHERE b.booking_id = $1 AND b.customer_id = $2 AND b.status = 'completed'
    `, [bookingId, reviewerId]);

    if (bookingResult.rows.length === 0) {
        throw new Error('Cannot review: booking not found or not completed');
    }

    const booking = bookingResult.rows[0];

    // Check if already reviewed
    const existingReview = await pool.query(`
        SELECT review_id FROM marketplace_reviews
        WHERE booking_id = $1 AND reviewer_id = $2
    `, [bookingId, reviewerId]);

    if (existingReview.rows.length > 0) {
        throw new Error('You have already reviewed this booking');
    }

    const result = await pool.query(`
        INSERT INTO marketplace_reviews (
            booking_id, service_id, provider_id, reviewer_id,
            overall_rating, quality_rating, punctuality_rating,
            communication_rating, value_rating, title, comment
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING review_id, booking_id, service_id, provider_id, reviewer_id, overall_rating, title, status, created_at
    `, [
        bookingId, booking.service_id, booking.provider_id, reviewerId,
        overall_rating, quality_rating, punctuality_rating,
        communication_rating, value_rating, title, comment
    ]);

    // Mark booking as reviewed
    await pool.query(`
        UPDATE marketplace_bookings SET customer_reviewed = true WHERE booking_id = $1
    `, [bookingId]);

    return result.rows[0];
}

// =====================================================
// SUBSCRIPTIONS
// =====================================================

// Check if user is an active tanda member or creator
async function checkTandaMembership(userId) {
    // Check if user is a creator of any active group/tanda
    const creatorCheck = await pool.query(`
        SELECT COUNT(*) as count
        FROM groups
        WHERE admin_id = $1 AND status IN ('active', 'in_progress')
    `, [userId]);

    const isCreator = parseInt(creatorCheck.rows[0].count) > 0;

    // Check if user is an active member of any tanda
    const memberCheck = await pool.query(`
        SELECT COUNT(*) as count
        FROM group_members gm
        JOIN groups g ON gm.group_id = g.group_id
        WHERE gm.user_id = $1
        AND gm.status = 'active'
        AND g.status IN ('active', 'in_progress', 'paused')
    `, [userId]);

    const isActiveMember = parseInt(memberCheck.rows[0].count) > 0;

    // Get details for UI
    let tandaDetails = null;
    if (isCreator || isActiveMember) {
        const details = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM groups WHERE admin_id = $1 AND status IN ('active', 'in_progress')) as groups_created,
                (SELECT COUNT(*) FROM group_members gm 
                 JOIN groups g ON gm.group_id = g.group_id
                 LEFT JOIN tandas t ON g.group_id = t.group_id
                 WHERE gm.user_id = $1 AND gm.status = 'active' 
                 AND COALESCE(t.status, g.status) IN ('active', 'in_progress')) as active_memberships,
                (SELECT COUNT(*) FROM group_members gm 
                 JOIN groups g ON gm.group_id = g.group_id
                 LEFT JOIN tandas t ON g.group_id = t.group_id
                 WHERE gm.user_id = $1 AND gm.status = 'active' AND t.status = 'paused') as paused_memberships,
                (SELECT COALESCE(t.status, g.status) FROM group_members gm 
                 JOIN groups g ON gm.group_id = g.group_id
                 LEFT JOIN tandas t ON g.group_id = t.group_id
                 WHERE gm.user_id = $1 AND gm.status = 'active' 
                 ORDER BY gm.joined_at DESC LIMIT 1) as current_tanda_status
        `, [userId]);
        tandaDetails = details.rows[0];
    }

    return {
        is_tanda_member: isCreator || isActiveMember,
        is_creator: isCreator,
        is_active_member: isActiveMember,
        details: tandaDetails
    };
}

async function getSubscription(userId) {
    // First check if user is a tanda member/creator (gets free premium access)
    const tandaStatus = await checkTandaMembership(userId);

    if (tandaStatus.is_tanda_member) {
        // Tanda members get full access for free
        return {
            user_id: userId,
            tier: 'tanda_member',
            price_monthly: 0,
            status: 'active',
            is_tanda_benefit: true,
            tanda_status: tandaStatus,
            features: [
                'Acceso completo al marketplace',
                'Listar productos y servicios gratis',
                'Promocionar listados',
                'Reservas ilimitadas',
                'Mensajería ilimitada',
                'Comisiones de referidos',
                'Soporte prioritario'
            ]
        };
    }

    // Check regular subscription
    const result = await pool.query(`
        SELECT subscription_id, user_id, tier, price_monthly, currency, started_at, expires_at, cancelled_at, payment_method, last_payment_at, next_payment_at, status, auto_renew, bookings_this_month, messages_today, created_at, updated_at FROM marketplace_subscriptions WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
        // Return default free tier
        return {
            user_id: userId,
            tier: 'free',
            price_monthly: 0,
            status: 'active',
            is_tanda_benefit: false,
            tanda_status: tandaStatus
        };
    }

    return {
        ...result.rows[0],
        is_tanda_benefit: false,
        tanda_status: tandaStatus
    };
}

async function upgradeSubscription(userId, newTier, paymentInfo) {
    const tierPrices = {
        'free': 0,
        'plan': 99,
        'premium': 299
    };

    if (!tierPrices.hasOwnProperty(newTier)) {
        throw new Error('Invalid subscription tier');
    }

    // Check existing subscription
    const existing = await pool.query(`
        SELECT subscription_id, user_id, tier, price_monthly, currency, started_at, expires_at, cancelled_at, payment_method, last_payment_at, next_payment_at, status, auto_renew, bookings_this_month, messages_today, created_at, updated_at FROM marketplace_subscriptions WHERE user_id = $1
    `, [userId]);

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    if (existing.rows.length === 0) {
        // Create new subscription
        const result = await pool.query(`
            INSERT INTO marketplace_subscriptions (
                user_id, tier, price_monthly, expires_at,
                payment_method, last_payment_at, next_payment_at
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $4)
            RETURNING subscription_id, user_id, tier, price_monthly, status, started_at, expires_at
        `, [userId, newTier, tierPrices[newTier], expiresAt, paymentInfo?.method || 'wallet']);

        return result.rows[0];
    } else {
        // Update existing subscription
        const result = await pool.query(`
            UPDATE marketplace_subscriptions
            SET tier = $2,
                price_monthly = $3,
                expires_at = $4,
                payment_method = COALESCE($5, payment_method),
                last_payment_at = CURRENT_TIMESTAMP,
                next_payment_at = $4,
                status = 'active',
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
            RETURNING subscription_id, user_id, tier, price_monthly, status, expires_at, updated_at
        `, [userId, newTier, tierPrices[newTier], expiresAt, paymentInfo?.method]);

        return result.rows[0];
    }
}

// =====================================================
// FAVORITES
// =====================================================

async function getFavorites(userId) {
    const result = await pool.query(`
        SELECT f.favorite_id, f.user_id, f.service_id, f.provider_id, f.created_at, s.title, s.short_description, s.price, s.images,
               p.business_name as provider_name
        FROM marketplace_favorites f
        LEFT JOIN marketplace_services s ON f.service_id = s.service_id
        LEFT JOIN marketplace_providers p ON f.provider_id = p.provider_id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
    `, [userId]);

    return result.rows;
}

async function addFavorite(userId, serviceId, providerId) {
    const result = await pool.query(`
        INSERT INTO marketplace_favorites (user_id, service_id, provider_id)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
        RETURNING favorite_id, user_id, service_id, provider_id, created_at
    `, [userId, serviceId || null, providerId || null]);

    return result.rows[0];
}

async function removeFavorite(userId, serviceId, providerId) {
    if (serviceId) {
        await pool.query(`
            DELETE FROM marketplace_favorites WHERE user_id = $1 AND service_id = $2
        `, [userId, serviceId]);
    } else if (providerId) {
        await pool.query(`
            DELETE FROM marketplace_favorites WHERE user_id = $1 AND provider_id = $2
        `, [userId, providerId]);
    }
}

// =====================================================
// STATS
// =====================================================

async function getMarketplaceStats() {
    const stats = await pool.query(`
        SELECT
            (SELECT COUNT(*) FROM marketplace_services WHERE status = 'active') as total_services,
            (SELECT COUNT(*) FROM marketplace_providers WHERE status = 'active') as total_providers,
            (SELECT COUNT(*) FROM marketplace_bookings WHERE status = 'completed') as completed_bookings,
            (SELECT COALESCE(SUM(final_price), 0) FROM marketplace_bookings WHERE status = 'completed' AND payment_status = 'paid') as total_volume,
            (SELECT ROUND(AVG(overall_rating)::numeric, 2) FROM marketplace_reviews WHERE status = 'published') as avg_rating
    `);

    return stats.rows[0];
}

// =====================================================
// REFERRAL/AFFILIATE SYSTEM
// =====================================================

// Get or create user's referral code
async function getOrCreateReferralCode(userId) {
    // Check if user already has a code
    let result = await pool.query(`
        SELECT code_id, user_id, referral_code, is_active, total_clicks, total_conversions, total_earnings, created_at FROM marketplace_referral_codes WHERE user_id = $1
    `, [userId]);

    if (result.rows.length > 0) {
        return result.rows[0];
    }

    // Generate new code
    const codeResult = await pool.query(`
        SELECT generate_referral_code($1) as code
    `, [userId]);
    const code = codeResult.rows[0].code;

    // Insert new code
    result = await pool.query(`
        INSERT INTO marketplace_referral_codes (user_id, referral_code)
        VALUES ($1, $2)
        RETURNING code_id, user_id, referral_code, is_active, created_at
    `, [userId, code]);

    return result.rows[0];
}

// Get user's referral stats
async function getReferralStats(userId) {
    const codeData = await getOrCreateReferralCode(userId);

    // Get detailed stats
    const stats = await pool.query(`
        SELECT
            COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as total_clicks,
            COUNT(*) FILTER (WHERE converted = true) as total_conversions,
            COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'approved'), 0) as approved_earnings,
            COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'pending'), 0) as pending_earnings,
            COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'paid'), 0) as paid_earnings
        FROM marketplace_referrals
        WHERE referrer_id = $1
    `, [userId]);

    return {
        referral_code: codeData.referral_code,
        is_active: codeData.is_active,
        ...stats.rows[0]
    };
}

// Track referral click
async function trackReferralClick(referralCode, serviceId, visitorInfo) {
    // Validate code exists
    const codeResult = await pool.query(`
        SELECT rc.code_id, rc.user_id, rc.referral_code, rc.is_active, rc.total_clicks,
               u.user_id as u_user_id, u.name as referrer_name
        FROM marketplace_referral_codes rc
        JOIN users u ON rc.user_id = u.user_id
        WHERE rc.referral_code = $1 AND rc.is_active = true
    `, [referralCode]);

    if (codeResult.rows.length === 0) {
        throw new Error('Invalid or inactive referral code');
    }

    const codeData = codeResult.rows[0];

    // Create referral tracking record
    const result = await pool.query(`
        INSERT INTO marketplace_referrals (
            referral_code, referrer_id, service_id,
            visitor_ip, visitor_device
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING referral_id
    `, [
        referralCode,
        codeData.user_id,
        serviceId || null,
        visitorInfo?.ip || null,
        visitorInfo?.device || null
    ]);

    // Update click count
    await pool.query(`
        UPDATE marketplace_referral_codes
        SET total_clicks = total_clicks + 1
        WHERE referral_code = $1
    `, [referralCode]);

    return {
        referral_id: result.rows[0].referral_id,
        referrer_name: codeData.referrer_name
    };
}

// Process referral conversion when booking is made
async function processReferralConversion(bookingId, referralId, referredUserId) {
    // Get booking details
    const bookingResult = await pool.query(`
        SELECT b.booking_id, b.service_id, b.provider_id, b.customer_id, b.quoted_price, b.status,
               s.referral_commission_percent, s.referral_enabled
        FROM marketplace_bookings b
        JOIN marketplace_services s ON b.service_id = s.service_id
        WHERE b.booking_id = $1
    `, [bookingId]);

    if (bookingResult.rows.length === 0) {
        throw new Error('Booking not found');
    }

    const booking = bookingResult.rows[0];

    if (!booking.referral_enabled) {
        throw new Error('Referrals not enabled for this service');
    }

    // Calculate commission
    const commissionPercent = parseFloat(booking.referral_commission_percent) || 5;
    const bookingAmount = parseFloat(booking.quoted_price) || 0;
    const commissionAmount = (bookingAmount * commissionPercent) / 100;

    // Update referral record
    await pool.query(`
        UPDATE marketplace_referrals
        SET
            converted = true,
            booking_id = $1,
            converted_at = CURRENT_TIMESTAMP,
            referred_user_id = $2,
            booking_amount = $3,
            commission_percent = $4,
            commission_amount = $5,
            commission_status = 'pending'
        WHERE referral_id = $6
    `, [bookingId, referredUserId, bookingAmount, commissionPercent, commissionAmount, referralId]);

    // Update referrer stats
    await pool.query(`
        UPDATE marketplace_referral_codes
        SET
            total_conversions = total_conversions + 1,
            total_earnings = total_earnings + $2
        WHERE referral_code = (
            SELECT referral_code FROM marketplace_referrals WHERE referral_id = $1
        )
    `, [referralId, commissionAmount]);

    return {
        booking_id: bookingId,
        commission_amount: commissionAmount,
        commission_percent: commissionPercent
    };
}

// Get user's referral history
async function getReferralHistory(userId, filters = {}) {
    const { status, limit = 20, offset = 0 } = filters;

    let query = `
        SELECT r.referral_id, r.referral_code, r.referrer_id, r.service_id, r.clicked_at,
               r.converted, r.booking_id, r.converted_at, r.referred_user_id,
               r.booking_amount, r.commission_percent, r.commission_amount, r.commission_status,
               s.title as service_title,
               u.name as referred_user_name,
               b.booking_code
        FROM marketplace_referrals r
        LEFT JOIN marketplace_services s ON r.service_id = s.service_id
        LEFT JOIN users u ON r.referred_user_id = u.user_id
        LEFT JOIN marketplace_bookings b ON r.booking_id = b.booking_id
        WHERE r.referrer_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (status) {
        query += ` AND r.commission_status = $${paramIndex++}`;
        params.push(status);
    }

    query += ` ORDER BY r.clicked_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
}

// Generate shareable referral link for services or products
function generateReferralLink(referralCode, itemId = null, type = 'service') {
    const baseUrl = 'https://latanda.online/marketplace-social.html';
    let link = `${baseUrl}?ref=${referralCode}`;
    if (itemId) {
        const param = type === 'product' ? 'product' : 'service';
        link += `&${param}=${itemId}`;
    }
    return link;
}

// Request commission payout
async function requestPayout(userId, amount, paymentMethod) {
    // v4.2.0: Transaction to prevent double-payout
    const payoutClient = await pool.connect();
    try {
        await payoutClient.query('BEGIN');

        // Lock the user's approved referrals
        const referrals = await payoutClient.query(`
            SELECT referral_id, commission_amount FROM marketplace_referrals
            WHERE referrer_id = $1 AND commission_status = 'approved'
            ORDER BY converted_at ASC
            FOR UPDATE
        `, [userId]);

        const availableBalance = referrals.rows.reduce((sum, r) => sum + parseFloat(r.commission_amount || 0), 0);

        if (amount > availableBalance) {
            throw new Error('Saldo insuficiente para retiro');
        }

        // Create payout request
        const referralIds = referrals.rows.map(r => r.referral_id);
        const result = await payoutClient.query(`
            INSERT INTO marketplace_commission_payouts (
                user_id, amount, payment_method, referral_ids
            ) VALUES ($1, $2, $3, $4)
            RETURNING payout_id, user_id, amount, status, payment_method, requested_at
        `, [userId, amount, paymentMethod || 'wallet', referralIds]);

        // Mark referrals as processing
        if (referralIds.length > 0) {
            await payoutClient.query(`
                UPDATE marketplace_referrals
                SET commission_status = 'processing'
                WHERE referral_id = ANY($1)
            `, [referralIds]);
        }

        await payoutClient.query('COMMIT');
        return result.rows[0];

    } catch (error) {
        await payoutClient.query('ROLLBACK');
        throw error;
    } finally {
        payoutClient.release();
    }
}

// Get payout history
async function getPayoutHistory(userId) {
    const result = await pool.query(`
        SELECT payout_id, user_id, amount, currency, status, payment_method, payment_reference, referral_ids, requested_at, processed_at, notes FROM marketplace_commission_payouts
        WHERE user_id = $1
        ORDER BY requested_at DESC
    `, [userId]);

    return result.rows;
}

// =====================================================
// MAIN REQUEST HANDLER
// =====================================================

async function handleMarketplaceRequest(req, res, pathname, method, sendSuccess, sendError, authenticateRequest, parseBody, log) {
    // Remove /api/marketplace prefix
    const route = pathname.replace('/api/marketplace', '');

    try {
        // GET /api/marketplace/categories
        if (route === '/categories' && method === 'GET') {
            const categories = await getCategories();
            return sendSuccess(res, { categories });
        }

        // GET /api/marketplace/services
        if (route === '/services' && method === 'GET') {
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const filters = {
                category: urlObj.searchParams.get('category'),
                city: urlObj.searchParams.get('city'),
                minPrice: urlObj.searchParams.get('minPrice'),
                maxPrice: urlObj.searchParams.get('maxPrice'),
                search: urlObj.searchParams.get('search'),
                featured: urlObj.searchParams.get('featured'),
                limit: parseInt(urlObj.searchParams.get('limit')) || 20,
                offset: parseInt(urlObj.searchParams.get('offset')) || 0
            };
            const result = await getServices(filters);
            return sendSuccess(res, result);
        }

        // GET /api/marketplace/services/:id
        if (route.match(/^\/services\/\d+$/) && method === 'GET') {
            const serviceId = parseInt(route.split('/')[2]);
            const service = await getServiceById(serviceId);
            if (!service) {
                return sendError(res, 404, 'Service not found');
            }
            return sendSuccess(res, { service });
        }

        // POST /api/marketplace/services (create service - requires provider)
        if (route === '/services' && method === 'POST') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const provider = await getProviderByUserId(authResult.user.userId);
            if (!provider || provider.status !== 'active') {
                return sendError(res, 403, 'You must be an active provider to create services');
            }
            if (provider.shop_type === 'products') {
                return sendError(res, 403, 'Tu tienda es de tipo Productos. No puedes crear servicios.');
            }
            const body = await parseBody(req);
            const service = await createService(provider.provider_id, body);
            return sendSuccess(res, { service }, 201);
        }

        // =====================================================
        // PRODUCTS ROUTES
        // =====================================================

        // GET /api/marketplace/products
        if (route === '/products' && method === 'GET') {
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const filters = {
                category: urlObj.searchParams.get('category'),
                location: urlObj.searchParams.get('location'),
                minPrice: urlObj.searchParams.get('minPrice'),
                maxPrice: urlObj.searchParams.get('maxPrice'),
                search: urlObj.searchParams.get('search'),
                featured: urlObj.searchParams.get('featured'),
                sellerId: urlObj.searchParams.get('seller'),
                limit: parseInt(urlObj.searchParams.get('limit')) || 20,
                offset: parseInt(urlObj.searchParams.get('offset')) || 0
            };
            const result = await getProducts(filters);
            return sendSuccess(res, result);
        }

        // GET /api/marketplace/products/my - My products (auth required)
        if (route === '/products/my' && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const products = await getMyProducts(authResult.user.userId);
            return sendSuccess(res, { products });
        }

        // GET /api/marketplace/products/:id
        if (route.match(/^\/products\/\d+$/) && method === 'GET') {
            const productId = parseInt(route.split('/')[2]);
            const product = await getProductById(productId);
            if (!product) {
                return sendError(res, 404, 'Product not found');
            }
            return sendSuccess(res, { product });
        }

        // POST /api/marketplace/products - Create product (auth required)
        if (route === '/products' && method === 'POST') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            // Enforce shop_type
            const providerCheck = await getProviderByUserId(authResult.user.userId);
            if (providerCheck && providerCheck.shop_type === 'services') {
                return sendError(res, 403, 'Tu tienda es de tipo Servicios. No puedes crear productos.');
            }
            try {
                const body = await parseBody(req);
                log('Creating product with data: ' + JSON.stringify(body).substring(0, 500));
                const product = await createProduct(authResult.user.userId, body);
                log('Product created successfully: ' + product.id);
                
                // SOCIAL FEED: Insert product_posted event
                try {
                    await pool.query(`
                        INSERT INTO social_feed (event_type, actor_id, actor_name, title, description, image_url, action_url, metadata)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    `, [
                        "product_posted",
                        authResult.user.userId,
                        authResult.user.name || "Vendedor",
                        product.title + (product.price ? " - L." + parseFloat(product.price).toLocaleString("es-HN") : ""),
                        product.description ? product.description.substring(0, 150) : null,
                        product.images && product.images[0] ? product.images[0] : null,
                        "marketplace.html?product=" + product.id,
                        JSON.stringify({ price: product.price, location: product.location || null, category: product.category || null })
                    ]);
                    log("[SOCIAL_FEED] Product event inserted: " + product.id);
                } catch (sfErr) {
                    log("[SOCIAL_FEED] Error inserting event: " + sfErr.message);
                }
                return sendSuccess(res, { product }, 201);
            } catch (err) {
                log('ERROR creating product: ' + err.message);
                return sendError(res, 400, 'Error al crear producto');
            }
        }

        // PUT /api/marketplace/products/:id - Update product (auth required)
        if (route.match(/^\/products\/\d+$/) && method === 'PUT') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const productId = parseInt(route.split('/')[2]);
            const body = await parseBody(req);
            try {
                const product = await updateProduct(productId, authResult.user.userId, body);
                return sendSuccess(res, { product });
            } catch (err) {
                return sendError(res, 403, 'Acceso denegado');
            }
        }

        // DELETE /api/marketplace/products/:id - Delete product (auth required)
        if (route.match(/^\/products\/\d+$/) && method === 'DELETE') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const productId = parseInt(route.split('/')[2]);
            const deleted = await deleteProduct(productId, authResult.user.userId);
            if (!deleted) {
                return sendError(res, 404, 'Product not found or unauthorized');
            }
            return sendSuccess(res, { message: 'Product deleted' });
        }


        // POST /api/marketplace/services/upload-images - Upload service images (auth required)
        if (route === "/services/upload-images" && method === "POST") {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, "Unauthorized");
            }

            const boundary = req.headers["content-type"]?.split("boundary=")[1];
            if (!boundary) {
                return sendError(res, 400, "Missing boundary in content-type");
            }

            let body = [];
            req.on("data", chunk => body.push(chunk));
            req.on("end", async () => {
                try {
                    const buffer = Buffer.concat(body);
                    const parts = buffer.toString("binary").split("--" + boundary);
                    const uploadedImages = [];

                    for (const part of parts) {
                        if (part.includes("filename=") && part.includes("Content-Type: image")) {
                            const filenameMatch = part.match(/filename="([^"]+)"/);
                            const filename = filenameMatch ? filenameMatch[1] : "image.jpg";
                            const contentTypeMatch = part.match(/Content-Type: (image\/[^\r\n]+)/);
                            const contentType = contentTypeMatch ? contentTypeMatch[1] : "image/jpeg";

                            if (!ALLOWED_TYPES.includes(contentType)) continue;

                            const dataStart = part.indexOf("\r\n\r\n") + 4;
                            const dataEnd = part.lastIndexOf("\r\n");
                            const imageData = part.substring(dataStart, dataEnd);
                            const imageBuffer = Buffer.from(imageData, "binary");

                            if (imageBuffer.length > MAX_FILE_SIZE) continue;

                            const imagePath = await processAndSaveImage(imageBuffer, filename);
                            const thumbPath = await processAndSaveThumbnail(imageBuffer, filename);

                            uploadedImages.push({
                                url: imagePath,
                                thumbnail: thumbPath,
                                originalName: filename
                            });

                            if (uploadedImages.length >= MAX_IMAGES_PER_PRODUCT) break;
                        }
                    }

                    if (uploadedImages.length === 0) {
                        return sendError(res, 400, "No se pudieron procesar las imágenes. Asegúrese de que sean JPG, PNG, WebP o GIF y menores a 5MB.");
                    }

                    log(`📸 User ${authResult.user.userId} uploaded ${uploadedImages.length} service images`);

                    return sendSuccess(res, {
                        images: uploadedImages,
                        count: uploadedImages.length
                    });
                } catch (error) {
                    log(`ERROR uploading service images: ${error.message}`);
                    return sendError(res, 500, "Error interno del servidor");
                }
            });
            return true;
        }

        // POST /api/marketplace/products/upload-images - Upload product images (auth required)
        if (route === "/products/upload-images" && method === "POST") {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, "Unauthorized");
            }
            
            // Handle multipart form data manually
            const boundary = req.headers["content-type"]?.split("boundary=")[1];
            if (!boundary) {
                return sendError(res, 400, "Missing boundary in content-type");
            }
            
            let body = [];
            req.on("data", chunk => body.push(chunk));
            req.on("end", async () => {
                try {
                    const buffer = Buffer.concat(body);
                    const parts = buffer.toString("binary").split("--" + boundary);
                    
                    const uploadedImages = [];
                    
                    for (const part of parts) {
                        if (part.includes("filename=") && part.includes("Content-Type: image")) {
                            // Extract filename
                            const filenameMatch = part.match(/filename="([^"]+)"/);
                            const filename = filenameMatch ? filenameMatch[1] : "image.jpg";
                            
                            // Extract content type
                            const contentTypeMatch = part.match(/Content-Type: (image\/[^\r\n]+)/);
                            const contentType = contentTypeMatch ? contentTypeMatch[1] : "image/jpeg";
                            
                            // Check allowed types
                            if (!ALLOWED_TYPES.includes(contentType)) {
                                continue;
                            }
                            
                            // Extract binary data (after double CRLF)
                            const dataStart = part.indexOf("\r\n\r\n") + 4;
                            const dataEnd = part.lastIndexOf("\r\n");
                            const imageData = part.substring(dataStart, dataEnd);
                            const imageBuffer = Buffer.from(imageData, "binary");
                            
                            // Check file size
                            if (imageBuffer.length > MAX_FILE_SIZE) {
                                continue;
                            }
                            
                            // Process and save
                            const imagePath = await processAndSaveImage(imageBuffer, filename);
                            const thumbPath = await processAndSaveThumbnail(imageBuffer, filename);
                            
                            uploadedImages.push({
                                url: imagePath,
                                thumbnail: thumbPath,
                                originalName: filename
                            });
                            
                            // Limit to MAX_IMAGES_PER_PRODUCT
                            if (uploadedImages.length >= MAX_IMAGES_PER_PRODUCT) {
                                break;
                            }
                        }
                    }
                    
                    if (uploadedImages.length === 0) {
                        return sendError(res, 400, "No se pudieron procesar las imágenes. Asegúrese de que sean JPG, PNG, WebP o GIF y menores a 5MB.");
                    }
                    
                    log(`📸 User ${authResult.user.userId} uploaded ${uploadedImages.length} images`);
                    
                    return sendSuccess(res, {
                        images: uploadedImages,
                        count: uploadedImages.length
                    });
                    
                } catch (error) {
                    log(`ERROR uploading images: ${error.message}`);
                    return sendError(res, 500, "Error interno del servidor");
                }
            });
            return true;
        }

        // POST /api/marketplace/products/:id/buy - Buy product (auth required)
        if (route.match(/^\/products\/\d+\/buy$/) && method === 'POST') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const productId = parseInt(route.split('/')[2]);
            const body = await parseBody(req);
            try {
                const order = await createProductOrder(authResult.user.userId, { product_id: productId, ...body });
                return sendSuccess(res, { order }, 201);
            } catch (err) {
                return sendError(res, 400, 'Solicitud invalida');
            }
        }

        // GET /api/marketplace/product-orders - My orders (auth required)
        if (route === '/product-orders' && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const role = urlObj.searchParams.get('role') || 'buyer';
            const filters = {
                status: urlObj.searchParams.get('status'),
                limit: parseInt(urlObj.searchParams.get('limit')) || 20,
                offset: parseInt(urlObj.searchParams.get('offset')) || 0
            };
            const orders = await getProductOrders(authResult.user.userId, role, filters);
            return sendSuccess(res, { orders });
        }

        // PUT /api/marketplace/product-orders/:id/status - Update order status (seller)
        if (route.match(/^\/product-orders\/\d+\/status$/) && method === 'PUT') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const orderId = parseInt(route.split('/')[2]);
            const body = await parseBody(req);
            try {
                const order = await updateProductOrderStatus(orderId, authResult.user.userId, body.status, body.tracking_number);
                return sendSuccess(res, { order });
            } catch (err) {
                return sendError(res, 400, 'Solicitud invalida');
            }
        }

        // =====================================================
        // WALLET/LTD BALANCE ENDPOINTS
        // =====================================================

        // GET /api/marketplace/wallet/balance - Get user's LTD balance
        if (route === '/wallet/balance' && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const balance = await getLTDBalance(authResult.user.userId);
            return sendSuccess(res, { balance, currency: 'LTD' });
        }

        // POST /api/marketplace/wallet/check-commission - Check if seller can cover commission
        if (route === '/wallet/check-commission' && method === 'POST') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const body = await parseBody(req);
            const { price, commission_percent = 5 } = body;
            const check = await checkSellerCommissionCapacity(
                authResult.user.userId,
                parseFloat(price) || 0,
                parseFloat(commission_percent)
            );
            return sendSuccess(res, check);
        }

        // GET /api/marketplace/providers
        if (route === '/providers' && method === 'GET') {
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const filters = {
                city: urlObj.searchParams.get('city'),
                verified: urlObj.searchParams.get('verified'),
                limit: parseInt(urlObj.searchParams.get('limit')) || 20,
                offset: parseInt(urlObj.searchParams.get('offset')) || 0
            };
            const providers = await getProviders(filters);
            return sendSuccess(res, { providers });
        }

        // GET /api/marketplace/providers/:id
        if (route.match(/^\/providers\/\d+$/) && method === 'GET') {
            const providerId = parseInt(route.split('/')[2]);
            const provider = await getProviderById(providerId);
            if (!provider) {
                return sendError(res, 404, 'Provider not found');
            }
            return sendSuccess(res, { provider });
        }

        // GET /api/marketplace/providers/:id/reviews
        if (route.match(/^\/providers\/\d+\/reviews$/) && method === 'GET') {
            const providerId = parseInt(route.split('/')[2]);
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const limit = parseInt(urlObj.searchParams.get('limit')) || 5;
            const reviews = await getProviderReviews(providerId, limit);
            return sendSuccess(res, { reviews });
        }

        // POST /api/marketplace/providers/register
        if (route === '/providers/register' && method === 'POST') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const body = await parseBody(req);
            const provider = await registerProvider(authResult.user.userId, body);
            return sendSuccess(res, { provider }, 201);
        }

        // GET /api/marketplace/providers/me
        if (route === '/providers/me' && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const provider = await getProviderByUserId(authResult.user.userId);
            return sendSuccess(res, { provider });
        }

        // PUT /api/marketplace/providers/me (update own provider profile)
        if (route === '/providers/me' && method === 'PUT') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const provider = await getProviderByUserId(authResult.user.userId);
            if (!provider) {
                return sendError(res, 404, 'No tienes perfil de proveedor');
            }
            const body = await parseBody(req);
            // Block shop_type changes (requires Premium)
            if (body.shop_type !== undefined) {
                return sendError(res, 400, 'No puedes cambiar el tipo de tienda');
            }
            // Validate required fields
            if (body.business_name !== undefined && typeof body.business_name !== 'string') {
                return sendError(res, 400, 'Nombre de negocio invalido');
            }
            if (body.business_name && body.business_name.length > 255) {
                return sendError(res, 400, 'Nombre de negocio muy largo (max 255)');
            }
            if (body.description && typeof body.description === 'string' && body.description.length > 2000) {
                return sendError(res, 400, 'Descripcion muy larga (max 2000)');
            }
            // Validate store_layout if provided
            if (body.store_layout !== undefined) {
                const validLayouts = ['classic', 'showcase', 'compact'];
                if (!validLayouts.includes(body.store_layout)) {
                    return sendError(res, 400, 'Layout invalido');
                }
            }
            // Validate store_theme if provided
            if (body.store_theme !== undefined) {
                const validThemes = ['dark', 'cyan', 'gold', 'green', 'coral', 'purple'];
                if (!validThemes.includes(body.store_theme)) {
                    return sendError(res, 400, 'Tema invalido');
                }
            }
            const updated = await updateProvider(provider.provider_id, authResult.user.userId, body);
            return sendSuccess(res, { provider: updated });
        }

        // GET /api/marketplace/bookings
        if (route === '/bookings' && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const role = urlObj.searchParams.get('role') || 'customer';
            const status = urlObj.searchParams.get('status');
            const bookings = await getBookings(authResult.user.userId, role, { status });
            return sendSuccess(res, { bookings });
        }

        // GET /api/marketplace/bookings/:id
        if (route.match(/^\/bookings\/\d+$/) && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const bookingId = parseInt(route.split('/')[2]);
            const booking = await getBookingById(bookingId, authResult.user.userId);
            if (!booking) {
                return sendError(res, 404, 'Booking not found');
            }
            return sendSuccess(res, { booking });
        }

        // POST /api/marketplace/bookings
        if (route === '/bookings' && method === 'POST') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const body = await parseBody(req);
            try {
                const booking = await createBooking(authResult.user.userId, body);
                return sendSuccess(res, { booking }, 201);
            } catch (err) {
                return sendError(res, 400, 'Solicitud invalida');
            }
        }

        // PUT /api/marketplace/bookings/:id/status
        if (route.match(/^\/bookings\/\d+\/status$/) && method === 'PUT') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const bookingId = parseInt(route.split('/')[2]);
            const body = await parseBody(req);
            try {
                const booking = await updateBookingStatus(bookingId, authResult.user.userId, body.status, body.notes);
                return sendSuccess(res, { booking });
            } catch (err) {
                return sendError(res, 400, 'Solicitud invalida');
            }
        }

        // GET /api/marketplace/reviews/:serviceId
        if (route.match(/^\/reviews\/\d+$/) && method === 'GET') {
            const serviceId = parseInt(route.split('/')[2]);
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const limit = parseInt(urlObj.searchParams.get('limit')) || 10;
            const offset = parseInt(urlObj.searchParams.get('offset')) || 0;
            const reviews = await getReviews(serviceId, limit, offset);
            return sendSuccess(res, { reviews });
        }

        // POST /api/marketplace/reviews
        if (route === '/reviews' && method === 'POST') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const body = await parseBody(req);
            try {
                const review = await createReview(body.booking_id, authResult.user.userId, body);
                return sendSuccess(res, { review }, 201);
            } catch (err) {
                return sendError(res, 400, 'Solicitud invalida');
            }
        }

        // GET /api/marketplace/subscription
        if (route === '/subscription' && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const subscription = await getSubscription(authResult.user.userId);
            return sendSuccess(res, { subscription });
        }

        // POST /api/marketplace/subscription/upgrade
        if (route === '/subscription/upgrade' && method === 'POST') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const body = await parseBody(req);
            try {
                const subscription = await upgradeSubscription(authResult.user.userId, body.tier, body.payment);
                return sendSuccess(res, { subscription });
            } catch (err) {
                return sendError(res, 400, 'Solicitud invalida');
            }
        }

        // GET /api/marketplace/favorites
        if (route === '/favorites' && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const favorites = await getFavorites(authResult.user.userId);
            return sendSuccess(res, { favorites });
        }

        // POST /api/marketplace/favorites
        if (route === '/favorites' && method === 'POST') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const body = await parseBody(req);
            const favorite = await addFavorite(authResult.user.userId, body.service_id, body.provider_id);
            return sendSuccess(res, { favorite }, 201);
        }

        // DELETE /api/marketplace/favorites
        if (route === '/favorites' && method === 'DELETE') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const body = await parseBody(req);
            await removeFavorite(authResult.user.userId, body.service_id, body.provider_id);
            return sendSuccess(res, { message: 'Favorite removed' });
        }

        // GET /api/marketplace/stats
        if (route === '/stats' && method === 'GET') {
            const stats = await getMarketplaceStats();
            return sendSuccess(res, { stats });
        }


        // =====================================================
        // MESSAGING ENDPOINTS
        // =====================================================

        // GET /api/marketplace/messages/conversations - Get user conversations
        if (route === '/messages/conversations' && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const conversations = await getConversations(authResult.user.userId);
            return sendSuccess(res, { conversations });
        }

        // GET /api/marketplace/messages/:otherUserId - Get messages with a user
        if (route.match(/^\/messages\/user_[a-zA-Z0-9]+$/) && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const otherUserId = route.split('/')[2];
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const productId = urlObj.searchParams.get('product_id');
            const limit = parseInt(urlObj.searchParams.get('limit')) || 50;
            const offset = parseInt(urlObj.searchParams.get('offset')) || 0;

            const messages = await getMessages(authResult.user.userId, otherUserId, productId, limit, offset);
            return sendSuccess(res, { messages });
        }

        // POST /api/marketplace/messages - Send a message
        if (route === '/messages' && method === 'POST') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const body = await parseBody(req);

            if (!body.recipient_id || !body.message) {
                return sendError(res, 400, 'recipient_id and message are required');
            }

            const msg = await sendMessage(
                authResult.user.userId,
                body.recipient_id,
                body.message,
                body.product_id || null,
                body.booking_id || null
            );
            return sendSuccess(res, { message: msg }, 201);
        }

        // GET /api/marketplace/messages/unread - Get unread count
        if (route === '/messages/unread' && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const count = await getUnreadCount(authResult.user.userId);
            return sendSuccess(res, { unread_count: count });
        }

        // PUT /api/marketplace/messages/read - Mark messages as read
        if (route === '/messages/read' && method === 'PUT') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const body = await parseBody(req);
            if (!body.other_user_id) {
                return sendError(res, 400, 'other_user_id is required');
            }
            await markMessagesRead(authResult.user.userId, body.other_user_id, body.product_id);
            return sendSuccess(res, { success: true });
        }

        // =====================================================
        // REFERRAL ENDPOINTS
        // =====================================================

        // GET /api/marketplace/referrals/my-code - Get user's referral code and stats
        if (route === '/referrals/my-code' && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const stats = await getReferralStats(authResult.user.userId);
            const link = generateReferralLink(stats.referral_code);
            return sendSuccess(res, { ...stats, referral_link: link });
        }

        // GET /api/marketplace/referrals/link/:id?type=service|product - Generate referral link
        if (route.match(/^\/referrals\/link\/\d+$/) && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const itemId = parseInt(route.split('/')[3]);
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const type = urlObj.searchParams.get('type') || 'service';

            const stats = await getReferralStats(authResult.user.userId);
            const link = generateReferralLink(stats.referral_code, itemId, type);

            return sendSuccess(res, {
                referral_code: stats.referral_code,
                referral_link: link,
                item_id: itemId,
                item_type: type
            });
        }

        // POST /api/marketplace/referrals/track - Track referral click (public endpoint)
        if (route === '/referrals/track' && method === 'POST') {
            const body = await parseBody(req);
            try {
                const result = await trackReferralClick(
                    body.referral_code,
                    body.service_id,
                    { ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress, device: req.headers['user-agent'] }
                );
                return sendSuccess(res, result);
            } catch (err) {
                return sendError(res, 400, 'Solicitud invalida');
            }
        }

        // GET /api/marketplace/referrals/history - Get referral history
        if (route === '/referrals/history' && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const filters = {
                status: urlObj.searchParams.get('status'),
                limit: parseInt(urlObj.searchParams.get('limit')) || 20,
                offset: parseInt(urlObj.searchParams.get('offset')) || 0
            };
            const history = await getReferralHistory(authResult.user.userId, filters);
            return sendSuccess(res, { referrals: history });
        }

        // POST /api/marketplace/referrals/payout - Request commission payout
        if (route === '/referrals/payout' && method === 'POST') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const body = await parseBody(req);
            try {
                const payout = await requestPayout(authResult.user.userId, body.amount, body.payment_method);
                return sendSuccess(res, { payout }, 201);
            } catch (err) {
                return sendError(res, 400, 'Solicitud invalida');
            }
        }

        // GET /api/marketplace/referrals/payouts - Get payout history
        if (route === '/referrals/payouts' && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const payouts = await getPayoutHistory(authResult.user.userId);
            return sendSuccess(res, { payouts });
        }

        // =====================================================
        // PORTFOLIO / CV ROUTES
        // =====================================================

        // GET /api/marketplace/portfolio/cv/me — get own portfolio for editor
        if (route === '/portfolio/cv/me' && method === 'GET') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const portfolio = await getPortfolioByUserId(authResult.user.userId);
            return sendSuccess(res, { portfolio });
        }

        // PUT /api/marketplace/portfolio/cv/me — create or update own portfolio
        if (route === '/portfolio/cv/me' && method === 'PUT') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const provider = await getProviderByUserId(authResult.user.userId);
            if (!provider || provider.status !== 'active') {
                return sendError(res, 403, 'Debes tener una tienda activa para crear un portafolio');
            }
            const body = await parseBody(req);
            const portfolio = await upsertPortfolio(authResult.user.userId, body);
            return sendSuccess(res, { portfolio });
        }

        // DELETE /api/marketplace/portfolio/cv/me — delete own portfolio
        if (route === '/portfolio/cv/me' && method === 'DELETE') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            await pool.query('DELETE FROM user_portfolios WHERE user_id = $1', [authResult.user.userId]);
            return sendSuccess(res, { message: 'Portafolio eliminado' });
        }

        // POST /api/marketplace/portfolio/cv/parse — parse PDF with AI
        if (route === '/portfolio/cv/parse' && method === 'POST') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const provider = await getProviderByUserId(authResult.user.userId);
            if (!provider || provider.status !== 'active') {
                return sendError(res, 403, 'Debes tener una tienda activa');
            }

            const contentType = req.headers['content-type'] || '';
            const boundary = contentType.split('boundary=')[1];
            if (!boundary) {
                return sendError(res, 400, 'Se requiere un archivo PDF');
            }

            const chunks = [];
            let totalSize = 0;
            const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5MB

            await new Promise((resolve, reject) => {
                req.on('data', chunk => {
                    totalSize += chunk.length;
                    if (totalSize > MAX_PDF_SIZE) {
                        req.destroy();
                        return reject(new Error('TOO_LARGE'));
                    }
                    chunks.push(chunk);
                });
                req.on('end', resolve);
                req.on('error', reject);
            }).catch(err => {
                if (err.message === 'TOO_LARGE') {
                    return sendError(res, 400, 'El archivo es muy grande. Maximo 5MB.');
                }
                throw err;
            });

            if (res.writableEnded) return;

            const buffer = Buffer.concat(chunks);
            const parts = buffer.toString('binary').split('--' + boundary);

            let pdfBuffer = null;
            for (const part of parts) {
                if (part.includes('Content-Type: application/pdf')) {
                    const dataStart = part.indexOf('\r\n\r\n') + 4;
                    const dataEnd = part.lastIndexOf('\r\n');
                    if (dataStart > 3 && dataEnd > dataStart) {
                        pdfBuffer = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
                    }
                    break;
                }
            }

            if (!pdfBuffer) {
                return sendError(res, 400, 'Solo se aceptan archivos PDF');
            }

            try {
                const pdfData = await pdfParse(pdfBuffer);
                const text = (pdfData.text || '').trim();
                if (!text || text.length < 50) {
                    return sendError(res, 400, 'No se pudo extraer texto del PDF. Asegurate de que no sea un PDF escaneado.');
                }

                const parsed = await parseCVWithAI(text);
                const sanitized = sanitizePortfolioData(parsed);

                log(`CV parsed via AI for user ${authResult.user.userId} (${text.length} chars extracted)`);
                return sendSuccess(res, { portfolio: sanitized });
            } catch (err) {
                log(`ERROR parsing CV for user ${authResult.user.userId}: ${err.message}`);
                return sendError(res, 500, 'Error al analizar el CV. Intenta de nuevo.');
            }
        }

        // POST /api/marketplace/portfolio/cv/generate-summary — AI summary
        if (route === '/portfolio/cv/generate-summary' && method === 'POST') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const provider = await getProviderByUserId(authResult.user.userId);
            if (!provider || provider.status !== 'active') {
                return sendError(res, 403, 'Debes tener una tienda activa');
            }

            const body = await parseBody(req);
            if (!body || typeof body !== 'object') {
                return sendError(res, 400, 'Datos del portafolio requeridos');
            }

            try {
                const summary = await generateSummaryWithAI(body);
                log(`AI summary generated for user ${authResult.user.userId}`);
                return sendSuccess(res, { summary });
            } catch (err) {
                log(`ERROR generating summary for user ${authResult.user.userId}: ${err.message}`);
                return sendError(res, 500, 'Error al generar el resumen. Intenta de nuevo.');
            }
        }

        // GET /api/marketplace/portfolio/:handle — public portfolio (no auth)
        if (route.match(/^\/portfolio\/[a-zA-Z0-9_-]+$/) && method === 'GET') {
            const handle = decodeURIComponent(route.split('/')[2]);
            if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
                return sendError(res, 400, 'Handle invalido');
            }
            const userResult = await pool.query(
                'SELECT user_id, handle, name, avatar_url FROM users WHERE handle = $1', [handle]
            );
            if (!userResult.rows[0]) {
                return sendError(res, 404, 'Portafolio no encontrado');
            }
            const user = userResult.rows[0];
            const provider = await getProviderByUserId(user.user_id);
            if (!provider || provider.status !== 'active') {
                return sendError(res, 404, 'Portafolio no encontrado');
            }
            // Services (ordered by featured + display_order)
            const servicesResult = await pool.query(`
                SELECT s.service_id, s.title, s.short_description, s.price, s.price_type, s.currency, s.images, s.featured, s.display_order, c.name_es AS category_name, c.icon AS category_icon
                FROM marketplace_services s
                LEFT JOIN marketplace_categories c ON s.category_id = c.category_id
                WHERE s.provider_id = $1 AND s.status = 'active'
                ORDER BY s.featured DESC, s.display_order ASC, s.created_at DESC
            `, [provider.provider_id]);
            // Products (ordered by featured + display_order)
            const productsResult = await pool.query(`
                SELECT p.id, p.title, p.price, p.currency, p.condition, p.images, p.featured, p.display_order, c.name_es AS category_name, c.icon AS category_icon
                FROM marketplace_products p
                LEFT JOIN marketplace_categories c ON p.category_id = c.category_id
                WHERE p.seller_id = $1 AND p.is_active = true
                ORDER BY p.featured DESC, p.display_order ASC, p.created_at DESC
            `, [user.user_id]);
            // Reviews (latest 10)
            const reviews = await getProviderReviews(provider.provider_id, 10);
            // Portfolio / CV (public only)
            const portfolioResult = await pool.query(`
                SELECT professional_title, summary, experience, education, skills,
                       certifications, projects, languages, is_public, allow_downloads
                FROM user_portfolios
                WHERE user_id = $1 AND is_public = true
            `, [user.user_id]);
            const portfolio = portfolioResult.rows[0] || null;
            return sendSuccess(res, {
                user: { handle: user.handle, full_name: user.name, profile_image: user.avatar_url },
                provider: {
                    business_name: provider.business_name,
                    description: provider.description,
                    profile_image: provider.profile_image,
                    city: provider.city,
                    neighborhood: provider.neighborhood,
                    service_areas: provider.service_areas,
                    social_links: provider.social_links,
                    store_theme: provider.store_theme,
                    shop_type: provider.shop_type,
                    avg_rating: provider.avg_rating,
                    total_reviews: provider.total_reviews,
                    completed_jobs: provider.completed_jobs,
                    response_rate: provider.response_rate,
                    is_verified: provider.is_verified,
                    created_at: provider.created_at
                },
                services: servicesResult.rows,
                products: productsResult.rows,
                reviews,
                portfolio
            });
        }

        // PATCH /api/marketplace/services/:id — toggle featured / set display_order (auth, owner only)
        if (route.match(/^\/services\/\d+$/) && method === 'PATCH') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const serviceId = parseInt(route.split('/')[2]);
            const provider = await getProviderByUserId(authResult.user.userId);
            if (!provider) {
                return sendError(res, 403, 'No tienes perfil de proveedor');
            }
            const body = await parseBody(req);
            const updates = [];
            const values = [serviceId, provider.provider_id];
            let idx = 3;
            if (typeof body.featured === 'boolean') {
                updates.push(`featured = $${idx++}`);
                values.push(body.featured);
            }
            if (typeof body.display_order === 'number' && Number.isInteger(body.display_order) && body.display_order >= 0 && body.display_order <= 999) {
                updates.push(`display_order = $${idx++}`);
                values.push(body.display_order);
            }
            if (updates.length === 0) {
                return sendError(res, 400, 'Nada que actualizar');
            }
            const result = await pool.query(`
                UPDATE marketplace_services SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE service_id = $1 AND provider_id = $2
                RETURNING service_id, featured, display_order
            `, values);
            if (!result.rows[0]) {
                return sendError(res, 404, 'Servicio no encontrado');
            }
            return sendSuccess(res, { service: result.rows[0] });
        }

        // PATCH /api/marketplace/products/:id — toggle featured / set display_order (auth, owner only)
        if (route.match(/^\/products\/\d+$/) && method === 'PATCH') {
            const authResult = await authenticateRequest(req);
            if (!authResult.authenticated) {
                return sendError(res, 401, 'Unauthorized');
            }
            const productId = parseInt(route.split('/')[2]);
            // Products use seller_id (user_id), not provider_id
            const body = await parseBody(req);
            const updates = [];
            const values = [productId, authResult.user.userId];
            let idx = 3;
            if (typeof body.featured === 'boolean') {
                updates.push(`featured = $${idx++}`);
                values.push(body.featured);
            }
            if (typeof body.display_order === 'number' && Number.isInteger(body.display_order) && body.display_order >= 0 && body.display_order <= 999) {
                updates.push(`display_order = $${idx++}`);
                values.push(body.display_order);
            }
            if (updates.length === 0) {
                return sendError(res, 400, 'Nada que actualizar');
            }
            const result = await pool.query(`
                UPDATE marketplace_products SET ${updates.join(', ')}, updated_at = NOW()
                WHERE id = $1 AND seller_id = $2
                RETURNING id, featured, display_order
            `, values);
            if (!result.rows[0]) {
                return sendError(res, 404, 'Producto no encontrado');
            }
            return sendSuccess(res, { product: result.rows[0] });
        }

        // Route not found in marketplace
        return false;

    } catch (error) {
        log('error', `Marketplace API error: ${error.message}`);
        return sendError(res, 500, "Error interno del servidor");
    }
}

// =====================================================
// =====================================================
// MESSAGING FUNCTIONS
// =====================================================

/**
 * Get conversations for a user
 */
async function getConversations(userId) {
    const result = await pool.query(`
        SELECT DISTINCT ON (other_user_id, product_id)
            m.message_id,
            m.product_id,
            m.booking_id,
            m.message,
            m.created_at,
            m.is_read,
            CASE 
                WHEN m.sender_id = $1 THEN m.recipient_id
                ELSE m.sender_id
            END as other_user_id,
            CASE 
                WHEN m.sender_id = $1 THEN false
                ELSE NOT m.is_read
            END as has_unread,
            u.name as other_user_name,
            p.title as product_title,
            p.price as product_price
        FROM marketplace_messages m
        LEFT JOIN users u ON (CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END) = u.user_id
        LEFT JOIN marketplace_products p ON m.product_id = p.id
        WHERE m.sender_id = $1 OR m.recipient_id = $1
        ORDER BY other_user_id, product_id, m.created_at DESC
    `, [userId]);
    
    return result.rows;
}

/**
 * Get messages in a conversation
 */
async function getMessages(userId, otherUserId, productId = null, limit = 50, offset = 0) {
    let query = `
        SELECT m.message_id, m.booking_id, m.sender_id, m.recipient_id, m.message, m.is_read, m.read_at, m.created_at,
               u.name as sender_name
        FROM marketplace_messages m
        LEFT JOIN users u ON m.sender_id = u.user_id
        WHERE ((m.sender_id = $1 AND m.recipient_id = $2)
               OR (m.sender_id = $2 AND m.recipient_id = $1))
    `;
    const params = [userId, otherUserId];
    let paramIndex = 3;

    if (productId) {
        query += ` AND m.product_id = $${paramIndex++}`;
        params.push(productId);
    } else {
        query += ` AND m.product_id IS NULL`;
    }

    query += ` ORDER BY m.created_at ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Mark messages as read
    await pool.query(`
        UPDATE marketplace_messages 
        SET is_read = true, read_at = NOW()
        WHERE recipient_id = $1 AND sender_id = $2 AND is_read = false
    `, [userId, otherUserId]);

    return result.rows;
}

/**
 * Send a message
 */
async function sendMessage(senderId, recipientId, message, productId = null, bookingId = null) {
    const result = await pool.query(`
        INSERT INTO marketplace_messages (sender_id, recipient_id, message, product_id, booking_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING message_id, sender_id, recipient_id, message, is_read, created_at
    `, [senderId, recipientId, message, productId, bookingId]);

    return result.rows[0];
}

/**
 * Get unread message count
 */
async function getUnreadCount(userId) {
    const result = await pool.query(`
        SELECT COUNT(*) as unread_count
        FROM marketplace_messages
        WHERE recipient_id = $1 AND is_read = false
    `, [userId]);

    return parseInt(result.rows[0].unread_count) || 0;
}

/**
 * Mark messages as read
 */
async function markMessagesRead(userId, otherUserId, productId = null) {
    let query = `
        UPDATE marketplace_messages
        SET is_read = true, read_at = NOW()
        WHERE recipient_id = $1 AND sender_id = $2 AND is_read = false
    `;
    const params = [userId, otherUserId];

    if (productId) {
        query += ` AND product_id = $3`;
        params.push(productId);
    }

    await pool.query(query, params);
    return { success: true };
}

// EXPORTS
// =====================================================

module.exports = {
    initMarketplaceAPI,
    handleMarketplaceRequest,
    // Categories
    getCategories,
    // Services
    getServices,
    getServiceById,
    createService,
    updateService,
    // Products
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getMyProducts,
    createProductOrder,
    getProductOrders,
    updateProductOrderStatus,
    // Providers
    getProviders,
    getProviderById,
    getProviderByUserId,
    registerProvider,
    updateProvider,
    // Bookings
    getBookings,
    getBookingById,
    createBooking,
    updateBookingStatus,
    // Reviews
    getReviews,
    getProviderReviews,
    createReview,
    // Subscriptions
    getSubscription,
    upgradeSubscription,
    // Favorites
    getFavorites,
    addFavorite,
    removeFavorite,
    // Stats
    getMarketplaceStats,
    // Tanda Membership
    checkTandaMembership,
    // Referrals/Affiliates
    getOrCreateReferralCode,
    getReferralStats,
    trackReferralClick,
    processReferralConversion,
    getReferralHistory,
    generateReferralLink,
    requestPayout,
    getPayoutHistory,
    // LTD Wallet
    getLTDBalance,
    debitLTDTokens,
    creditLTDTokens,
    transferLTD,
    checkSellerCommissionCapacity,
    // Messaging
    getConversations,
    getMessages,
    sendMessage,
    getUnreadCount,
    markMessagesRead
};
