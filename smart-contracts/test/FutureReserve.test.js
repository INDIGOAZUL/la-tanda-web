const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper function to increase time
async function increaseTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
}

describe("FutureReserve", function () {
    let ltdToken;
    let futureReserve;
    let owner;
    let dao;
    let recipient;
    let addr1;

    const TOTAL_RESERVE = ethers.utils.parseEther("50000000"); // 50M LTD
    const TIMELOCK_DURATION = 7 * 24 * 60 * 60; // 7 days

    beforeEach(async function () {
        [owner, dao, recipient, addr1] = await ethers.getSigners();

        // Deploy LTD Token
        const LTDToken = await ethers.getContractFactory("LTDToken");
        ltdToken = await LTDToken.deploy();
        await ltdToken.deployed();

        // Deploy Future Reserve
        const FutureReserve = await ethers.getContractFactory("FutureReserve");
        futureReserve = await FutureReserve.deploy(ltdToken.address);
        await futureReserve.deployed();

        // Transfer 50M LTD to reserve contract
        await ltdToken.transfer(futureReserve.address, TOTAL_RESERVE);
    });

    describe("Deployment", function () {
        it("Should set correct token address", async function () {
            expect(await futureReserve.ltdToken()).to.equal(ltdToken.address);
        });

        it("Should have correct total reserve", async function () {
            expect(await futureReserve.TOTAL_RESERVE()).to.equal(TOTAL_RESERVE);
        });

        it("Should have 7-day timelock", async function () {
            expect(await futureReserve.TIMELOCK_DURATION()).to.equal(TIMELOCK_DURATION);
        });

        it("Should have no DAO set initially", async function () {
            expect(await futureReserve.daoGovernance()).to.equal(ethers.constants.AddressZero);
        });
    });

    describe("Set DAO Governance", function () {
        it("Should allow owner to set DAO governance", async function () {
            await futureReserve.setDAOGovernance(dao.address);
            expect(await futureReserve.daoGovernance()).to.equal(dao.address);
        });

        it("Should emit DAOGovernanceUpdated event", async function () {
            await expect(futureReserve.setDAOGovernance(dao.address))
                .to.emit(futureReserve, "DAOGovernanceUpdated")
                .withArgs(ethers.constants.AddressZero, dao.address);
        });

        it("Should revert if DAO address is zero", async function () {
            await expect(
                futureReserve.setDAOGovernance(ethers.constants.AddressZero)
            ).to.be.revertedWith("Invalid DAO address");
        });

        it("Should revert if DAO already set", async function () {
            await futureReserve.setDAOGovernance(dao.address);
            await expect(
                futureReserve.setDAOGovernance(addr1.address)
            ).to.be.revertedWith("DAO already set");
        });

        it("Should revert if non-owner tries to set DAO", async function () {
            await expect(
                futureReserve.connect(addr1).setDAOGovernance(dao.address)
            ).to.be.reverted;
        });
    });

    describe("Create Proposal", function () {
        beforeEach(async function () {
            await futureReserve.setDAOGovernance(dao.address);
        });

        it("Should create proposal successfully", async function () {
            const amount = ethers.utils.parseEther("1000000"); // 1M LTD
            const purpose = "New DeFi feature implementation";
            const category = "new_feature";

            await futureReserve.createProposal(recipient.address, amount, purpose, category);

            const proposal = await futureReserve.getProposal(1);
            expect(proposal.recipient).to.equal(recipient.address);
            expect(proposal.amount).to.equal(amount);
            expect(proposal.purpose).to.equal(purpose);
            expect(proposal.category).to.equal(category);
        });

        it("Should emit ProposalCreated event", async function () {
            const amount = ethers.utils.parseEther("1000000");
            await expect(
                futureReserve.createProposal(recipient.address, amount, "Test", "emergency")
            ).to.emit(futureReserve, "ProposalCreated");
        });

        it("Should revert for invalid recipient", async function () {
            await expect(
                futureReserve.createProposal(
                    ethers.constants.AddressZero,
                    ethers.utils.parseEther("1000"),
                    "Test",
                    "test"
                )
            ).to.be.revertedWith("Invalid recipient");
        });

        it("Should revert for zero amount", async function () {
            await expect(
                futureReserve.createProposal(recipient.address, 0, "Test", "test")
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("Should revert if amount exceeds total reserve", async function () {
            const tooMuch = TOTAL_RESERVE.add(1);
            await expect(
                futureReserve.createProposal(recipient.address, tooMuch, "Test", "test")
            ).to.be.revertedWith("Exceeds total reserve");
        });

        it("Should revert if purpose is empty", async function () {
            await expect(
                futureReserve.createProposal(
                    recipient.address,
                    ethers.utils.parseEther("1000"),
                    "",
                    "test"
                )
            ).to.be.revertedWith("Purpose required");
        });

        it("Should track proposal count correctly", async function () {
            await futureReserve.createProposal(
                recipient.address,
                ethers.utils.parseEther("1000"),
                "Test 1",
                "test"
            );
            await futureReserve.createProposal(
                recipient.address,
                ethers.utils.parseEther("2000"),
                "Test 2",
                "test"
            );

            expect(await futureReserve.proposalCount()).to.equal(2);
        });
    });

    describe("Approve Proposal", function () {
        beforeEach(async function () {
            await futureReserve.setDAOGovernance(dao.address);
            await futureReserve.createProposal(
                recipient.address,
                ethers.utils.parseEther("1000000"),
                "Test proposal",
                "new_feature"
            );
        });

        it("Should allow DAO to approve proposal", async function () {
            await futureReserve.connect(dao).approveProposal(1);

            const proposal = await futureReserve.getProposal(1);
            expect(proposal.status).to.equal(1); // Approved
            expect(proposal.daoApproved).to.be.true;
        });

        it("Should set execution time correctly (current + 7 days)", async function () {
            const txTimestamp = await time.latest();
            await futureReserve.connect(dao).approveProposal(1);

            const proposal = await futureReserve.getProposal(1);
            expect(proposal.executionTime).to.be.closeTo(
                ethers.BigNumber.from(txTimestamp + TIMELOCK_DURATION),
                5 // Allow 5 seconds tolerance
            );
        });

        it("Should emit ProposalApproved event", async function () {
            await expect(futureReserve.connect(dao).approveProposal(1))
                .to.emit(futureReserve, "ProposalApproved");
        });

        it("Should revert if non-DAO tries to approve", async function () {
            await expect(
                futureReserve.connect(owner).approveProposal(1)
            ).to.be.revertedWith("Only DAO can approve");
        });

        it("Should revert for invalid proposal ID", async function () {
            await expect(
                futureReserve.connect(dao).approveProposal(999)
            ).to.be.revertedWith("Invalid proposal ID");
        });

        it("Should revert if proposal not pending", async function () {
            await futureReserve.connect(dao).approveProposal(1);
            await expect(
                futureReserve.connect(dao).approveProposal(1)
            ).to.be.revertedWith("Proposal not pending");
        });
    });

    describe("Execute Proposal", function () {
        beforeEach(async function () {
            await futureReserve.setDAOGovernance(dao.address);
            await futureReserve.createProposal(
                recipient.address,
                ethers.utils.parseEther("1000000"),
                "Test proposal",
                "new_feature"
            );
            await futureReserve.connect(dao).approveProposal(1);
        });

        it("Should execute proposal after timelock", async function () {
            // Fast forward 7 days
            await increaseTime(TIMELOCK_DURATION);

            const recipientBalanceBefore = await ltdToken.balanceOf(recipient.address);
            await futureReserve.executeProposal(1);
            const recipientBalanceAfter = await ltdToken.balanceOf(recipient.address);

            expect(recipientBalanceAfter.sub(recipientBalanceBefore)).to.equal(
                ethers.utils.parseEther("1000000")
            );
        });

        it("Should update totalAllocated", async function () {
            await increaseTime(TIMELOCK_DURATION);
            await futureReserve.executeProposal(1);

            expect(await futureReserve.totalAllocated()).to.equal(
                ethers.utils.parseEther("1000000")
            );
        });

        it("Should emit ProposalExecuted event", async function () {
            await increaseTime(TIMELOCK_DURATION);
            await expect(futureReserve.executeProposal(1))
                .to.emit(futureReserve, "ProposalExecuted");
        });

        it("Should revert if timelock not expired", async function () {
            // Don't fast forward time
            await expect(
                futureReserve.executeProposal(1)
            ).to.be.revertedWith("Timelock not expired");
        });

        it("Should revert if proposal not approved", async function () {
            // Create new proposal but don't approve
            await futureReserve.createProposal(
                recipient.address,
                ethers.utils.parseEther("500000"),
                "Test 2",
                "test"
            );

            await expect(
                futureReserve.executeProposal(2)
            ).to.be.revertedWith("Proposal not approved");
        });

        it("Should revert if proposal already executed", async function () {
            await increaseTime(TIMELOCK_DURATION);
            await futureReserve.executeProposal(1);

            await expect(
                futureReserve.executeProposal(1)
            ).to.be.revertedWith("Proposal not approved");
        });
    });

    describe("Cancel Proposal", function () {
        beforeEach(async function () {
            await futureReserve.setDAOGovernance(dao.address);
            await futureReserve.createProposal(
                recipient.address,
                ethers.utils.parseEther("1000000"),
                "Test proposal",
                "new_feature"
            );
        });

        it("Should allow owner to cancel pending proposal", async function () {
            await futureReserve.cancelProposal(1, "Changed priorities");

            const proposal = await futureReserve.getProposal(1);
            expect(proposal.status).to.equal(3); // Cancelled
        });

        it("Should emit ProposalCancelled event", async function () {
            await expect(futureReserve.cancelProposal(1, "Test reason"))
                .to.emit(futureReserve, "ProposalCancelled");
        });

        it("Should allow cancelling approved proposal", async function () {
            await futureReserve.connect(dao).approveProposal(1);
            await futureReserve.cancelProposal(1, "Emergency cancel");

            const proposal = await futureReserve.getProposal(1);
            expect(proposal.status).to.equal(3);
        });

        it("Should revert if trying to cancel executed proposal", async function () {
            await futureReserve.connect(dao).approveProposal(1);
            await increaseTime(TIMELOCK_DURATION);
            await futureReserve.executeProposal(1);

            await expect(
                futureReserve.cancelProposal(1, "Too late")
            ).to.be.revertedWith("Cannot cancel executed proposal");
        });
    });

    describe("Get Reserve Status", function () {
        it("Should return correct reserve status", async function () {
            await futureReserve.setDAOGovernance(dao.address);

            const status = await futureReserve.getReserveStatus();

            expect(status.totalReserve).to.equal(TOTAL_RESERVE);
            expect(status.allocated).to.equal(0);
            expect(status.remaining).to.equal(TOTAL_RESERVE);
            expect(status.contractBalance).to.equal(TOTAL_RESERVE);
            expect(status.totalProposals).to.equal(0);
            expect(status.dao).to.equal(dao.address);
        });
    });

    describe("Is Proposal Executable", function () {
        beforeEach(async function () {
            await futureReserve.setDAOGovernance(dao.address);
            await futureReserve.createProposal(
                recipient.address,
                ethers.utils.parseEther("1000000"),
                "Test",
                "test"
            );
            await futureReserve.connect(dao).approveProposal(1);
        });

        it("Should return false before timelock", async function () {
            expect(await futureReserve.isProposalExecutable(1)).to.be.false;
        });

        it("Should return true after timelock", async function () {
            await increaseTime(TIMELOCK_DURATION);
            expect(await futureReserve.isProposalExecutable(1)).to.be.true;
        });

        it("Should return false for non-approved proposal", async function () {
            await futureReserve.createProposal(
                recipient.address,
                ethers.utils.parseEther("500000"),
                "Test 2",
                "test"
            );
            expect(await futureReserve.isProposalExecutable(2)).to.be.false;
        });
    });
});
