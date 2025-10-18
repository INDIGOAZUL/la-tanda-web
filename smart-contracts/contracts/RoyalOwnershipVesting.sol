// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title RoyalOwnershipVesting
 * @dev Vesting contract for La Tanda founder's 10% Royal Ownership allocation (100M LTD)
 *
 * Features:
 * - 1-year cliff period (no tokens released before 1 year)
 * - 4-year linear vesting total (including cliff year)
 * - Anti-dump protection: max 2% of total allocation per month after cliff
 * - Non-transferable until cliff period ends
 * - Emergency pause functionality
 *
 * Tokenomics V2.0 Specification (2025-10-16)
 */
contract RoyalOwnershipVesting is Ownable, ReentrancyGuard {

    IERC20 public immutable ltdToken;
    address public immutable beneficiary; // Platform founder

    uint256 public constant TOTAL_ALLOCATION = 100_000_000 * 10**18; // 100M LTD (10% of total supply)
    uint256 public constant VESTING_DURATION = 4 * 365 days; // 4 years
    uint256 public constant CLIFF_DURATION = 365 days; // 1 year cliff
    uint256 public constant MONTHLY_WITHDRAWAL_LIMIT = 2; // 2% of total allocation per month
    uint256 public constant WITHDRAWAL_PERIOD = 30 days; // Monthly withdrawal window

    uint256 public startTime;
    uint256 public totalReleased;
    uint256 public lastWithdrawalTime;
    uint256 public currentPeriodWithdrawn;

    bool public vestingStarted;
    bool public isPaused;

    // Events
    event VestingStarted(uint256 startTime, address indexed beneficiary);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event VestingPaused(string reason);
    event VestingUnpaused();
    event EmergencyWithdrawal(address indexed owner, uint256 amount);

    /**
     * @dev Constructor
     * @param _ltdToken Address of LTD token contract
     * @param _beneficiary Address of the founder (beneficiary)
     */
    constructor(address _ltdToken, address _beneficiary) {
        require(_ltdToken != address(0), "Invalid token address");
        require(_beneficiary != address(0), "Invalid beneficiary address");

        ltdToken = IERC20(_ltdToken);
        beneficiary = _beneficiary;
    }

    /**
     * @dev Start the vesting schedule (can only be called once by owner)
     */
    function startVesting() external onlyOwner {
        require(!vestingStarted, "Vesting already started");
        require(ltdToken.balanceOf(address(this)) >= TOTAL_ALLOCATION, "Insufficient tokens in contract");

        vestingStarted = true;
        startTime = block.timestamp;
        lastWithdrawalTime = block.timestamp;

        emit VestingStarted(startTime, beneficiary);
    }

    /**
     * @dev Calculate total vested amount at current time
     * @return Amount of tokens vested
     */
    function vestedAmount() public view returns (uint256) {
        if (!vestingStarted) {
            return 0;
        }

        // No tokens vested before cliff
        if (block.timestamp < startTime + CLIFF_DURATION) {
            return 0;
        }

        // After full vesting period, all tokens are vested
        if (block.timestamp >= startTime + VESTING_DURATION) {
            return TOTAL_ALLOCATION;
        }

        // Linear vesting after cliff
        uint256 timeVested = block.timestamp - startTime;
        return (TOTAL_ALLOCATION * timeVested) / VESTING_DURATION;
    }

    /**
     * @dev Calculate releasable amount (vested - already released - considering monthly limit)
     * @return Amount of tokens that can be released
     */
    function releasableAmount() public view returns (uint256) {
        uint256 vested = vestedAmount();
        uint256 unreleased = vested - totalReleased;

        if (unreleased == 0) {
            return 0;
        }

        // Check if we're in a new withdrawal period
        bool newPeriod = block.timestamp >= lastWithdrawalTime + WITHDRAWAL_PERIOD;

        // Calculate monthly limit (2% of TOTAL_ALLOCATION)
        uint256 monthlyLimit = (TOTAL_ALLOCATION * MONTHLY_WITHDRAWAL_LIMIT) / 100;

        if (newPeriod) {
            // New period: can withdraw up to monthly limit or unreleased amount, whichever is smaller
            return unreleased > monthlyLimit ? monthlyLimit : unreleased;
        } else {
            // Same period: can only withdraw remaining allowance for this period
            uint256 remainingAllowance = monthlyLimit > currentPeriodWithdrawn ?
                                         monthlyLimit - currentPeriodWithdrawn : 0;
            return unreleased > remainingAllowance ? remainingAllowance : unreleased;
        }
    }

    /**
     * @dev Release vested tokens to beneficiary
     */
    function release() external nonReentrant {
        require(msg.sender == beneficiary, "Only beneficiary can release");
        require(vestingStarted, "Vesting not started");
        require(!isPaused, "Vesting is paused");
        require(block.timestamp >= startTime + CLIFF_DURATION, "Cliff period not ended");

        uint256 amount = releasableAmount();
        require(amount > 0, "No tokens available for release");

        // Check if we're in a new withdrawal period
        bool newPeriod = block.timestamp >= lastWithdrawalTime + WITHDRAWAL_PERIOD;

        if (newPeriod) {
            // Reset period tracking
            lastWithdrawalTime = block.timestamp;
            currentPeriodWithdrawn = amount;
        } else {
            // Accumulate in current period
            currentPeriodWithdrawn += amount;
        }

        totalReleased += amount;

        require(ltdToken.transfer(beneficiary, amount), "Token transfer failed");

        emit TokensReleased(beneficiary, amount);
    }

    /**
     * @dev Pause vesting (emergency function)
     * @param reason Reason for pausing
     */
    function pauseVesting(string memory reason) external onlyOwner {
        require(!isPaused, "Already paused");
        isPaused = true;
        emit VestingPaused(reason);
    }

    /**
     * @dev Unpause vesting
     */
    function unpauseVesting() external onlyOwner {
        require(isPaused, "Not paused");
        isPaused = false;
        emit VestingUnpaused();
    }

    /**
     * @dev Emergency withdrawal (only owner, only before vesting starts)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(!vestingStarted, "Cannot emergency withdraw after vesting started");
        require(ltdToken.transfer(owner(), amount), "Emergency withdrawal failed");
        emit EmergencyWithdrawal(owner(), amount);
    }

    /**
     * @dev Get vesting details
     */
    function getVestingDetails() external view returns (
        bool started,
        uint256 start,
        uint256 cliffEnd,
        uint256 vestingEnd,
        uint256 totalAllocation,
        uint256 vested,
        uint256 released,
        uint256 releasable,
        uint256 nextWithdrawalTime,
        uint256 monthlyWithdrawableLimit,
        uint256 currentPeriodUsed,
        bool paused
    ) {
        start = startTime;
        cliffEnd = vestingStarted ? startTime + CLIFF_DURATION : 0;
        vestingEnd = vestingStarted ? startTime + VESTING_DURATION : 0;
        totalAllocation = TOTAL_ALLOCATION;
        vested = vestedAmount();
        released = totalReleased;
        releasable = releasableAmount();
        started = vestingStarted;
        nextWithdrawalTime = lastWithdrawalTime + WITHDRAWAL_PERIOD;
        monthlyWithdrawableLimit = (TOTAL_ALLOCATION * MONTHLY_WITHDRAWAL_LIMIT) / 100;
        currentPeriodUsed = currentPeriodWithdrawn;
        paused = isPaused;
    }

    /**
     * @dev Get beneficiary address
     */
    function getBeneficiary() external view returns (address) {
        return beneficiary;
    }
}
