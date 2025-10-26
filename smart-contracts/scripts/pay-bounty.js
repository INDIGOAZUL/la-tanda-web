const hre = require("hardhat");

/**
 * Pay LTD Token bounty to contributor
 * Usage: npx hardhat run scripts/pay-bounty.js --network amoy
 *
 * Edit the PAYMENT_DATA object below with recipient address and amount
 */

// ===== PAYMENT CONFIGURATION =====
const PAYMENT_DATA = {
    recipient: "0xRECIPIENT_ADDRESS_HERE",  // Contributor's wallet address
    amount: 100,                             // Amount in LTD tokens
    bountyIssue: "#11",                      // GitHub issue number
    contributor: "@Sahillather002",          // GitHub username
    description: "Database Backup Automation" // What they built
};

// LTD Token contract address (Polygon Amoy)
const LTD_TOKEN_ADDRESS = "0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc";

async function main() {
    console.log("💰 La Tanda Bounty Payment System\n");
    console.log("=" .repeat(50));

    // Validate configuration
    if (PAYMENT_DATA.recipient === "0xRECIPIENT_ADDRESS_HERE") {
        console.error("❌ ERROR: Please set recipient address in PAYMENT_DATA!");
        console.log("\nEdit this file and replace:");
        console.log("   recipient: \"0xRECIPIENT_ADDRESS_HERE\"");
        console.log("   with actual wallet address from PR description\n");
        process.exit(1);
    }

    const [deployer] = await hre.ethers.getSigners();

    console.log("\n📋 Payment Details:");
    console.log("   From:", deployer.address);
    console.log("   To:", PAYMENT_DATA.recipient);
    console.log("   Amount:", PAYMENT_DATA.amount, "LTD");
    console.log("   Issue:", PAYMENT_DATA.bountyIssue);
    console.log("   Contributor:", PAYMENT_DATA.contributor);
    console.log("   For:", PAYMENT_DATA.description);
    console.log("\n" + "=".repeat(50));

    // ERC20 ABI
    const ERC20_ABI = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function symbol() view returns (string)"
    ];

    try {
        // Connect to LTD Token contract
        const ltdToken = await hre.ethers.getContractAt(ERC20_ABI, LTD_TOKEN_ADDRESS);

        // Get token info
        const symbol = await ltdToken.symbol();
        const decimals = await ltdToken.decimals();

        // Check sender balance
        const senderBalance = await ltdToken.balanceOf(deployer.address);
        const senderBalanceFormatted = hre.ethers.utils.formatUnits(senderBalance, decimals);

        console.log("\n💵 Sender Balance:", senderBalanceFormatted, symbol);

        if (parseFloat(senderBalanceFormatted) < PAYMENT_DATA.amount) {
            console.error(`\n❌ INSUFFICIENT BALANCE!`);
            console.log(`   You have: ${senderBalanceFormatted} ${symbol}`);
            console.log(`   You need: ${PAYMENT_DATA.amount} ${symbol}`);
            console.log(`\n💡 ACTION REQUIRED:`);
            console.log(`   1. Mint more LTD tokens to ${deployer.address}`);
            console.log(`   2. Or transfer from treasury/reserve`);
            process.exit(1);
        }

        // Convert amount to wei (with token decimals)
        const amountInWei = hre.ethers.utils.parseUnits(
            PAYMENT_DATA.amount.toString(),
            decimals
        );

        console.log("\n🔄 Processing payment...");

        // Execute transfer
        const tx = await ltdToken.transfer(PAYMENT_DATA.recipient, amountInWei);
        console.log("   Transaction sent:", tx.hash);
        console.log("   Waiting for confirmation...");

        // Wait for transaction confirmation
        const receipt = await tx.wait();

        if (receipt.status === 1) {
            console.log("\n✅ PAYMENT SUCCESSFUL!\n");
            console.log("=" .repeat(50));
            console.log("   Transaction Hash:", receipt.transactionHash);
            console.log("   Block Number:", receipt.blockNumber);
            console.log("   Gas Used:", receipt.gasUsed.toString());
            console.log("=" .repeat(50));

            // Check final balances
            const newSenderBalance = await ltdToken.balanceOf(deployer.address);
            const recipientBalance = await ltdToken.balanceOf(PAYMENT_DATA.recipient);

            console.log("\n💵 Final Balances:");
            console.log("   Sender:", hre.ethers.utils.formatUnits(newSenderBalance, decimals), symbol);
            console.log("   Recipient:", hre.ethers.utils.formatUnits(recipientBalance, decimals), symbol);

            console.log("\n🔗 View on PolygonScan:");
            console.log(`   https://amoy.polygonscan.com/tx/${receipt.transactionHash}`);

            console.log("\n📣 Next Steps:");
            console.log("   1. Comment on GitHub PR with transaction hash");
            console.log("   2. Update issue status to 'paid'");
            console.log("   3. Thank contributor publicly");
            console.log(`\n   Example comment:`);
            console.log(`   "✅ Bounty paid! ${PAYMENT_DATA.amount} LTD sent to your wallet."`);
            console.log(`   "TX: https://amoy.polygonscan.com/tx/${receipt.transactionHash}"`);

        } else {
            console.error("\n❌ TRANSACTION FAILED!");
            console.log("   Transaction Hash:", receipt.transactionHash);
            console.log("   Check PolygonScan for details");
        }

    } catch (error) {
        console.error("\n❌ ERROR:", error.message);

        if (error.message.includes("insufficient funds")) {
            console.log("\n💡 You need MATIC for gas fees!");
            console.log("   Get testnet MATIC: https://faucet.polygon.technology/");
        } else if (error.message.includes("nonce")) {
            console.log("\n💡 Nonce error - try again in a moment");
        }

        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
