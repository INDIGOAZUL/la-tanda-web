/**
 * Lottery Scheduler - Daily Combined Prediction Publisher
 * Generates ONE combined daily post with predictions for all 3 draws
 *
 * Schedule: 10:15 AM Honduras time (before first draw at 11am)
 *
 * @version 2.0.0
 * @date 2026-02-10
 */

const cron = require('node-cron');
const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import lottery predictor (includes pool)
const lotteryPredictor = require('./lottery-predictor.js');
const lotteryJaladora = require('./lottery-jaladora.js');

// Use the predictor's pool for DB operations
const pool = lotteryPredictor.pool;

// Logging utility
function log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, ...data };
    if (level === 'error') {
        process.stderr.write(JSON.stringify(logEntry) + '\n');
    } else {
        process.stdout.write(JSON.stringify(logEntry) + '\n');
    }
}

// Draw times
const DRAW_TIMES = ['11am', '3pm', '9pm'];
const DRAW_LABELS = { '11am': '11:00 AM', '3pm': '3:00 PM', '9pm': '9:00 PM' };

/**
 * Insert event into social_feed
 */
async function insertSocialEvent(eventData) {
    try {
        const result = await pool.query(`
            INSERT INTO social_feed (event_type, actor_id, actor_name, title, description, image_url, action_url, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `, [
            eventData.event_type,
            eventData.actor_id || null,
            eventData.actor_name || null,
            eventData.title,
            eventData.description || null,
            eventData.image_url || null,
            eventData.action_url || null,
            JSON.stringify(eventData.metadata || {})
        ]);
        log('info', 'Social event inserted', { id: result.rows[0]?.id });
        return result.rows[0]?.id;
    } catch (error) {
        log('error', 'Failed to insert social event', { error: error.message });
        return null;
    }
}

/**
 * Generate prediction for a single draw time
 */
async function generateSinglePrediction(drawTime) {
    try {
        const prediction = await lotteryPredictor.generatePrediction(drawTime, 'premium');
        if (!prediction || !prediction.numbers || prediction.numbers.length === 0) {
            return null;
        }

        const numbers = prediction.numbers.map(n => ({
            number: n.value.toString().padStart(2, '0'),
            sign: n.sign,
            confidence: n.score || prediction.confidence
        }));

        const topNumber = prediction.numbers[0].value;
        const jaladores = lotteryJaladora.getJaladores(topNumber);

        return {
            drawTime,
            numbers,
            jaladores,
            confidence: prediction.confidence || 65,
            topSign: prediction.numbers[0].sign
        };
    } catch (error) {
        log('error', `Prediction failed for ${drawTime}`, { error: error.message });
        return null;
    }
}

/**
 * Generate combined daily prediction and publish ONE post
 */
async function generateDailyPost() {
    const startTime = Date.now();
    log('info', 'Starting daily combined prediction');

    try {
        // Generate predictions for all 3 draws
        const predictions = [];
        for (const drawTime of DRAW_TIMES) {
            const pred = await generateSinglePrediction(drawTime);
            if (pred) predictions.push(pred);
        }

        if (predictions.length === 0) {
            log('error', 'All predictions failed');
            return false;
        }

        // Format date
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-HN', {
            weekday: 'long', day: 'numeric', month: 'long'
        });

        // Build combined description
        let description = '';
        const allNumbers = [];

        for (const pred of predictions) {
            const nums = pred.numbers.slice(0, 3).map(n => n.number).join(', ');
            description += `\n⏰ ${DRAW_LABELS[pred.drawTime]}: ${nums}`;
            if (pred.topSign) {
                description += ` (${pred.topSign})`;
            }
            allNumbers.push(...pred.numbers);
        }

        // Add jaladores based on LAST REAL lottery result
        try {
            const lastResult = await pool.query(
                "SELECT main_number, animal_name, draw_time FROM hn_lottery_draws ORDER BY draw_date DESC, draw_time DESC LIMIT 1"
            );
            if (lastResult.rows.length > 0) {
                const lastNum = lastResult.rows[0].main_number;
                const lastAnimal = lastResult.rows[0].animal_name || '';
                const lastDraw = lastResult.rows[0].draw_time || '';
                const jaladores = lotteryJaladora.getJaladores(lastNum);
                const jalStr = jaladores.map(j => j.toString().padStart(2, '0')).join(', ');
                const numStr = lastNum.toString().padStart(2, '0');
                description += '\n\n\ud83c\udfaf Ultimo resultado: ' + numStr + ' (' + lastAnimal + ') - ' + lastDraw;
                description += '\n\ud83d\udd17 Jala: ' + jalStr;
            }
        } catch (e) {
            // Skip jaladores if query fails
        }

        // Average confidence
        const avgConfidence = Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length);
        description += `\n📊 Confianza promedio: ${avgConfidence}%`;

        // Publish ONE combined post
        const eventId = await insertSocialEvent({
            event_type: 'prediction_shared',
            actor_id: null,
            actor_name: '🎱 Predictor La Tanda',
            title: `Predicciones del dia - ${dateStr}`,
            description: description.trim(),
            image_url: null,
            action_url: '/lottery-predictor.html',
            metadata: {
                type: 'daily_combined',
                predictions: predictions.map(p => ({
                    drawTime: p.drawTime,
                    numbers: p.numbers,
                    jaladores: p.jaladores,
                    confidence: p.confidence
                })),
                avgConfidence,
                automated: true,
                generatedAt: now.toISOString()
            }
        });

        const elapsed = Date.now() - startTime;
        log('info', 'Daily combined prediction published', {
            eventId,
            predictionsCount: predictions.length,
            avgConfidence,
            elapsedMs: elapsed
        });

        return true;

    } catch (error) {
        log('error', 'Daily prediction failed', { error: error.message });
        return false;
    }
}

/**
 * Manual trigger for testing
 */
async function triggerManual() {
    log('info', 'Manual trigger requested');
    return await generateDailyPost();
}

/**
 * Initialize scheduler - ONE daily job
 */
function initScheduler() {
    log('info', '=== Lottery Scheduler v2.0 Starting ===');

    // Single daily job at 10:15 AM Honduras time (45 min before first draw)
    cron.schedule('15 10 * * *', async () => {
        log('info', 'Daily prediction cron triggered');
        await generateDailyPost();
    }, {
        timezone: 'America/Tegucigalpa'
    });

    log('info', 'Scheduled: Daily combined prediction at 10:15 AM (America/Tegucigalpa)');
    log('info', '=== Scheduler initialized ===');
}

// Health check
function getStatus() {
    return {
        status: 'running',
        version: '2.0.0',
        schedule: '10:15 AM daily (America/Tegucigalpa)',
        postsPerDay: 1,
        timezone: 'America/Tegucigalpa',
        uptime: process.uptime()
    };
}

// Start if run directly
if (require.main === module) {
    initScheduler();
    log('info', 'Scheduler running. Press Ctrl+C to stop.');
}

module.exports = {
    initScheduler,
    triggerManual,
    generateDailyPost,
    getStatus,
    DRAW_TIMES
};
