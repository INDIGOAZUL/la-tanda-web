/**
 * Honduras Lottery Predictor Algorithm
 * Uses frequency analysis, Markov chains, and real-time data
 * Enhanced with animal signs and live scraping from loteriasdehonduras.com
 */

// v4.3.0: Pool removed — use shared pool from db-postgres
const crypto = require("crypto");
const https = require("https");
const path = require("path");
const { LOTTERY_SIGNS, getSign } = require("./lottery-signs.js");
const { getJaladores, getJaladorScore } = require("./lottery-jaladora.js");
// Lazy load sendLotteryEmail to avoid circular dependency
function getSendLotteryEmail() {
    try {
        const lotteryApi = require("./lottery-api.js");
        return lotteryApi.sendLotteryEmail;
    } catch (e) {
        // log removed
        return null;
    }
}

// Load env from correct path
require("dotenv").config({ path: path.join(__dirname, '.env') });

// Database connection
// v4.3.0: Use shared pool from db-postgres (avoids duplicate connections)
const { pool } = require('./db-postgres');

// Cache for real-time scraping (avoid hitting the site too often)
let lastScrapeTime = 0;
const SCRAPE_COOLDOWN = 60000; // 1 minute cooldown

// kiskooloterias.com JSON API (backend for loteriasdehonduras.com)
const KISKOO_API = "https://client-back.temp.kiskooloterias.com/honduras";
const KISKOO_GAMES = [
    { time: "11am", siteGameId: "693ae5bbd7b13e9daed23b31" },
    { time: "3pm",  siteGameId: "693ae5bbd7b13e9daed23b07" },
    { time: "9pm",  siteGameId: "693ae5bbd7b13e9daed23b1f" }
];

/**
 * Fetch URL helper for real-time scraping (follows 301/302 redirects, max 3 hops)
 */
const http = require("http");
function fetchURL(url, maxRedirects = 3) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith("https") ? https : http;
        const req = protocol.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html",
                "Accept-Language": "es-HN,es;q=0.9"
            },
            timeout: 10000
        }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                res.resume(); // drain response to free socket
                if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
                const redirectUrl = new URL(res.headers.location, url).href;
                return fetchURL(redirectUrl, maxRedirects - 1).then(resolve, reject);
            }
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => resolve(data));
        });
        req.on("error", reject);
        req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    });
}

/**
 * Real-time data fetch from kiskooloterias JSON API
 * Updates DB with latest results before generating predictions
 */
async function scrapeRealTime() {
    const now = Date.now();
    if (now - lastScrapeTime < SCRAPE_COOLDOWN) {
        return { updated: 0, cached: true };
    }
    lastScrapeTime = now;

    const results = [];

    for (const slot of KISKOO_GAMES) {
        try {
            const raw = await fetchURL(`${KISKOO_API}/site-games/${slot.siteGameId}`);
            const data = JSON.parse(raw);
            const game = data.game || data;

            // Build ID -> text mapping
            const idMap = {};
            for (const row of (game.score_layout || [])) {
                const items = Array.isArray(row) ? row : [row];
                for (const item of items) {
                    for (const opt of (item.options || [])) {
                        idMap[opt.id] = opt.text;
                    }
                }
            }

            // Only take first 3 sessions (most recent)
            for (const session of (game.sessions || []).slice(0, 3)) {
                const drawDate = session.date ? session.date.substring(0, 10) : null;
                if (!drawDate) continue;

                const scoreRow = session.score?.[0];
                if (!scoreRow || scoreRow.length === 0) continue;

                const mainText = idMap[scoreRow[0]] || "";
                const numMatch = mainText.match(/^(\d+)/);
                if (!numMatch) continue;
                const mainNumber = parseInt(numMatch[1]);

                const bonusText = idMap[scoreRow[2]] || "0";
                const bonusMatch = bonusText.match(/^(\d+)/);
                const companionNumber = bonusMatch ? parseInt(bonusMatch[1]) : 0;

                const animalName = mainText.replace(/^\d+\s*/, "").trim() || getSign(mainNumber);

                results.push({
                    draw_date: drawDate,
                    draw_time: slot.time,
                    main_number: mainNumber,
                    companion_number: companionNumber,
                    animal_name: animalName
                });
            }
        } catch (err) {
            // Silent fail — prediction still works with DB data
        }
    }

    // Save to DB
    let updated = 0;
    const client = await pool.connect();
    try {
        for (const r of results) {
            const res = await client.query(`
                INSERT INTO hn_lottery_draws
                (draw_date, draw_time, main_number, companion_number, animal_name, lottery_type)
                VALUES ($1, $2, $3, $4, $5, 'diaria')
                ON CONFLICT (draw_date, draw_time, lottery_type)
                DO UPDATE SET main_number = $3, companion_number = $4, animal_name = COALESCE($5, hn_lottery_draws.animal_name)
                RETURNING id
            `, [r.draw_date, r.draw_time, r.main_number, r.companion_number, r.animal_name]);
            if (res.rowCount > 0) updated++;
        }
    } finally {
        client.release();
    }

    return { updated, cached: false, results };
}

