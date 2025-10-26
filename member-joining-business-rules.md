# La Tanda - Member Joining Business Rules & Financial Validation

## 1. Core Business Rules for Member Eligibility

### 1.1 Universal Eligibility Requirements

All users must meet these basic requirements to join any group:

#### Account Status Requirements
- User account must be in `active` status
- User must not be `suspended`, `banned`, or `inactive`
- Account must be at least 24 hours old (prevents spam accounts)

#### Verification Requirements
- **Basic Level**: Email verification required
- **Verified Level**: Email + Phone + Identity document
- **Premium Level**: All verifications + Financial capacity + Background check

#### KYC Requirements
- KYC status must be `approved` for groups with contribution > $200
- KYC status can be `pending` for entry-level groups (< $100)
- Rejected KYC permanently disqualifies from high-value groups

### 1.2 Trust Score Requirements

#### Trust Score Calculation Formula
```javascript
Trust Score = (
    Payment Reliability × 35% +
    Group Participation × 25% +
    Community Standing × 20% +
    Verification Level × 15% +
    Historical Performance × 5%
)
```

#### Trust Score Tiers
- **Excellent (80-100)**: Auto-approval eligible, premium group access
- **Good (60-79)**: Standard approval process, most groups accessible
- **Average (40-59)**: Manual review required, limited group access
- **Poor (0-39)**: Restricted to entry-level groups, enhanced verification

### 1.3 Financial Capacity Requirements

#### Income-to-Contribution Ratios
- **Entry Level (< $100)**: Minimum 2x monthly income
- **Standard ($100-$500)**: Minimum 2.5x monthly income  
- **Premium (> $500)**: Minimum 3x monthly income

#### Debt-to-Income Ratios
- **Maximum 40%** debt-to-income ratio for all groups
- **Maximum 25%** for high-value groups (> $1000)
- Must exclude mortgage/rent from debt calculation

#### Financial Stability Indicators
- **Income Stability**: Minimum 3 months consistent income
- **Bank Account**: Active account with minimum balance (2x contribution)
- **Payment History**: No defaults in financial obligations (if available)

## 2. Group-Specific Business Rules

### 2.1 Group Categories and Requirements

#### Entry-Level Groups (< $100 contribution)
```javascript
{
    minTrustScore: 25.0,
    minIncomeRatio: 2.0,
    maxDebtToIncomeRatio: 0.40,
    requiredVerificationLevel: "basic",
    requiredVerifications: ["email_verified"],
    minGroupsCompleted: 0,
    maxDefaultRate: 0.20,
    autoApproveThreshold: 60.0,
    backgroundCheckRequired: false,
    maxConcurrentGroups: 3
}
```

#### Standard Groups ($100-$500 contribution)
```javascript
{
    minTrustScore: 40.0,
    minIncomeRatio: 2.5,
    maxDebtToIncomeRatio: 0.35,
    requiredVerificationLevel: "verified",
    requiredVerifications: ["email_verified", "phone_verified", "identity_verified"],
    minGroupsCompleted: 0,
    maxDefaultRate: 0.15,
    autoApproveThreshold: 70.0,
    backgroundCheckRequired: false,
    maxConcurrentGroups: 4
}
```

#### Premium Groups ($500-$1000 contribution)
```javascript
{
    minTrustScore: 60.0,
    minIncomeRatio: 3.0,
    maxDebtToIncomeRatio: 0.30,
    requiredVerificationLevel: "premium",
    requiredVerifications: ["email_verified", "phone_verified", "identity_verified", "bank_verified"],
    minGroupsCompleted: 1,
    maxDefaultRate: 0.10,
    autoApproveThreshold: 80.0,
    backgroundCheckRequired: true,
    maxConcurrentGroups: 5
}
```

#### High-Value Groups (> $1000 contribution)
```javascript
{
    minTrustScore: 75.0,
    minIncomeRatio: 4.0,
    maxDebtToIncomeRatio: 0.25,
    requiredVerificationLevel: "premium",
    requiredVerifications: ["email_verified", "phone_verified", "identity_verified", "bank_verified", "reference_verified"],
    minGroupsCompleted: 3,
    maxDefaultRate: 0.05,
    autoApproveThreshold: 85.0,
    backgroundCheckRequired: true,
    maxConcurrentGroups: 3,
    additionalRequirements: ["collateral_or_guarantor"]
}
```

### 2.2 Geographic and Demographic Rules

