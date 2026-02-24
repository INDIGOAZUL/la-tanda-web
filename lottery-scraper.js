/**
 * Honduras Lottery Scraper
 * Scrapes results from La Diaria lottery
 * 
 * Sources:
 * - https://www.lotodehonduras.com/la-diaria/
 * - https://loteriasdehonduras.com/
 */

const https = require("https");
const http = require("http");
const { Pool } = require("pg");
const crypto = require("crypto");

// kiskooloterias.com JSON API (backend for loteriasdehonduras.com)
const KISKOO_API = "https://client-back.temp.kiskooloterias.com/honduras";
const KISKOO_GAMES = [
    { time: "11am", siteGameId: "693ae5bbd7b13e9daed23b31" },
    { time: "3pm",  siteGameId: "693ae5bbd7b13e9daed23b07" },
    { time: "9pm",  siteGameId: "693ae5bbd7b13e9daed23b1f" }
];

// Load env
require("dotenv").config();

// Database connection
const pool = new Pool({
    host: "localhost",
    port: 5432,
    database: "latanda_production",
    user: process.env.DB_USER || "latanda_user",
    password: process.env.DB_PASSWORD,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000
});

// Track which draws we've already notified this session (prevents duplicate API calls)
const notifiedThisSession = new Set();

// Notify users about new lottery results
async function notifyUsers(drawDate, drawTime, resultNumber) {
    // Guard: require INTERNAL_API_KEY to be configured
    if (!process.env.INTERNAL_API_KEY) {
        console.error('INTERNAL_API_KEY not set — skipping user notifications');
        return;
    }

    // Skip if we already notified for this draw in this session
    const key = `${drawDate}|${drawTime}`;
    if (notifiedThisSession.has(key)) {
        return;
    }
    notifiedThisSession.add(key);

    return new Promise((resolve) => {
        const data = JSON.stringify({ draw_date: drawDate, draw_time: drawTime, result_number: resultNumber });
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: '/api/lottery/notify-results',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': data.length, 'x-internal-api-key': process.env.INTERNAL_API_KEY }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    // Notification sent
                } catch (e) {}
                resolve();
            });
        });
        req.on('error', (e) => { console.error('Notify error:', e.message); resolve(); });
        req.write(data);
        req.end();
    });
}

// Fetch URL helper (follows 301/302 redirects, max 3 hops)
function fetchURL(url, maxRedirects = 3) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith("https") ? https : http;
        const req = protocol.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "es-HN,es;q=0.9"
            },
            timeout: 15000
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
        req.on("timeout", () => {
            req.destroy();
            reject(new Error("Request timeout"));
        });
    });
}

// Generate sample historical data for testing
async function generateSampleData(days = 180) {
    // Generating sample data
    
    const times = ["11am", "3pm", "9pm"];
    const animals = ["Gato", "Perro", "Conejo", "Gallo", "Caballo", "Tigre", "Serpiente", "Cabra", "Mono", "Búfalo"];
    
    let count = 0;
    const today = new Date();
    
    // Create weighted distribution (some numbers appear more often - simulates real patterns)
    const hotNumbers = [7, 13, 21, 33, 45, 67, 77, 88];
    const coldNumbers = [3, 11, 19, 41, 52, 63, 91, 99];
    
    for (let d = 0; d < days; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split("T")[0];
        
        for (const time of times) {
            // Weighted random - hot numbers appear 40% of time
            let mainNum;
            const roll = crypto.randomInt(1000000) / 1000000;
            if (roll < 0.40) {
                mainNum = hotNumbers[crypto.randomInt(hotNumbers.length)];
            } else if (roll < 0.55) {
                mainNum = coldNumbers[crypto.randomInt(coldNumbers.length)];
            } else {
                mainNum = crypto.randomInt(100);
            }
            
            const compNum = crypto.randomInt(10);
            const animal = animals[crypto.randomInt(animals.length)];
            
            try {
                const result = await pool.query(`
                    INSERT INTO hn_lottery_draws 
                    (draw_date, draw_time, main_number, companion_number, animal_name, lottery_type)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (draw_date, draw_time, lottery_type) DO NOTHING
                    RETURNING id
                `, [dateStr, time, mainNum, compNum, animal, "diaria"]);
                if (result.rowCount > 0) count++;
            } catch (err) {
                console.error(`Error inserting ${dateStr} ${time}: ${err.message}`);
            }
        }
    }
    
    // sample data generation complete
    return count;
}