/**
 * EWMA (Exponentially Weighted Moving Average) frequency for each number.
 * Gives more weight to recent appearances.
 * alpha=0.3 means ~70% of weight is on last ~3 draws' worth of history.
 */
function computeEWMA(draws, alpha = 0.3) {
    const ewma = new Float64Array(100); // numbers 00-99
    // Process oldest to newest
    for (const num of draws) {
        for (let n = 0; n < 100; n++) {
            ewma[n] = alpha * (n === num ? 1 : 0) + (1 - alpha) * ewma[n];
        }
    }
    return ewma;
}

/**
 * Digit-level Markov chains (10x10 matrices for tens and units digits).
 * Much denser than a 100x100 matrix with limited data (~1,095 draws/year).
 */
function computeDigitMarkov(draws) {
    // tensMatrix[d1][d2] = count of tens digit d1 -> d2
    const tensMatrix = Array.from({ length: 10 }, () => new Float64Array(10));
    const unitsMatrix = Array.from({ length: 10 }, () => new Float64Array(10));

    for (let i = 1; i < draws.length; i++) {
        const prevTens = Math.floor(draws[i - 1] / 10);
        const prevUnits = draws[i - 1] % 10;
        const currTens = Math.floor(draws[i] / 10);
        const currUnits = draws[i] % 10;
        tensMatrix[prevTens][currTens]++;
        unitsMatrix[prevUnits][currUnits]++;
    }

    // Normalize to probabilities
    for (let d = 0; d < 10; d++) {
        const tensTotal = tensMatrix[d].reduce((a, b) => a + b, 0) || 1;
        const unitsTotal = unitsMatrix[d].reduce((a, b) => a + b, 0) || 1;
        for (let j = 0; j < 10; j++) {
            tensMatrix[d][j] /= tensTotal;
            unitsMatrix[d][j] /= unitsTotal;
        }
    }

    return { tensMatrix, unitsMatrix };
}

/**
 * CUSUM (Cumulative Sum) streak detection for each number.
 * Positive CUSUM = number appearing more than expected (hot streak).
 * Negative CUSUM = number appearing less than expected (cold streak).
 * Expected rate for a 2-digit lottery = 1/100 per draw.
 */
function computeCUSUM(draws) {
    const expected = 1 / 100; // probability of any single number per draw
    const cusum = new Float64Array(100);

    for (const num of draws) {
        for (let n = 0; n < 100; n++) {
            cusum[n] += (n === num ? 1 : 0) - expected;
        }
    }
    return cusum;
}

/**
 * Main prediction algorithm v3.0 — Enhanced with EWMA, Digit Markov, and CUSUM
 */
