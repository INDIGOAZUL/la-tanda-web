const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper function to increase time
async function increaseTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
}

describe("RoyalOwnershipVesting", function () {
    let ltdToken;
    let vesting;
    let owner;
    let beneficiary;
    let addr1;

    const TOTAL_ALLOCATION = ethers.utils.parseEther("100000000"); // 100M LTD
    const ONE_YEAR = 365 * 24 * 60 * 60;
    const FOUR_YEARS = 4 * ONE_YEAR;

    beforeEach(async function () {
        [owner, beneficiary, addr1] = await ethers.getSigners();

        // Deploy LTD Token
        const LTDToken = await ethers.getContractFactory("LTDToken");
        ltdToken = await LTDToken.deploy();
        await ltdToken.deployed();

        // Deploy Vesting Contract
        const RoyalVesting = await ethers.getContractFactory("RoyalOwnershipVesting");
        vesting = await RoyalVesting.deploy(ltdToken.address, beneficiary.address);
        await vesting.deployed();

        // Transfer 100M LTD to vesting contract
        await ltdToken.transfer(vesting.address, TOTAL_ALLOCATION);
    });

    describe("Deployment", function () {
        it("Should set correct token address", async function () {
            expect(await vesting.ltdToken()).to.equal(ltdToken.address);
        });

        it("Should set correct beneficiary", async function () {
            expect(await vesting.beneficiary()).to.equal(beneficiary.address);
        });

        it("Should have correct total allocation", async function () {
            expect(await vesting.TOTAL_ALLOCATION()).to.equal(TOTAL_ALLOCATION);
        });

        it("Should have vesting duration of 4 years", async function () {
            expect(await vesting.VESTING_DURATION()).to.equal(FOUR_YEARS);
        });

        it("Should have cliff duration of 1 year", async function () {
            expect(await vesting.CLIFF_DURATION()).to.equal(ONE_YEAR);
        });

        it("Should have 2% monthly withdrawal limit", async function () {
            expect(await vesting.MONTHLY_WITHDRAWAL_LIMIT()).to.equal(2);
        });
    });

    describe("Start Vesting", function () {
        it("Should start vesting successfully", async function () {
            await vesting.startVesting();
            expect(await vesting.vestingStarted()).to.be.true;
        });

        it("Should revert if vesting already started", async function () {
            await vesting.startVesting();
            await expect(vesting.startVesting()).to.be.revertedWith("Vesting already started");
        });

        it("Should revert if insufficient tokens in contract", async function () {
            const RoyalVesting2 = await ethers.getContractFactory("RoyalOwnershipVesting");
            const vesting2 = await RoyalVesting2.deploy(ltdToken.address, beneficiary.address);
            await vesting2.deployed();

            await expect(vesting2.startVesting()).to.be.revertedWith("Insufficient tokens in contract");
        });

        it("Should emit VestingStarted event", async function () {
            await expect(vesting.startVesting())
                .to.emit(vesting, "VestingStarted");
        });
    });

    describe("Vesting Calculation", function () {
        beforeEach(async function () {
            await vesting.startVesting();
        });

        it("Should return 0 vested amount before cliff (1 year)", async function () {
            // Fast forward 6 months
            await increaseTime(ONE_YEAR / 2);
            expect(await vesting.vestedAmount()).to.equal(0);
        });

        it("Should return correct vested amount after 1 year (cliff)", async function () {
            await increaseTime(ONE_YEAR);
            const vested = await vesting.vestedAmount();
            const expected = TOTAL_ALLOCATION.mul(ONE_YEAR).div(FOUR_YEARS);
            expect(vested).to.equal(expected); // Should be 25M LTD (25%)
        });

        it("Should return correct vested amount after 2 years", async function () {
            await increaseTime(2 * ONE_YEAR);
            const vested = await vesting.vestedAmount();
            const expected = TOTAL_ALLOCATION.mul(2 * ONE_YEAR).div(FOUR_YEARS);
            expect(vested).to.equal(expected); // Should be 50M LTD (50%)
        });

        it("Should return full allocation after 4 years", async function () {
            await increaseTime(FOUR_YEARS);
            const vested = await vesting.vestedAmount();
            expect(vested).to.equal(TOTAL_ALLOCATION); // Should be 100M LTD (100%)
        });

        it("Should not exceed total allocation after vesting period", async function () {
            await increaseTime(5 * ONE_YEAR); // 5 years
            const vested = await vesting.vestedAmount();
            expect(vested).to.equal(TOTAL_ALLOCATION);
        });
    });

    describe("Releasable Amount (Anti-dump 2% monthly limit)", function () {
        beforeEach(async function () {
            await vesting.startVesting();
        });

        it("Should return 0 releasable before cliff", async function () {
            await increaseTime(ONE_YEAR / 2); // 6 months
            expect(await vesting.releasableAmount()).to.equal(0);
        });

        it("Should limit to 2% monthly after cliff", async function () {
            await increaseTime(ONE_YEAR); // 1 year - cliff ended
            const releasable = await vesting.releasableAmount();
            const monthlyLimit = TOTAL_ALLOCATION.mul(2).div(100); // 2M LTD (2%)

            expect(releasable).to.equal(monthlyLimit);
        });

        it("Should respect monthly limit even if more vested", async function () {
            await increaseTime(2 * ONE_YEAR); // 2 years - 50% vested
            const releasable = await vesting.releasableAmount();
            const monthlyLimit = TOTAL_ALLOCATION.mul(2).div(100); // 2M LTD (2%)

            // Even though 50M is vested, can only release 2M per month
            expect(releasable).to.equal(monthlyLimit);
        });
    });

    describe("Release Tokens", function () {
        beforeEach(async function () {
            await vesting.startVesting();
        });

        it("Should revert release before cliff", async function () {
            await expect(
                vesting.connect(beneficiary).release()
            ).to.be.revertedWith("Cliff period not ended");
        });

        it("Should allow beneficiary to release after cliff", async function () {
            await increaseTime(ONE_YEAR); // Pass cliff

            const releasableBefore = await vesting.releasableAmount();
            await vesting.connect(beneficiary).release();

            expect(await ltdToken.balanceOf(beneficiary.address)).to.equal(releasableBefore);
        });

        it("Should revert if non-beneficiary tries to release", async function () {
            await increaseTime(ONE_YEAR);
            await expect(
                vesting.connect(addr1).release()
            ).to.be.revertedWith("Only beneficiary can release");
        });

        it("Should track total released correctly", async function () {
            await increaseTime(ONE_YEAR);
            const releasable = await vesting.releasableAmount();

            await vesting.connect(beneficiary).release();
            expect(await vesting.totalReleased()).to.equal(releasable);
        });

        it("Should emit TokensReleased event", async function () {
            await increaseTime(ONE_YEAR);
            await expect(vesting.connect(beneficiary).release())
                .to.emit(vesting, "TokensReleased");
        });

        it("Should prevent double release in same period", async function () {
            await increaseTime(ONE_YEAR);

            await vesting.connect(beneficiary).release();

            // Try to release again immediately
            await expect(
                vesting.connect(beneficiary).release()
            ).to.be.revertedWith("No tokens available for release");
        });

        it("Should allow release in new period (30 days later)", async function () {
            await increaseTime(ONE_YEAR);
            await vesting.connect(beneficiary).release();

            // Fast forward 30 days
            await increaseTime(30 * 24 * 60 * 60);

            const releasable = await vesting.releasableAmount();
            expect(releasable).to.be.gt(0);
        });
    });

    describe("Pause/Unpause", function () {
        beforeEach(async function () {
            await vesting.startVesting();
        });

        it("Should allow owner to pause vesting", async function () {
            await vesting.pauseVesting("Emergency pause");
            expect(await vesting.isPaused()).to.be.true;
        });

        it("Should prevent release when paused", async function () {
            await increaseTime(ONE_YEAR);
            await vesting.pauseVesting("Testing");

            await expect(
                vesting.connect(beneficiary).release()
            ).to.be.revertedWith("Vesting is paused");
        });

        it("Should allow owner to unpause", async function () {
            await vesting.pauseVesting("Test");
            await vesting.unpauseVesting();
            expect(await vesting.isPaused()).to.be.false;
        });

        it("Should emit events on pause/unpause", async function () {
            await expect(vesting.pauseVesting("Test"))
                .to.emit(vesting, "VestingPaused");

            await expect(vesting.unpauseVesting())
                .to.emit(vesting, "VestingUnpaused");
        });
    });

    describe("Get Vesting Details", function () {
        it("Should return correct details", async function () {
            await vesting.startVesting();
            const details = await vesting.getVestingDetails();

            expect(details.started).to.be.true;
            expect(details.totalAllocation).to.equal(TOTAL_ALLOCATION);
            expect(details.released).to.equal(0);
            expect(details.paused).to.be.false;
        });
    });
});