#### Location-Based Requirements
- **Local Groups**: Maximum 25km radius from group center
- **Regional Groups**: Within same state/department
- **National Groups**: Within same country
- **Remote Groups**: No geographic restrictions

#### Age-Based Restrictions (Optional)
- **Youth Groups**: Ages 18-25
- **Adult Groups**: Ages 26-55
- **Senior Groups**: Ages 55+
- **Mixed Age**: No restrictions (default)

#### Professional/Interest-Based Groups
- **Professional Groups**: Require employment verification
- **Student Groups**: Require student ID verification
- **Women-Only Groups**: Gender verification required
- **Sector-Specific**: Industry/profession verification

## 3. Financial Capacity Validation System

### 3.1 Income Verification Methods

#### Primary Verification Methods

**1. Bank Account Integration**
```javascript
{
    method: "bank_connection",
    requirements: {
        minimumHistory: "3_months",
        minimumTransactions: 10,
        consistentDeposits: true,
        accountType: ["checking", "savings"],
        minimumBalance: "2x_contribution"
    },
    reliability: "high",
    processingTime: "instant"
}
```

**2. Employment Verification**
```javascript
{
    method: "employment_verification",
    requirements: {
        employmentLetter: true,
        payStubs: "last_3_months",
        hrContact: "optional",
        employmentDuration: "minimum_6_months"
    },
    reliability: "high",
    processingTime: "24-48_hours"
}
```

**3. Document Upload**
```javascript
{
    method: "document_upload",
    acceptedDocuments: [
        "salary_certificate",
        "bank_statements_3_months",
        "tax_returns",
        "business_income_proof",
        "pension_statements",
        "investment_statements"
    ],
    reliability: "medium",
    processingTime: "manual_review"
}
```

#### Secondary Verification Methods

**4. Third-Party Services**
```javascript
{
    method: "credit_bureau_check",
    providers: ["TransUnion", "Equifax", "Local_Credit_Bureau"],
    dataPoints: ["income_estimation", "credit_score", "debt_levels"],
    reliability: "medium",
    processingTime: "instant"
}
```

**5. Reference Verification**
```javascript
{
    method: "reference_verification",
    requirements: {
        professionalReferences: 2,
        personalReferences: 1,
        contactMethods: ["phone", "email"],
        verificationQuestions: "standardized"
    },
    reliability: "low",
    processingTime: "48-72_hours"
}
```

### 3.2 Financial Capacity Scoring Algorithm

```javascript
function calculateFinancialCapacity(financialData, contributionAmount) {
    const weights = {
        incomeRatio: 0.40,        // 40% - Most important
        debtToIncome: 0.25,       // 25% - Debt burden assessment
        savingsRatio: 0.20,       // 20% - Financial cushion
        incomeStability: 0.15     // 15% - Income consistency
    };
    
    // Income Ratio Score (Target: 3x contribution amount)
    const incomeRatio = financialData.monthlyIncome / contributionAmount;
    const incomeScore = Math.min(incomeRatio / 3.0, 1.0) * 100;
    
    // Debt-to-Income Score (Target: < 30% for premium)
    const debtRatio = financialData.monthlyDebt / financialData.monthlyIncome;
    const debtScore = Math.max(0, (0.4 - debtRatio) / 0.4) * 100;
    
    // Savings Ratio Score (Target: 1x annual contribution)
    const annualContribution = contributionAmount * 12;
    const savingsRatio = financialData.totalSavings / annualContribution;
    const savingsScore = Math.min(savingsRatio, 1.0) * 100;
    
    // Income Stability Score
    const stabilityScore = calculateIncomeStability(financialData.incomeHistory);
    
    const finalScore = (
        incomeScore * weights.incomeRatio +
        debtScore * weights.debtToIncome +
        savingsScore * weights.savingsRatio +
        stabilityScore * weights.incomeStability
    );
    
    return {
        overall: Math.round(finalScore),
        components: {
            income: Math.round(incomeScore),
            debt: Math.round(debtScore),
            savings: Math.round(savingsScore),
            stability: Math.round(stabilityScore)
        },
        recommendations: generateRecommendations(finalScore, {
            incomeRatio, debtRatio, savingsRatio, stabilityScore
        })
    };
}

function calculateIncomeStability(incomeHistory) {
    if (incomeHistory.length < 3) return 50; // Default for insufficient data
    
    const variance = calculateVariance(incomeHistory);
    const mean = calculateMean(incomeHistory);
    const coefficientOfVariation = variance / mean;
    
    // Lower coefficient of variation = higher stability
    const stabilityScore = Math.max(0, 100 - (coefficientOfVariation * 100));
    
    return Math.min(stabilityScore, 100);
}
```