async function generatePrediction(drawTime = null, tier = "free") {
    // First, scrape real-time data
    try {
        await scrapeRealTime();
    } catch (err) {
        // Silent fail
    }

    const client = await pool.connect();
    try {
        // Get frequency stats with momentum (recent 7-day performance)
        const statsQuery = `
            SELECT s.number, s.frequency, s.gap_days, s.is_hot, s.is_cold,
                   COALESCE(m.recent_freq, 0) as momentum
            FROM hn_lottery_stats s
            LEFT JOIN (
                SELECT main_number as number, COUNT(*) as recent_freq
                FROM hn_lottery_draws
                WHERE draw_date >= CURRENT_DATE - 7
                AND ($1::text IS NULL OR draw_time = $1)
                GROUP BY main_number
            ) m ON s.number = m.number
            WHERE s.period_days = 30
            AND ($1::text IS NULL OR s.draw_time = $1 OR s.draw_time IS NULL)
            ORDER BY s.number
        `;
        const statsRaw = await client.query(statsQuery, [drawTime]);

        // Deduplicate by number (query returns draw_time-specific + NULL rows)
        const numberMap = new Map();
        for (const row of statsRaw.rows) {
            const existing = numberMap.get(row.number);
            if (!existing || (row.frequency || 0) > (existing.frequency || 0)) {
                numberMap.set(row.number, row);
            }
        }
        const stats = { rows: Array.from(numberMap.values()) };

        if (stats.rows.length === 0) {
            return generateRandomPrediction(tier);
        }

        // Get last drawn number for Markov chain
        const lastDrawQuery = `
            SELECT main_number, animal_name FROM hn_lottery_draws
            WHERE ($1::text IS NULL OR draw_time = $1)
            ORDER BY draw_date DESC, draw_time DESC
            LIMIT 1
        `;
        const lastDraw = await client.query(lastDrawQuery, [drawTime]);
        const lastNumber = lastDraw.rows[0]?.main_number;
        const lastAnimal = lastDraw.rows[0]?.animal_name || getSign(lastNumber);

        // Get 100x100 Markov transition probabilities from last number (existing DB table)
        let markovProbs = {};
        if (lastNumber !== undefined) {
            const markovQuery = `
                SELECT to_number, probability
                FROM hn_lottery_markov
                WHERE from_number = $1
                AND (draw_time = $2 OR draw_time IS NULL)
                ORDER BY probability DESC
            `;
            const markovResult = await client.query(markovQuery, [lastNumber, drawTime]);
            markovResult.rows.forEach(row => {
                const prob = parseFloat(row.probability);
                markovProbs[row.to_number] = Math.max(markovProbs[row.to_number] || 0, prob);
            });
        }

        // ── NEW: Fetch recent draws for EWMA, Digit Markov, CUSUM ──
        const recentDrawsQuery = `
            SELECT main_number FROM hn_lottery_draws
            WHERE ($1::text IS NULL OR draw_time = $1)
            ORDER BY draw_date ASC, draw_time ASC
        `;
        const recentDrawsResult = await client.query(recentDrawsQuery, [drawTime]);
        const drawSequence = recentDrawsResult.rows.map(r => r.main_number);

        // Compute advanced signals
        const ewma = computeEWMA(drawSequence, 0.3);
        const { tensMatrix, unitsMatrix } = computeDigitMarkov(drawSequence);
        const cusum = computeCUSUM(drawSequence);

        // Digit Markov: predict probability for each number 00-99 from last number
        const digitMarkovProbs = new Float64Array(100);
        if (lastNumber !== undefined) {
            const lastTens = Math.floor(lastNumber / 10);
            const lastUnits = lastNumber % 10;
            for (let n = 0; n < 100; n++) {
                const t = Math.floor(n / 10);
                const u = n % 10;
                // Joint probability = P(tens_digit) * P(units_digit)
                digitMarkovProbs[n] = tensMatrix[lastTens][t] * unitsMatrix[lastUnits][u];
            }
        }

        // Normalize EWMA and CUSUM to 0-1 ranges for scoring
        const ewmaMax = Math.max(...ewma) || 1;
        const cusumMax = Math.max(...cusum.map(Math.abs)) || 1;

        // ── SCORING v3.0 ──
        // Weights: EWMA(20%) + DigitMarkov(20%) + 100x100Markov(15%) + Momentum(15%) + CUSUM(10%) + Gap(10%) + Jalador(5%) + Random(5%)
        const scores = stats.rows.map(row => {
            const n = row.number;

            // EWMA trend score (recent weighted frequency)
            const ewmaScore = (ewma[n] / ewmaMax) * 40;

            // Digit-level Markov (joint tens+units prediction)
            const digitMarkovScore = (digitMarkovProbs[n] || 0) * 400;

            // 100x100 Markov from DB
            const markovScore = (markovProbs[n] || 0) * 120;

            // Momentum: Recent 7-day raw frequency
            const momentumScore = (row.momentum || 0) * 20;

            // CUSUM: Positive = hot streak, negative = cold streak
            // We boost numbers in hot streaks and give a small "due" bonus to very cold ones
            const cusumNorm = cusum[n] / cusumMax;
            const cusumScore = cusumNorm > 0
                ? cusumNorm * 20   // Hot streak bonus
                : Math.abs(cusumNorm) > 0.5 ? Math.abs(cusumNorm) * 8 : 0; // Deep cold = small "due" bonus

            // Gap score: Numbers absent >7 days
            const gapScore = row.gap_days > 7 ? Math.min(row.gap_days * 1.5, 20) : 0;

            // Jalador bonus
            const jaladorBonus = (lastNumber !== undefined && getJaladores(lastNumber).includes(n)) ? 15 : 0;

            // Reduced randomness
            const randomFactor = crypto.randomInt(1000000) / 1000000 * 8;

            const totalScore = ewmaScore + digitMarkovScore + markovScore + momentumScore + cusumScore + gapScore + jaladorBonus + randomFactor;

            return {
                number: n,
                score: totalScore,
                isHot: row.is_hot,
                isCold: row.is_cold,
                frequency: row.frequency,
                gapDays: row.gap_days,
                momentum: row.momentum || 0,
                markovProb: markovProbs[n] || 0,
                digitMarkovProb: digitMarkovProbs[n] || 0,
                ewma: ewma[n],
                cusum: cusum[n],
                isJalador: jaladorBonus > 0,
                jaladorBonus
            };
        });

        // Sort by score descending
        scores.sort((a, b) => b.score - a.score);

        // Determine how many numbers to return based on tier
        const numResults = tier === "diamond" ? 5 : tier === "premium" ? 3 : 1;

        // Pick from top pool with slight randomization
        const selected = [];
        const poolSize = Math.min(8, scores.length);

        for (let i = 0; i < numResults && scores.length > 0; i++) {
            const idx = crypto.randomInt(Math.min(poolSize - i, scores.length));
            const pick = scores.splice(idx, 1)[0];
            selected.push(pick);
        }

        // Confidence score
        const avgFreq = selected.reduce((sum, s) => sum + s.frequency, 0) / selected.length;
        const avgMarkov = selected.reduce((sum, s) => sum + s.markovProb, 0) / selected.length;
        const avgEwma = selected.reduce((sum, s) => sum + s.ewma, 0) / selected.length;
        const confidence = Math.min(95, 45 + avgFreq * 4 + avgMarkov * 40 + (avgEwma / ewmaMax) * 15);

        return {
            numbers: selected.map(s => ({
                value: s.number,
                sign: getSign(s.number),
                isHot: s.isHot,
                isCold: s.isCold,
                frequency: s.frequency,
                gapDays: s.gapDays,
                markovProb: Math.round(s.markovProb * 100),
                digitMarkovProb: Math.round(s.digitMarkovProb * 10000) / 100,
                ewma: Math.round(s.ewma * 1000) / 1000,
                cusum: Math.round(s.cusum * 100) / 100
            })),
            confidence: Math.round(confidence),
            drawTime: drawTime || "any",
            tier: tier,
            generatedAt: new Date().toISOString(),
            methodology: "v3_ewma_digitmarkov_cusum",
            algorithm: "v3.0",
            lastDrawnNumber: lastNumber,
            lastDrawnSign: lastAnimal,
            dataSource: "kiskooloterias.com"
        };
    } finally {
        client.release();
    }
}

