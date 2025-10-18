/**
 * 🔒 LA TANDA SMART CONTRACT SECURITY AUDITOR
 * Comprehensive security analysis and vulnerability detection for smart contracts
 */

const fs = require('fs');
const path = require('path');

class ContractSecurityAuditor {
    constructor() {
        this.vulnerabilities = [];
        this.recommendations = [];
        this.securityScore = 0;
        this.auditResults = {
            critical: [],
            high: [],
            medium: [],
            low: [],
            info: []
        };
    }

    /**
     * Run comprehensive security audit on all contracts
     */
    async auditAllContracts() {
        console.log('🔒 Starting Comprehensive Security Audit...\n');
        
        const contractsDir = path.join(__dirname, '..', 'contracts');
        const contracts = ['LTDToken.sol', 'LaTandaDAO.sol', 'GroupManager.sol'];
        
        for (const contractFile of contracts) {
            await this.auditContract(path.join(contractsDir, contractFile));
        }
        
        this.generateSecurityReport();
        return this.auditResults;
    }

    /**
     * Audit individual contract file
     */
    async auditContract(contractPath) {
        const contractName = path.basename(contractPath, '.sol');
        console.log(`🔍 Auditing ${contractName}...`);
        
        try {
            const contractCode = fs.readFileSync(contractPath, 'utf8');
            
            // Run various security checks
            this.checkAccessControls(contractCode, contractName);
            this.checkReentrancyVulnerabilities(contractCode, contractName);
            this.checkOverflowUnderflow(contractCode, contractName);
            this.checkGasOptimization(contractCode, contractName);
            this.checkUpgradeability(contractCode, contractName);
            this.checkEmergencyPause(contractCode, contractName);
            this.checkInputValidation(contractCode, contractName);
            this.checkTimeManipulation(contractCode, contractName);
            this.checkFrontRunning(contractCode, contractName);
            this.checkFlashLoanVulnerabilities(contractCode, contractName);
            this.checkOracleManipulation(contractCode, contractName);
            this.checkEconomicDesignFlaws(contractCode, contractName);
            
            console.log(`✅ ${contractName} audit completed\n`);
            
        } catch (error) {
            this.addVulnerability('critical', contractName, 'Contract file not found or unreadable', 'FILE_ERROR');
        }
    }

    /**
     * Check access control mechanisms
     */
    checkAccessControls(code, contractName) {
        const issues = [];
        
        // Check for proper use of onlyOwner modifier
        if (!code.includes('onlyOwner')) {
            issues.push('Missing onlyOwner access control modifier');
        }
        
        // Check for role-based access control
        if (!code.includes('AccessControl') && !code.includes('Role')) {
            issues.push('Consider implementing role-based access control for better security');
        }
        
        // Check for public functions that should be restricted
        const publicFunctions = code.match(/function\s+\w+\s*\([^)]*\)\s+public/g) || [];
        if (publicFunctions.length > 3) {
            issues.push(`${publicFunctions.length} public functions found - review if all should be public`);
        }
        