### 3.3 Risk Assessment Matrix

#### Low Risk (Score: 0-25)
- **Characteristics**: High income ratio, low debt, stable employment
- **Requirements**: Standard verification
- **Monitoring**: Quarterly reviews
- **Group Access**: All groups available

#### Medium Risk (Score: 26-50)
- **Characteristics**: Adequate income, moderate debt, some stability concerns
- **Requirements**: Enhanced verification + references
- **Monitoring**: Monthly reviews
- **Group Access**: Entry to standard groups

#### High Risk (Score: 51-75)
- **Characteristics**: Tight income ratio, high debt, employment instability
- **Requirements**: Comprehensive verification + guarantor
- **Monitoring**: Bi-weekly reviews
- **Group Access**: Entry-level groups only

#### Very High Risk (Score: 76-100)
- **Characteristics**: Insufficient income, excessive debt, unstable employment
- **Requirements**: Complete documentation + collateral
- **Monitoring**: Weekly reviews
- **Group Access**: Declined or probationary membership

## 4. Verification Requirements by Document Type

### 4.1 Identity Documents

#### Accepted Documents (Honduras)
```javascript
{
    nationalID: {
        document: "Tarjeta de Identidad Nacional",
        format: "0000-0000-00000",
        verification: "government_api",
        validity: "not_expired",
        additionalChecks: ["photo_match", "biometric_verification"]
    },
    passport: {
        document: "Pasaporte Hondureño",
        format: "passport_number",
        verification: "manual_review",
        validity: "minimum_6_months",
        additionalChecks: ["travel_history_optional"]
    },
    drivingLicense: {
        document: "Licencia de Conducir",
        verification: "manual_review",
        validity: "not_expired",
        acceptedAsSecondary: true
    }
}
```

#### Identity Verification Process
1. **Document Upload**: High-resolution photo of both sides
2. **OCR Processing**: Automatic data extraction
3. **Government Verification**: API check with national registry
4. **Photo Matching**: Selfie comparison with ID photo
5. **Manual Review**: Human verification for edge cases

### 4.2 Financial Documents

#### Bank Statements
```javascript
{
    requirements: {
        period: "last_3_months",
        format: ["PDF", "bank_API"],
        minimumTransactions: 15,
        requiredData: [
            "account_holder_name",
            "account_number",
            "opening_balance",
            "closing_balance",
            "transaction_history",
            "bank_official_stamp"
        ]
    },
    verification: {
        authenticity: "bank_API_preferred",
        balance: "sufficient_for_contribution",
        patterns: "regular_income_deposits",
        flags: ["returned_payments", "overdrafts", "suspicious_activity"]
    }
}
```

#### Income Certificates
```javascript
{
    requirements: {
        issuer: "employer_or_accountant",
        period: "current_employment",
        format: "official_letterhead",
        requiredData: [
            "gross_monthly_income",
            "net_monthly_income",
            "employment_start_date",
            "position_title",
            "employer_contact"
        ]
    },
    verification: {
        employer: "direct_contact_verification",
        authenticity: "letterhead_verification",
        consistency: "cross_reference_bank_deposits"
    }
}
```

### 4.3 Reference Verification

#### Professional References
```javascript
{
    requirements: {
        count: 2,
        relationship: ["supervisor", "colleague", "business_partner"],
        duration: "minimum_1_year_acquaintance",
        contact: ["phone", "email", "linkedin"]
    },
    verificationProcess: {
        initialContact: "automated_email",
        phoneVerification: "human_agent",
        questions: [
            "How long have you known this person?",
            "In what capacity?",
            "How would you rate their reliability?",
            "Would you trust them with financial commitments?",
            "Any concerns about their character?"
        ]
    }
}
```

#### Personal References
```javascript
{
    requirements: {
        count: 2,
        relationship: ["family", "friend", "neighbor"],
        exclusions: ["spouse", "children", "other_applicants"],
        duration: "minimum_2_years_acquaintance"
    },
    verificationProcess: {
        focus: [
            "character_assessment",
            "financial_responsibility",
            "community_standing",
            "any_known_issues"
        ]
    }
}
```

## 5. Auto-Approval vs Manual Review Triggers

### 5.1 Auto-Approval Criteria

Users qualify for automatic approval if ALL conditions are met:

```javascript
const autoApprovalCriteria = {
    trustScore: "≥ group.autoApproveThreshold",
    verificationStatus: "all_required_verifications_complete",
    financialCapacity: "≥ 75",
    riskFlags: "none",
    groupCapacity: "available_slots",
    previousDefaults: "none_in_last_12_months",
    currentGroupLimit: "not_exceeded",
    backgroundCheck: "passed_if_required"
};
```

### 5.2 Manual Review Triggers

Any of these conditions trigger manual review:

#### Trust Score Issues
- Trust score below auto-approval threshold
- Recent significant drop in trust score (>10 points)
- Trust score based on insufficient data

#### Verification Concerns
- Incomplete verification package
- Document quality concerns
- Verification timeout or failures
- Conflicting information between documents

#### Financial Red Flags
- Income verification inconsistencies
- High debt-to-income ratio (>35%)
- Recent financial distress indicators
- Insufficient income stability data

#### Risk Factors
- First-time platform user
- Recent group defaults or violations
- Suspicious account activity
- Geographic or demographic outliers

#### Group-Specific Factors
- High-value group (admin preference)
- Group approaching capacity
- Special group requirements
- Admin-requested manual review

### 5.3 Review Priority System

```javascript
const reviewPriority = {
    urgent: {
        triggers: ["expiring_soon", "high_value_group", "admin_escalation"],
        sla: "2_hours"
    },
    high: {
        triggers: ["premium_user", "excellent_trust_score", "complete_verification"],
        sla: "12_hours"
    },
    normal: {
        triggers: ["standard_application", "minor_concerns"],
        sla: "48_hours"
    },
    low: {
        triggers: ["incomplete_application", "poor_trust_score"],
        sla: "72_hours"
    }
};
```

## 6. Fraud Prevention and Security Measures

### 6.1 Identity Fraud Prevention

#### Document Verification
- **OCR + AI**: Automatic extraction and validation
- **Tamper Detection**: Check for document modifications
- **Cross-Reference**: Verify against government databases
- **Biometric Matching**: Photo comparison algorithms
- **Device Fingerprinting**: Detect suspicious devices

#### Behavioral Analysis
- **Application Patterns**: Detect unusual application behaviors
- **Device Analysis**: Check for device reputation
- **Location Verification**: GPS and IP address validation
- **Time Pattern Analysis**: Detect automated submissions

### 6.2 Financial Fraud Prevention

#### Bank Account Verification
- **Real-time Verification**: Instant bank account validation
- **Ownership Verification**: Micro-deposits or instant verification
- **Account Age**: Minimum account age requirements
- **Transaction History**: Pattern analysis for legitimacy

#### Income Fraud Detection
- **Cross-Reference Checks**: Multiple income source validation
- **Employer Verification**: Direct contact with employers
- **Tax Record Verification**: Government tax database checks
- **Industry Benchmarks**: Compare against sector standards

### 6.3 Blacklist and Watchlist Management

#### Automatic Blacklist Triggers
```javascript
{
    identityFraud: "permanent_ban",
    documentForgery: "permanent_ban", 
    multipleAccountFraud: "permanent_ban",
    financialFraud: "permanent_ban",
    threeStrikesViolations: "12_month_suspension",
    groupDefaults: "6_month_probation"
}
```

#### Watchlist Categories
- **High Risk**: Enhanced monitoring and verification
- **Suspicious Activity**: Regular review and limits
- **Previous Violations**: Probationary status
- **Geographic Risk**: Location-based enhanced checks

## 7. Appeals and Exceptions Process

### 7.1 Application Rejection Appeals

#### Appealable Rejections
- Verification document issues
- Trust score calculations
- Financial capacity assessments
- Technical errors in processing

#### Non-Appealable Rejections
- Identity fraud
- Document forgery
- False information provision
- Blacklist violations

#### Appeals Process
1. **Initial Appeal**: Online form submission
2. **Document Review**: 48-hour assessment
3. **Human Review**: Manual verification
4. **Final Decision**: Binding determination
5. **Escalation**: Senior admin review (exceptional cases)

### 7.2 Exception Handling

#### Administrative Exceptions
- **Group Admin Override**: Limited exception authority
- **Platform Admin Override**: Full exception authority
- **Special Circumstances**: Natural disasters, emergencies
- **Technical Issues**: System errors or outages

#### Exception Documentation
- Reason for exception
- Risk assessment
- Monitoring requirements
- Time-limited validity
- Approval authority

This comprehensive business rules system ensures that La Tanda maintains high standards for member quality while providing fair and transparent processes for all users seeking to join groups.