function generateRandomPrediction(tier) {
    const numResults = tier === "diamond" ? 5 : tier === "premium" ? 3 : 1;
    const numbers = [];
    
    for (let i = 0; i < numResults; i++) {
        let num;
        do {
            num = crypto.randomInt(100);
        } while (numbers.find(n => n.value === num));
        
        numbers.push({
            value: num,
            sign: getSign(num),
            isHot: crypto.randomInt(1000000) / 1000000 > 0.7,
            isCold: crypto.randomInt(1000000) / 1000000 > 0.8
        });
    }
    
    return {
        numbers,
        confidence: 30 + crypto.randomInt(20),
        drawTime: "any",
        tier,
        generatedAt: new Date().toISOString(),
        methodology: "random",
        dataSource: "none"
    };
}

async function getStatistics(period = 30) {
    // Scrape real-time data first
    try {
        await scrapeRealTime();
    } catch (err) {
        // log removed
    }
    
    const client = await pool.connect();
    try {
        const hotQuery = `
            SELECT number, frequency, gap_days 
            FROM hn_lottery_stats 
            WHERE period_days = $1 AND draw_time IS NULL AND is_hot = true
            ORDER BY frequency DESC LIMIT 10
        `;
        
        const coldQuery = `
            SELECT number, frequency, gap_days 
            FROM hn_lottery_stats 
            WHERE period_days = $1 AND draw_time IS NULL AND is_cold = true
            ORDER BY gap_days DESC LIMIT 10
        `;
        
        const recentQuery = `
            SELECT draw_date, draw_time, main_number, companion_number, animal_name
            FROM hn_lottery_draws
            ORDER BY draw_date DESC, draw_time DESC
            LIMIT 10
        `;
        
        const [hot, cold, recent] = await Promise.all([
            client.query(hotQuery, [period]),
            client.query(coldQuery, [period]),
            client.query(recentQuery)
        ]);
        
        return {
            period,
            hotNumbers: hot.rows.map(r => ({
                number: r.number.toString().padStart(2, "0"),
                sign: getSign(r.number),
                frequency: r.frequency,
                gapDays: r.gap_days
            })),
            coldNumbers: cold.rows.map(r => ({
                number: r.number.toString().padStart(2, "0"),
                sign: getSign(r.number),
                frequency: r.frequency,
                gapDays: r.gap_days
            })),
            recentResults: recent.rows.map(r => ({
                date: r.draw_date,
                time: r.draw_time,
                mainNumber: r.main_number.toString().padStart(2, "0"),
                sign: r.animal_name || getSign(r.main_number),
                companionNumber: r.companion_number
            })),
            dataSource: "loteriasdehonduras.com"
        };
    } finally {
        client.release();
    }
}

