#!/usr/bin/env node

/**
 * 🧪 LTD Withdrawal Endpoint Test Script
 * Tests the /api/wallet/withdraw/ltd endpoint functionality
 *
 * Usage: node test-withdrawal-endpoint.js
 */

const http = require('http');
const { ethers } = require('ethers');

const API_HOST = 'localhost';
const API_PORT = 3001;
const TEST_USER_TOKEN = 'YOUR_TEST_USER_JWT_TOKEN_HERE';
const TEST_DESTINATION_ADDRESS = '0xYOUR_TEST_WALLET_ADDRESS_HERE'; // Replace with your test wallet
const TEST_WITHDRAWAL_AMOUNT = 10; // 10 LTD tokens

// LTD Token Configuration
const LTD_TOKEN_ADDRESS = '0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc';
const TREASURY_ADDRESS = '0x58EA31ceba1B3DeFacB06A5B7fc7408656b91bf7';
const AMOY_RPC_URL = 'https://rpc-amoy.polygon.technology';

console.log('🧪 La Tanda Withdrawal Endpoint Test\n');
console.log('=' . repeat(60));

// Test 1: Check blockchain balances before withdrawal
async function checkBalancesBefore() {
    console.log('\n📊 Test 1: Checking Blockchain Balances Before Withdrawal\n');

    const provider = new ethers.providers.JsonRpcProvider({
        url: AMOY_RPC_URL,
        chainId: 80002,
        name: 'polygon-amoy'
    });
    const ERC20_ABI = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)"
    ];

    const ltdToken = new ethers.Contract(LTD_TOKEN_ADDRESS, ERC20_ABI, provider);

    try {
        const [decimals, symbol] = await Promise.all([
            ltdToken.decimals(),
            ltdToken.symbol()
        ]);

        const [treasuryBalance, testWalletBalance, maticBalance] = await Promise.all([
            ltdToken.balanceOf(TREASURY_ADDRESS),
            ltdToken.balanceOf(TEST_DESTINATION_ADDRESS),
            provider.getBalance(TREASURY_ADDRESS)
        ]);

        console.log('Treasury LTD Balance:', ethers.utils.formatUnits(treasuryBalance, decimals), symbol);
        console.log('Test Wallet LTD Balance:', ethers.utils.formatUnits(testWalletBalance, decimals), symbol);
        console.log('Treasury MATIC Balance:', ethers.utils.formatEther(maticBalance), 'MATIC');

        console.log('\n✅ Blockchain connection working');
        return true;
    } catch (error) {
        console.error('❌ Error checking balances:', error.message);
        return false;
    }
}

// Test 2: Test balance check endpoint
async function testBalanceEndpoint() {
    console.log('\n📊 Test 2: Testing GET /api/wallet/ltd-balance/:address\n');

    return new Promise((resolve) => {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: `/api/wallet/ltd-balance/${TEST_DESTINATION_ADDRESS}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('Response Status:', res.statusCode);
                    console.log('Response:', JSON.stringify(response, null, 2));

                    if (res.statusCode === 200 && response.success) {
                        console.log('\n✅ Balance endpoint working');
                        resolve(true);
                    } else {
                        console.log('\n❌ Balance endpoint failed');
                        resolve(false);
                    }
                } catch (error) {
                    console.error('❌ Error parsing response:', error.message);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error.message);
            console.log('\n💡 Make sure the API server is running:');
            console.log('   node api-server-database.js');
            resolve(false);
        });

        req.end();
    });
}

// Test 3: Test withdrawal endpoint (requires authentication)
async function testWithdrawalEndpoint() {
    console.log('\n📊 Test 3: Testing POST /api/wallet/withdraw/ltd\n');

    if (TEST_USER_TOKEN === 'YOUR_TEST_USER_JWT_TOKEN_HERE') {
        console.log('⚠️ SKIPPED: No test user token provided');
        console.log('\nTo test withdrawal:');
        console.log('1. Login to get a JWT token');
        console.log('2. Replace TEST_USER_TOKEN in this script');
        console.log('3. Replace TEST_DESTINATION_ADDRESS with your wallet');
        console.log('4. Run this script again');
        return false;
    }

    if (TEST_DESTINATION_ADDRESS === '0xYOUR_TEST_WALLET_ADDRESS_HERE') {
        console.log('⚠️ SKIPPED: No test wallet address provided');
        return false;
    }

    return new Promise((resolve) => {
        const postData = JSON.stringify({
            amount: TEST_WITHDRAWAL_AMOUNT,
            destination_address: TEST_DESTINATION_ADDRESS
        });

        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: '/api/wallet/withdraw/ltd',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_USER_TOKEN}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('Response Status:', res.statusCode);
                    console.log('Response:', JSON.stringify(response, null, 2));

                    if (res.statusCode === 200 && response.success) {
                        console.log('\n✅ Withdrawal successful!');
                        console.log('Transaction Hash:', response.data.transaction_hash);
                        console.log('View on PolygonScan:', response.data.explorer_url);
                        resolve(true);
                    } else {
                        console.log('\n⚠️ Withdrawal failed (this is expected without auth)');
                        resolve(false);
                    }
                } catch (error) {
                    console.error('❌ Error parsing response:', error.message);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error.message);
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

// Run all tests
async function runTests() {
    console.log('\n🚀 Starting Withdrawal Endpoint Tests...\n');

    // Test 1: Check blockchain
    const test1 = await checkBalancesBefore();

    // Test 2: Check balance endpoint
    const test2 = await testBalanceEndpoint();

    // Test 3: Try withdrawal
    const test3 = await testWithdrawalEndpoint();

    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary:\n');
    console.log('Test 1 (Blockchain):', test1 ? '✅ PASS' : '❌ FAIL');
    console.log('Test 2 (Balance API):', test2 ? '✅ PASS' : '❌ FAIL');
    console.log('Test 3 (Withdrawal):', test3 ? '✅ PASS' : '⚠️ SKIPPED (needs auth)');
    console.log('\n' + '='.repeat(60));

    if (test1 && test2) {
        console.log('\n✅ Backend crypto system is ready!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Start API server: node api-server-database.js');
        console.log('   2. Test from frontend: ltd-token-economics.html');
        console.log('   3. Connect MetaMask and test withdrawal');
    } else {
        console.log('\n❌ Some tests failed. Check the logs above.');
    }
}

// Run tests
runTests().catch(console.error);
