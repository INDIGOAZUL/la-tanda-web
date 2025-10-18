/**
 * 📋 Extract ABIs from compiled contracts for frontend integration
 */

const fs = require('fs');
const path = require('path');

async function extractABIs() {
    console.log('📋 Extracting contract ABIs...');
    
    const contracts = ['LTDToken', 'LaTandaDAO', 'GroupManager'];
    const abis = {};
    
    for (const contractName of contracts) {
        try {
            const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', `${contractName}.sol`, `${contractName}.json`);
            const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            
            abis[contractName] = artifact.abi;
            console.log(`✅ Extracted ABI for ${contractName}`);
            
            // Save individual ABI files
            fs.writeFileSync(
                path.join(__dirname, '..', '..', `${contractName}-abi.json`),
                JSON.stringify(artifact.abi, null, 2)
            );
            
        } catch (error) {
            console.error(`❌ Failed to extract ABI for ${contractName}:`, error.message);
        }
    }
    
    // Create combined ABIs file
    const combinedABIs = {
        contracts: abis,
        deployment: JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'deployments', 'hardhat-deployment.json'), 'utf8'))
    };
    
    fs.writeFileSync(
        path.join(__dirname, '..', '..', 'contract-abis.js'),
        `// La Tanda Smart Contracts ABIs
export const CONTRACT_ABIS = ${JSON.stringify(combinedABIs, null, 2)};`
    );
    
    console.log('✅ All ABIs extracted and saved');
    console.log('📁 Files created:');
    console.log('   - contract-abis.js (combined)');
    contracts.forEach(name => console.log(`   - ${name}-abi.json`));
}

extractABIs().catch(console.error);