async function checkUserSpins(userId) {
    const client = await pool.connect();
    try {
        // Check for active paid subscription first
        const subQuery = `
            SELECT plan as tier, status, expires_at, payment_provider 
            FROM hn_lottery_subscriptions 
            WHERE user_id = $1 AND status = 'active'
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            ORDER BY CASE WHEN plan = 'diamond' THEN 1 WHEN plan = 'premium' THEN 2 ELSE 3 END
            LIMIT 1
        `;
        const subResult = await client.query(subQuery, [userId]);
        
        let tier = "free";
        let isTrial = false;
        let trialEndsAt = null;
        
        if (subResult.rows.length > 0) {
            tier = subResult.rows[0].tier;
            isTrial = subResult.rows[0].payment_provider === 'trial';
            trialEndsAt = subResult.rows[0].expires_at;
        } else {
            // Check if user is an active member of any group
            const groupMemberQuery = `
                SELECT gm.group_id, g.name as group_name
                FROM group_members gm
                JOIN groups g ON gm.group_id = g.group_id
                WHERE gm.user_id = $1 
                AND gm.status = 'active'
                AND g.deleted_at IS NULL
                LIMIT 1
            `;
            const groupResult = await client.query(groupMemberQuery, [userId]);
            
            if (groupResult.rows.length > 0) {
                // Active group member gets Premium access
                tier = "premium";
                isTrial = false;
                trialEndsAt = null; // No expiration while active in group
                // Create/update subscription as group_member type
                const prevSubResult = await client.query(
                    "SELECT payment_provider FROM hn_lottery_subscriptions WHERE user_id = $1",
                    [userId]
                );
                const wasTrialOrNew = prevSubResult.rows.length === 0 || prevSubResult.rows[0].payment_provider === "trial";
                
                await client.query(`
                    INSERT INTO hn_lottery_subscriptions (user_id, plan, status, payment_provider, expires_at)
                    VALUES ($1, 'premium', 'active', 'group_member', NULL)
                    ON CONFLICT (user_id) DO UPDATE SET 
                        plan = 'premium', 
                        status = 'active', 
                        payment_provider = 'group_member',
                        expires_at = NULL,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE hn_lottery_subscriptions.payment_provider IN ('trial', 'group_member')
                `, [userId]);
                
                // Send group premium email if upgrading from trial or new
                if (wasTrialOrNew && getSendLotteryEmail()) {
                    const userEmail = await client.query("SELECT email, name FROM users WHERE user_id = $1", [userId]);
                    if (userEmail.rows[0]?.email) {
                        getSendLotteryEmail()(
                            userEmail.rows[0].email, 
                            "groupPremium", 
                            [userEmail.rows[0].first_name || "Usuario", groupResult.rows[0].group_name]
                        ).catch(() => {})
                    }
                }
            } else {
                // No group membership - create 30-day Premium trial starting NOW (first use)
                const trialEnd = new Date();
                trialEnd.setDate(trialEnd.getDate() + 30);
                
                tier = "premium";
                isTrial = true;
                trialEndsAt = trialEnd.toISOString();
                
                // Create trial subscription starting from first use
                const trialInsert = await client.query(`
                    INSERT INTO hn_lottery_subscriptions (user_id, plan, status, payment_provider, expires_at)
                    VALUES ($1, 'premium', 'active', 'trial', $2)
                    ON CONFLICT (user_id) DO NOTHING
                    RETURNING user_id
                `, [userId, trialEnd]);
                
                // Send welcome email if new trial was created
                if (trialInsert.rows.length > 0 && getSendLotteryEmail()) {
                    const userEmail = await client.query("SELECT email, name FROM users WHERE user_id = $1", [userId]);
                    if (userEmail.rows[0]?.email) {
                        getSendLotteryEmail()(
                            userEmail.rows[0].email, 
                            "welcome", 
                            [userEmail.rows[0].first_name || "Usuario"]
                        ).catch(() => {})
                    }
                }
            }
        }
        
        const maxSpins = tier === "diamond" ? -1 : tier === "premium" ? 10 : 3;
        const numbersPerSpin = tier === "diamond" ? 5 : tier === "premium" ? 3 : 1;
        const hasMLAccess = tier === "diamond";
        
        const spinsQuery = `
            SELECT spins_used, last_spin_at 
            FROM hn_lottery_spins 
            WHERE user_id = $1 AND spin_date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Tegucigalpa')::date
        `;
        const spinsResult = await client.query(spinsQuery, [userId]);
        let spinsUsed = spinsResult.rows[0]?.spins_used || 0;
        
        return {
            tier, isTrial, trialEndsAt, maxSpins, numbersPerSpin, hasMLAccess,
            spinsUsed, spinsRemaining: maxSpins === -1 ? "unlimited" : maxSpins - spinsUsed,
            canSpin: maxSpins === -1 || spinsUsed < maxSpins
        };
    } finally {
        client.release();
    }
}

