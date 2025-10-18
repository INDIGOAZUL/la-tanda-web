require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('@openzeppelin/hardhat-upgrades');
require('hardhat-gas-reporter');
require('solidity-coverage');

const { task } = require('hardhat/config');

// Load environment variables
require('dotenv').config();

/**
 * Hardhat configuration for La Tanda Smart Contracts
 * Supports deployment to Honduras Chain and other test networks
 */

const HONDURAS_CHAIN_RPC_URL = process.env.HONDURAS_CHAIN_RPC_URL || 'https://rpc.honduras-chain.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

module.exports = {
    solidity: {
        version: '0.8.19',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            viaIR: true
        }
    },
    
    networks: {
        // Local development network
        hardhat: {
            chainId: 31337,
            gas: 12000000,
            gasPrice: 20000000000,
            accounts: {
                count: 20,
                accountsBalance: '10000000000000000000000' // 10,000 ETH per account
            }
        },
        
        // Honduras Chain (Main Network)
        honduras: {
            url: HONDURAS_CHAIN_RPC_URL,
            chainId: 502, // Honduras Chain ID
            accounts: PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? [PRIVATE_KEY] : [],
            gas: 8000000,
            gasPrice: 20000000000, // 20 gwei
            timeout: 60000
        },
        
        // Honduras Chain Testnet
        hondurasTestnet: {
            url: process.env.HONDURAS_TESTNET_RPC_URL || 'https://testnet-rpc.honduras-chain.org',
            chainId: 503, // Honduras Testnet Chain ID
            accounts: PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? [PRIVATE_KEY] : [],
            gas: 8000000,
            gasPrice: 10000000000, // 10 gwei for testnet
            timeout: 60000
        },
        
        // Ethereum Mainnet (for reference)
        mainnet: {
            url: process.env.ETHEREUM_RPC_URL || `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            chainId: 1,
            accounts: PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? [PRIVATE_KEY] : [],
            gas: 6000000,
            gasPrice: 30000000000 // 30 gwei
        },
        
        // Polygon Network (for testing)
        polygon: {
            url: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
            chainId: 137,
            accounts: PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? [PRIVATE_KEY] : [],
            gas: 6000000,
            gasPrice: 30000000000
        },

        // Polygon Amoy Testnet (replacement for Mumbai - for La Tanda V2.0 testing)
        amoy: {
            url: process.env.AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
            chainId: 80002,
            accounts: PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? [PRIVATE_KEY] : [],
            gas: 6000000,
            gasPrice: 10000000000, // 10 gwei
            timeout: 60000
        },
        
        // BSC Network (for testing)
        bsc: {
            url: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
            chainId: 56,
            accounts: PRIVATE_KEY !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? [PRIVATE_KEY] : [],
            gas: 6000000,
            gasPrice: 5000000000 // 5 gwei
        }
    },
    
    etherscan: {
        apiKey: {
            mainnet: ETHERSCAN_API_KEY,
            polygon: process.env.POLYGONSCAN_API_KEY || '',
            polygonAmoy: process.env.POLYGONSCAN_API_KEY || '',
            bsc: process.env.BSCSCAN_API_KEY || '',
            // Honduras Chain explorer (when available)
            honduras: process.env.HONDURAS_EXPLORER_API_KEY || ''
        },
        customChains: [
            {
                network: 'honduras',
                chainId: 502,
                urls: {
                    apiURL: 'https://api.honduras-explorer.org/api',
                    browserURL: 'https://explorer.honduras-chain.org'
                }
            },
            {
                network: 'hondurasTestnet',
                chainId: 503,
                urls: {
                    apiURL: 'https://api.testnet-explorer.honduras.org/api',
                    browserURL: 'https://testnet-explorer.honduras-chain.org'
                }
            }
        ]
    },
    
    gasReporter: {
        enabled: process.env.REPORT_GAS === 'true',
        currency: 'USD',
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
        token: 'HNL', // Honduras Chain native token
        gasPrice: 20,
        outputFile: 'gas-report.txt',
        noColors: true
    },
    
    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
        disambiguatePaths: false
    },
    
    paths: {
        sources: './contracts',
        tests: './test',
        cache: './cache',
        artifacts: './artifacts'
    },
    
    mocha: {
        timeout: 60000
    }
};

// Custom tasks
task('deploy-honduras', 'Deploy contracts to Honduras Chain')
    .setAction(async (taskArgs, hre) => {
        console.log('🇭🇳 Deploying to Honduras Chain...');
        await hre.run('compile');
        await hre.run('run', { script: 'scripts/deploy.js', network: 'honduras' });
    });

task('deploy-testnet', 'Deploy contracts to Honduras Testnet')
    .setAction(async (taskArgs, hre) => {
        console.log('🧪 Deploying to Honduras Testnet...');
        await hre.run('compile');
        await hre.run('run', { script: 'scripts/deploy.js', network: 'hondurasTestnet' });
    });

task('verify-contracts', 'Verify deployed contracts')
    .addParam('targetNetwork', 'Network name')
    .addParam('deployment', 'Deployment file path')
    .setAction(async (taskArgs, hre) => {
        const deployment = require(taskArgs.deployment);
        
        console.log(`🔍 Verifying contracts on ${taskArgs.targetNetwork}...`);
        
        for (const [contractName, address] of Object.entries(deployment.contracts)) {
            try {
                console.log(`Verifying ${contractName} at ${address}...`);
                await hre.run('verify:verify', {
                    address: address,
                    constructorArguments: [],
                    network: taskArgs.targetNetwork
                });
                console.log(`✅ ${contractName} verified`);
            } catch (error) {
                console.log(`❌ Failed to verify ${contractName}: ${error.message}`);
            }
        }
    });

task('setup-governance', 'Setup initial governance proposals')
    .addParam('targetNetwork', 'Network name')
    .setAction(async (taskArgs, hre) => {
        console.log('🏛️ Setting up governance...');
        // Implementation for setting up initial governance proposals
    });

task('distribute-tokens', 'Distribute initial tokens for testing')
    .addParam('targetNetwork', 'Network name')
    .addParam('amount', 'Amount per address')
    .addVariadicPositionalParam('addresses', 'Addresses to receive tokens')
    .setAction(async (taskArgs, hre) => {
        console.log('💰 Distributing tokens...');
        // Implementation for token distribution
    });

task('contract-size', 'Check contract sizes')
    .setAction(async (taskArgs, hre) => {
        await hre.run('compile');
        await hre.run('size-contracts');
    });