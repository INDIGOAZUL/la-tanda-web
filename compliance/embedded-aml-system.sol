// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Embedded AML/KYC Compliance System for La Tanda
 * @dev Compliance-by-design architecture addressing regulatory requirements
 * 
 * Key Features:
 * - Real-time transaction monitoring
 * - Automated suspicious activity detection
 * - Regulatory reporting capabilities
 * - Privacy-preserving compliance verification
 */
contract EmbeddedAMLSystem is Ownable, ReentrancyGuard, Pausable {
    
    // Compliance levels for different user tiers
    enum ComplianceLevel {
        UNVERIFIED,     // 0 - No verification
        BASIC_KYC,      // 1 - Basic identity verification
        ENHANCED_KYC,   // 2 - Enhanced due diligence
        INSTITUTIONAL   // 3 - Institutional verification
    }
    
    // Risk assessment categories
    enum RiskCategory {
        LOW,            // 0 - Low risk user/transaction
        MEDIUM,         // 1 - Medium risk requiring monitoring
        HIGH,           // 2 - High risk requiring approval
        PROHIBITED      // 3 - Blocked from platform
    }
    
    // Transaction monitoring flags
    enum MonitoringFlag {
        NONE,              // 0 - No flags
        VELOCITY_CHECK,    // 1 - High transaction velocity
        AMOUNT_THRESHOLD,  // 2 - Large amount transaction
        PATTERN_ANOMALY,   // 3 - Unusual transaction pattern
        GEOGRAPHIC_RISK,   // 4 - High-risk jurisdiction
        SANCTIONS_CHECK    // 5 - Sanctions screening required
    }
    
    // User compliance profile
    struct ComplianceProfile {
        ComplianceLevel level;
        RiskCategory riskCategory;
        uint256 kycTimestamp;
        uint256 lastVerification;
        bytes32 documentHash;      // Hash of KYC documents
        bool sanctionsChecked;
        uint256 totalTransactionVolume;
        uint256 monthlyTransactionCount;
        string jurisdictionCode;   // ISO country code
    }
    
    // Transaction monitoring record
    struct TransactionRecord {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        MonitoringFlag flag;
        bool approved;
        bool reported;
        bytes32 transactionHash;
    }
    
    // Suspicious Activity Report
    struct SARRecord {
        uint256 id;
        address subject;
        uint256 timestamp;
        string suspiciousActivity;
        uint256[] relatedTransactions;
        bool filed;
        address reporter;
    }
    
    // Storage
    mapping(address => ComplianceProfile) public userCompliance;
    mapping(bytes32 => TransactionRecord) public transactions;
    mapping(uint256 => SARRecord) public suspiciousReports;
    mapping(string => bool) public sanctionedJurisdictions;
    mapping(address => bool) public sanctionedAddresses;
    mapping(address => bool) public complianceOfficers;
    
    // Thresholds and limits
    uint256 public constant LARGE_TRANSACTION_THRESHOLD = 10000 * 10**18; // 10,000 LTD
    uint256 public constant DAILY_VELOCITY_LIMIT = 50000 * 10**18;       // 50,000 LTD
    uint256 public constant MONTHLY_TRANSACTION_LIMIT = 100;              // 100 transactions
    uint256 public constant KYC_VALIDITY_PERIOD = 365 days;              // Annual re-verification
    
    // Counters
    uint256 public nextSARId = 1;
    uint256 public totalTransactionsMonitored;
    uint256 public totalSuspiciousReports;
    
    // Events for regulatory reporting
    event KYCCompleted(address indexed user, ComplianceLevel level, uint256 timestamp);
    event TransactionFlagged(bytes32 indexed txHash, address indexed user, MonitoringFlag flag);
    event SuspiciousActivityReported(uint256 indexed sarId, address indexed subject);
    event ComplianceViolation(address indexed user, string violation);
    event RegulatoryReport(uint256 indexed reportId, string reportType, uint256 timestamp);
    
    modifier onlyComplianceOfficer() {
        require(complianceOfficers[msg.sender], "Not authorized compliance officer");
        _;
    }
    
    modifier requiresKYC(address user, ComplianceLevel minLevel) {
        require(
            userCompliance[user].level >= minLevel,
            "Insufficient KYC level for this operation"
        );
        require(
            block.timestamp <= userCompliance[user].kycTimestamp + KYC_VALIDITY_PERIOD,
            "KYC verification expired"
        );
        _;
    }
    
    constructor() {
        // Initialize sanctioned jurisdictions (example)
        sanctionedJurisdictions["KP"] = true; // North Korea
        sanctionedJurisdictions["IR"] = true; // Iran
        sanctionedJurisdictions["CU"] = true; // Cuba
        
        // Set deployer as initial compliance officer
        complianceOfficers[msg.sender] = true;
    }
    
    /**
     * @dev Complete KYC verification for a user
     */
    function completeKYC(
        address user,
        ComplianceLevel level,
        bytes32 documentHash,
        string memory jurisdictionCode
    ) external onlyComplianceOfficer {
        require(user != address(0), "Invalid user address");
        require(level != ComplianceLevel.UNVERIFIED, "Invalid compliance level");
        
        // Check jurisdiction sanctions
        bool isHighRiskJurisdiction = sanctionedJurisdictions[jurisdictionCode];
        
        userCompliance[user] = ComplianceProfile({
            level: level,
            riskCategory: isHighRiskJurisdiction ? RiskCategory.HIGH : RiskCategory.LOW,
            kycTimestamp: block.timestamp,
            lastVerification: block.timestamp,
            documentHash: documentHash,
            sanctionsChecked: true,
            totalTransactionVolume: 0,
            monthlyTransactionCount: 0,
            jurisdictionCode: jurisdictionCode
        });
        
        emit KYCCompleted(user, level, block.timestamp);
    }
    
    /**
     * @dev Monitor transaction for AML compliance
     */
    function monitorTransaction(
        address from,
        address to,
        uint256 amount,
        bytes32 txHash
    ) external returns (bool approved) {
        require(from != address(0) && to != address(0), "Invalid addresses");
        
        // Check basic compliance requirements
        require(
            userCompliance[from].level >= ComplianceLevel.BASIC_KYC,
            "Sender requires KYC verification"
        );
        require(
            userCompliance[to].level >= ComplianceLevel.BASIC_KYC,
            "Recipient requires KYC verification"
        );
        
        // Perform AML checks
        MonitoringFlag flag = performAMLChecks(from, to, amount);
        
        // Record transaction
        transactions[txHash] = TransactionRecord({
            from: from,
            to: to,
            amount: amount,
            timestamp: block.timestamp,
            flag: flag,
            approved: flag == MonitoringFlag.NONE || flag == MonitoringFlag.VELOCITY_CHECK,
            reported: false,
            transactionHash: txHash
        });
        
        // Update user transaction volumes
        userCompliance[from].totalTransactionVolume += amount;
        userCompliance[from].monthlyTransactionCount += 1;
        
        totalTransactionsMonitored++;
        
        // Emit event if flagged
        if (flag != MonitoringFlag.NONE) {
            emit TransactionFlagged(txHash, from, flag);
        }
        
        // Auto-report suspicious activity if needed
        if (flag == MonitoringFlag.PATTERN_ANOMALY || flag == MonitoringFlag.SANCTIONS_CHECK) {
            createSuspiciousActivityReport(from, "Automated AML flag", new uint256[](0));
        }
        
        return transactions[txHash].approved;
    }
    
    /**
     * @dev Perform automated AML checks
     */
    function performAMLChecks(
        address from,
        address to,
        uint256 amount
    ) internal view returns (MonitoringFlag) {
        // Check sanctions lists
        if (sanctionedAddresses[from] || sanctionedAddresses[to]) {
            return MonitoringFlag.SANCTIONS_CHECK;
        }
        
        // Check transaction amount thresholds
        if (amount >= LARGE_TRANSACTION_THRESHOLD) {
            return MonitoringFlag.AMOUNT_THRESHOLD;
        }
        
        // Check velocity limits
        if (userCompliance[from].totalTransactionVolume >= DAILY_VELOCITY_LIMIT) {
            return MonitoringFlag.VELOCITY_CHECK;
        }
        
        // Check transaction frequency
        if (userCompliance[from].monthlyTransactionCount >= MONTHLY_TRANSACTION_LIMIT) {
            return MonitoringFlag.PATTERN_ANOMALY;
        }
        
        // Check geographic risk
        if (sanctionedJurisdictions[userCompliance[from].jurisdictionCode] || 
            sanctionedJurisdictions[userCompliance[to].jurisdictionCode]) {
            return MonitoringFlag.GEOGRAPHIC_RISK;
        }
        
        return MonitoringFlag.NONE;
    }
    
    /**
     * @dev Create Suspicious Activity Report (SAR)
     */
    function createSuspiciousActivityReport(
        address subject,
        string memory suspiciousActivity,
        uint256[] memory relatedTransactions
    ) public onlyComplianceOfficer returns (uint256 sarId) {
        sarId = nextSARId++;
        
        suspiciousReports[sarId] = SARRecord({
            id: sarId,
            subject: subject,
            timestamp: block.timestamp,
            suspiciousActivity: suspiciousActivity,
            relatedTransactions: relatedTransactions,
            filed: false,
            reporter: msg.sender
        });
        
        totalSuspiciousReports++;
        
        emit SuspiciousActivityReported(sarId, subject);
        
        return sarId;
    }
    
    /**
     * @dev File SAR with regulatory authorities
     */
    function fileSAR(uint256 sarId) external onlyComplianceOfficer {
        require(suspiciousReports[sarId].id != 0, "SAR does not exist");
        require(!suspiciousReports[sarId].filed, "SAR already filed");
        
        suspiciousReports[sarId].filed = true;
        
        emit RegulatoryReport(sarId, "SAR", block.timestamp);
    }
    
    /**
     * @dev Update user risk category
     */
    function updateRiskCategory(
        address user,
        RiskCategory newCategory
    ) external onlyComplianceOfficer {
        userCompliance[user].riskCategory = newCategory;
        
        if (newCategory == RiskCategory.PROHIBITED) {
            emit ComplianceViolation(user, "Account blocked due to risk assessment");
        }
    }
    
    /**
     * @dev Add address to sanctions list
     */
    function addToSanctionsList(address sanctionedAddress) external onlyComplianceOfficer {
        sanctionedAddresses[sanctionedAddress] = true;
        userCompliance[sanctionedAddress].riskCategory = RiskCategory.PROHIBITED;
    }
    
    /**
     * @dev Add jurisdiction to sanctions list
     */
    function addSanctionedJurisdiction(string memory jurisdictionCode) external onlyComplianceOfficer {
        sanctionedJurisdictions[jurisdictionCode] = true;
    }
    
    /**
     * @dev Approve high-risk transaction manually
     */
    function approveTransaction(bytes32 txHash) external onlyComplianceOfficer {
        require(transactions[txHash].transactionHash != bytes32(0), "Transaction not found");
        require(!transactions[txHash].approved, "Transaction already approved");
        
        transactions[txHash].approved = true;
    }
    
    /**
     * @dev Generate regulatory compliance report
     */
    function generateComplianceReport() external view onlyComplianceOfficer returns (
        uint256 totalUsers,
        uint256 verifiedUsers,
        uint256 flaggedTransactions,
        uint256 pendingSARs
    ) {
        // This would typically query database for comprehensive stats
        // For now, return basic counters
        return (
            0, // Would need to track total users
            0, // Would need to track verified users
            totalTransactionsMonitored,
            totalSuspiciousReports
        );
    }
    
    /**
     * @dev Check if user can perform transaction
     */
    function canTransact(
        address user,
        uint256 amount,
        ComplianceLevel requiredLevel
    ) external view returns (bool) {
        ComplianceProfile memory profile = userCompliance[user];
        
        // Check KYC level
        if (profile.level < requiredLevel) return false;
        
        // Check if blocked
        if (profile.riskCategory == RiskCategory.PROHIBITED) return false;
        
        // Check KYC expiry
        if (block.timestamp > profile.kycTimestamp + KYC_VALIDITY_PERIOD) return false;
        
        // Check velocity limits
        if (profile.totalTransactionVolume + amount > DAILY_VELOCITY_LIMIT) return false;
        
        return true;
    }
    
    /**
     * @dev Get user compliance status
     */
    function getComplianceStatus(address user) external view returns (
        ComplianceLevel level,
        RiskCategory risk,
        bool kycValid,
        uint256 transactionVolume,
        uint256 transactionCount
    ) {
        ComplianceProfile memory profile = userCompliance[user];
        bool kycIsValid = block.timestamp <= profile.kycTimestamp + KYC_VALIDITY_PERIOD;
        
        return (
            profile.level,
            profile.riskCategory,
            kycIsValid,
            profile.totalTransactionVolume,
            profile.monthlyTransactionCount
        );
    }
    
    /**
     * @dev Add compliance officer
     */
    function addComplianceOfficer(address officer) external onlyOwner {
        complianceOfficers[officer] = true;
    }
    
    /**
     * @dev Remove compliance officer
     */
    function removeComplianceOfficer(address officer) external onlyOwner {
        complianceOfficers[officer] = false;
    }
    
    /**
     * @dev Emergency pause for compliance violations
     */
    function emergencyPause() external onlyComplianceOfficer {
        _pause();
    }
    
    /**
     * @dev Resume operations after compliance review
     */
    function resumeOperations() external onlyOwner {
        _unpause();
    }
}