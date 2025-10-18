// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./LTDToken.sol";

/**
 * @title La Tanda DAO - Decentralized Autonomous Organization
 * @dev Governance contract for the La Tanda ecosystem
 * 
 * Features:
 * - Proposal creation and voting
 * - Time-locked execution
 * - Minimum staking requirements for participation
 * - Vote delegation system
 * - Emergency pause functionality
 */
contract LaTandaDAO is Ownable, ReentrancyGuard, Pausable {
    
    LTDToken public immutable ltdToken;
    
    // DAO Configuration
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint256 public constant PROPOSAL_THRESHOLD = 10000 * 10**18; // 10,000 LTD to create proposal
    uint256 public constant QUORUM_PERCENTAGE = 10; // 10% of total staked tokens
    
    // Proposal states
    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Queued,
        Executed,
        Cancelled
    }
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        bytes32 ipfsHash; // For detailed proposal documents
        
        uint256 startTime;
        uint256 endTime;
        uint256 executionTime;
        
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        
        bool executed;
        bool cancelled;
        
        // Execution parameters
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
    }
    
    // Vote tracking
    struct Vote {
        bool hasVoted;
        uint8 support; // 0=against, 1=for, 2=abstain
        uint256 votes;
        string reason;
    }
    
    // Delegation tracking
    struct Delegation {
        address delegate;
        uint256 fromBlock;
    }
    
    // State variables
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(address => Delegation) public delegations;
    mapping(address => uint256) public votingPower;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        string description,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,
        uint256 votes,
        string reason
    );
    
    event ProposalQueued(uint256 indexed proposalId, uint256 executionTime);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event VotingPowerUpdated(address indexed user, uint256 newPower);
    
    /**
     * @dev Constructor
     */
    constructor(address _ltdToken) {
        ltdToken = LTDToken(payable(_ltdToken));
    }
    
    /**
     * @dev Create a new proposal
     */
    function createProposal(
        string memory title,
        string memory description,
        bytes32 ipfsHash,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(ltdToken.getStakingPower(msg.sender) >= PROPOSAL_THRESHOLD, "Insufficient staking power");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(targets.length == values.length && values.length == calldatas.length, "Array length mismatch");
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + VOTING_PERIOD;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            ipfsHash: ipfsHash,
            startTime: startTime,
            endTime: endTime,
            executionTime: 0,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            executed: false,
            cancelled: false,
            targets: targets,
            values: values,
            calldatas: calldatas
        });
        
        emit ProposalCreated(proposalId, msg.sender, title, description, startTime, endTime);
        
        return proposalId;
    }
    
    /**
     * @dev Cast a vote on a proposal
     */
    function castVote(
        uint256 proposalId,
        uint8 support,
        string memory reason
    ) external nonReentrant whenNotPaused {
        _castVote(proposalId, msg.sender, support, reason);
    }
    
    /**
     * @dev Cast vote by signature (for gasless voting)
     */
    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        string memory reason,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant whenNotPaused {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("LaTandaDAO")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Vote(uint256 proposalId,uint8 support,string reason)"),
                proposalId,
                support,
                keccak256(bytes(reason))
            )
        );
        
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        address signer = ecrecover(digest, v, r, s);
        
        require(signer != address(0), "Invalid signature");
        _castVote(proposalId, signer, support, reason);
    }
    
    /**
     * @dev Internal vote casting logic
     */
    function _castVote(
        uint256 proposalId,
        address voter,
        uint8 support,
        string memory reason
    ) internal {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");
        require(support <= 2, "Invalid support value");
        
        Proposal storage proposal = proposals[proposalId];
        require(getProposalState(proposalId) == ProposalState.Active, "Proposal not active");
        require(!votes[proposalId][voter].hasVoted, "Already voted");
        
        uint256 voterPower = getVotingPower(voter);
        require(voterPower > 0, "No voting power");
        
        votes[proposalId][voter] = Vote({
            hasVoted: true,
            support: support,
            votes: voterPower,
            reason: reason
        });
        
        if (support == 0) {
            proposal.againstVotes += voterPower;
        } else if (support == 1) {
            proposal.forVotes += voterPower;
        } else {
            proposal.abstainVotes += voterPower;
        }
        
        emit VoteCast(proposalId, voter, support, voterPower, reason);
    }
    
    /**
     * @dev Queue a successful proposal for execution
     */
    function queueProposal(uint256 proposalId) external nonReentrant {
        require(getProposalState(proposalId) == ProposalState.Succeeded, "Proposal not succeeded");
        
        Proposal storage proposal = proposals[proposalId];
        proposal.executionTime = block.timestamp + EXECUTION_DELAY;
        
        emit ProposalQueued(proposalId, proposal.executionTime);
    }
    
    /**
     * @dev Execute a queued proposal
     */
    function executeProposal(uint256 proposalId) external payable nonReentrant {
        require(getProposalState(proposalId) == ProposalState.Queued, "Proposal not queued");
        
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.executionTime, "Execution time not reached");
        
        proposal.executed = true;
        
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success,) = proposal.targets[i].call{value: proposal.values[i]}(proposal.calldatas[i]);
            require(success, "Execution failed");
        }
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Cancel a proposal (only by proposer or governance)
     */
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || 
            msg.sender == owner() ||
            ltdToken.getStakingPower(proposal.proposer) < PROPOSAL_THRESHOLD,
            "Not authorized to cancel"
        );
        
        ProposalState state = getProposalState(proposalId);
        require(
            state == ProposalState.Pending || 
            state == ProposalState.Active || 
            state == ProposalState.Queued,
            "Cannot cancel proposal"
        );
        
        proposal.cancelled = true;
        emit ProposalCancelled(proposalId);
    }
    
    /**
     * @dev Delegate voting power to another address
     */
    function delegate(address delegatee) external {
        address currentDelegate = delegations[msg.sender].delegate;
        delegations[msg.sender] = Delegation({
            delegate: delegatee,
            fromBlock: block.number
        });
        
        emit DelegateChanged(msg.sender, currentDelegate, delegatee);
        _updateVotingPower(msg.sender);
        _updateVotingPower(delegatee);
        if (currentDelegate != address(0)) {
            _updateVotingPower(currentDelegate);
        }
    }
    
    /**
     * @dev Update voting power for an address
     */
    function updateVotingPower(address user) external {
        _updateVotingPower(user);
    }
    
    /**
     * @dev Internal function to update voting power
     */
    function _updateVotingPower(address user) internal {
        uint256 newPower = ltdToken.getStakingPower(user);
        
        // Add delegated power
        // Note: This is a simplified implementation
        // In production, you'd want to track delegations more efficiently
        
        votingPower[user] = newPower;
        emit VotingPowerUpdated(user, newPower);
    }
    
    /**
     * @dev Get the current state of a proposal
     */
    function getProposalState(uint256 proposalId) public view returns (ProposalState) {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.cancelled) {
            return ProposalState.Cancelled;
        }
        
        if (proposal.executed) {
            return ProposalState.Executed;
        }
        
        if (block.timestamp < proposal.startTime) {
            return ProposalState.Pending;
        }
        
        if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        }
        
        if (proposal.forVotes <= proposal.againstVotes || !_quorumReached(proposalId)) {
            return ProposalState.Defeated;
        }
        
        if (proposal.executionTime == 0) {
            return ProposalState.Succeeded;
        }
        
        return ProposalState.Queued;
    }
    
    /**
     * @dev Check if quorum is reached for a proposal
     */
    function _quorumReached(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalStaked = ltdToken.balanceOf(address(ltdToken)); // Approximate total staked
        
        return totalVotes >= (totalStaked * QUORUM_PERCENTAGE) / 100;
    }
    
    /**
     * @dev Get voting power of an address (including delegations)
     */
    function getVotingPower(address user) public view returns (uint256) {
        // In a simplified implementation, return direct staking power
        // In production, this would include delegated power
        return ltdToken.getStakingPower(user);
    }
    
    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        ProposalState state
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            getProposalState(proposalId)
        );
    }
    
    /**
     * @dev Get vote details for a user on a proposal
     */
    function getVoteDetails(uint256 proposalId, address voter) external view returns (
        bool hasVoted,
        uint8 support,
        uint256 voteAmount,
        string memory reason
    ) {
        Vote storage vote = votes[proposalId][voter];
        return (vote.hasVoted, vote.support, vote.votes, vote.reason);
    }
    
    /**
     * @dev Emergency pause function
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause function
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Update governance parameters (through governance)
     */
    function updateParameters(
        uint256 newProposalThreshold,
        uint256 newQuorumPercentage
    ) external onlyOwner {
        require(newQuorumPercentage <= 50, "Quorum too high");
        // Update parameters
        // Note: In production, these would be stored as state variables
    }
    
    /**
     * @dev Receive ETH for proposal execution
     */
    receive() external payable {}
    
    /**
     * @dev Withdraw ETH (governance function)
     */
    function withdrawETH(uint256 amount) external onlyOwner {
        payable(owner()).transfer(amount);
    }
}