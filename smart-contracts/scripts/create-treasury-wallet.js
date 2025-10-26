const { ethers } = require("ethers");

async function main() {
    console.log("\n🔑 Creating New Treasury Wallet for La Tanda...\n");
    
    // Generate new random wallet
    const wallet = ethers.Wallet.createRandom();
    
    console.log("✅ New Treasury Wallet Created!\n");
    console.log("═══════════════════════════════════════════════════");
    console.log("Address:     ", wallet.address);
    console.log("Private Key: ", wallet.privateKey);
    console.log("═══════════════════════════════════════════════════");
    console.log("\n⚠️  SAVE THESE SECURELY - YOU'LL NEED THEM!\n");
    
    console.log("📋 Next Steps:\n");
    console.log("1. Get MATIC from faucet:");
    console.log("   https://faucet.polygon.technology/");
    console.log("   → Send to:", wallet.address);
    console.log("");
    console.log("2. Transfer LTD tokens to this new wallet:");
    console.log("   From: 0x58EA31ceba1B3DeFacB06A5B7fc7408656b91bf7");
    console.log("   To:  ", wallet.address);
    console.log("   Amount: 200,000,000 LTD");
    console.log("");
    console.log("3. Add private key to production server:");
    console.log("   ssh root@168.231.67.201");
    console.log("   nano /root/.env");
    console.log("   TREASURY_PRIVATE_KEY=" + wallet.privateKey);
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
