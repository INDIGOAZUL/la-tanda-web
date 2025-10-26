const hre = require("hardhat");

/**
 * Check LTD Token balance on Polygon Amoy
 * Contract: 0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc
 */

async function main() {
    console.log("💰 Checking LTD Token Balance on Polygon Amoy...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📍 Wallet Address:", deployer.address);

    // LTD Token contract address (Polygon Amoy)
    const LTD_TOKEN_ADDRESS = "0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc";

    // ERC20 ABI (minimal - just what we need)
    const ERC20_ABI = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
        "function name() view returns (string)",
        "function totalSupply() view returns (uint256)"
    ];

    try {
        // Connect to LTD Token contract
        const ltdToken = await hre.ethers.getContractAt(ERC20_ABI, LTD_TOKEN_ADDRESS);

        // Get token info
        const name = await ltdToken.name();
        const symbol = await ltdToken.symbol();
        const decimals = await ltdToken.decimals();
        const totalSupply = await ltdToken.totalSupply();
        const balance = await ltdToken.balanceOf(deployer.address);

        // Format amounts
        const balanceFormatted = hre.ethers.utils.formatUnits(balance, decimals);
        const totalSupplyFormatted = hre.ethers.utils.formatUnits(totalSupply, decimals);

        console.log("\n📊 Token Information:");
        console.log("   Name:", name);
        console.log("   Symbol:", symbol);
        console.log("   Decimals:", decimals);
        console.log("   Total Supply:", totalSupplyFormatted, symbol);

        console.log("\n💵 Your Balance:", balanceFormatted, symbol);

        // Check if enough for bounties
        const bountyNeeds = {
            "First Bounty (PR #11)": 100,
            "Issue #2 (Assigned)": 250,
            "Issue #3 (On Hold)": 500,
            "Total Assigned": 850,
            "All Active Bounties": 1550,
            "With New Role Bounties": 4075
        };

        console.log("\n💰 Bounty Payment Capacity:");
        Object.entries(bountyNeeds).forEach(([desc, amount]) => {
            const canPay = parseFloat(balanceFormatted) >= amount;
            const status = canPay ? "✅" : "❌";
            console.log(`   ${status} ${desc}: ${amount} LTD ${canPay ? "(OK)" : "(INSUFFICIENT)"}`);
        });

        // Status summary
        console.log("\n📈 Status:");
        if (parseFloat(balanceFormatted) >= bountyNeeds["With New Role Bounties"]) {
            console.log("   ✅ EXCELLENT - Can pay all bounties (current + new)");
        } else if (parseFloat(balanceFormatted) >= bountyNeeds["All Active Bounties"]) {
            console.log("   ✅ GOOD - Can pay all current bounties");
        } else if (parseFloat(balanceFormatted) >= bountyNeeds["Total Assigned"]) {
            console.log("   ⚠️  OK - Can pay assigned bounties only");
        } else if (parseFloat(balanceFormatted) >= bountyNeeds["First Bounty (PR #11)"]) {
            console.log("   ⚠️  LIMITED - Can pay first bounty only");
        } else {
            console.log("   ❌ CRITICAL - Cannot pay any bounties!");
            console.log("\n   💡 ACTION REQUIRED:");
            console.log("      1. Mint LTD tokens to your address");
            console.log("      2. Or transfer from treasury/reserve");
        }

        console.log("\n🔗 View on PolygonScan Amoy:");
        console.log(`   Wallet: https://amoy.polygonscan.com/address/${deployer.address}`);
        console.log(`   Token: https://amoy.polygonscan.com/token/${LTD_TOKEN_ADDRESS}`);

    } catch (error) {
        console.error("\n❌ Error checking balance:", error.message);
        console.log("\n💡 Possible issues:");
        console.log("   - Not connected to Polygon Amoy network");
        console.log("   - Contract address incorrect");
        console.log("   - RPC endpoint not responding");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
