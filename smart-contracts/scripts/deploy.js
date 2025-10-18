/**
 * 🚀 LA TANDA SMART CONTRACTS DEPLOYMENT SCRIPT
 * Deploy LTD Token, DAO, and Group Manager contracts to Honduras Chain
 */

const { ethers } = require('hardhat');

async function main() {
    console.log('🚀 Starting La Tanda Smart Contracts Deployment...\n');
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`📝 Deploying contracts with account: ${deployer.address}`);
    console.log(`💰 Account balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH\n`);
    
    // Track deployment addresses
    const deployedContracts = {};
    
    try {
        // 1. Deploy LTD Token
        console.log('1️⃣ Deploying LTD Token...');
        const LTDToken = await ethers.getContractFactory('LTDToken');
        const ltdToken = await LTDToken.deploy();
        await ltdToken.deployed();
        
        deployedContracts.LTDToken = ltdToken.address;
        console.log(`   ✅ LTD Token deployed to: ${ltdToken.address}`);
        console.log(`   📊 Total Supply: ${ethers.utils.formatEther(await ltdToken.totalSupply())} LTD\n`);
        
        // 2. Deploy La Tanda DAO
        console.log('2️⃣ Deploying La Tanda DAO...');
        const LaTandaDAO = await ethers.getContractFactory('LaTandaDAO');
        const dao = await LaTandaDAO.deploy(ltdToken.address);
        await dao.deployed();
        
        deployedContracts.LaTandaDAO = dao.address;
        console.log(`   ✅ La Tanda DAO deployed to: ${dao.address}\n`);
        
        // 3. Deploy Group Manager
        console.log('3️⃣ Deploying Group Manager...');
        const GroupManager = await ethers.getContractFactory('GroupManager');
        const groupManager = await GroupManager.deploy(ltdToken.address);
        await groupManager.deployed();
        
        deployedContracts.GroupManager = groupManager.address;
        console.log(`   ✅ Group Manager deployed to: ${groupManager.address}\n`);
        
        // 4. Setup initial configuration
        console.log('4️⃣ Setting up initial configuration...');
        
        // Transfer some tokens to DAO for governance rewards
        const daoTokens = ethers.utils.parseEther('10000000'); // 10M LTD for DAO
        await ltdToken.transfer(dao.address, daoTokens);
        console.log(`   💰 Transferred ${ethers.utils.formatEther(daoTokens)} LTD to DAO`);
        
        // Verify deployments
        console.log('\n5️⃣ Verifying deployments...');
        
        // Check LTD Token
        const tokenName = await ltdToken.name();
        const tokenSymbol = await ltdToken.symbol();
        const totalSupply = await ltdToken.totalSupply();
        console.log(`   🪙 Token: ${tokenName} (${tokenSymbol})`);
        console.log(`   📈 Total Supply: ${ethers.utils.formatEther(totalSupply)} LTD`);
        
        // Check DAO
        const ltdTokenInDAO = await dao.ltdToken();
        console.log(`   🏛️ DAO connected to LTD Token: ${ltdTokenInDAO === ltdToken.address ? '✅' : '❌'}`);
        
        // Check Group Manager
        const ltdTokenInGroupManager = await groupManager.ltdToken();
        console.log(`   👥 Group Manager connected to LTD Token: ${ltdTokenInGroupManager === ltdToken.address ? '✅' : '❌'}`);
        
        // 6. Create deployment summary
        console.log('\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!\n');
        console.log('📋 DEPLOYMENT SUMMARY:');
        console.log('═'.repeat(60));
        console.log(`🪙 LTD Token:      ${deployedContracts.LTDToken}`);
        console.log(`🏛️ La Tanda DAO:   ${deployedContracts.LaTandaDAO}`);
        console.log(`👥 Group Manager:  ${deployedContracts.GroupManager}`);
        console.log('═'.repeat(60));
        
        // Get network info
        const currentNetwork = await ethers.provider.getNetwork();
        
        // 7. Save deployment configuration
        const deploymentConfig = {
            network: currentNetwork.name || 'localhost',
            chainId: currentNetwork.chainId,
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            contracts: deployedContracts,
            gasUsed: {
                // These would be calculated from deployment receipts
                LTDToken: 'TBD',
                LaTandaDAO: 'TBD',
                GroupManager: 'TBD'
            }
        };
        
        console.log('\n📁 Saving deployment configuration...');
        const fs = require('fs');
        fs.writeFileSync(
            `deployments/${currentNetwork.name || 'localhost'}-deployment.json`,
            JSON.stringify(deploymentConfig, null, 2)
        );
        console.log(`   ✅ Configuration saved to deployments/${currentNetwork.name || 'localhost'}-deployment.json`);
        
        // 8. Create frontend integration file
        console.log('\n🔗 Creating frontend integration file...');
        const frontendConfig = {
            contracts: {
                LTDToken: {
                    address: deployedContracts.LTDToken,
                    abi: 'LTDToken.json' // Reference to ABI file
                },
                LaTandaDAO: {
                    address: deployedContracts.LaTandaDAO,
                    abi: 'LaTandaDAO.json'
                },
                GroupManager: {
                    address: deployedContracts.GroupManager,
                    abi: 'GroupManager.json'
                }
            },
            network: {
                name: currentNetwork.name || 'localhost',
                chainId: currentNetwork.chainId,
                rpcUrl: 'http://localhost:8545'
            }
        };
        
        fs.writeFileSync(
            '../smart-contracts-config.js',
            `// La Tanda Smart Contracts Configuration
export const SMART_CONTRACTS_CONFIG = ${JSON.stringify(frontendConfig, null, 2)};

export const CHAIN_CONFIG = {
    chainId: '0x${currentNetwork.chainId.toString(16)}',
    chainName: 'Honduras Chain',
    nativeCurrency: {
        name: 'HNL',
        symbol: 'HNL',
        decimals: 18
    },
    rpcUrls: ['http://localhost:8545'],
    blockExplorerUrls: ['https://explorer.honduras-chain.org']
};`
        );
        console.log('   ✅ Frontend configuration created');
        
        // 9. Initial token distribution for testing
        console.log('\n🎁 Setting up test token distribution...');
        
        // Distribute some tokens for testing
        const testAddresses = [
            '0x742d35Cc6634C0532925a3b8D4C4F2bD1096B0cD', // Example test address
            '0x8ba1f109551bD432803012645Hap0E16731c95da'  // Another test address
        ];
        
        for (const address of testAddresses) {
            try {
                const testAmount = ethers.utils.parseEther('1000'); // 1000 LTD for testing
                await ltdToken.transfer(address, testAmount);
                console.log(`   💰 Sent ${ethers.utils.formatEther(testAmount)} LTD to ${address}`);
            } catch (error) {
                console.log(`   ⚠️ Could not send tokens to ${address} (address may not exist)`);
            }
        }
        
        console.log('\n🌟 HONDURAS CHAIN DEPLOYMENT COMPLETE!');
        console.log('\n🚀 Next Steps:');
        console.log('   1. Update frontend with new contract addresses');
        console.log('   2. Verify contracts on block explorer');
        console.log('   3. Set up governance proposals');
        console.log('   4. Configure group creation parameters');
        console.log('   5. Enable DeFi features integration');
        
        return deployedContracts;
        
    } catch (error) {
        console.error('\n❌ DEPLOYMENT FAILED:');
        console.error(error);
        process.exit(1);
    }
}

// Handle script execution
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;