// Update statistics cache
async function updateStatistics() {
    // Updating statistics

    const periods = [30, 60, 90, 180];
    const times = ["11am", "3pm", "9pm"];

    // First, clear old stats
    await pool.query("DELETE FROM hn_lottery_stats");

    let totalInserted = 0;

    for (const period of periods) {
        const coldThreshold = Math.floor(period / 3);

        // Stats for each time slot
        for (const time of times) {
            try {
                const result = await pool.query(`
                    INSERT INTO hn_lottery_stats
                    (number, draw_time, period_days, frequency, last_appearance, gap_days, is_hot, is_cold, calculated_at)
                    SELECT
                        main_number as number,
                        $1 as draw_time,
                        $2 as period_days,
                        COUNT(*) as frequency,
                        MAX(draw_date) as last_appearance,
                        (CURRENT_DATE - MAX(draw_date)) as gap_days,
                        COUNT(*) >= COALESCE((SELECT AVG(freq) + STDDEV(freq) FROM (
                            SELECT COUNT(*) as freq FROM hn_lottery_draws
                            WHERE draw_date >= CURRENT_DATE - INTERVAL '1 day' * $2
                            AND draw_time = $1
                            GROUP BY main_number
                        ) t), 5) as is_hot,
                        (CURRENT_DATE - MAX(draw_date)) >= $3 as is_cold,
                        CURRENT_TIMESTAMP
                    FROM hn_lottery_draws
                    WHERE draw_date >= CURRENT_DATE - INTERVAL '1 day' * $2
                    AND draw_time = $1
                    GROUP BY main_number
                `, [time, period, coldThreshold]);
                totalInserted += result.rowCount || 0;
            } catch (err) {
                console.error(`Error stats ${period}d ${time}: ${err.message}`);
            }
        }

        // Stats for all times combined
        try {
            const result = await pool.query(`
                INSERT INTO hn_lottery_stats
                (number, draw_time, period_days, frequency, last_appearance, gap_days, is_hot, is_cold, calculated_at)
                SELECT
                    main_number as number,
                    NULL as draw_time,
                    $1 as period_days,
                    COUNT(*) as frequency,
                    MAX(draw_date) as last_appearance,
                    (CURRENT_DATE - MAX(draw_date)) as gap_days,
                    COUNT(*) >= COALESCE((SELECT AVG(freq) + STDDEV(freq) FROM (
                        SELECT COUNT(*) as freq FROM hn_lottery_draws
                        WHERE draw_date >= CURRENT_DATE - INTERVAL '1 day' * $1
                        GROUP BY main_number
                    ) t), 5) as is_hot,
                    (CURRENT_DATE - MAX(draw_date)) >= $2 as is_cold,
                    CURRENT_TIMESTAMP
                FROM hn_lottery_draws
                WHERE draw_date >= CURRENT_DATE - INTERVAL '1 day' * $1
                GROUP BY main_number
            `, [period, coldThreshold]);
            totalInserted += result.rowCount || 0;
        } catch (err) {
            console.error(`Error stats ${period}d all: ${err.message}`);
        }
    }

    // Statistics updated
}
// Show status
async function showStatus() {
    const countResult = await pool.query("SELECT COUNT(*) FROM hn_lottery_draws");
    const latestResult = await pool.query(
        "SELECT draw_date, draw_time, main_number FROM hn_lottery_draws ORDER BY draw_date DESC, draw_time DESC LIMIT 5"
    );
    const hotResult = await pool.query(
        "SELECT number, frequency FROM hn_lottery_stats WHERE period_days = 30 AND draw_time IS NULL AND is_hot = true ORDER BY frequency DESC LIMIT 10"
    );
    
    console.log(`Total records: ${countResult.rows[0].count}`);
    console.log("\nLatest results:");
    latestResult.rows.forEach(r => {
        console.log(`  ${r.draw_date} ${r.draw_time}: ${r.main_number.toString().padStart(2, "0")}`);
    });
    
    if (hotResult.rows.length > 0) {
        console.log("\n🔥 Hot numbers (30 days):");
        console.log("  " + hotResult.rows.map(r => `${r.number.toString().padStart(2, "0")}(${r.frequency})`).join(", "));
    }
}

