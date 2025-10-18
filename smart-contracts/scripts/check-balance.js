const hre = require("hardhat");

/**
 * Check wallet balance on Mumbai testnet
 */

async function main() {
    console.log("💰 Verificando balance de Mumbai Testnet...\n");

    const [deployer] = await hre.ethers.getSigners();

    console.log("📍 Dirección de la wallet:", deployer.address);

    const balance = await deployer.getBalance();
    const balanceInMatic = hre.ethers.utils.formatEther(balance);

    console.log("💵 Balance actual:", balanceInMatic, "MATIC");
    console.log("");

    // Check if enough for deployment
    const requiredGas = 0.5; // Recommended minimum
    const criticalGas = 0.3; // Absolute minimum

    if (parseFloat(balanceInMatic) >= requiredGas) {
        console.log("✅ Balance EXCELENTE - Suficiente para deployment");
        console.log(`   Tienes ${balanceInMatic} MATIC (requieres ~${criticalGas} MATIC mínimo)`);
    } else if (parseFloat(balanceInMatic) >= criticalGas) {
        console.log("⚠️  Balance ACEPTABLE - Puedes deployar pero es justo");
        console.log(`   Tienes ${balanceInMatic} MATIC (recomendado: ${requiredGas} MATIC)`);
    } else {
        console.log("❌ Balance INSUFICIENTE - Necesitas fondear más MATIC");
        console.log(`   Tienes ${balanceInMatic} MATIC (requieres mínimo ${criticalGas} MATIC)`);
        console.log("");
        console.log("🔗 Fondea tu wallet en:");
        console.log("   https://faucet.polygon.technology/");
        console.log("");
        console.log("📍 Tu dirección:", deployer.address);
    }

    console.log("");
    console.log("🔗 Ver en PolygonScan Mumbai:");
    console.log(`   https://mumbai.polygonscan.com/address/${deployer.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
