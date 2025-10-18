const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * La Tanda Chain - Tokenomics V2.0 Deployment Script
 * Mumbai Testnet Deployment
 *
 * Deploys:
 * 1. LTDToken.sol (with V2.0 optimized distribution)
 * 2. RoyalOwnershipVesting.sol (100M LTD, 4-year vesting)
 * 3. FutureReserve.sol (50M LTD, DAO-controlled)
 */

async function main() {
    console.log("🚀 La Tanda Chain - Tokenomics V2.0 Deployment to Mumbai Testnet");
    console.log("================================================================\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📍 Deploying from address:", deployer.address);
    console.log("💰 Account balance:", hre.ethers.utils.formatEther(await deployer.getBalance()), "MATIC\n");

    // Network validation
    const network = await hre.ethers.provider.getNetwork();
    console.log("🌐 Network:", network.name);
    console.log("🔗 Chain ID:", network.chainId);

    if (network.chainId !== 80001) {
        console.error("❌ ERROR: Not connected to Mumbai testnet (expected chainId 80001)");
        console.error("   Current chainId:", network.chainId);
        process.exit(1);
    }
    console.log("✅ Mumbai testnet confirmed\n");

    const deploymentResults = {
        network: "mumbai",
        chainId: 80001,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {}
    };

    try {
        // ====================================
        // STEP 1: Deploy LTDToken (V2.0)
        // ====================================
        console.log("1️⃣  Deploying LTDToken V2.0...");
        const LTDToken = await hre.ethers.getContractFactory("LTDToken");
        const ltdToken = await LTDToken.deploy();
        await ltdToken.deployed();

        console.log("   ✅ LTDToken deployed to:", ltdToken.address);
        console.log("   📊 Transaction hash:", ltdToken.deployTransaction.hash);

        deploymentResults.contracts.LTDToken = {
            address: ltdToken.address,
            txHash: ltdToken.deployTransaction.hash
        };

        // Wait for confirmations
        console.log("   ⏳ Waiting for 5 confirmations...");
        await ltdToken.deployTransaction.wait(5);
        console.log("   ✅ Confirmed!\n");

        // ====================================
        // STEP 2: Deploy RoyalOwnershipVesting
        // ====================================
        console.log("2️⃣  Deploying RoyalOwnershipVesting...");

        // Beneficiary is deployer for testing (change to real founder address for mainnet)
        const beneficiaryAddress = deployer.address;
        console.log("   👤 Beneficiary (founder):", beneficiaryAddress);

        const RoyalVesting = await hre.ethers.getContractFactory("RoyalOwnershipVesting");
        const royalVesting = await RoyalVesting.deploy(ltdToken.address, beneficiaryAddress);
        await royalVesting.deployed();

        console.log("   ✅ RoyalOwnershipVesting deployed to:", royalVesting.address);
        console.log("   📊 Transaction hash:", royalVesting.deployTransaction.hash);

        deploymentResults.contracts.RoyalOwnershipVesting = {
            address: royalVesting.address,
            txHash: royalVesting.deployTransaction.hash,
            beneficiary: beneficiaryAddress
        };

        console.log("   ⏳ Waiting for 5 confirmations...");
        await royalVesting.deployTransaction.wait(5);
        console.log("   ✅ Confirmed!\n");

        // ====================================
        // STEP 3: Deploy FutureReserve
        // ====================================
        console.log("3️⃣  Deploying FutureReserve...");

        const FutureReserve = await hre.ethers.getContractFactory("FutureReserve");
        const futureReserve = await FutureReserve.deploy(ltdToken.address);
        await futureReserve.deployed();

        console.log("   ✅ FutureReserve deployed to:", futureReserve.address);
        console.log("   📊 Transaction hash:", futureReserve.deployTransaction.hash);

        deploymentResults.contracts.FutureReserve = {
            address: futureReserve.address,
            txHash: futureReserve.deployTransaction.hash
        };

        console.log("   ⏳ Waiting for 5 confirmations...");
        await futureReserve.deployTransaction.wait(5);
        console.log("   ✅ Confirmed!\n");

        // ====================================
        // STEP 4: Transfer Royal Ownership tokens to vesting contract
        // ====================================
        console.log("4️⃣  Transferring 100M LTD to RoyalOwnershipVesting...");

        const royalAmount = hre.ethers.utils.parseEther("100000000"); // 100M LTD
        const transferRoyalTx = await ltdToken.transfer(royalVesting.address, royalAmount);
        await transferRoyalTx.wait(3);

        const vestingBalance = await ltdToken.balanceOf(royalVesting.address);
        console.log("   ✅ Transferred:", hre.ethers.utils.formatEther(vestingBalance), "LTD");
        console.log("   📊 Transaction hash:", transferRoyalTx.hash);

        deploymentResults.transfers = deploymentResults.transfers || {};
        deploymentResults.transfers.royalOwnership = {
            amount: "100000000",
            txHash: transferRoyalTx.hash
        };
        console.log();

        // ====================================
        // STEP 5: Transfer Future Reserve tokens
        // ====================================
        console.log("5️⃣  Transferring 50M LTD to FutureReserve...");

        const reserveAmount = hre.ethers.utils.parseEther("50000000"); // 50M LTD
        const transferReserveTx = await ltdToken.transfer(futureReserve.address, reserveAmount);
        await transferReserveTx.wait(3);

        const reserveBalance = await ltdToken.balanceOf(futureReserve.address);
        console.log("   ✅ Transferred:", hre.ethers.utils.formatEther(reserveBalance), "LTD");
        console.log("   📊 Transaction hash:", transferReserveTx.hash);

        deploymentResults.transfers.futureReserve = {
            amount: "50000000",
            txHash: transferReserveTx.hash
        };
        console.log();

        // ====================================
        // STEP 6: Verify Token Distribution
        // ====================================
        console.log("6️⃣  Verifying Token Distribution...");

        const totalSupply = await ltdToken.TOTAL_SUPPLY();
        const deployerBalance = await ltdToken.balanceOf(deployer.address);
        const contractBalance = await ltdToken.balanceOf(ltdToken.address);

        console.log("   📊 Total Supply:", hre.ethers.utils.formatEther(totalSupply), "LTD");
        console.log("   💰 Deployer Balance:", hre.ethers.utils.formatEther(deployerBalance), "LTD");
        console.log("   📦 Contract Balance:", hre.ethers.utils.formatEther(contractBalance), "LTD");
        console.log("   🔐 Vesting Balance:", hre.ethers.utils.formatEther(vestingBalance), "LTD");
        console.log("   🏦 Reserve Balance:", hre.ethers.utils.formatEther(reserveBalance), "LTD");

        deploymentResults.verification = {
            totalSupply: hre.ethers.utils.formatEther(totalSupply),
            deployerBalance: hre.ethers.utils.formatEther(deployerBalance),
            contractBalance: hre.ethers.utils.formatEther(contractBalance),
            vestingBalance: hre.ethers.utils.formatEther(vestingBalance),
            reserveBalance: hre.ethers.utils.formatEther(reserveBalance)
        };

        // Check distribution percentages
        const participation = await ltdToken.PARTICIPATION_RESERVE();
        const staking = await ltdToken.STAKING_GOVERNANCE_RESERVE();
        const development = await ltdToken.DEVELOPMENT_MARKETING_RESERVE();
        const liquidity = await ltdToken.LIQUIDITY_RESERVE();
        const royal = await ltdToken.ROYAL_OWNERSHIP_RESERVE();
        const future = await ltdToken.FUTURE_RESERVE();

        console.log("\n   📊 V2.0 Distribution Constants:");
        console.log("   - Participation (20%):", hre.ethers.utils.formatEther(participation), "LTD");
        console.log("   - Staking & Governance (30%):", hre.ethers.utils.formatEther(staking), "LTD");
        console.log("   - Development & Marketing (25%):", hre.ethers.utils.formatEther(development), "LTD");
        console.log("   - Liquidity (10%):", hre.ethers.utils.formatEther(liquidity), "LTD");
        console.log("   - Royal Ownership (10%):", hre.ethers.utils.formatEther(royal), "LTD ✨");
        console.log("   - Future Reserve (5%):", hre.ethers.utils.formatEther(future), "LTD ✨");

        const sum = participation.add(staking).add(development).add(liquidity).add(royal).add(future);
        const matches = sum.eq(totalSupply);
        console.log("   ✅ Distribution sums to 100%:", matches ? "YES" : "NO");
        console.log();

        // ====================================
        // STEP 7: Save Deployment Info
        // ====================================
        console.log("7️⃣  Saving deployment info...");

        const deploymentsDir = path.join(__dirname, "..", "deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `mumbai-v2-${timestamp}.json`;
        const filepath = path.join(deploymentsDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(deploymentResults, null, 2));
        console.log("   ✅ Saved to:", filepath);
        console.log();

        // ====================================
        // Summary
        // ====================================
        console.log("================================================================");
        console.log("✅ DEPLOYMENT COMPLETE!");
        console.log("================================================================\n");

        console.log("📋 Contract Addresses:");
        console.log("   LTDToken:", ltdToken.address);
        console.log("   RoyalOwnershipVesting:", royalVesting.address);
        console.log("   FutureReserve:", futureReserve.address);
        console.log();

        console.log("🔗 View on Polygonscan Mumbai:");
        console.log(`   LTDToken: https://mumbai.polygonscan.com/address/${ltdToken.address}`);
        console.log(`   RoyalVesting: https://mumbai.polygonscan.com/address/${royalVesting.address}`);
        console.log(`   FutureReserve: https://mumbai.polygonscan.com/address/${futureReserve.address}`);
        console.log();

        console.log("🔍 Next Steps:");
        console.log("   1. Verify contracts on Polygonscan:");
        console.log(`      npx hardhat verify --network mumbai ${ltdToken.address}`);
        console.log(`      npx hardhat verify --network mumbai ${royalVesting.address} "${ltdToken.address}" "${beneficiaryAddress}"`);
        console.log(`      npx hardhat verify --network mumbai ${futureReserve.address} "${ltdToken.address}"`);
        console.log();
        console.log("   2. Start vesting (when ready):");
        console.log("      Call royalVesting.startVesting() from owner account");
        console.log();
        console.log("   3. Set DAO governance on FutureReserve:");
        console.log("      Call futureReserve.setDAOGovernance(daoAddress)");
        console.log();

    } catch (error) {
        console.error("\n❌ DEPLOYMENT FAILED:");
        console.error(error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