// Scrape from web
// Scrape from web
// Scrape from web - FIXED VERSION
async function scrapeWeb() {
    // Scraping from lotodehonduras.com
    try {
        const html = await fetchURL("https://www.lotodehonduras.com/la-diaria/");
        // Fetched HTML data
        
        const results = [];
        const months = {
            "enero": "01", "febrero": "02", "marzo": "03", "abril": "04",
            "mayo": "05", "junio": "06", "julio": "07", "agosto": "08",
            "septiembre": "09", "octubre": "10", "noviembre": "11", "diciembre": "12"
        };
        
        // Time slots in order they appear on website (9pm first, then 3pm, then 11am)
        const timeSlots = ["11am", "3pm", "9pm"];
        
        // Split HTML by date headers
        const dateSections = html.split(/rrm-date">/i).slice(1); // Skip first empty section
        
        for (const section of dateSections) {
            // Extract date: "Lunes, 29 Diciembre 2025"
            const dateMatch = section.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
            if (!dateMatch) continue;
            
            const [, day, monthName, yearStr] = dateMatch;
            const month = months[monthName.toLowerCase()];
            if (!month) continue;
            
            // Validate year - fix potential issues with future dates
            let year = parseInt(yearStr);
            let drawDate = `${year}-${month}-${day.padStart(2, "0")}`;
            const testDate = new Date(drawDate);
            const today = new Date();
            const daysDiff = (testDate - today) / (1000 * 60 * 60 * 24);
            if (daysDiff > 7) {
                // Date is in the future, likely a year parsing issue
                year = today.getFullYear();
                if (parseInt(month) > today.getMonth() + 1) {
                    year = year - 1;
                }
                drawDate = `${year}-${month}-${day.padStart(2, "0")}`;
            }
            
            // Extract ALL main numbers from this date section
            const numberMatches = section.match(/<span\s+nm>\s*(\d{1,2})/gi);
            if (!numberMatches || numberMatches.length === 0) continue;
            
            // Parse numbers (validate 0-99 range)
            const numbers = numberMatches.map(m => {
                const num = m.match(/(\d{1,2})/);
                if (!num) return null;
                const val = parseInt(num[1]);
                return (val >= 0 && val <= 99) ? val : null;
            }).filter(n => n !== null);
            
            // Also extract companion numbers
            const compMatches = section.match(/<span\s+ne>\s*(\d{1,2})/gi);
            const companions = compMatches ? compMatches.map(m => {
                const num = m.match(/(\d{1,2})/);
                return num ? parseInt(num[1]) : null;
            }).filter(n => n !== null) : [];
            
            // Create result for each time slot (up to 3)
            for (let i = 0; i < Math.min(numbers.length, 3); i++) {
                results.push({
                    draw_date: drawDate,
                    draw_time: timeSlots[i],
                    main_number: numbers[i],
                    companion_number: companions[i] || 0
                });
            }
        }
        
        // Parsed results from date sections
        
        // Save to DB
        let saved = 0;
        for (const r of results) {
            try {
                const res = await pool.query(`
                    INSERT INTO hn_lottery_draws 
                    (draw_date, draw_time, main_number, companion_number, lottery_type)
                    VALUES ($1, $2, $3, $4, 'diaria')
                    ON CONFLICT (draw_date, draw_time, lottery_type) 
                    DO UPDATE SET main_number = $3, companion_number = $4
                    RETURNING id
                `, [r.draw_date, r.draw_time, r.main_number, r.companion_number]);
                if (res.rowCount > 0) saved++;
            } catch (e) {
                // Silently skip if constraint error
            }
        }
        // Notify users for today results
        const today = new Date();
        const hondurasDate = new Date(today.toLocaleString("en-US", {timeZone: "America/Tegucigalpa"}));
        const todayStr = hondurasDate.toISOString().split("T")[0];
        
        for (const r of results) {
            if (r.draw_date === todayStr) {
                await notifyUsers(r.draw_date, r.draw_time, r.main_number);
            }
        }
        
    } catch (err) {
        console.error("Scrape error:", err.message);
    }
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || "help";
    
    // Honduras Lottery Scraper
    
    try {
        switch (command) {
            case "sample":
                const days = parseInt(args[1]) || 180;
                await generateSampleData(days);
                await updateStatistics(); await updateMarkovMatrix();
                break;
                
            case "stats":
                await updateStatistics(); await updateMarkovMatrix();
                break;
                
            case "scrape":
                // Try alternative source first (faster updates)
                try { await scrapeAlternative(); } catch(e) { console.log("Alt source failed:", e.message); }
                // Then main source (more history)
                await scrapeWeb();
                await updateStatistics(); await updateMarkovMatrix();
                break;
                
            case "status":
                await showStatus();
                break;
                
            default:
                console.log("Usage:");
                console.log("  node lottery-scraper.js sample [days]  - Generate sample data");
                console.log("  node lottery-scraper.js scrape         - Scrape from web");
                console.log("  node lottery-scraper.js stats          - Update statistics");
                console.log("  node lottery-scraper.js status         - Show data status");
        }
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await pool.end();
    }
}

main();

// Update Markov transition matrix
async function updateMarkovMatrix() {
    // Updating Markov matrix
    try {
        // Clear and repopulate time-specific transitions
        await pool.query("DELETE FROM hn_lottery_markov WHERE draw_time IS NOT NULL");
        
        await pool.query(`
            WITH ordered_draws AS (
                SELECT draw_time, main_number,
                    LAG(main_number) OVER (PARTITION BY draw_time ORDER BY draw_date) as prev_number
                FROM hn_lottery_draws
            ),
            transition_counts AS (
                SELECT prev_number as from_number, main_number as to_number, draw_time, COUNT(*) as transitions
                FROM ordered_draws WHERE prev_number IS NOT NULL
                GROUP BY prev_number, main_number, draw_time
            ),
            time_totals AS (
                SELECT from_number, draw_time, SUM(transitions) as total
                FROM transition_counts GROUP BY from_number, draw_time
            )
            INSERT INTO hn_lottery_markov (from_number, to_number, draw_time, transitions, probability, updated_at)
            SELECT tc.from_number, tc.to_number, tc.draw_time, tc.transitions,
                ROUND(tc.transitions::numeric / tt.total, 4), CURRENT_TIMESTAMP
            FROM transition_counts tc
            JOIN time_totals tt ON tc.from_number = tt.from_number AND tc.draw_time = tt.draw_time
        `);

        // Clear and repopulate combined transitions
        await pool.query("DELETE FROM hn_lottery_markov WHERE draw_time IS NULL");
        
        await pool.query(`
            WITH ordered_draws AS (
                SELECT main_number,
                    LAG(main_number) OVER (ORDER BY draw_date, draw_time) as prev_number
                FROM hn_lottery_draws ORDER BY draw_date, draw_time
            ),
            transition_counts AS (
                SELECT prev_number as from_number, main_number as to_number, COUNT(*) as transitions
                FROM ordered_draws WHERE prev_number IS NOT NULL
                GROUP BY prev_number, main_number
            ),
            totals AS (
                SELECT from_number, SUM(transitions) as total
                FROM transition_counts GROUP BY from_number
            )
            INSERT INTO hn_lottery_markov (from_number, to_number, draw_time, transitions, probability, updated_at)
            SELECT tc.from_number, tc.to_number, NULL, tc.transitions,
                ROUND(tc.transitions::numeric / t.total, 4), CURRENT_TIMESTAMP
            FROM transition_counts tc
            JOIN totals t ON tc.from_number = t.from_number
        `);

        // Markov matrix update complete
    } catch (err) {
        console.error("Markov update error:", err.message);
    }
}

// Alternative source: kiskooloterias.com JSON API (fast, reliable, no HTML scraping)
async function scrapeAlternative() {
    // Fetching from kiskooloterias JSON API

    const results = [];

    for (const slot of KISKOO_GAMES) {
        try {
            const raw = await fetchURL(`${KISKOO_API}/site-games/${slot.siteGameId}`);
            const data = JSON.parse(raw);
            const game = data.game || data;

            // Build ID -> text mapping from score_layout options
            const idMap = {};
            for (const row of (game.score_layout || [])) {
                const items = Array.isArray(row) ? row : [row];
                for (const item of items) {
                    for (const opt of (item.options || [])) {
                        idMap[opt.id] = opt.text;
                    }
                }
            }

            // Parse sessions
            for (const session of (game.sessions || [])) {
                const drawDate = session.date ? session.date.substring(0, 10) : null;
                if (!drawDate) continue;

                // First score row: [mainNumberId, companionId, bonusDigitId]
                const scoreRow = session.score?.[0];
                if (!scoreRow || scoreRow.length === 0) continue;

                // Resolve main number: "34 Música" -> 34
                const mainText = idMap[scoreRow[0]] || "";
                const numMatch = mainText.match(/^(\d+)/);
                if (!numMatch) continue;
                const mainNumber = parseInt(numMatch[1]);
                if (isNaN(mainNumber) || mainNumber < 0 || mainNumber > 99) continue;

                // Resolve companion number (bonus digit)
                const bonusText = idMap[scoreRow[2]] || "0";
                const bonusMatch = bonusText.match(/^(\d+)/);
                const companionNumber = bonusMatch ? parseInt(bonusMatch[1]) : 0;

                // Resolve animal/sign name
                const animalName = mainText.replace(/^\d+\s*/, "").trim();

                results.push({
                    draw_date: drawDate,
                    draw_time: slot.time,
                    main_number: mainNumber,
                    companion_number: companionNumber,
                    animal_name: animalName || null
                });
            }
            // Fetched sessions for time slot
        } catch (err) {
            console.error(`Error fetching ${slot.time}: ${err.message}`);
        }
    }

    // Parsed results from JSON API

    // Save to DB with UPSERT
    let saved = 0;
    for (const r of results) {
        try {
            const res = await pool.query(`
                INSERT INTO hn_lottery_draws
                (draw_date, draw_time, main_number, companion_number, animal_name, lottery_type)
                VALUES ($1, $2, $3, $4, $5, 'diaria')
                ON CONFLICT (draw_date, draw_time, lottery_type)
                DO UPDATE SET main_number = $3, companion_number = $4, animal_name = COALESCE($5, hn_lottery_draws.animal_name)
                RETURNING id
            `, [r.draw_date, r.draw_time, r.main_number, r.companion_number, r.animal_name]);
            if (res.rowCount > 0) saved++;
        } catch (e) {
            // Skip constraint errors
        }
    }
    // Saved/updated records from JSON API

    // Notify for today's results
    const today = new Date();
    const hondurasDate = new Date(today.toLocaleString("en-US", {timeZone: "America/Tegucigalpa"}));
    const todayStr = hondurasDate.toISOString().split("T")[0];

    for (const r of results) {
        if (r.draw_date === todayStr) {
            await notifyUsers(r.draw_date, r.draw_time, r.main_number);
        }
    }

    return results.length;
}
