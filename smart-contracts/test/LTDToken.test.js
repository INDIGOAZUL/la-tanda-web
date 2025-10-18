const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LTDToken V2.0", function () {
    let ltdToken;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const LTDToken = await ethers.getContractFactory("LTDToken");
        ltdToken = await LTDToken.deploy();
        await ltdToken.deployed();
    });

    describe("Deployment & Distribution V2.0", function () {
        it("Should have correct total supply (1 billion LTD)", async function () {
            const totalSupply = await ltdToken.TOTAL_SUPPLY();
            expect(totalSupply).to.equal(ethers.utils.parseEther("1000000000"));
        });

        it("Should have correct V2.0 distribution constants", async function () {
            expect(await ltdToken.PARTICIPATION_RESERVE()).to.equal(
                ethers.utils.parseEther("200000000") // 20% (reduced from 35%)
            );
            expect(await ltdToken.STAKING_GOVERNANCE_RESERVE()).to.equal(
                ethers.utils.parseEther("300000000") // 30% (maintained)
            );
            expect(await ltdToken.DEVELOPMENT_MARKETING_RESERVE()).to.equal(
                ethers.utils.parseEther("250000000") // 25% (increased from 20%)
            );
            expect(await ltdToken.LIQUIDITY_RESERVE()).to.equal(
                ethers.utils.parseEther("100000000") // 10% (reduced from 15%)
            );
            expect(await ltdToken.ROYAL_OWNERSHIP_RESERVE()).to.equal(
                ethers.utils.parseEther("100000000") // 10% (NEW)
            );
            expect(await ltdToken.FUTURE_RESERVE()).to.equal(
                ethers.utils.parseEther("50000000") // 5% (NEW)
            );
        });

        it("Should verify reserves sum to 100% (1B LTD)", async function () {
            const participation = await ltdToken.PARTICIPATION_RESERVE();
            const staking = await ltdToken.STAKING_GOVERNANCE_RESERVE();
            const development = await ltdToken.DEVELOPMENT_MARKETING_RESERVE();
            const liquidity = await ltdToken.LIQUIDITY_RESERVE();
            const royal = await ltdToken.ROYAL_OWNERSHIP_RESERVE();
            const future = await ltdToken.FUTURE_RESERVE();

            const total = participation.add(staking).add(development)
                          .add(liquidity).add(royal).add(future);

            expect(total).to.equal(await ltdToken.TOTAL_SUPPLY());
        });

        it("Should have initial distribution to owner (Development + Liquidity)", async function () {
            const ownerBalance = await ltdToken.balanceOf(owner.address);
            const expectedBalance = ethers.utils.parseEther("350000000"); // 250M + 100M
            expect(ownerBalance).to.equal(expectedBalance);
        });
    });

    describe("V2.0 Adjusted Reward Rates", function () {
        it("Should have correct participation reward (30 LTD, reduced from 50)", async function () {
            expect(await ltdToken.participationReward()).to.equal(
                ethers.utils.parseEther("30")
            );
        });

        it("Should have correct activity reward (15 LTD, reduced from 25)", async function () {
            expect(await ltdToken.activityReward()).to.equal(
                ethers.utils.parseEther("15")
            );
        });

        it("Should have correct app usage reward (1.2 LTD, reduced from 2)", async function () {
            expect(await ltdToken.appUsageReward()).to.equal(
                ethers.utils.parseEther("1.2")
            );
        });

        it("Should have correct governance reward (3 LTD, reduced from 5)", async function () {
            expect(await ltdToken.governanceReward()).to.equal(
                ethers.utils.parseEther("3")
            );
        });
    });

    describe("Tanda Reward Calculation (NEW V2.0)", function () {
        it("Should return 30 LTD for 2-5 participants", async function () {
            expect(await ltdToken.calculateTandaReward(2)).to.equal(ethers.utils.parseEther("30"));
            expect(await ltdToken.calculateTandaReward(5)).to.equal(ethers.utils.parseEther("30"));
        });

        it("Should return 60 LTD for 6-10 participants", async function () {
            expect(await ltdToken.calculateTandaReward(6)).to.equal(ethers.utils.parseEther("60"));
            expect(await ltdToken.calculateTandaReward(10)).to.equal(ethers.utils.parseEther("60"));
        });

        it("Should return 75 LTD for 11-15 participants", async function () {
            expect(await ltdToken.calculateTandaReward(11)).to.equal(ethers.utils.parseEther("75"));
            expect(await ltdToken.calculateTandaReward(15)).to.equal(ethers.utils.parseEther("75"));
        });

        it("Should return 90 LTD for 16+ participants", async function () {
            expect(await ltdToken.calculateTandaReward(16)).to.equal(ethers.utils.parseEther("90"));
            expect(await ltdToken.calculateTandaReward(20)).to.equal(ethers.utils.parseEther("90"));
            expect(await ltdToken.calculateTandaReward(50)).to.equal(ethers.utils.parseEther("90"));
        });

        it("Should return 0 for invalid participant count (< 2)", async function () {
            expect(await ltdToken.calculateTandaReward(0)).to.equal(0);
            expect(await ltdToken.calculateTandaReward(1)).to.equal(0);
        });
    });

    describe("Tanda Reward Distribution (NEW V2.0)", function () {
        it("Should distribute tanda reward correctly", async function () {
            const participants = 10;
            const expectedReward = ethers.utils.parseEther("60"); // 6-10 participants

            await ltdToken.distributeTandaReward(addr1.address, participants);

            expect(await ltdToken.balanceOf(addr1.address)).to.equal(expectedReward);
            expect(await ltdToken.participationDistributed()).to.equal(expectedReward);
        });

        it("Should revert for invalid coordinator address", async function () {
            await expect(
                ltdToken.distributeTandaReward(ethers.constants.AddressZero, 5)
            ).to.be.revertedWith("Invalid coordinator address");
        });

        it("Should revert for less than 2 participants", async function () {
            await expect(
                ltdToken.distributeTandaReward(addr1.address, 1)
            ).to.be.revertedWith("Minimum 2 participants required");
        });

        it("Should emit RewardDistributed event", async function () {
            await expect(ltdToken.distributeTandaReward(addr1.address, 8))
                .to.emit(ltdToken, "RewardDistributed")
                .withArgs(addr1.address, ethers.utils.parseEther("60"), "tanda_completion");
        });
    });

    describe("Participation Rewards", function () {
        it("Should distribute participation reward to user", async function () {
            await ltdToken.distributeParticipationReward(addr1.address);
            expect(await ltdToken.balanceOf(addr1.address)).to.equal(
                ethers.utils.parseEther("30") // V2.0: 30 LTD
            );
        });

        it("Should track participation distributed", async function () {
            await ltdToken.distributeParticipationReward(addr1.address);
            expect(await ltdToken.participationDistributed()).to.equal(
                ethers.utils.parseEther("30")
            );
        });
    });

    describe("Staking for Governance", function () {
        it("Should allow staking for governance eligibility", async function () {
            const stakeAmount = ethers.utils.parseEther("1000");

            // First give user some tokens
            await ltdToken.distributeParticipationReward(addr1.address);
            await ltdToken.transfer(addr1.address, stakeAmount.sub(ethers.utils.parseEther("30")));

            // Stake
            await ltdToken.connect(addr1).stakeForGovernance(stakeAmount);

            expect(await ltdToken.isGovernanceEligible(addr1.address)).to.be.true;
            expect(await ltdToken.stakedBalance(addr1.address)).to.equal(stakeAmount);
        });
    });

    describe("Distribution Status (V2.0 Updated)", function () {
        it("Should return correct distribution status including new reserves", async function () {
            const status = await ltdToken.getDistributionStatus();

            expect(status.participationRemaining).to.equal(
                ethers.utils.parseEther("200000000")
            );
            expect(status.stakingGovernanceRemaining).to.equal(
                ethers.utils.parseEther("300000000")
            );
            expect(status.royalOwnershipRemaining).to.equal(
                ethers.utils.parseEther("100000000") // NEW in V2.0
            );
            expect(status.futureReserveRemaining).to.equal(
                ethers.utils.parseEther("50000000") // NEW in V2.0
            );
        });
    });
});
