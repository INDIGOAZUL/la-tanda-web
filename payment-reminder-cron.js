/**
 * Payment Reminder Cron - Daily Payment Status Check
 * Calls /api/cron/check-payment-status daily at 8:00 AM Honduras time
 * Triggers email reminders + coordinator digests for late payments
 *
 * @version 1.0.0
 * @date 2026-02-20
 */

'use strict';

const cron = require('node-cron');
const path = require('path');
const http = require('http');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '.env') });

const API_PORT = process.env.PORT || 3002;
const CRON_KEY = process.env.CRON_SECRET_KEY;

if (!CRON_KEY) {
    console.error('[payment-reminder-cron] FATAL: CRON_SECRET_KEY not set in .env');
    process.exit(1);
}

function callCheckPaymentStatus() {
    return new Promise(function(resolve, reject) {
        const postData = JSON.stringify({});
        const options = {
            hostname: '127.0.0.1',
            port: API_PORT,
            path: '/api/cron/check-payment-status',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-cron-key': CRON_KEY,
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 60000
        };

        const req = http.request(options, function(res) {
            let data = '';
            res.on('data', function(chunk) { data += chunk; });
            res.on('end', function() {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (e) {
                    resolve({ raw: data.slice(0, 500) });
                }
            });
        });

        req.on('error', function(err) { reject(err); });
        req.on('timeout', function() { req.destroy(); reject(new Error('Request timeout')); });
        req.write(postData);
        req.end();
    });
}

// Run daily at 8:00 AM Honduras time (CST = UTC-6 = 14:00 UTC)
cron.schedule('0 14 * * *', async function() {
    const timestamp = new Date().toISOString();
    console.log(`[payment-reminder-cron] ${timestamp} Running daily payment check...`);
    try {
        const result = await callCheckPaymentStatus();
        console.log(`[payment-reminder-cron] ${timestamp} Result:`, JSON.stringify(result.data || result));
    } catch (error) {
        console.error(`[payment-reminder-cron] ${timestamp} Error:`, error.message);
    }
});

console.log('[payment-reminder-cron] Started - scheduled for 8:00 AM Honduras time (14:00 UTC) daily');