async function recordSpin(userId, prediction) {
    const client = await pool.connect();
    try {
        await client.query(`
            INSERT INTO hn_lottery_spins (user_id, spin_date, spins_used, last_spin_at)
            VALUES ($1, (CURRENT_TIMESTAMP AT TIME ZONE 'America/Tegucigalpa')::date, 1, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, spin_date) 
            DO UPDATE SET spins_used = hn_lottery_spins.spins_used + 1, last_spin_at = CURRENT_TIMESTAMP
        `, [userId]);
        
        const result = await client.query(`
            INSERT INTO hn_lottery_predictions (user_id, target_date, target_time, predicted_numbers, confidence_scores, spin_type, algorithm_version)
            VALUES ($1, (CURRENT_TIMESTAMP AT TIME ZONE 'America/Tegucigalpa')::date, $2, $3, jsonb_build_object('confidence', $4::numeric), 'free', $5)
            RETURNING id
        `, [
            userId,
            prediction.drawTime === "any" ? "11am" : prediction.drawTime,
            JSON.stringify(prediction.numbers.map(n => n.number || n.value)),
            prediction.confidence,
            prediction.algorithm || 'v2.0'
        ]);
        
        return result.rows[0]?.id || null;
    } finally {
        client.release();
    }
}

// Export all signs for frontend use
function getAllSigns() {
    return LOTTERY_SIGNS;
}

module.exports = {
    generatePrediction,
    getStatistics,
    checkUserSpins,
    recordSpin,
    scrapeRealTime,
    getAllSigns,
    pool
};
