// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./LTDToken.sol";

/**
 * @title Group Manager - Smart Contract for La Tanda Groups
 * @dev Manages tanda groups, contributions, and payouts on-chain
 * 
 * Features:
 * - Create and manage tanda groups
 * - Handle contributions and automated payouts
 * - Reputation system for coordinators
 * - Emergency freezing for defaulted coordinators
 * - Transparent fund management
 */
contract GroupManager is Ownable, ReentrancyGuard, Pausable {
    
    LTDToken public immutable ltdToken;
    
    // Group states
    enum GroupState {
        Active,
        Completed,
        Cancelled,
        Frozen
    }
    
    // Member states
    enum MemberState {
        Active,
        Defaulted,
        Completed,
        Removed
    }
    
    // Group structure
    struct Group {
        uint256 id;
        string name;
        address coordinator;
        
        uint256 contributionAmount;
        uint256 maxMembers;
        uint256 currentMembers;
        uint256 frequency; // in seconds (e.g., 30 days = 2592000)
        
        uint256 currentRound;
        uint256 totalRounds;
        uint256 startTime;
        uint256 nextPayoutTime;
        
        uint256 totalContributions;
        uint256 totalPayouts;
        
        GroupState state;
        bool isPrivate;
        string description;
        
        address[] members;
        mapping(address => MemberState) memberStates;
        mapping(address => uint256) memberContributions;
        mapping(uint256 => address) roundRecipients; // round number => recipient
        mapping(uint256 => bool) roundCompleted;
    }
    
    // Coordinator reputation
    struct CoordinatorReputation {
        uint256 groupsCreated;
        uint256 groupsCompleted;
        uint256 totalMembers;
        uint256 defaultCount;
        uint256 reputationScore; // 0-1000
        bool isFrozen;
        uint256 freezeTime;
    }
    
    // State variables
    uint256 public groupCount;
    mapping(uint256 => Group) public groups;
    mapping(address => CoordinatorReputation) public coordinatorReputations;
    mapping(address => uint256[]) public userGroups;
    
    // Configuration
    uint256 public constant MIN_CONTRIBUTION = 100 * 10**18; // 100 LTD minimum
    uint256 public constant MAX_MEMBERS = 50; // Maximum members per group
    uint256 public constant COORDINATOR_FREEZE_DURATION = 30 days;
    uint256 public coordinatorFee = 2; // 2% fee for coordinators
    uint256 public platformFee = 1; // 1% platform fee
    
    // Events
    event GroupCreated(
        uint256 indexed groupId,
        address indexed coordinator,
        string name,
        uint256 contributionAmount,
        uint256 maxMembers
    );
    
    event MemberJoined(uint256 indexed groupId, address indexed member);
    event MemberLeft(uint256 indexed groupId, address indexed member);
    event ContributionMade(uint256 indexed groupId, address indexed member, uint256 amount);
    event PayoutDistributed(uint256 indexed groupId, uint256 round, address indexed recipient, uint256 amount);
    event GroupCompleted(uint256 indexed groupId);
    event GroupCancelled(uint256 indexed groupId, string reason);
    event CoordinatorFrozen(address indexed coordinator, string reason);
    event EmergencyWithdrawal(uint256 indexed groupId, address indexed member, uint256 amount);
    
    /**
     * @dev Constructor
     */
    constructor(address _ltdToken) {
        ltdToken = LTDToken(payable(_ltdToken));
    }
    
    /**
     * @dev Create a new tanda group
     */
    function createGroup(
        string memory name,
        uint256 contributionAmount,
        uint256 maxMembers,
        uint256 frequency,
        bool isPrivate,
        string memory description
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(bytes(name).length > 0, "Group name cannot be empty");
        require(contributionAmount >= MIN_CONTRIBUTION, "Contribution too low");
        require(maxMembers >= 2 && maxMembers <= MAX_MEMBERS, "Invalid member count");
        require(frequency >= 7 days, "Frequency too short");
        require(!coordinatorReputations[msg.sender].isFrozen, "Coordinator is frozen");
        
        groupCount++;
        uint256 groupId = groupCount;
        
        Group storage group = groups[groupId];
        group.id = groupId;
        group.name = name;
        group.coordinator = msg.sender;
        group.contributionAmount = contributionAmount;
        group.maxMembers = maxMembers;
        group.frequency = frequency;
        group.state = GroupState.Active;
        group.isPrivate = isPrivate;
        group.description = description;
        group.totalRounds = maxMembers;
        
        // Add coordinator as first member
        group.members.push(msg.sender);
        group.memberStates[msg.sender] = MemberState.Active;
        group.currentMembers = 1;
        
        // Update coordinator reputation
        coordinatorReputations[msg.sender].groupsCreated++;
        
        // Add to user groups
        userGroups[msg.sender].push(groupId);
        
        emit GroupCreated(groupId, msg.sender, name, contributionAmount, maxMembers);
        emit MemberJoined(groupId, msg.sender);
        
        return groupId;
    }
    
    /**
     * @dev Join an existing group
     */
    function joinGroup(uint256 groupId) external nonReentrant whenNotPaused {
        require(groupId <= groupCount && groupId > 0, "Invalid group ID");
        
        Group storage group = groups[groupId];
        require(group.state == GroupState.Active, "Group not active");
        require(group.currentMembers < group.maxMembers, "Group is full");
        require(group.memberStates[msg.sender] == MemberState(0), "Already a member"); // Default state is 0
        
        // Check if group has started (first contribution made)
        if (group.startTime > 0) {
            revert("Group already started");
        }
        
        group.members.push(msg.sender);
        group.memberStates[msg.sender] = MemberState.Active;
        group.currentMembers++;
        
        userGroups[msg.sender].push(groupId);
        
        emit MemberJoined(groupId, msg.sender);
    }
    
    /**
     * @dev Leave a group (before it starts)
     */
    function leaveGroup(uint256 groupId) external nonReentrant {
        Group storage group = groups[groupId];
        require(group.memberStates[msg.sender] == MemberState.Active, "Not an active member");
        require(group.startTime == 0, "Group already started");
        require(msg.sender != group.coordinator, "Coordinator cannot leave");
        
        group.memberStates[msg.sender] = MemberState.Removed;
        group.currentMembers--;
        
        // Remove from members array
        for (uint256 i = 0; i < group.members.length; i++) {
            if (group.members[i] == msg.sender) {
                group.members[i] = group.members[group.members.length - 1];
                group.members.pop();
                break;
            }
        }
        
        emit MemberLeft(groupId, msg.sender);
    }
    
    /**
     * @dev Start the group and first contribution round
     */
    function startGroup(uint256 groupId) external nonReentrant {
        Group storage group = groups[groupId];
        require(msg.sender == group.coordinator, "Only coordinator can start");
        require(group.currentMembers == group.maxMembers, "Group not full");
        require(group.startTime == 0, "Group already started");
        
        group.startTime = block.timestamp;
        group.nextPayoutTime = block.timestamp + group.frequency;
        group.currentRound = 1;
        
        // Determine round order (could be random or based on contribution order)
        _assignRoundOrder(groupId);
    }
    
    /**
     * @dev Make a contribution to the group
     */
    function makeContribution(uint256 groupId) external nonReentrant whenNotPaused {
        Group storage group = groups[groupId];
        require(group.memberStates[msg.sender] == MemberState.Active, "Not an active member");
        require(group.state == GroupState.Active, "Group not active");
        require(group.startTime > 0, "Group not started");
        
        uint256 contributionAmount = group.contributionAmount;
        require(ltdToken.balanceOf(msg.sender) >= contributionAmount, "Insufficient balance");
        
        // Transfer tokens to contract
        require(ltdToken.transferFrom(msg.sender, address(this), contributionAmount), "Transfer failed");
        
        group.memberContributions[msg.sender] += contributionAmount;
        group.totalContributions += contributionAmount;
        
        emit ContributionMade(groupId, msg.sender, contributionAmount);
        
        // Check if round is complete and process payout
        if (_isRoundComplete(groupId)) {
            _processRoundPayout(groupId);
        }
    }
    
    /**
     * @dev Process payout for completed round
     */
    function _processRoundPayout(uint256 groupId) internal {
        Group storage group = groups[groupId];
        
        address recipient = group.roundRecipients[group.currentRound];
        require(recipient != address(0), "No recipient for round");
        
        uint256 totalPayout = group.contributionAmount * group.currentMembers;
        uint256 coordinatorFeeAmount = (totalPayout * coordinatorFee) / 100;
        uint256 platformFeeAmount = (totalPayout * platformFee) / 100;
        uint256 recipientAmount = totalPayout - coordinatorFeeAmount - platformFeeAmount;
        
        // Transfer funds
        require(ltdToken.transfer(recipient, recipientAmount), "Recipient transfer failed");
        require(ltdToken.transfer(group.coordinator, coordinatorFeeAmount), "Coordinator fee transfer failed");
        require(ltdToken.transfer(owner(), platformFeeAmount), "Platform fee transfer failed");
        
        group.totalPayouts += totalPayout;
        group.roundCompleted[group.currentRound] = true;
        
        emit PayoutDistributed(groupId, group.currentRound, recipient, recipientAmount);
        
        // Move to next round or complete group
        if (group.currentRound >= group.totalRounds) {
            _completeGroup(groupId);
        } else {
            group.currentRound++;
            group.nextPayoutTime = block.timestamp + group.frequency;
        }
    }
    
    /**
     * @dev Complete a group
     */
    function _completeGroup(uint256 groupId) internal {
        Group storage group = groups[groupId];
        group.state = GroupState.Completed;
        
        // Update coordinator reputation
        coordinatorReputations[group.coordinator].groupsCompleted++;
        coordinatorReputations[group.coordinator].totalMembers += group.currentMembers;
        _updateCoordinatorReputation(group.coordinator);
        
        emit GroupCompleted(groupId);
    }
    
    /**
     * @dev Check if current round is complete
     */
    function _isRoundComplete(uint256 groupId) internal view returns (bool) {
        Group storage group = groups[groupId];
        
        uint256 expectedTotal = group.contributionAmount * group.currentMembers;
        uint256 currentRoundContributions = 0;
        
        // Count contributions for current round
        for (uint256 i = 0; i < group.members.length; i++) {
            address member = group.members[i];
            if (group.memberStates[member] == MemberState.Active) {
                // This is simplified - in practice you'd track round-specific contributions
                currentRoundContributions += group.contributionAmount;
            }
        }
        
        return currentRoundContributions >= expectedTotal;
    }
    
    /**
     * @dev Assign round order (simplified random assignment)
     */
    function _assignRoundOrder(uint256 groupId) internal {
        Group storage group = groups[groupId];
        
        // Simplified assignment - in practice, this could be randomized or based on preferences
        for (uint256 i = 0; i < group.members.length; i++) {
            group.roundRecipients[i + 1] = group.members[i];
        }
    }
    
    /**
     * @dev Handle coordinator default (emergency function)
     */
    function handleCoordinatorDefault(uint256 groupId, string memory reason) external onlyOwner {
        Group storage group = groups[groupId];
        require(group.state == GroupState.Active, "Group not active");
        
        // Freeze coordinator
        coordinatorReputations[group.coordinator].isFrozen = true;
        coordinatorReputations[group.coordinator].freezeTime = block.timestamp;
        coordinatorReputations[group.coordinator].defaultCount++;
        
        // Cancel group and enable emergency withdrawals
        group.state = GroupState.Frozen;
        
        emit CoordinatorFrozen(group.coordinator, reason);
        emit GroupCancelled(groupId, reason);
    }
    
    /**
     * @dev Emergency withdrawal for frozen groups
     */
    function emergencyWithdrawal(uint256 groupId) external nonReentrant {
        Group storage group = groups[groupId];
        require(group.state == GroupState.Frozen, "Group not frozen");
        require(group.memberStates[msg.sender] == MemberState.Active, "Not an active member");
        
        uint256 withdrawalAmount = group.memberContributions[msg.sender];
        require(withdrawalAmount > 0, "No contributions to withdraw");
        
        group.memberContributions[msg.sender] = 0;
        group.memberStates[msg.sender] = MemberState.Removed;
        
        require(ltdToken.transfer(msg.sender, withdrawalAmount), "Withdrawal failed");
        
        emit EmergencyWithdrawal(groupId, msg.sender, withdrawalAmount);
    }
    
    /**
     * @dev Update coordinator reputation score
     */
    function _updateCoordinatorReputation(address coordinator) internal {
        CoordinatorReputation storage rep = coordinatorReputations[coordinator];
        
        if (rep.groupsCreated == 0) {
            rep.reputationScore = 500; // Default score
            return;
        }
        
        uint256 completionRate = (rep.groupsCompleted * 100) / rep.groupsCreated;
        uint256 defaultPenalty = rep.defaultCount * 50;
        
        rep.reputationScore = completionRate * 10; // Max 1000
        if (rep.reputationScore > defaultPenalty) {
            rep.reputationScore -= defaultPenalty;
        } else {
            rep.reputationScore = 0;
        }
        
        if (rep.reputationScore > 1000) {
            rep.reputationScore = 1000;
        }
    }
    
    /**
     * @dev Unfreeze coordinator (after penalty period)
     */
    function unfreezeCoordinator(address coordinator) external onlyOwner {
        CoordinatorReputation storage rep = coordinatorReputations[coordinator];
        require(rep.isFrozen, "Coordinator not frozen");
        require(block.timestamp >= rep.freezeTime + COORDINATOR_FREEZE_DURATION, "Freeze period not over");
        
        rep.isFrozen = false;
        rep.freezeTime = 0;
    }
    
    /**
     * @dev Get group details
     */
    function getGroupDetails(uint256 groupId) external view returns (
        string memory name,
        address coordinator,
        uint256 contributionAmount,
        uint256 maxMembers,
        uint256 currentMembers,
        uint256 currentRound,
        GroupState state
    ) {
        Group storage group = groups[groupId];
        return (
            group.name,
            group.coordinator,
            group.contributionAmount,
            group.maxMembers,
            group.currentMembers,
            group.currentRound,
            group.state
        );
    }
    
    /**
     * @dev Get group members
     */
    function getGroupMembers(uint256 groupId) external view returns (address[] memory) {
        return groups[groupId].members;
    }
    
    /**
     * @dev Get user's groups
     */
    function getUserGroups(address user) external view returns (uint256[] memory) {
        return userGroups[user];
    }
    
    /**
     * @dev Get coordinator reputation
     */
    function getCoordinatorReputation(address coordinator) external view returns (
        uint256 groupsCreated,
        uint256 groupsCompleted,
        uint256 reputationScore,
        bool isFrozen
    ) {
        CoordinatorReputation storage rep = coordinatorReputations[coordinator];
        return (rep.groupsCreated, rep.groupsCompleted, rep.reputationScore, rep.isFrozen);
    }
    
    /**
     * @dev Update platform fees (governance function)
     */
    function updateFees(uint256 newCoordinatorFee, uint256 newPlatformFee) external onlyOwner {
        require(newCoordinatorFee + newPlatformFee <= 10, "Total fees too high");
        coordinatorFee = newCoordinatorFee;
        platformFee = newPlatformFee;
    }
    
    /**
     * @dev Pause contract
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
}