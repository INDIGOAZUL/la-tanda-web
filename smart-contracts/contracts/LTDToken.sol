// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title LTD Token - La Tanda Digital Token
 * @dev ERC20 token for the La Tanda cooperative financial ecosystem
 * 
 * Features:
 * - Fixed total supply of 1,000,000,000 LTD tokens
 * - Burn mechanism for deflationary economics
 * - Pause functionality for emergency situations
 * - Role-based access control
 * - Reward distribution system
 * - Governance token capabilities
 */
contract LTDToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    
    // Token distribution constants - TOKENOMICS V2.0 OPTIMIZED (2025-10-16)
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant PARTICIPATION_RESERVE = 200_000_000 * 10**18; // 20% (reduced from 35%)
    uint256 public constant STAKING_GOVERNANCE_RESERVE = 300_000_000 * 10**18; // 30% (maintained)
    uint256 public constant DEVELOPMENT_MARKETING_RESERVE = 250_000_000 * 10**18; // 25% (increased from 20%)
    uint256 public constant LIQUIDITY_RESERVE = 100_000_000 * 10**18; // 10% (reduced from 15%)
    uint256 public constant ROYAL_OWNERSHIP_RESERVE = 100_000_000 * 10**18; // 10% (new - founder allocation)
    uint256 public constant FUTURE_RESERVE = 50_000_000 * 10**18; // 5% (new - strategic flexibility)
    
    // Reward rates (per action) - V2.0 ADJUSTED (reduced ~40% for sustainability)
    uint256 public participationReward = 30 * 10**18; // 30 LTD for early participation (reduced from 50)
    uint256 public activityReward = 15 * 10**18; // 15 LTD for activity (reduced from 25, decreases over time)
    uint256 public appUsageReward = 12 * 10**17; // 1.2 LTD per check-in every 48h (reduced from 2.0)
    uint256 public governanceReward = 3 * 10**18; // 3 LTD for governance participation (reduced from 5)
    
    // Burn configuration
    uint256 public burnRate = 10; // 0.1% (10 basis points)
    uint256 public constant BURN_RATE_BASE = 10000; // 100%
    
    // Staking requirements
    uint256 public governanceStakingRequirement = 1000 * 10**18; // 1000 LTD minimum for governance
    
    // Distribution tracking
    uint256 public participationDistributed;
    uint256 public stakingGovernanceDistributed;
    uint256 public developmentMarketingDistributed;
    uint256 public liquidityDistributed;
    uint256 public royalOwnershipDistributed; // V2.0: tracks founder allocation
    uint256 public futureReserveDistributed; // V2.0: tracks strategic reserve usage
    
    // User tracking
    mapping(address => uint256) public lastCheckIn;
    mapping(address => uint256) public stakedBalance;
    mapping(address => bool) public isGovernanceEligible;
    mapping(address => uint256) public totalRewardsEarned;
    
    // Events
    event RewardDistributed(address indexed user, uint256 amount, string rewardType);
    event TokensBurned(uint256 amount, string reason);
    event StakingDeposit(address indexed user, uint256 amount);
    event StakingWithdrawal(address indexed user, uint256 amount);
    event GovernanceEligibilityChanged(address indexed user, bool eligible);
    event RewardRatesUpdated(uint256 participation, uint256 activity, uint256 appUsage, uint256 governance);
    
    /**
     * @dev Constructor initializes the LTD token with initial distribution
     * @notice V2.0: Updated to include Royal Ownership and Future Reserve allocations
     */
    constructor() ERC20("La Tanda Digital", "LTD") {
        // Mint total supply to contract for controlled distribution
        _mint(address(this), TOTAL_SUPPLY);

        // Initial distribution to owner for liquidity, development, and Royal Ownership
        // Note: Royal Ownership should be transferred to RoyalOwnershipVesting contract after deployment
        // Note: Future Reserve stays in contract for DAO-controlled deployment
        _transfer(address(this), owner(), DEVELOPMENT_MARKETING_RESERVE + LIQUIDITY_RESERVE);

        developmentMarketingDistributed = DEVELOPMENT_MARKETING_RESERVE;
        liquidityDistributed = LIQUIDITY_RESERVE;
        // Royal Ownership and Future Reserve remain in contract for later allocation

        emit Transfer(address(0), address(this), TOTAL_SUPPLY);
    }
    
    /**
     * @dev Distribute participation rewards to early adopters
     */
    function distributeParticipationReward(address user) external onlyOwner nonReentrant {
        require(user != address(0), "Invalid user address");
        require(participationDistributed + participationReward <= PARTICIPATION_RESERVE, "Participation reserve exceeded");
        
        _transfer(address(this), user, participationReward);
        participationDistributed += participationReward;
        totalRewardsEarned[user] += participationReward;
        
        emit RewardDistributed(user, participationReward, "participation");
    }
    
    /**
     * @dev Distribute activity rewards with decreasing amounts over time
     */
    function distributeActivityReward(address user) external onlyOwner nonReentrant {
        require(user != address(0), "Invalid user address");
        require(participationDistributed + activityReward <= PARTICIPATION_RESERVE, "Participation reserve exceeded");
        
        // Calculate dynamic reward based on distribution progress
        uint256 distributionProgress = (participationDistributed * 100) / PARTICIPATION_RESERVE;
        uint256 adjustedReward = activityReward;
        
        if (distributionProgress > 50) {
            adjustedReward = activityReward / 2; // Reduce by 50% after 50% distribution
        }
        if (distributionProgress > 80) {
            adjustedReward = activityReward / 4; // Reduce by 75% after 80% distribution
        }
        
        _transfer(address(this), user, adjustedReward);
        participationDistributed += adjustedReward;
        totalRewardsEarned[user] += adjustedReward;
        
        emit RewardDistributed(user, adjustedReward, "activity");
    }
    
    /**
     * @dev Distribute app usage rewards (every 48 hours)
     */
    function distributeAppUsageReward(address user) external onlyOwner nonReentrant {
        require(user != address(0), "Invalid user address");
        require(block.timestamp >= lastCheckIn[user] + 48 hours, "Check-in too frequent");
        require(participationDistributed + appUsageReward <= PARTICIPATION_RESERVE, "Participation reserve exceeded");
        
        _transfer(address(this), user, appUsageReward);
        lastCheckIn[user] = block.timestamp;
        participationDistributed += appUsageReward;
        totalRewardsEarned[user] += appUsageReward;
        
        emit RewardDistributed(user, appUsageReward, "app_usage");
    }
    
    /**
     * @dev Distribute governance rewards for DAO participation
     */
    function distributeGovernanceReward(address user, uint256 amount) external onlyOwner nonReentrant {
        require(user != address(0), "Invalid user address");
        require(isGovernanceEligible[user], "User not eligible for governance rewards");
        require(amount >= 1 * 10**18 && amount <= 5 * 10**18, "Reward amount out of range");
        require(stakingGovernanceDistributed + amount <= STAKING_GOVERNANCE_RESERVE, "Governance reserve exceeded");
        
        _transfer(address(this), user, amount);
        stakingGovernanceDistributed += amount;
        totalRewardsEarned[user] += amount;
        
        emit RewardDistributed(user, amount, "governance");
    }

    /**
     * @dev Calculate tanda reward based on participant count (V2.0)
     * @param participants Number of participants in the tanda group
     * @return Reward amount in LTD tokens
     *
     * Reward Tiers:
     * - 2-5 participants: 30 LTD
     * - 6-10 participants: 60 LTD
     * - 11-15 participants: 75 LTD
     * - 16+ participants: 90 LTD (max)
     */
    function calculateTandaReward(uint256 participants) public pure returns (uint256) {
        if (participants >= 2 && participants <= 5) {
            return 30 * 10**18; // 30 LTD
        } else if (participants >= 6 && participants <= 10) {
            return 60 * 10**18; // 60 LTD
        } else if (participants >= 11 && participants <= 15) {
            return 75 * 10**18; // 75 LTD
        } else if (participants >= 16) {
            return 90 * 10**18; // 90 LTD (maximum)
        }
        return 0; // Invalid participant count (< 2)
    }

    /**
     * @dev Distribute tanda completion reward to group creator/coordinator
     * @param coordinator Address of the tanda coordinator
     * @param participants Number of participants in the completed tanda
     */
    function distributeTandaReward(address coordinator, uint256 participants) external onlyOwner nonReentrant {
        require(coordinator != address(0), "Invalid coordinator address");
        require(participants >= 2, "Minimum 2 participants required");

        uint256 reward = calculateTandaReward(participants);
        require(participationDistributed + reward <= PARTICIPATION_RESERVE, "Participation reserve exceeded");

        _transfer(address(this), coordinator, reward);
        participationDistributed += reward;
        totalRewardsEarned[coordinator] += reward;

        emit RewardDistributed(coordinator, reward, "tanda_completion");
    }

    /**
     * @dev Stake tokens for governance eligibility
     */
    function stakeForGovernance(uint256 amount) external nonReentrant whenNotPaused {
        require(amount >= governanceStakingRequirement, "Insufficient staking amount");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _transfer(msg.sender, address(this), amount);
        stakedBalance[msg.sender] += amount;
        
        if (stakedBalance[msg.sender] >= governanceStakingRequirement) {
            isGovernanceEligible[msg.sender] = true;
            emit GovernanceEligibilityChanged(msg.sender, true);
        }
        
        emit StakingDeposit(msg.sender, amount);
    }
    
    /**
     * @dev Unstake tokens (removes governance eligibility)
     */
    function unstake(uint256 amount) external nonReentrant whenNotPaused {
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");
        
        stakedBalance[msg.sender] -= amount;
        _transfer(address(this), msg.sender, amount);
        
        if (stakedBalance[msg.sender] < governanceStakingRequirement) {
            isGovernanceEligible[msg.sender] = false;
            emit GovernanceEligibilityChanged(msg.sender, false);
        }
        
        emit StakingWithdrawal(msg.sender, amount);
    }
    
    /**
     * @dev Burn tokens from transactions (0.1% burn rate)
     */
    function burnFromTransaction(uint256 transactionAmount) external onlyOwner {
        uint256 burnAmount = (transactionAmount * burnRate) / BURN_RATE_BASE;
        if (burnAmount > 0 && balanceOf(address(this)) >= burnAmount) {
            _burn(address(this), burnAmount);
            emit TokensBurned(burnAmount, "transaction_burn");
        }
    }
    
    /**
     * @dev Emergency burn function for deflationary measures
     */
    function emergencyBurn(uint256 amount) external onlyOwner {
        require(balanceOf(address(this)) >= amount, "Insufficient contract balance");
        _burn(address(this), amount);
        emit TokensBurned(amount, "emergency_burn");
    }
    
    /**
     * @dev Update reward rates (governance function)
     */
    function updateRewardRates(
        uint256 _participationReward,
        uint256 _activityReward,
        uint256 _appUsageReward,
        uint256 _governanceReward
    ) external onlyOwner {
        participationReward = _participationReward;
        activityReward = _activityReward;
        appUsageReward = _appUsageReward;
        governanceReward = _governanceReward;
        
        emit RewardRatesUpdated(_participationReward, _activityReward, _appUsageReward, _governanceReward);
    }
    
    /**
     * @dev Update burn rate (governance function)
     */
    function updateBurnRate(uint256 newBurnRate) external onlyOwner {
        require(newBurnRate <= 100, "Burn rate too high"); // Max 1%
        burnRate = newBurnRate;
    }
    
    /**
     * @dev Update governance staking requirement
     */
    function updateGovernanceStakingRequirement(uint256 newRequirement) external onlyOwner {
        governanceStakingRequirement = newRequirement;
    }
    
    /**
     * @dev Pause contract (emergency function)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get user's total staking power
     */
    function getStakingPower(address user) external view returns (uint256) {
        return stakedBalance[user];
    }
    
    /**
     * @dev Get contract's token distribution status (V2.0 updated)
     */
    function getDistributionStatus() external view returns (
        uint256 totalDistributed,
        uint256 participationRemaining,
        uint256 stakingGovernanceRemaining,
        uint256 royalOwnershipRemaining,
        uint256 futureReserveRemaining,
        uint256 contractBalance
    ) {
        totalDistributed = participationDistributed + stakingGovernanceDistributed +
                          developmentMarketingDistributed + liquidityDistributed +
                          royalOwnershipDistributed + futureReserveDistributed;
        participationRemaining = PARTICIPATION_RESERVE - participationDistributed;
        stakingGovernanceRemaining = STAKING_GOVERNANCE_RESERVE - stakingGovernanceDistributed;
        royalOwnershipRemaining = ROYAL_OWNERSHIP_RESERVE - royalOwnershipDistributed;
        futureReserveRemaining = FUTURE_RESERVE - futureReserveDistributed;
        contractBalance = balanceOf(address(this));
    }
    
    /**
     * @dev Get user's reward summary
     */
    function getUserRewardSummary(address user) external view returns (
        uint256 totalEarned,
        uint256 currentBalance,
        uint256 staked,
        bool governanceEligible,
        uint256 lastCheckInTime
    ) {
        totalEarned = totalRewardsEarned[user];
        currentBalance = balanceOf(user);
        staked = stakedBalance[user];
        governanceEligible = isGovernanceEligible[user];
        lastCheckInTime = lastCheckIn[user];
    }
    
    /**
     * @dev Check if user can receive app usage reward
     */
    function canReceiveAppUsageReward(address user) external view returns (bool) {
        return block.timestamp >= lastCheckIn[user] + 48 hours;
    }
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Withdraw any mistakenly sent tokens (not LTD)
     */
    function withdrawMistakenTokens(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(this), "Cannot withdraw LTD tokens");
        IERC20(tokenAddress).transfer(owner(), amount);
    }
    
    /**
     * @dev Withdraw ETH from contract (if any)
     */
    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Accept ETH deposits for contract operations
     */
    receive() external payable {}
}