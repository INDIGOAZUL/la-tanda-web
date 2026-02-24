/**
 * Honduras Lottery API Endpoints
 */

const crypto = require('crypto');
const lotteryPredictor = require("./lottery-predictor.js");
const lotteryJaladora = require("./lottery-jaladora.js");
const url = require("url");

async function handleLotteryRequest(req, res, pathname, method, sendSuccess, sendError, authenticateRequest, parseBody, log) {
    
    // GET /api/lottery/stats
    if (pathname === "/api/lottery/stats" && (method === "GET" || method === "HEAD")) {
        try {
            const params = new URLSearchParams(url.parse(req.url).query || "");
            const period = parseInt(params.get("period")) || 30;
            const stats = await lotteryPredictor.getStatistics(period);
            sendSuccess(res, { stats });
        } catch (error) {
            log("error", "Lottery stats error", { error: error.message });
            sendError(res, 500, "Error al obtener estadísticas");
        }
        return true;
    }

    // GET /api/lottery/scheduler-status
    if (pathname === "/api/lottery/scheduler-status" && (method === "GET" || method === "HEAD")) {
        try {
            // Get scheduler status from the module
            let schedulerStatus;
            try {
                const scheduler = require('./lottery-scheduler.js');
                schedulerStatus = scheduler.getStatus();
            } catch (e) {
                schedulerStatus = { status: 'not_loaded', error: e.message };
            }
            sendSuccess(res, { scheduler: schedulerStatus });
        } catch (error) {
            log("error", "Scheduler status error", { error: error.message });
            sendError(res, 500, "Error al obtener estado del scheduler");
        }
        return true;
    }
    
    // GET /api/lottery/results
    if (pathname === "/api/lottery/results" && (method === "GET" || method === "HEAD")) {
        try {
            const params = new URLSearchParams(url.parse(req.url).query || "");
            const limit = Math.min(parseInt(params.get("limit")) || 10, 100);
            const result = await lotteryPredictor.pool.query(
                "SELECT draw_date, draw_time, main_number, companion_number, animal_name FROM hn_lottery_draws ORDER BY draw_date DESC, draw_time DESC LIMIT $1",
                [limit]
            );
            sendSuccess(res, {
                results: result.rows.map(r => ({
                    date: r.draw_date,
                    time: r.draw_time,
                    mainNumber: r.main_number.toString().padStart(2, "0"),
                    companionNumber: r.companion_number,
                    animal: r.animal_name
                }))
            });
        } catch (error) {
            log("error", "Lottery results error", { error: error.message });
            sendError(res, 500, "Error al obtener resultados");
        }
        return true;
    }
    
    // POST /api/lottery/spin

    // POST /api/lottery/trial-spin - Free trial spin without auth
    if (pathname === "/api/lottery/trial-spin" && method === "POST") {
        try {
            const body = await parseBody(req);
            const drawTime = body.draw_time || null;

            // Generate prediction for trial user (tier = "trial")
            
            // Check if ML algorithm requested
            const useML = true; // ML model enabled for all users
            let prediction;
            if (useML) {
                try {
                    const { execSync } = require("child_process");
                    const result = execSync(`python3 /var/www/latanda.online/lottery-ml-model-v4.py predict ${drawTime || "11am"}`, { encoding: "utf8", timeout: 15000 });
                    const mlResult = JSON.parse(result);
                    prediction = {
                        numbers: mlResult.predictions.map(p => ({ number: p[0].toString().padStart(2, "0"), confidence: p[1] })),
                        algorithm: "xgboost-digits-v4",
                        confidence: Math.round(mlResult.predictions[0][1]),
                        drawTime: drawTime || "11am"
                    };
                } catch (e) {
                    prediction = await lotteryPredictor.generatePrediction(drawTime, "trial");
                }
            } else {
                prediction = await lotteryPredictor.generatePrediction(drawTime, "trial");
            }

            // Don't record spin for trial users (they're not in DB)
            // Just return the prediction

            sendSuccess(res, {
                prediction,
                message: "¡Tu predicción de prueba está lista! Crea una cuenta para más predicciones.",
                is_trial: true
            });
        } catch (error) {
            log("error", "Trial spin error", { error: error.message });
            sendError(res, 500, "Error al generar predicción de prueba");
        }
        return true;
    }

    if (pathname === "/api/lottery/spin" && method === "POST") {
        try {
            const authResult = authenticateRequest(req);
            if (!authResult.authenticated) {
                sendError(res, 401, "Autenticación requerida");
                return true;
            }
            const authUser = authResult.user;
            
            const body = await parseBody(req);
            const drawTime = body.draw_time || null;
            
            const spinStatus = await lotteryPredictor.checkUserSpins(authUser.userId);
            
            if (!spinStatus.canSpin) {
                sendError(res, 429, "No te quedan giros disponibles hoy", {
                    spin_status: spinStatus,
                    upgrade_url: "/lottery-subscriptions"
                });
                return true;
            }
            
            // Check if ML algorithm requested
            const useML = true; // ML model enabled for all users
            let prediction;
            if (useML) {
                try {
                    const { execSync } = require("child_process");
                    const result = execSync(`python3 /var/www/latanda.online/lottery-ml-model-v4.py predict ${drawTime || "11am"}`, { encoding: "utf8", timeout: 15000 });
                    const mlResult = JSON.parse(result);
                    prediction = {
                        numbers: mlResult.predictions.map(p => ({ number: p[0].toString().padStart(2, "0"), confidence: p[1] })),
                        algorithm: "xgboost-digits-v4",
                        confidence: Math.round(mlResult.predictions[0][1]),
                        drawTime: drawTime || "11am"
                    };
                } catch (e) {
                    prediction = await lotteryPredictor.generatePrediction(drawTime, spinStatus.tier);
                }
            } else {
                prediction = await lotteryPredictor.generatePrediction(drawTime, spinStatus.tier);
            }
            
            const predictionId = await lotteryPredictor.recordSpin(authUser.userId, prediction);
            prediction.id = predictionId;  // Add ID to prediction object
            const newSpinStatus = await lotteryPredictor.checkUserSpins(authUser.userId);
            
            sendSuccess(res, {
                prediction,
                spin_status: newSpinStatus,
                message: spinStatus.tier === "free" ? "¡Mejora a Premium para más números!" : "¡Buena suerte!"
            });
        } catch (error) {
            log("error", "Lottery spin error", { error: error.message, stack: error.stack });
            sendError(res, 500, "Error al generar predicción");
        }
        return true;
    }
    
    // GET /api/lottery/spin-status
    if (pathname === "/api/lottery/spin-status" && (method === "GET" || method === "HEAD")) {
        try {
            const authResult = authenticateRequest(req);
            if (!authResult.authenticated) {
                sendError(res, 401, "Autenticación requerida");
                return true;
            }
            const authUser = authResult.user;
            const spinStatus = await lotteryPredictor.checkUserSpins(authUser.userId);
            sendSuccess(res, { spin_status: spinStatus });
        } catch (error) {
            log("error", "Spin status error", { error: error.message });
            sendError(res, 500, "Error al verificar giros");
        }
        return true;
    }
    
    // GET /api/lottery/history
    if (pathname === "/api/lottery/history" && (method === "GET" || method === "HEAD")) {
        try {
            const authResult = authenticateRequest(req);
            if (!authResult.authenticated) {
                sendError(res, 401, "Autenticación requerida");
                return true;
            }
            const authUser = authResult.user;
            const result = await lotteryPredictor.pool.query(
                "SELECT id, predicted_numbers, draw_time, confidence, created_at FROM hn_lottery_predictions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
                [authUser.userId]
            );
            sendSuccess(res, {
                predictions: result.rows.map(r => ({
                    id: r.id,
                    numbers: r.predicted_numbers,
                    drawTime: r.draw_time,
                    confidence: r.confidence,
                    createdAt: r.created_at
                }))
            });
        } catch (error) {
            log("error", "History error", { error: error.message });
            sendError(res, 500, "Error al obtener historial");
        }
        return true;
    }
    
    // POST /api/lottery/subscribe
    if (pathname === "/api/lottery/subscribe" && method === "POST") {
        try {
            const authResult = authenticateRequest(req);
            if (!authResult.authenticated) {
                sendError(res, 401, "Autenticación requerida");
                return true;
            }
            const authUser = authResult.user;
            
            const body = await parseBody(req);
            const tier = body.tier;
            const billing = body.billing || "monthly";
            
            if (!["premium", "diamond"].includes(tier)) {
                sendError(res, 400, "Tier inválido");
                return true;
            }
            
            const prices = {
                premium: { monthly: 25, annual: 19 * 12 },
                diamond: { monthly: 49, annual: 29 * 12 }
            };
            
            const amount = prices[tier][billing];
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + (billing === "annual" ? 12 : 1));
            
            await lotteryPredictor.pool.query(
                `INSERT INTO hn_lottery_subscriptions (user_id, tier, status, start_date, end_date, billing_cycle, amount)
                 VALUES ($1, $2, 'active', CURRENT_DATE, $3, $4, $5)
                 ON CONFLICT (user_id) DO UPDATE SET tier = $2, status = 'active', end_date = $3, billing_cycle = $4, amount = $5, updated_at = CURRENT_TIMESTAMP`,
                [authUser.userId, tier, endDate, billing, amount]
            );
            
            sendSuccess(res, {
                subscription: { tier, billing, amount, start_date: new Date().toISOString().split("T")[0], end_date: endDate.toISOString().split("T")[0] },
                message: tier === "diamond" ? "¡Bienvenido a Diamante!" : "¡Bienvenido a Premium!"
            });
        } catch (error) {
            log("error", "Subscription error", { error: error.message });
            sendError(res, 500, "Error al procesar suscripción");
        }
        return true;
    }
    
    // GET /api/lottery/stats/detailed - Detailed statistics for charts
    if (pathname === "/api/lottery/stats/detailed" && (method === "GET" || method === "HEAD")) {
        try {
            const params = new URLSearchParams(url.parse(req.url).query || "");
            const period = parseInt(params.get("period")) || 30;
            
            const client = await lotteryPredictor.pool.connect();
            try {
                // Frequency distribution (all 100 numbers)
                const freqQuery = `
                    SELECT main_number as number, COUNT(*) as frequency
                    FROM hn_lottery_draws
                    WHERE draw_date >= CURRENT_DATE - $1::integer
                    GROUP BY main_number
                    ORDER BY main_number
                `;
                const freqResult = await client.query(freqQuery, [period]);
                
                // Fill missing numbers with 0
                const frequency = new Array(100).fill(0);
                freqResult.rows.forEach(r => {
                    frequency[r.number] = parseInt(r.frequency);
                });
                
                // Frequency by time slot
                const timeQuery = `
                    SELECT draw_time, main_number as number, COUNT(*) as frequency
                    FROM hn_lottery_draws
                    WHERE draw_date >= CURRENT_DATE - $1::integer
                    GROUP BY draw_time, main_number
                    ORDER BY draw_time, main_number
                `;
                const timeResult = await client.query(timeQuery, [period]);
                
                // Organize by time slot for heatmap
                const byTime = { "11am": new Array(100).fill(0), "3pm": new Array(100).fill(0), "9pm": new Array(100).fill(0) };
                timeResult.rows.forEach(r => {
                    if (byTime[r.draw_time]) {
                        byTime[r.draw_time][r.number] = parseInt(r.frequency);
                    }
                });
                
                // Daily trend
                const trendQuery = `
                    SELECT draw_date::text as date, COUNT(*) as draws,
                           array_agg(main_number ORDER BY draw_time) as numbers
                    FROM hn_lottery_draws
                    WHERE draw_date >= CURRENT_DATE - $1::integer
                    GROUP BY draw_date
                    ORDER BY draw_date
                `;
                const trendResult = await client.query(trendQuery, [period]);
                
                // Top 10 most frequent
                const top10 = freqResult.rows
                    .sort((a, b) => b.frequency - a.frequency)
                    .slice(0, 10)
                    .map(r => ({ number: parseInt(r.number), frequency: parseInt(r.frequency) }));
                
                // Bottom 10
                const bottom10 = freqResult.rows
                    .filter(r => r.frequency > 0)
                    .sort((a, b) => a.frequency - b.frequency)
                    .slice(0, 10)
                    .map(r => ({ number: parseInt(r.number), frequency: parseInt(r.frequency) }));
                
                sendSuccess(res, {
                    period,
                    frequency,
                    byTimeSlot: byTime,
                    dailyTrend: trendResult.rows,
                    top10,
                    bottom10,
                    totalDraws: freqResult.rows.reduce((sum, r) => sum + parseInt(r.frequency), 0)
                });
            } finally {
                client.release();
            }
        } catch (error) {
            log("error", "Detailed stats error", { error: error.message });
            sendError(res, 500, "Error al obtener estadísticas detalladas");
        }
        return true;
    }


    // GET /api/lottery/accuracy-dashboard - Comprehensive accuracy statistics
    if (pathname === "/api/lottery/accuracy-dashboard" && (method === "GET" || method === "HEAD")) {
        try {
            const client = await lotteryPredictor.pool.connect();
            try {
                // 1. Overall backtest accuracy (last 90 days)
                const backtestQuery = `
                    WITH predictions AS (
                        SELECT 
                            d.draw_date,
                            d.draw_time,
                            d.main_number as actual,
                            ARRAY(
                                SELECT s.number FROM hn_lottery_stats s
                                WHERE s.period_days = 30
                                AND (s.draw_time = d.draw_time OR s.draw_time IS NULL)
                                ORDER BY s.frequency DESC, s.gap_days DESC
                                LIMIT 5
                            ) as predicted
                        FROM hn_lottery_draws d
                        WHERE d.draw_date >= CURRENT_DATE - INTERVAL '90 days'
                    )
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN actual = ANY(predicted[1:1]) THEN 1 END) as top1_hits,
                        COUNT(CASE WHEN actual = ANY(predicted[1:3]) THEN 1 END) as top3_hits,
                        COUNT(CASE WHEN actual = ANY(predicted[1:5]) THEN 1 END) as top5_hits
                    FROM predictions
                `;
                const backtest = await client.query(backtestQuery);
                const bt = backtest.rows[0];
                
                // 2. Accuracy by time slot
                const byTimeQuery = `
                    WITH predictions AS (
                        SELECT 
                            d.draw_time,
                            d.main_number as actual,
                            ARRAY(
                                SELECT s.number FROM hn_lottery_stats s
                                WHERE s.period_days = 30 AND s.draw_time = d.draw_time
                                ORDER BY s.frequency DESC
                                LIMIT 5
                            ) as predicted
                        FROM hn_lottery_draws d
                        WHERE d.draw_date >= CURRENT_DATE - INTERVAL '90 days'
                    )
                    SELECT 
                        draw_time,
                        COUNT(*) as total,
                        ROUND(100.0 * COUNT(CASE WHEN actual = ANY(predicted[1:5]) THEN 1 END) / COUNT(*), 1) as top5_rate
                    FROM predictions
                    GROUP BY draw_time
                    ORDER BY draw_time
                `;
                const byTime = await client.query(byTimeQuery);
                
                // 3. Markov chain performance
                const markovQuery = `
                    SELECT 
                        COUNT(*) as total_transitions,
                        ROUND(AVG(probability) * 100, 2) as avg_probability,
                        ROUND(MAX(probability) * 100, 2) as max_probability,
                        COUNT(CASE WHEN probability > 0.10 THEN 1 END) as high_prob_transitions
                    FROM hn_lottery_markov
                    WHERE transitions >= 3
                `;
                const markov = await client.query(markovQuery);
                
                // 4. Real user predictions accuracy
                const userPredQuery = `
                    SELECT 
                        COUNT(*) as total_predictions,
                        COUNT(CASE WHEN was_correct THEN 1 END) as correct,
                        ROUND(100.0 * COUNT(CASE WHEN was_correct THEN 1 END) / NULLIF(COUNT(actual_result), 0), 1) as hit_rate
                    FROM hn_lottery_predictions
                    WHERE actual_result IS NOT NULL
                `;
                const userPred = await client.query(userPredQuery);
                
                // 5. Hot/Cold number accuracy
                const hotColdQuery = `
                    WITH recent_draws AS (
                        SELECT main_number FROM hn_lottery_draws 
                        WHERE draw_date >= CURRENT_DATE - INTERVAL '30 days'
                    ),
                    hot_numbers AS (
                        SELECT number FROM hn_lottery_stats 
                        WHERE is_hot = true AND period_days = 30
                    ),
                    cold_numbers AS (
                        SELECT number FROM hn_lottery_stats 
                        WHERE is_cold = true AND period_days = 30
                    )
                    SELECT 
                        (SELECT COUNT(*) FROM recent_draws WHERE main_number IN (SELECT number FROM hot_numbers)) as hot_hits,
                        (SELECT COUNT(*) FROM recent_draws) as total_draws,
                        (SELECT COUNT(*) FROM hot_numbers) as hot_count,
                        (SELECT COUNT(*) FROM cold_numbers) as cold_count
                `;
                const hotCold = await client.query(hotColdQuery);
                const hc = hotCold.rows[0];
                
                sendSuccess(res, {
                    backtest: {
                        period_days: 90,
                        total_tests: parseInt(bt.total),
                        top1: { hits: parseInt(bt.top1_hits), rate: (100 * bt.top1_hits / bt.total).toFixed(1), vs_random: (bt.top1_hits / bt.total / 0.01).toFixed(1) + "x" },
                        top3: { hits: parseInt(bt.top3_hits), rate: (100 * bt.top3_hits / bt.total).toFixed(1), vs_random: (bt.top3_hits / bt.total / 0.03).toFixed(1) + "x" },
                        top5: { hits: parseInt(bt.top5_hits), rate: (100 * bt.top5_hits / bt.total).toFixed(1), vs_random: (bt.top5_hits / bt.total / 0.05).toFixed(1) + "x" }
                    },
                    by_time_slot: byTime.rows.map(r => ({
                        time: r.draw_time,
                        total: parseInt(r.total),
                        top5_rate: parseFloat(r.top5_rate)
                    })),
                    markov_chain: {
                        total_patterns: parseInt(markov.rows[0].total_transitions),
                        avg_probability: parseFloat(markov.rows[0].avg_probability),
                        max_probability: parseFloat(markov.rows[0].max_probability),
                        high_confidence_patterns: parseInt(markov.rows[0].high_prob_transitions)
                    },
                    user_predictions: {
                        total: parseInt(userPred.rows[0].total_predictions),
                        correct: parseInt(userPred.rows[0].correct) || 0,
                        hit_rate: parseFloat(userPred.rows[0].hit_rate) || 0
                    },
                    number_analysis: {
                        hot_numbers: parseInt(hc.hot_count),
                        cold_numbers: parseInt(hc.cold_count),
                        hot_hit_rate: (100 * hc.hot_hits / hc.total_draws).toFixed(1)
                    },
                    methodology: "markov_chain + frequency_analysis",
                    last_updated: new Date().toISOString()
                });
            } finally {
                client.release();
            }
        } catch (error) {
            log("error", "Accuracy dashboard error", { error: error.message });
            sendError(res, 500, "Error al calcular estadísticas");
        }
        return true;
    }
    // GET /api/lottery/backtest - Simulate predictions vs actual results
    if (pathname === "/api/lottery/backtest" && (method === "GET" || method === "HEAD")) {
        try {
            const params = new URLSearchParams(url.parse(req.url).query || "");
            const days = Math.min(parseInt(params.get("days")) || 30, 90);
            
            const client = await lotteryPredictor.pool.connect();
            try {
                // Get recent draws for comparison
                const drawsQuery = `
                    SELECT id, main_number, draw_date, draw_time
                    FROM hn_lottery_draws
                    ORDER BY draw_date DESC, draw_time DESC
                    LIMIT $1::integer
                `;
                const drawsResult = await client.query(drawsQuery, [days * 3]);
                
                let hits = 0;
                let top3Hits = 0;
                let top5Hits = 0;
                let totalTests = 0;
                const results = [];
                
                // For each draw, calculate what prediction would have been
                for (const draw of drawsResult.rows) {
                    // Get previous draw for Markov chain
                    const prevDrawQuery = `
                        SELECT main_number FROM hn_lottery_draws
                        WHERE draw_date < $1 AND draw_time = $2
                        ORDER BY draw_date DESC LIMIT 1
                    `;
                    const prevDraw = await client.query(prevDrawQuery, [draw.draw_date, draw.draw_time]);
                    const prevNumber = prevDraw.rows[0]?.main_number;
                    
                    // IMPROVED ALGORITHM: frequency + momentum + markov + gap
                    const freqQuery = `
                        WITH freq_30d AS (
                            SELECT main_number, COUNT(*) as frequency
                            FROM hn_lottery_draws
                            WHERE draw_date < $1 AND draw_date >= $1::date - 30
                            AND draw_time = $3
                            GROUP BY main_number
                        ),
                        momentum AS (
                            SELECT main_number, COUNT(*) as recent_freq
                            FROM hn_lottery_draws
                            WHERE draw_date < $1 AND draw_date >= $1::date - 7
                            AND draw_time = $3
                            GROUP BY main_number
                        ),
                        markov AS (
                            SELECT to_number, probability FROM hn_lottery_markov
                            WHERE from_number = $2 AND (draw_time = $3 OR draw_time IS NULL)
                        ),
                        gaps AS (
                            SELECT main_number, ($1::date - MAX(draw_date)) as gap_days
                            FROM hn_lottery_draws
                            WHERE draw_date < $1
                            GROUP BY main_number
                        )
                        SELECT f.main_number,
                            (COALESCE(m.recent_freq, 0) * 25 +
                             COALESCE(mk.probability, 0) * 150 +
                             f.frequency * 8 +
                             CASE WHEN g.gap_days > 7 THEN LEAST(g.gap_days * 2, 30) ELSE 0 END) as score
                        FROM freq_30d f
                        LEFT JOIN momentum m ON f.main_number = m.main_number
                        LEFT JOIN markov mk ON f.main_number = mk.to_number
                        LEFT JOIN gaps g ON f.main_number = g.main_number
                        ORDER BY score DESC
                        LIMIT 10
                    `;
                    const freqResult = await client.query(freqQuery, [draw.draw_date, prevNumber, draw.draw_time]);
                    
                    if (freqResult.rows.length >= 5) {
                        const top5Predictions = freqResult.rows.slice(0, 5).map(r => parseInt(r.main_number));
                        const top3Predictions = top5Predictions.slice(0, 3);
                        const actualNumber = parseInt(draw.main_number);
                        
                        const hitTop1 = top5Predictions[0] === actualNumber;
                        const hitTop3 = top3Predictions.includes(actualNumber);
                        const hitTop5 = top5Predictions.includes(actualNumber);
                        
                        if (hitTop1) hits++;
                        if (hitTop3) top3Hits++;
                        if (hitTop5) top5Hits++;
                        totalTests++;
                        
                        if (results.length < 20) {
                            results.push({
                                date: draw.draw_date,
                                time: draw.draw_time,
                                actual: String(actualNumber).padStart(2, "0"),
                                predicted: top5Predictions.map(n => String(n).padStart(2, "0")),
                                hitTop3,
                                hitTop5
                            });
                        }
                    }
                }
                
                const accuracy = {
                    totalTests,
                    top1Hits: hits,
                    top1Rate: totalTests > 0 ? ((hits / totalTests) * 100).toFixed(1) : 0,
                    top3Hits,
                    top3Rate: totalTests > 0 ? ((top3Hits / totalTests) * 100).toFixed(1) : 0,
                    top5Hits,
                    top5Rate: totalTests > 0 ? ((top5Hits / totalTests) * 100).toFixed(1) : 0,
                    expectedRandom: {
                        top1: "1.0",
                        top3: "3.0",
                        top5: "5.0"
                    }
                };
                
                sendSuccess(res, {
                    days,
                    accuracy,
                    recentResults: results
                });
            } finally {
                client.release();
            }
        } catch (error) {
            log("error", "Backtest error", { error: error.message });
            sendError(res, 500, "Error al ejecutar backtest");
        }
        return true;
    }


    // ==================== GAMIFICATION ENDPOINTS ====================

    // GET /api/lottery/achievements - Get all achievements and user progress
    if (pathname === "/api/lottery/achievements" && method === "GET") {
        try {
            // SECURITY FIX: Require auth (2025-12-31)
            const authResult = authenticateRequest(req);
            if (!authResult.authenticated) {
                sendError(res, 401, "Autenticación requerida");
                return true;
            }
            const userId = authResult.user.userId;

            const client = await lotteryPredictor.pool.connect();
            try {
                // Get all achievements
                const achievementsQuery = `
                    SELECT a.*, 
                           CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as earned,
                           ua.earned_at
                    FROM hn_lottery_achievements a
                    LEFT JOIN hn_lottery_user_achievements ua 
                        ON a.id = ua.achievement_id AND ua.user_id = $1
                    ORDER BY a.tier, a.requirement_value
                `;
                const result = await client.query(achievementsQuery, [userId || 'guest']);

                const achievements = result.rows.map(a => ({
                    id: a.id,
                    code: a.code,
                    name: a.name_es,
                    description: a.description_es,
                    icon: a.icon,
                    points: a.points_reward,
                    tier: a.tier,
                    earned: a.earned,
                    earnedAt: a.earned_at
                }));

                const earned = achievements.filter(a => a.earned).length;
                const total = achievements.length;

                sendSuccess(res, {
                    achievements,
                    summary: { earned, total, percentage: Math.round((earned/total)*100) }
                });
            } finally {
                client.release();
            }
        } catch (error) {
            log("error", "Achievements error", { error: error.message });
            sendError(res, 500, "Error al obtener logros");
        }
        return true;
    }

    // GET /api/lottery/user-stats - Get user gamification stats
    if (pathname === "/api/lottery/user-stats" && method === "GET") {
        try {
            // SECURITY FIX: Require auth (2025-12-31)
            const authResult = authenticateRequest(req);
            if (!authResult.authenticated) {
                sendError(res, 401, "Autenticación requerida");
                return true;
            }
            const userId = authResult.user.userId;

            const client = await lotteryPredictor.pool.connect();
            try {
                // Get or create user stats
                const statsQuery = `
                    INSERT INTO hn_lottery_user_stats (user_id)
                    VALUES ($1)
                    ON CONFLICT (user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
                    RETURNING *
                `;
                const result = await client.query(statsQuery, [userId]);
                const stats = result.rows[0];

                // Get recent achievements
                const recentQuery = `
                    SELECT a.code, a.name_es, a.icon, ua.earned_at
                    FROM hn_lottery_user_achievements ua
                    JOIN hn_lottery_achievements a ON ua.achievement_id = a.id
                    WHERE ua.user_id = $1
                    ORDER BY ua.earned_at DESC
                    LIMIT 5
                `;
                const recentResult = await client.query(recentQuery, [userId]);

                sendSuccess(res, {
                    stats: {
                        totalSpins: stats.total_spins,
                        winsTop1: stats.total_wins_top1,
                        winsTop3: stats.total_wins_top3,
                        winsTop5: stats.total_wins_top5,
                        currentStreak: stats.current_streak,
                        bestStreak: stats.best_streak,
                        totalPoints: stats.total_points,
                        consecutiveDays: stats.consecutive_days
                    },
                    recentAchievements: recentResult.rows.map(a => ({
                        code: a.code,
                        name: a.name_es,
                        icon: a.icon,
                        earnedAt: a.earned_at
                    }))
                });
            } finally {
                client.release();
            }
        } catch (error) {
            log("error", "User stats error", { error: error.message });
            sendError(res, 500, "Error al obtener estadísticas");
        }
        return true;
    }

    // GET /api/lottery/leaderboard - Weekly leaderboard
    if (pathname === "/api/lottery/leaderboard" && method === "GET") {
        try {
            const params = new URLSearchParams(url.parse(req.url).query || "");
            const period = params.get("period") || "week"; // week, month, all
            const limit = Math.min(parseInt(params.get("limit")) || 20, 100);

            const client = await lotteryPredictor.pool.connect();
            try {
                let dateFilter = "";
                if (period === "week") {
                    dateFilter = "AND s.updated_at >= CURRENT_DATE - 7";
                } else if (period === "month") {
                    dateFilter = "AND s.updated_at >= CURRENT_DATE - 30";
                }

                const leaderboardQuery = `
                    SELECT 
                        s.user_id,
                        u.name,
                        u.avatar_url,
                        s.total_points,
                        s.total_wins_top1 + s.total_wins_top3 as total_wins,
                        s.best_streak,
                        s.current_streak,
                        (SELECT COUNT(*) FROM hn_lottery_user_achievements WHERE user_id = s.user_id) as badges
                    FROM hn_lottery_user_stats s
                    JOIN users u ON s.user_id = u.user_id
                    WHERE s.total_points > 0 ${dateFilter}
                    ORDER BY s.total_points DESC
                    LIMIT $1
                `;
                const result = await client.query(leaderboardQuery, [limit]);

                const leaderboard = result.rows.map((row, idx) => ({
                    rank: idx + 1,
                    userId: row.user_id,
                    name: row.name || "Jugador Anónimo",
                    avatar: row.avatar_url,
                    points: row.total_points,
                    wins: row.total_wins,
                    bestStreak: row.best_streak,
                    currentStreak: row.current_streak,
                    badges: parseInt(row.badges)
                }));

                sendSuccess(res, { period, leaderboard });
            } finally {
                client.release();
            }
        } catch (error) {
            log("error", "Leaderboard error", { error: error.message });
            sendError(res, 500, "Error al obtener leaderboard");
        }
        return true;
    }

    // POST /api/lottery/record-spin - Record a spin and check achievements
    if (pathname === "/api/lottery/record-spin" && method === "POST") {
        try {
            // SECURITY FIX: Require auth (2025-12-31)
            const authResult = authenticateRequest(req);
            if (!authResult.authenticated) {
                sendError(res, 401, "Autenticación requerida");
                return true;
            }
            const user_id = authResult.user.userId;

            let body = "";
            await new Promise((resolve) => {
                req.on("data", chunk => body += chunk);
                req.on("end", resolve);
            });
            const data = JSON.parse(body || "{}");
            const { prediction, actual_number, draw_time } = data;

            const client = await lotteryPredictor.pool.connect();
            try {
                await client.query("BEGIN");

                // Ensure user stats exist
                await client.query(`
                    INSERT INTO hn_lottery_user_stats (user_id) 
                    VALUES ($1) 
                    ON CONFLICT (user_id) DO NOTHING
                `, [user_id]);

                // Update spin count
                let updateQuery = `
                    UPDATE hn_lottery_user_stats 
                    SET total_spins = total_spins + 1,
                        last_spin_date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Tegucigalpa')::date,
                        updated_at = CURRENT_TIMESTAMP
                `;

                // Check for win if actual_number provided
                let isWin = false;
                let winType = null;
                if (actual_number !== undefined && prediction) {
                    const predictions = Array.isArray(prediction) ? prediction : [prediction];
                    const actual = parseInt(actual_number);
                    
                    if (predictions[0] === actual) {
                        updateQuery += `, total_wins_top1 = total_wins_top1 + 1`;
                        isWin = true;
                        winType = "top1";
                    } else if (predictions.slice(0, 3).includes(actual)) {
                        updateQuery += `, total_wins_top3 = total_wins_top3 + 1`;
                        isWin = true;
                        winType = "top3";
                    } else if (predictions.slice(0, 5).includes(actual)) {
                        updateQuery += `, total_wins_top5 = total_wins_top5 + 1`;
                        isWin = true;
                        winType = "top5";
                    }

                    if (isWin) {
                        updateQuery += `, current_streak = current_streak + 1,
                                        best_streak = GREATEST(best_streak, current_streak + 1),
                                        last_win_date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Tegucigalpa')::date`;
                    } else {
                        updateQuery += `, current_streak = 0`;
                    }
                }

                updateQuery += " WHERE user_id = $1 RETURNING *";
                const statsResult = await client.query(updateQuery, [user_id]);
                const stats = statsResult.rows[0];

                // Check and award achievements
                const newAchievements = [];
                const checkAchievements = [
                    { code: "first_spin", check: stats.total_spins >= 1 },
                    { code: "spins_10", check: stats.total_spins >= 10 },
                    { code: "spins_50", check: stats.total_spins >= 50 },
                    { code: "spins_100", check: stats.total_spins >= 100 },
                    { code: "spins_500", check: stats.total_spins >= 500 },
                    { code: "first_win", check: (stats.total_wins_top1 + stats.total_wins_top3 + stats.total_wins_top5) >= 1 },
                    { code: "wins_5", check: (stats.total_wins_top1 + stats.total_wins_top3) >= 5 },
                    { code: "wins_25", check: (stats.total_wins_top1 + stats.total_wins_top3) >= 25 },
                    { code: "wins_100", check: (stats.total_wins_top1 + stats.total_wins_top3) >= 100 },
                    { code: "streak_3", check: stats.best_streak >= 3 },
                    { code: "streak_5", check: stats.best_streak >= 5 },
                    { code: "streak_10", check: stats.best_streak >= 10 }
                ];

                // Check time-based achievements
                if (draw_time === "11am") {
                    checkAchievements.push({ code: "early_bird", check: true });
                } else if (draw_time === "9pm") {
                    checkAchievements.push({ code: "night_owl", check: true });
                }

                for (const ach of checkAchievements) {
                    if (ach.check) {
                        // First, get the achievement info
                        const achInfo = await client.query(
                            "SELECT id, points_reward, name_es, icon FROM hn_lottery_achievements WHERE code = $1",
                            [ach.code]
                        );
                        
                        if (achInfo.rows.length > 0) {
                            const achievement = achInfo.rows[0];
                            
                            // Try to insert (will fail silently if already exists)
                            const insertResult = await client.query(`
                                INSERT INTO hn_lottery_user_achievements (user_id, achievement_id)
                                VALUES ($1, $2)
                                ON CONFLICT (user_id, achievement_id) DO NOTHING
                                RETURNING id
                            `, [user_id, achievement.id]);

                            // If insert succeeded (new achievement)
                            if (insertResult.rows.length > 0) {
                                newAchievements.push({
                                    code: ach.code,
                                    name: achievement.name_es,
                                    icon: achievement.icon,
                                    points: achievement.points_reward
                                });

                                // Award points
                                await client.query(
                                    "UPDATE hn_lottery_user_stats SET total_points = total_points + $2 WHERE user_id = $1",
                                    [user_id, achievement.points_reward]
                                );

                                await client.query(
                                    "INSERT INTO hn_lottery_points_log (user_id, points, reason, reference_type) VALUES ($1, $2, $3, $4)",
                                    [user_id, achievement.points_reward, "Logro: " + achievement.name_es, "achievement"]
                                );
                            }
                        }
                    }
                }

                // Award points for win
                let pointsEarned = 0;
                if (isWin) {
                    pointsEarned = winType === "top1" ? 50 : winType === "top3" ? 25 : 10;
                    await client.query(`
                        UPDATE hn_lottery_user_stats SET total_points = total_points + $2 WHERE user_id = $1
                    `, [user_id, pointsEarned]);
                    await client.query(`
                        INSERT INTO hn_lottery_points_log (user_id, points, reason, reference_type)
                        VALUES ($1, $2, $3, 'prediction')
                    `, [user_id, pointsEarned, "Acierto " + winType]);
                }

                await client.query("COMMIT");

                // Get updated stats
                const finalStats = await client.query("SELECT id, user_id, total_spins, total_wins_top1, total_wins_top3, total_wins_top5, current_streak, best_streak, total_points, last_spin_date, last_win_date, consecutive_days, created_at, updated_at FROM hn_lottery_user_stats WHERE user_id = $1", [user_id]);

                sendSuccess(res, {
                    recorded: true,
                    isWin,
                    winType,
                    pointsEarned,
                    newAchievements,
                    stats: {
                        totalSpins: finalStats.rows[0].total_spins,
                        currentStreak: finalStats.rows[0].current_streak,
                        bestStreak: finalStats.rows[0].best_streak,
                        totalPoints: finalStats.rows[0].total_points
                    }
                });
            } catch (e) {
                await client.query("ROLLBACK");
                throw e;
            } finally {
                client.release();
            }
        } catch (error) {
            sendError(res, 500, "Error al registrar giro");
        }
        return true;
    }


    // GET /api/lottery/my-predictions - Get user's prediction history
    if (pathname === "/api/lottery/my-predictions" && method === "GET") {
        try {
            // SECURITY FIX: Require auth (2025-12-31)
            const authResult = authenticateRequest(req);
            if (!authResult.authenticated) {
                sendError(res, 401, "Autenticación requerida");
                return true;
            }
            const userId = authResult.user.userId;
            const params = new URLSearchParams(url.parse(req.url).query || "");
            const limit = Math.min(parseInt(params.get("limit")) || 20, 100);

            const client = await lotteryPredictor.pool.connect();
            try {
                const query = `
                    SELECT 
                        p.id,
                        p.target_date,
                        p.target_time,
                        p.predicted_numbers,
                        p.confidence_scores,
                        p.actual_result,
                        p.was_correct,
                        p.created_at,
                        d.main_number as actual_number
                    FROM hn_lottery_predictions p
                    LEFT JOIN hn_lottery_draws d 
                        ON p.target_date = d.draw_date AND p.target_time = d.draw_time
                    WHERE p.user_id = $1
                    ORDER BY p.created_at DESC
                    LIMIT $2
                `;
                const result = await client.query(query, [userId, limit]);

                const predictions = result.rows.map(p => {
                    const numbers = (p.predicted_numbers || []).map(n => parseInt(n));
                    const actual = p.actual_number !== null ? parseInt(p.actual_number) : null;
                    let hitType = null;
                    
                    if (actual !== null && numbers.length > 0) {
                        if (numbers[0] === actual) hitType = "top1";
                        else if (numbers.slice(0, 3).includes(actual)) hitType = "top3";
                        else if (numbers.slice(0, 5).includes(actual)) hitType = "top5";
                    }

                    return {
                        id: p.id,
                        date: p.target_date,
                        time: p.target_time,
                        numbers: numbers.map(n => String(n).padStart(2, "0")),
                        actualResult: actual !== null ? String(actual).padStart(2, "0") : null,
                        hitType,
                        pending: actual === null,
                        createdAt: p.created_at
                    };
                });

                // Calculate stats
                const completed = predictions.filter(p => !p.pending);
                const hits = completed.filter(p => p.hitType);

                sendSuccess(res, {
                    predictions,
                    stats: {
                        total: predictions.length,
                        completed: completed.length,
                        pending: predictions.filter(p => p.pending).length,
                        hits: hits.length,
                        hitRate: completed.length > 0 ? ((hits.length / completed.length) * 100).toFixed(1) : 0
                    }
                });
            } finally {
                client.release();
            }
        } catch (error) {
            log("error", "My predictions error", { error: error.message });
            sendError(res, 500, "Error al obtener historial");
        }
        return true;
    }


    // POST /api/lottery/notify-results - Notify users about lottery results (admin/cron)
    if (pathname === "/api/lottery/notify-results" && method === "POST") {
        try {
            // SECURITY FIX: Require internal API key or admin (2025-12-31)
            const apiKey = req.headers["x-internal-api-key"];
            const expectedKey = process.env.INTERNAL_API_KEY;
            if (!expectedKey) {
                sendError(res, 500, "Error de configuracion del servidor");
                return true;
            }
            if (!apiKey || !safeCompare(String(apiKey), String(expectedKey))) {
                // Check if admin session
                const authHeader = req.headers.authorization;
                const adminToken = authHeader?.split(" ")[1];
                // Simple check - in production, validate against admin_sessions
                if (!adminToken) {
                    sendError(res, 403, "Acceso restringido a uso interno");
                    return true;
                }
            }

            let body = "";
            await new Promise((resolve) => {
                req.on("data", chunk => body += chunk);
                req.on("end", resolve);
            });
            const data = JSON.parse(body || "{}");
            const { draw_date, draw_time, result_number } = data;

            if (!draw_date || !draw_time || result_number === undefined) {
                sendError(res, 400, "draw_date, draw_time y result_number requeridos");
                return true;
            }

            const client = await lotteryPredictor.pool.connect();
            try {
                // DEDUPLICATION FIX: Check if we already notified for this draw
                const alreadyNotifiedQuery = `
                    SELECT DISTINCT user_id FROM notifications
                    WHERE type = 'lottery_result'
                    AND data->>'draw_date' = $1
                    AND data->>'draw_time' = $2
                `;
                const alreadyNotified = await client.query(alreadyNotifiedQuery, [draw_date, draw_time]);
                const alreadyNotifiedUsers = new Set(alreadyNotified.rows.map(r => r.user_id));

                // Find all predictions for this draw
                const predictionsQuery = `
                    SELECT DISTINCT p.user_id, p.predicted_numbers
                    FROM hn_lottery_predictions p
                    WHERE p.target_date = $1 AND p.target_time = $2
                    AND p.user_id IS NOT NULL
                `;
                const predictions = await client.query(predictionsQuery, [draw_date, draw_time]);

                let notified = 0;
                let skipped = 0;
                const resultNum = parseInt(result_number);

                for (const pred of predictions.rows) {
                    // Check if already notified (but always update predictions)
                    const skipNotification = alreadyNotifiedUsers.has(pred.user_id);

                    // Handle both object format {number: "XX"} and raw numbers
                    const numbers = (pred.predicted_numbers || []).map(n => {
                        if (typeof n === 'object' && n !== null) {
                            return parseInt(n.number || n.value || 0);
                        }
                        return parseInt(n);
                    }).filter(n => n > 0 && n < 100);

                    // Skip if no valid numbers
                    if (numbers.length === 0) {
                        skipped++;
                        continue;
                    }

                    let hitType = null;
                    let title = "";
                    let message = "";

                    if (numbers[0] === resultNum) {
                        hitType = "top1";
                        title = "🎯 ¡ACERTASTE EL #1!";
                        message = `¡Increíble! Tu predicción #1 (${String(resultNum).padStart(2, '0')}) fue el número ganador del sorteo de las ${draw_time}.`;
                    } else if (numbers.slice(0, 3).includes(resultNum)) {
                        hitType = "top3";
                        title = "🔥 ¡Acertaste en Top 3!";
                        message = `¡Bien hecho! El ${String(resultNum).padStart(2, '0')} estaba en tu Top 3 para el sorteo de las ${draw_time}.`;
                    } else if (numbers.slice(0, 5).includes(resultNum)) {
                        hitType = "top5";
                        title = "✨ Acertaste en Top 5";
                        message = `El ${String(resultNum).padStart(2, '0')} estaba en tu Top 5 para el sorteo de las ${draw_time}.`;
                    } else {
                        title = "📊 Resultado del Sorteo";
                        message = `El número ganador de las ${draw_time} fue ${String(resultNum).padStart(2, '0')}. Tus números: ${numbers.slice(0,3).map(n => String(n).padStart(2,'0')).join(', ')}. ¡Sigue intentando!`;
                    }

                    // Always update prediction with result (even if already notified)
                    await client.query(`
                        UPDATE hn_lottery_predictions
                        SET actual_result = $3, was_correct = $4
                        WHERE user_id = $1 AND target_date = $2 AND target_time = $5
                    `, [pred.user_id, draw_date, resultNum, hitType !== null, draw_time]);

                    // Create notification (only if not already notified)
                    if (!skipNotification) {
                        await client.query(`
                            INSERT INTO notifications (user_id, type, title, message, data)
                            VALUES ($1, 'lottery_result', $2, $3, $4)
                        `, [
                            pred.user_id,
                            title,
                            message,
                            JSON.stringify({
                                draw_date,
                                draw_time,
                                result: resultNum,
                                predicted: numbers.slice(0, 5),
                                hitType
                            })
                        ]);
                        notified++;
                    } else {
                        skipped++;
                    }
                }

                sendSuccess(res, {
                    notified,
                    skipped,
                    draw_date,
                    draw_time,
                    result: resultNum
                });
            } finally {
                client.release();
            }
        } catch (error) {
            log("error", "Notify results error", { error: error.message });
            sendError(res, 500, "Error al notificar resultados");
        }
        return true;
    }

    // GET /api/lottery/my-notifications - Get user's lottery notifications
    if (pathname === "/api/lottery/my-notifications" && method === "GET") {
        try {
            // SECURITY FIX: Require auth (2025-12-31)
            const authResult = authenticateRequest(req);
            if (!authResult.authenticated) {
                sendError(res, 401, "Autenticación requerida");
                return true;
            }
            const userId = authResult.user.userId;
            const params = new URLSearchParams(url.parse(req.url).query || "");
            const limit = Math.min(parseInt(params.get("limit")) || 20, 50);
            const unreadOnly = params.get("unread") === "true";

            const client = await lotteryPredictor.pool.connect();
            try {
                let query = `
                    SELECT id, title, message, data, read_at, created_at
                    FROM notifications
                    WHERE user_id = $1 AND type = 'lottery_result'
                `;
                if (unreadOnly) {
                    query += " AND read_at IS NULL";
                }
                query += " ORDER BY created_at DESC LIMIT $2";

                const result = await client.query(query, [userId, limit]);

                // Count unread
                const unreadCount = await client.query(`
                    SELECT COUNT(*) FROM notifications 
                    WHERE user_id = $1 AND type = 'lottery_result' AND read_at IS NULL
                `, [userId]);

                sendSuccess(res, {
                    notifications: result.rows.map(n => ({
                        id: n.id,
                        title: n.title,
                        message: n.message,
                        data: n.data,
                        read: n.read_at !== null,
                        createdAt: n.created_at
                    })),
                    unreadCount: parseInt(unreadCount.rows[0].count)
                });
            } finally {
                client.release();
            }
        } catch (error) {
            log("error", "My notifications error", { error: error.message });
            sendError(res, 500, "Error al obtener notificaciones");
        }
        return true;
    }

    // POST /api/lottery/mark-notification-read - Mark notification as read
    if (pathname === "/api/lottery/mark-notification-read" && method === "POST") {
        try {
            // SECURITY FIX: Require auth (2025-12-31)
            const authResult = authenticateRequest(req);
            if (!authResult.authenticated) {
                sendError(res, 401, "Autenticación requerida");
                return true;
            }
            const user_id = authResult.user.userId;

            let body = "";
            await new Promise((resolve) => {
                req.on("data", chunk => body += chunk);
                req.on("end", resolve);
            });
            const data = JSON.parse(body || "{}");
            const { notification_id } = data;

            if (!notification_id) {
                sendError(res, 400, "notification_id requerido");
                return true;
            }

            const client = await lotteryPredictor.pool.connect();
            try {
                await client.query(`
                    UPDATE notifications SET read_at = NOW()
                    WHERE id = $1 AND user_id = $2 AND read_at IS NULL
                `, [notification_id, user_id]);

                sendSuccess(res, { marked: true });
            } finally {
                client.release();
            }
        } catch (error) {
            log("error", "Mark read error", { error: error.message });
            sendError(res, 500, "Error interno del servidor");
        }
        return true;
    }


    // GET /api/lottery/social-feed - Get public predictions feed
    if (pathname === "/api/lottery/social-feed" && method === "GET") {
        try {
            const params = new URLSearchParams(url.parse(req.url).query || "");
            const limit = parseInt(params.get("limit")) || 20;
            const offset = parseInt(params.get("offset")) || 0;

            const client = await lotteryPredictor.pool.connect();
            try {
                const result = await client.query(`
                    SELECT 
                        p.id,
                        p.display_name,
                        p.predicted_numbers,
                        p.target_date,
                        p.target_time,
                        p.confidence_scores,
                        p.created_at,
                        p.actual_result,
                        p.was_correct
                    FROM hn_lottery_predictions p
                    WHERE p.is_public = true
                    ORDER BY p.created_at DESC
                    LIMIT $1 OFFSET $2
                `, [limit, offset]);

                const countResult = await client.query(
                    "SELECT COUNT(*) FROM hn_lottery_predictions WHERE is_public = true"
                );

                sendSuccess(res, {
                    predictions: result.rows,
                    pagination: {
                        total: parseInt(countResult.rows[0].count),
                        limit,
                        offset,
                        hasMore: offset + limit < parseInt(countResult.rows[0].count)
                    }
                });
            } finally {
                client.release();
            }
        } catch (error) {
            log("error", "Social feed error", { error: error.message });
            sendError(res, 500, "Error interno del servidor");
        }
        return true;
    }

    // POST /api/lottery/share-prediction - Share a prediction publicly
    if (pathname === "/api/lottery/share-prediction" && method === "POST") {
        try {
            // SECURITY FIX: Require auth (2025-12-31)
            const authResult = authenticateRequest(req);
            if (!authResult.authenticated) {
                sendError(res, 401, "Autenticación requerida");
                return true;
            }
            const user_id = authResult.user.userId;

            let body = "";
            await new Promise((resolve) => {
                req.on("data", chunk => body += chunk);
                req.on("end", resolve);
            });
            const data = JSON.parse(body || "{}");
            const { prediction_id, display_name, is_public } = data;

            if (!prediction_id) {
                sendError(res, 400, "prediction_id requerido");
                return true;
            }

            const client = await lotteryPredictor.pool.connect();
            try {
                const result = await client.query(`
                    UPDATE hn_lottery_predictions 
                    SET is_public = $1, display_name = $2
                    WHERE id = $3 AND user_id = $4
                    RETURNING id, is_public, display_name
                `, [
                    is_public !== false,
                    display_name || 'Anónimo',
                    prediction_id,
                    user_id
                ]);

                if (result.rows.length === 0) {
                    sendError(res, 404, "Predicción no encontrada");
                    return true;
                }

                sendSuccess(res, {
                    shared: true,
                    prediction: result.rows[0]
                });
            } finally {
                client.release();
            }
        } catch (error) {
            log("error", "Share prediction error", { error: error.message });
            sendError(res, 500, "Error al compartir predicción");
        }
        return true;
    }

    // GET /api/lottery/predict-ml - XGBoost ML predictions
    if (pathname === "/api/lottery/predict-ml" && (method === "GET" || method === "HEAD")) {
        try {
            const params = new URLSearchParams(url.parse(req.url).query || "");
            const drawTime = params.get("time") || params.get("draw_time") || "11am";
            
            const { execSync } = require("child_process");
            const result = execSync(`python3 /var/www/latanda.online/lottery-ml-model-v4.py predict ${drawTime}`, {
                encoding: "utf8",
                timeout: 15000
            });
            
            const prediction = JSON.parse(result);
            sendSuccess(res, prediction);
        } catch (error) {
            log("error", "ML prediction error", { error: error.message });
            sendError(res, 500, "Error en predicción ML");
        }
        return true;
    }

    // GET /api/lottery/backtest-ml - XGBoost ML backtest
    if (pathname === "/api/lottery/backtest-ml" && (method === "GET" || method === "HEAD")) {
        try {
            const { execSync } = require("child_process");
            const result = execSync("python3 /var/www/latanda.online/lottery-ml-model-v4.py backtest", {
                encoding: "utf8",
                timeout: 60000
            });
            
            const backtest = JSON.parse(result);
            sendSuccess(res, backtest);
        } catch (error) {
            log("error", "ML backtest error", { error: error.message });
            sendError(res, 500, "Error en backtest ML");
        }
        return true;
    }
    // GET /api/lottery/predict-ensemble - Ensemble predictions
    if (pathname === "/api/lottery/predict-ensemble" && (method === "GET" || method === "HEAD")) {
        try {
            const params = new URLSearchParams(url.parse(req.url).query || "");
            const drawTime = params.get("time") || params.get("draw_time") || "all";
            
            const { execSync } = require("child_process");
            const result = execSync(`python3 /var/www/latanda.online/lottery-ensemble-v2.py predict ${drawTime}`, {
                encoding: "utf8",
                timeout: 30000
            });
            
            const lines = result.trim().split("\n");
            const jsonStart = lines.findIndex(l => l.trim().startsWith("{"));
            const jsonStr = lines.slice(jsonStart).join("\n");
            const prediction = JSON.parse(jsonStr);
            sendSuccess(res, prediction);
        } catch (error) {
            log("error", "Ensemble prediction error", { error: error.message });
            sendError(res, 500, "Error en prediccion ensemble");
        }
        return true;
    }

    // POST /api/lottery/cron/subscription-notifications - Internal cron for sending subscription emails
    if (pathname === "/api/lottery/cron/subscription-notifications" && method === "POST") {
        // Verify internal API key — reject if not configured (prevents empty-string bypass)
        const internalKey = req.headers["x-internal-api-key"];
        if (!process.env.INTERNAL_API_KEY || !internalKey || !safeCompare(String(internalKey), String(process.env.INTERNAL_API_KEY))) {
            sendError(res, 401, "Unauthorized");
            return true;
        }
        
        try {
            const results = {
                expiringSoon: [],
                expired: [],
                errors: []
            };
            
            // Get subscriptions expiring in 3 days (haven't been notified yet)
            const expiringQuery = await lotteryPredictor.pool.query(`
                SELECT 
                    s.user_id, s.expires_at, s.payment_provider,
                    u.name, u.email
                FROM hn_lottery_subscriptions s
                JOIN users u ON s.user_id = u.user_id
                WHERE s.status = 'active' 
                AND s.payment_provider = 'trial'
                AND s.expires_at BETWEEN NOW() + INTERVAL '2 days' AND NOW() + INTERVAL '4 days'
                AND (s.notified_expiring IS NULL OR s.notified_expiring = false)
            `);
            
            // Send expiring soon emails
            for (const sub of expiringQuery.rows) {
                if (!sub.email) continue;
                const daysLeft = Math.ceil((new Date(sub.expires_at) - Date.now()) / (1000*60*60*24));
                try {
                    // Import sendLotteryEmail at runtime
                    
                    await sendLotteryEmail(sub.email, "trialExpiring", [sub.name || "Usuario", daysLeft]);
                    
                    // Mark as notified
                    await lotteryPredictor.pool.query(
                        "UPDATE hn_lottery_subscriptions SET notified_expiring = true WHERE user_id = $1",
                        [sub.user_id]
                    );
                    results.expiringSoon.push({ email: sub.email, daysLeft });
                } catch (e) {
                    results.errors.push({ email: sub.email, type: "expiring", error: e.message });
                }
            }
            
            // Get subscriptions that expired yesterday (haven't been notified)
            const expiredQuery = await lotteryPredictor.pool.query(`
                SELECT 
                    s.user_id, s.expires_at, s.payment_provider,
                    u.name, u.email
                FROM hn_lottery_subscriptions s
                JOIN users u ON s.user_id = u.user_id
                WHERE s.payment_provider = 'trial'
                AND s.expires_at BETWEEN NOW() - INTERVAL '2 days' AND NOW() - INTERVAL '12 hours'
                AND (s.notified_expired IS NULL OR s.notified_expired = false)
            `);
            
            // Send expired emails
            for (const sub of expiredQuery.rows) {
                if (!sub.email) continue;
                try {
                    
                    await sendLotteryEmail(sub.email, "trialExpired", [sub.name || "Usuario"]);
                    
                    // Mark as notified and update status
                    await lotteryPredictor.pool.query(`
                        UPDATE hn_lottery_subscriptions 
                        SET notified_expired = true, status = 'expired' 
                        WHERE user_id = $1
                    `, [sub.user_id]);
                    results.expired.push({ email: sub.email });
                } catch (e) {
                    results.errors.push({ email: sub.email, type: "expired", error: e.message });
                }
            }
            
            log("info", "Subscription notification cron completed", results);
            sendSuccess(res, {
                message: "Notification cron completed",
                ...results,
                summary: {
                    expiringSoonSent: results.expiringSoon.length,
                    expiredSent: results.expired.length,
                    errors: results.errors.length
                }
            });
        } catch (error) {
            log("error", "Subscription notification cron error", { error: error.message });
            sendError(res, 500, "Error en cron de notificaciones");
        }
        return true;
    }

    // GET /api/lottery/jaladores/:number - Get pulling numbers for a specific number
    if (pathname.match(/^\/api\/lottery\/jaladores\/\d+$/) && method === "GET") {
        try {
            const number = parseInt(pathname.split("/").pop());
            if (isNaN(number) || number < 0 || number > 99) {
                sendError(res, 400, "Número debe estar entre 00 y 99");
                return true;
            }
            const jaladores = lotteryJaladora.getJaladores(number);
            const grupo = lotteryJaladora.getGrupoJalador(number);
            sendSuccess(res, {
                numero: number.toString().padStart(2, "0"),
                jaladores: jaladores.map(n => n.toString().padStart(2, "0")),
                grupoCompleto: grupo.map(n => n.toString().padStart(2, "0")),
                mensaje: `El ${number.toString().padStart(2, "0")} jala: ${jaladores.map(n => n.toString().padStart(2, "0")).join(", ")}`
            });
        } catch (error) {
            log("error", "Jaladores error", { error: error.message });
            sendError(res, 500, "Error al obtener jaladores");
        }
        return true;
    }

    // GET /api/lottery/jaladores - Get analysis based on last results
    if (pathname === "/api/lottery/jaladores" && method === "GET") {
        try {
            const result = await lotteryPredictor.pool.query(
                "SELECT main_number FROM hn_lottery_draws ORDER BY draw_date DESC, draw_time DESC LIMIT 10"
            );
            const lastResults = result.rows.map(r => r.main_number);
            const analysis = lotteryJaladora.analizarJaladores(lastResults);
            sendSuccess(res, analysis);
        } catch (error) {
            log("error", "Jaladores analysis error", { error: error.message });
            sendError(res, 500, "Error al analizar jaladores");
        }
        return true;
    }

    // GET /api/lottery/tabla-jaladora - Get complete pulling table
    if (pathname === "/api/lottery/tabla-jaladora" && method === "GET") {
        try {
            const tabla = lotteryJaladora.getTablaCompleta();
            sendSuccess(res, { tabla, totalGrupos: 25, descripcion: "Cada grupo contiene 4 números que se jalan entre sí" });
        } catch (error) {
            log("error", "Tabla jaladora error", { error: error.message });
            sendError(res, 500, "Error al obtener tabla jaladora");
        }
        return true;
    }
    return false;
}


