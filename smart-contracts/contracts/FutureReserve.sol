// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FutureReserve
 * @dev Governance-controlled reserve contract for La Tanda's 5% Future Reserve (50M LTD)
 *
 * Features:
 * - DAO governance required for any deployment
 * - 7-day timelock on all proposals
 * - Transparent on-chain proposal system
 * - Multi-purpose allocation (new features, emergencies, strategic partnerships)
 * - Immutable audit trail
 *
 * Tokenomics V2.0 Specification (2025-10-16)
 */
contract FutureReserve is Ownable, ReentrancyGuard {

    IERC20 public immutable ltdToken;
    address public daoGovernance; // Address of DAO governance contract

    uint256 public constant TOTAL_RESERVE = 50_000_000 * 10**18; // 50M LTD (5% of total supply)
    uint256 public constant TIMELOCK_DURATION = 7 days; // 7-day timelock
    uint256 public constant MIN_PROPOSAL_DURATION = 3 days; // Minimum voting period

    uint256 public totalAllocated;
    uint256 public proposalCount;

    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        address recipient;
        uint256 amount;
        string purpose;
        string category; // "new_feature", "emergency", "partnership", "marketing", etc.
        uint256 createdAt;
        uint256 executionTime; // When proposal can be executed (createdAt + timelock)
        ProposalStatus status;
        bool daoApproved; // Requires DAO vote approval
    }

    enum ProposalStatus {
        Pending,
        Approved,
        Executed,
        Cancelled,
        Rejected
    }

    mapping(uint256 => Proposal) public proposals;

    // Events
    event ProposalCreated(uint256 indexed proposalId, address indexed recipient, uint256 amount, string purpose);
    event ProposalApproved(uint256 indexed proposalId, uint256 executionTime);
    event ProposalExecuted(uint256 indexed proposalId, address indexed recipient, uint256 amount);
    event ProposalCancelled(uint256 indexed proposalId, string reason);
    event DAOGovernanceUpdated(address indexed oldDAO, address indexed newDAO);
    event EmergencyWithdrawal(address indexed owner, uint256 amount, string reason);

    /**
     * @dev Constructor
     * @param _ltdToken Address of LTD token contract
     */
    constructor(address _ltdToken) {
        require(_ltdToken != address(0), "Invalid token address");
        ltdToken = IERC20(_ltdToken);
    }

    /**
     * @dev Set DAO governance contract address (only owner, only once)
     * @param _daoGovernance Address of DAO governance contract
     */
    function setDAOGovernance(address _daoGovernance) external onlyOwner {
        require(_daoGovernance != address(0), "Invalid DAO address");
        require(daoGovernance == address(0), "DAO already set");

        address oldDAO = daoGovernance;
        daoGovernance = _daoGovernance;

        emit DAOGovernanceUpdated(oldDAO, _daoGovernance);
    }

    /**
     * @dev Create a new allocation proposal
     * @param recipient Address to receive tokens
     * @param amount Amount of LTD tokens to allocate
     * @param purpose Description of allocation purpose
     * @param category Category of allocation
     */
    function createProposal(
        address recipient,
        uint256 amount,
        string memory purpose,
        string memory category
    ) external onlyOwner returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(totalAllocated + amount <= TOTAL_RESERVE, "Exceeds total reserve");
        require(bytes(purpose).length > 0, "Purpose required");

        proposalCount++;
        uint256 proposalId = proposalCount;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            recipient: recipient,
            amount: amount,
            purpose: purpose,
            category: category,
            createdAt: block.timestamp,
            executionTime: 0,
            status: ProposalStatus.Pending,
            daoApproved: false
        });

        emit ProposalCreated(proposalId, recipient, amount, purpose);

        return proposalId;
    }

    /**
     * @dev Approve proposal (requires DAO governance call)
     * @param proposalId ID of the proposal
     */
    function approveProposal(uint256 proposalId) external {
        require(msg.sender == daoGovernance, "Only DAO can approve");
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Pending, "Proposal not pending");

        proposal.status = ProposalStatus.Approved;
        proposal.daoApproved = true;
        proposal.executionTime = block.timestamp + TIMELOCK_DURATION;

        emit ProposalApproved(proposalId, proposal.executionTime);
    }

    /**
     * @dev Execute approved proposal after timelock
     * @param proposalId ID of the proposal
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");

        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Approved, "Proposal not approved");
        require(proposal.daoApproved, "DAO approval required");
        require(block.timestamp >= proposal.executionTime, "Timelock not expired");

        // Mark as executed before transfer (reentrancy protection)
        proposal.status = ProposalStatus.Executed;
        totalAllocated += proposal.amount;

        // Transfer tokens
        require(ltdToken.transfer(proposal.recipient, proposal.amount), "Token transfer failed");

        emit ProposalExecuted(proposalId, proposal.recipient, proposal.amount);
    }

    /**
     * @dev Cancel a pending proposal
     * @param proposalId ID of the proposal
     * @param reason Reason for cancellation
     */
    function cancelProposal(uint256 proposalId, string memory reason) external onlyOwner {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");

        Proposal storage proposal = proposals[proposalId];
        require(
            proposal.status == ProposalStatus.Pending || proposal.status == ProposalStatus.Approved,
            "Cannot cancel executed proposal"
        );

        proposal.status = ProposalStatus.Cancelled;

        emit ProposalCancelled(proposalId, reason);
    }

    /**
     * @dev Emergency withdrawal (only owner, for critical situations)
     * @param amount Amount to withdraw
     * @param reason Reason for emergency withdrawal
     */
    function emergencyWithdraw(uint256 amount, string memory reason) external onlyOwner {
        require(amount > 0 && amount <= ltdToken.balanceOf(address(this)), "Invalid amount");
        require(bytes(reason).length > 0, "Reason required");

        require(ltdToken.transfer(owner(), amount), "Emergency withdrawal failed");

        emit EmergencyWithdrawal(owner(), amount, reason);
    }

    /**
     * @dev Get proposal details
     * @param proposalId ID of the proposal
     */
    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        address recipient,
        uint256 amount,
        string memory purpose,
        string memory category,
        uint256 createdAt,
        uint256 executionTime,
        ProposalStatus status,
        bool daoApproved
    ) {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");

        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.recipient,
            proposal.amount,
            proposal.purpose,
            proposal.category,
            proposal.createdAt,
            proposal.executionTime,
            proposal.status,
            proposal.daoApproved
        );
    }

    /**
     * @dev Get reserve status
     */
    function getReserveStatus() external view returns (
        uint256 totalReserve,
        uint256 allocated,
        uint256 remaining,
        uint256 contractBalance,
        uint256 totalProposals,
        address dao
    ) {
        totalReserve = TOTAL_RESERVE;
        allocated = totalAllocated;
        remaining = TOTAL_RESERVE - totalAllocated;
        contractBalance = ltdToken.balanceOf(address(this));
        totalProposals = proposalCount;
        dao = daoGovernance;
    }

    /**
     * @dev Check if proposal is executable
     * @param proposalId ID of the proposal
     */
    function isProposalExecutable(uint256 proposalId) external view returns (bool) {
        if (proposalId > proposalCount || proposalId == 0) {
            return false;
        }

        Proposal storage proposal = proposals[proposalId];
        return proposal.status == ProposalStatus.Approved &&
               proposal.daoApproved &&
               block.timestamp >= proposal.executionTime;
    }
}