        issues.forEach(issue => {
            this.addVulnerability('medium', contractName, issue, 'ACCESS_CONTROL');
        });
    }

    /**
     * Check for reentrancy vulnerabilities
     */
    checkReentrancyVulnerabilities(code, contractName) {
        const issues = [];
        
        // Check for ReentrancyGuard usage
        if (!code.includes('ReentrancyGuard') && !code.includes('nonReentrant')) {
            issues.push('Missing ReentrancyGuard protection - vulnerable to reentrancy attacks');
        }
        
        // Check for external calls before state changes
        const externalCallPattern = /\.call\(|\.delegatecall\(|\.transfer\(/g;
        const externalCalls = code.match(externalCallPattern);
        if (externalCalls && externalCalls.length > 0) {
            issues.push('External calls detected - ensure proper reentrancy protection');
        }
        
        issues.forEach(issue => {
            this.addVulnerability('high', contractName, issue, 'REENTRANCY');
        });
    }

    /**
     * Check for integer overflow/underflow vulnerabilities
     */
    checkOverflowUnderflow(code, contractName) {
        const issues = [];
        
        // Check Solidity version for automatic overflow protection
        const versionMatch = code.match(/pragma solidity \^?(\d+\.\d+\.\d+)/);
        if (versionMatch) {
            const version = versionMatch[1];
            const [major, minor] = version.split('.').map(Number);
            
            if (major < 1 && (major === 0 && minor < 8)) {
                issues.push('Using Solidity version < 0.8.0 - vulnerable to overflow/underflow. Upgrade or use SafeMath');
            }
        }
        
        // Check for SafeMath usage in older versions
        if (!code.includes('SafeMath') && !versionMatch) {
            issues.push('No SafeMath library detected - potential overflow/underflow vulnerability');
        }
        
        issues.forEach(issue => {
            this.addVulnerability('high', contractName, issue, 'OVERFLOW');
        });
    }

    /**
     * Check gas optimization opportunities
     */
    checkGasOptimization(code, contractName) {
        const recommendations = [];
        
        // Check for storage vs memory usage
        const storageVars = (code.match(/storage\s+/g) || []).length;
        const memoryVars = (code.match(/memory\s+/g) || []).length;
        
        if (storageVars > memoryVars * 2) {
            recommendations.push('Consider using memory instead of storage where possible to reduce gas costs');
        }
        
        // Check for loops that could be optimized
        const loops = (code.match(/for\s*\(/g) || []).length + (code.match(/while\s*\(/g) || []).length;
        if (loops > 3) {
            recommendations.push(`${loops} loops found - consider gas optimization for array operations`);
        }
        
        recommendations.forEach(rec => {
            this.addVulnerability('low', contractName, rec, 'GAS_OPTIMIZATION');
        });
    }

    /**
     * Check upgradeability patterns
     */
    checkUpgradeability(code, contractName) {
        const recommendations = [];
        
        if (!code.includes('Upgradeable') && !code.includes('Proxy')) {
            recommendations.push('Contract is not upgradeable - consider implementing proxy pattern for future updates');
        }
        
        if (code.includes('Upgradeable') && !code.includes('initializer')) {
            recommendations.push('Upgradeable contract missing initializer modifier');
        }
        
        recommendations.forEach(rec => {
            this.addVulnerability('info', contractName, rec, 'UPGRADEABILITY');
        });
    }

    /**
     * Check emergency pause functionality
     */
    checkEmergencyPause(code, contractName) {
        const issues = [];
        
        if (!code.includes('Pausable') && !code.includes('pause')) {
            issues.push('Missing emergency pause functionality - consider implementing for critical operations');
        }
        
        if (code.includes('Pausable') && !code.includes('whenNotPaused')) {
            issues.push('Pausable contract but functions not protected with whenNotPaused modifier');
        }
        
        issues.forEach(issue => {
            this.addVulnerability('medium', contractName, issue, 'EMERGENCY_CONTROLS');
        });
    }

    /**
     * Check input validation
     */
    checkInputValidation(code, contractName) {
        const issues = [];
        
        // Check for require statements
        const requireStatements = (code.match(/require\s*\(/g) || []).length;
        const functions = (code.match(/function\s+\w+/g) || []).length;
        
        if (requireStatements < functions * 0.5) {
            issues.push('Insufficient input validation - add more require statements for parameter validation');
        }
        
        // Check for address validation
        if (!code.includes('address(0)') && code.includes('address')) {
            issues.push('Missing zero address validation for address parameters');
        }
        
        issues.forEach(issue => {
            this.addVulnerability('medium', contractName, issue, 'INPUT_VALIDATION');
        });
    }

    /**
     * Check for timestamp manipulation vulnerabilities
     */
    checkTimeManipulation(code, contractName) {
        const issues = [];
        
        if (code.includes('block.timestamp') || code.includes('now')) {
            issues.push('Uses block.timestamp - vulnerable to miner manipulation, consider using block.number or oracle');
        }
        
        issues.forEach(issue => {
            this.addVulnerability('medium', contractName, issue, 'TIME_MANIPULATION');
        });
    }

    /**
     * Check for front-running vulnerabilities
     */
    checkFrontRunning(code, contractName) {
        const recommendations = [];
        
        if (code.includes('auction') || code.includes('bid')) {
            recommendations.push('Auction/bidding functionality detected - consider commit-reveal scheme to prevent front-running');
        }
        
        if (code.includes('price') && code.includes('public')) {
            recommendations.push('Public price-sensitive functions - consider MEV protection mechanisms');
        }
        
        recommendations.forEach(rec => {
            this.addVulnerability('low', contractName, rec, 'FRONT_RUNNING');
        });
    }

    /**
     * 🚨 FLASH LOAN ATTACK VULNERABILITY DETECTION
     * Critical security check for 2025's most devastating attack vector
     */
    checkFlashLoanVulnerabilities(code, contractName) {
        const criticalIssues = [];
        const highIssues = [];
        
        // Check for flash loan-powered logic breaks
        if (code.includes('flashLoan') || code.includes('borrow')) {
            if (!code.includes('require(balanceBefore') && !code.includes('balanceAfter')) {
                criticalIssues.push('Flash loan functionality without proper balance verification - vulnerable to economic manipulation');
            }
            
            if (!code.includes('reentrancyGuard') && !code.includes('nonReentrant')) {
                criticalIssues.push('Flash loan operations without reentrancy protection - critical vulnerability');
            }
        }
        
        // Check for economic design oversights
        if (code.includes('price') && !code.includes('timeWeighted')) {
            highIssues.push('Price calculations without time-weighted average - vulnerable to flash loan price manipulation');
        }
        
        // Check for single-block dependency
        if (code.includes('block.timestamp') && (code.includes('price') || code.includes('rate'))) {
            criticalIssues.push('Single-block price/rate calculations - exploitable via flash loan attacks');
        }
        
        // Check for insufficient slippage protection
        if (code.includes('swap') && !code.includes('slippage')) {
            highIssues.push('Token swaps without slippage protection - vulnerable to sandwich attacks via flash loans');
        }
        
        criticalIssues.forEach(issue => {
            this.addVulnerability('critical', contractName, issue, 'FLASH_LOAN_ATTACK');
        });
        
        highIssues.forEach(issue => {
            this.addVulnerability('high', contractName, issue, 'FLASH_LOAN_ATTACK');
        });
    }

    /**
     * 🎯 ORACLE MANIPULATION ATTACK DETECTION
     * Prevents price feed manipulation through large borrowed amounts
     */
    checkOracleManipulation(code, contractName) {
        const criticalIssues = [];
        const highIssues = [];
        
        // Check for oracle dependency without protection
        if (code.includes('oracle') || code.includes('price')) {
            if (!code.includes('TWAP') && !code.includes('timeWeighted')) {
                criticalIssues.push('Oracle price usage without TWAP protection - vulnerable to flash loan manipulation');
            }
            
            if (!code.includes('multiple') && !code.includes('chainlink')) {
                highIssues.push('Single oracle dependency - consider multiple oracle sources for price validation');
            }
            
            if (!code.includes('deviation') && !code.includes('threshold')) {
                highIssues.push('No price deviation checks - vulnerable to extreme price manipulation');
            }
        }
        
        // Check for DEX liquidity dependency
        if (code.includes('getAmountOut') || code.includes('getReserves')) {
            criticalIssues.push('Direct DEX price queries without protection - highly vulnerable to flash loan attacks');
        }
        
        criticalIssues.forEach(issue => {
            this.addVulnerability('critical', contractName, issue, 'ORACLE_MANIPULATION');
        });
        
        highIssues.forEach(issue => {
            this.addVulnerability('high', contractName, issue, 'ORACLE_MANIPULATION');
        });
    }

    /**
     * 💰 ECONOMIC DESIGN FLAW DETECTION
     * Identifies economic oversights that enable flash loan exploitation
     */
    checkEconomicDesignFlaws(code, contractName) {
        const criticalIssues = [];
        const highIssues = [];
        const mediumIssues = [];
        
        // Check for atomicity assumptions
        if (code.includes('require') && code.includes('balance')) {
            if (!code.includes('snapshot') && !code.includes('checkpoint')) {
                highIssues.push('Balance requirements without checkpointing - vulnerable to intra-transaction manipulation');
            }
        }
        
        // Check for governance vulnerabilities
        if (code.includes('vote') || code.includes('governance')) {
            if (!code.includes('timelock') && !code.includes('delay')) {
                criticalIssues.push('Governance without timelock - vulnerable to flash loan governance attacks');
            }
            
            if (!code.includes('quorum') || !code.includes('threshold')) {
                highIssues.push('Insufficient governance protection - consider higher thresholds and quorum requirements');
            }
        }
        
        // Check for liquidity pool vulnerabilities
        if (code.includes('addLiquidity') || code.includes('removeLiquidity')) {
            if (!code.includes('minimum') && !code.includes('slippage')) {
                mediumIssues.push('Liquidity operations without minimum amount protection');
            }
        }
        
        // Check for reward calculation flaws
        if (code.includes('reward') && code.includes('calculate')) {
            if (!code.includes('time') && !code.includes('duration')) {
                highIssues.push('Reward calculations without time constraints - exploitable via flash operations');
            }
        }
        
        criticalIssues.forEach(issue => {
            this.addVulnerability('critical', contractName, issue, 'ECONOMIC_DESIGN');
        });
        
        highIssues.forEach(issue => {
            this.addVulnerability('high', contractName, issue, 'ECONOMIC_DESIGN');
        });
        
        mediumIssues.forEach(issue => {
            this.addVulnerability('medium', contractName, issue, 'ECONOMIC_DESIGN');
        });
    }

    /**
     * Add vulnerability to results
     */
    addVulnerability(severity, contract, description, category) {
        this.auditResults[severity].push({
            contract,
            description,
            category,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Calculate security score
     */
    calculateSecurityScore() {
        const weights = { critical: -50, high: -20, medium: -10, low: -5, info: -1 };
        let score = 100;
        
        Object.keys(this.auditResults).forEach(severity => {
            score += this.auditResults[severity].length * weights[severity];
        });
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Generate comprehensive security report
     */
    generateSecurityReport() {
        this.securityScore = this.calculateSecurityScore();
        
        console.log('\n🔒 SECURITY AUDIT REPORT');
        console.log('═'.repeat(80));
        console.log(`📊 Overall Security Score: ${this.securityScore}/100`);
        
        const totalIssues = Object.values(this.auditResults).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`🔍 Total Issues Found: ${totalIssues}`);
        
        // Report by severity
        Object.keys(this.auditResults).forEach(severity => {
            const issues = this.auditResults[severity];
            if (issues.length > 0) {
                const icon = this.getSeverityIcon(severity);
                console.log(`\n${icon} ${severity.toUpperCase()} (${issues.length})`);
                console.log('─'.repeat(40));
                
                issues.forEach((issue, index) => {
                    console.log(`  ${index + 1}. [${issue.contract}] ${issue.description}`);
                    console.log(`     Category: ${issue.category}`);
                });
            }
        });
        
        // Security recommendations
        console.log('\n💡 SECURITY RECOMMENDATIONS');
        console.log('─'.repeat(80));
        this.generateRecommendations();
        
        // Save detailed report
        this.saveAuditReport();
    }

    /**
     * Get severity icon
     */
    getSeverityIcon(severity) {
        const icons = {
            critical: '🚨',
            high: '⚠️',
            medium: '🔶',
            low: '💡',
            info: 'ℹ️'
        };
        return icons[severity] || '📋';
    }

    /**
     * Generate security recommendations
     */
    generateRecommendations() {
        const recommendations = [
            '1. 🔐 Implement multi-signature wallet for owner functions',
            '2. 🛡️ Add timelocks for critical administrative functions',
            '3. 🔍 Conduct regular third-party security audits',
            '4. 📊 Implement comprehensive monitoring and alerting',
            '5. 🚨 Create incident response procedures',
            '6. 💰 Consider bug bounty program for ongoing security',
            '7. 🔒 Implement formal verification for critical functions',
            '8. 📝 Maintain detailed documentation of all security measures'
        ];
        
        recommendations.forEach(rec => console.log(rec));
    }

    /**
     * Save audit report to file
     */
    saveAuditReport() {
        const reportPath = path.join(__dirname, 'audit-report.json');
        const report = {
            timestamp: new Date().toISOString(),
            securityScore: this.securityScore,
            totalIssues: Object.values(this.auditResults).reduce((sum, arr) => sum + arr.length, 0),
            issues: this.auditResults,
            recommendations: [
                'Implement multi-signature wallet for owner functions',
                'Add timelocks for critical administrative functions',
                'Conduct regular third-party security audits',
                'Implement comprehensive monitoring and alerting',
                'Create incident response procedures',
                'Consider bug bounty program for ongoing security',
                'Implement formal verification for critical functions',
                'Maintain detailed documentation of all security measures'
            ]
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📁 Detailed audit report saved to: ${reportPath}`);
    }
}

// Export for module usage
module.exports = ContractSecurityAuditor;

// Run audit if called directly
if (require.main === module) {
    const auditor = new ContractSecurityAuditor();
    auditor.auditAllContracts()
        .then(() => {
            console.log('\n✅ Security audit completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Security audit failed:', error);
            process.exit(1);
        });
}