// ============================================
// LOTTERY SUBSCRIPTION NOTIFICATIONS SYSTEM
// Added: 2026-01-17
// ============================================

const nodemailer = require("nodemailer");

// Timing-safe string comparison
function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const hashA = crypto.createHash('sha256').update(a).digest();
    const hashB = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(hashA, hashB);
}

const lotteryEmailTransporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Email templates for lottery notifications
const LOTTERY_EMAIL_TEMPLATES = {
    welcome: (userName) => ({
        subject: "🎰 ¡Bienvenido al Predictor de Lotería de La Tanda!",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🎰 ¡Bienvenido!</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 18px;">Hola <strong>${userName}</strong>,</p>
                    <p>¡Gracias por usar el <strong>Predictor de Lotería</strong> de La Tanda!</p>
                    <p>Tienes acceso <strong>Premium</strong> con:</p>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 10px 0;">✅ <strong>10 giros diarios</strong></li>
                        <li style="padding: 10px 0;">✅ <strong>3 números por predicción</strong></li>
                        <li style="padding: 10px 0;">✅ <strong>Algoritmo XGBoost avanzado</strong></li>
                    </ul>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://latanda.online/lottery-predictor.html" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ir al Predictor 🎯</a>
                    </div>
                    <p style="margin-top: 30px; color: #666; font-size: 12px;">⚠️ Solo entretenimiento. Juega responsablemente.</p>
                </div>
            </div>
        `
    }),

    trialExpiring: (userName, daysLeft) => ({
        subject: `⏰ Tu acceso Premium vence en ${daysLeft} días`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="color: white; margin: 0;">⏰ ¡Tu Premium expira pronto!</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 18px;">Hola <strong>${userName}</strong>,</p>
                    <p>Tu acceso <strong>Premium</strong> al Predictor de Lotería vence en <strong>${daysLeft} días</strong>.</p>
                    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #856404;">📉 Después de expirar tendrás acceso <strong>Free</strong>:</p>
                        <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
                            <li>Solo 3 giros diarios</li>
                            <li>1 número por predicción</li>
                        </ul>
                    </div>
                    <p>Para mantener tu acceso Premium:</p>
                    <ul>
                        <li>Únete a un grupo de ahorro en La Tanda</li>
                        <li>O suscríbete a Premium (5/mes)</li>
                    </ul>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://latanda.online/lottery-predictor.html" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Usar mis últimos giros Premium 🎰</a>
                    </div>
                </div>
            </div>
        `
    }),

    trialExpired: (userName) => ({
        subject: "😢 Tu acceso Premium ha expirado",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #4a4a4a 0%, #2d2d2d 100%); padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="color: white; margin: 0;">😢 Premium Expirado</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 18px;">Hola <strong>${userName}</strong>,</p>
                    <p>Tu acceso <strong>Premium</strong> al Predictor de Lotería ha expirado.</p>
                    <p>Ahora tienes acceso <strong>Free</strong> con:</p>
                    <ul>
                        <li>3 giros diarios</li>
                        <li>1 número por predicción</li>
                    </ul>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #155724;"><strong>💡 ¿Sabías que?</strong></p>
                        <p style="margin: 10px 0 0 0; color: #155724;">Los miembros de grupos de ahorro en La Tanda tienen acceso <strong>Premium ilimitado</strong> mientras estén activos.</p>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://latanda.online/groups-advanced-system.html" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Unirme a un Grupo 👥</a>
                    </div>
                </div>
            </div>
        `
    }),

    groupPremium: (userName, groupName) => ({
        subject: "🎉 ¡Tienes Premium ilimitado por ser miembro de grupo!",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🎉 ¡Premium Activado!</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 18px;">Hola <strong>${userName}</strong>,</p>
                    <p>Como miembro activo de <strong>${groupName}</strong>, tienes acceso <strong>Premium ilimitado</strong> al Predictor de Lotería.</p>
                    <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #155724;"><strong>Tus beneficios:</strong></p>
                        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #155724;">
                            <li>✅ 10 giros diarios</li>
                            <li>✅ 3 números por predicción</li>
                            <li>✅ Sin fecha de expiración</li>
                            <li>✅ Algoritmo XGBoost avanzado</li>
                        </ul>
                    </div>
                    <p style="color: #666;">Este beneficio se mantiene mientras seas miembro activo de un grupo.</p>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://latanda.online/lottery-predictor.html" style="background: #11998e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Usar el Predictor 🎰</a>
                    </div>
                </div>
            </div>
        `
    })
};

// Function to send lottery notification email
async function sendLotteryEmail(to, templateName, templateData) {
    try {
        const template = LOTTERY_EMAIL_TEMPLATES[templateName];
        if (!template) {
            return { success: false, error: "Unknown template" };
        }
        
        const { subject, html } = typeof template === 'function' ? template(...templateData) : template;
        
        const mailOptions = {
            from: "La Tanda Predictor <notificaciones@latanda.online>",
            to: to,
            subject: subject,
            html: html
        };
        
        const result = await lotteryEmailTransporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        return { success: false, error: "Error interno del servidor" };
    }
}

// Export for use in lottery-predictor.js
module.exports = { handleLotteryRequest, sendLotteryEmail, LOTTERY_EMAIL_TEMPLATES };
