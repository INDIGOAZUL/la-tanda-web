/**
 * Automated Security Scanner
 * Client-side security checks and vulnerability detection
 */

const SECURITY_CHECKS = {
  HTTPS: 'https',
  HEADERS: 'headers',
  COOKIES: 'cookies',
  LOCAL_STORAGE: 'localStorage',
  XSS: 'xss',
  MIXED_CONTENT: 'mixedContent',
  DEPENDENCIES: 'dependencies',
  CSP: 'csp'
};

const SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
};

/**
 * Security scan results
 */
let scanResults = [];

/**
 * Check if HTTPS is enforced
 */
function checkHTTPS() {
  const isHTTPS = window.location.protocol === 'https:';
  
  return {
    check: SECURITY_CHECKS.HTTPS,
    passed: isHTTPS,
    severity: isHTTPS ? SEVERITY.INFO : SEVERITY.CRITICAL,
    message: isHTTPS ? 
      'HTTPS is enforced' : 
      '🔴 CRITICAL: Site not using HTTPS',
    recommendation: isHTTPS ? null : 'Enable HTTPS immediately'
  };
}

/**
 * Check security headers
 */
async function checkSecurityHeaders() {
  try {
    const response = await fetch(window.location.href, { method: 'HEAD' });
    const headers = {
      hsts: response.headers.get('Strict-Transport-Security'),
      csp: response.headers.get('Content-Security-Policy'),
      xFrame: response.headers.get('X-Frame-Options'),
      xContentType: response.headers.get('X-Content-Type-Options'),
      xXSS: response.headers.get('X-XSS-Protection'),
      referrer: response.headers.get('Referrer-Policy')
    };
    
    const missing = [];
    if (!headers.hsts) missing.push('HSTS');
    if (!headers.csp) missing.push('CSP');
    if (!headers.xFrame) missing.push('X-Frame-Options');
    if (!headers.xContentType) missing.push('X-Content-Type-Options');
    if (!headers.xXSS) missing.push('X-XSS-Protection');
    if (!headers.referrer) missing.push('Referrer-Policy');
    
    const passed = missing.length === 0;
    
    return {
      check: SECURITY_CHECKS.HEADERS,
      passed: passed,
      severity: passed ? SEVERITY.INFO : (missing.length > 3 ? SEVERITY.HIGH : SEVERITY.MEDIUM),
      message: passed ? 
        'All security headers present' : 
        `Missing headers: ${missing.join(', ')}`,
      recommendation: passed ? null : 'Configure missing security headers in web server'
    };
  } catch (e) {
    return {
      check: SECURITY_CHECKS.HEADERS,
      passed: false,
      severity: SEVERITY.MEDIUM,
      message: 'Could not check headers',
      recommendation: null
    };
  }
}

/**
 * Check secure cookie attributes
 */
function checkCookies() {
  const cookies = document.cookie.split(';');
  const issues = [];
  
  // Check if any cookies lack Secure or HttpOnly (can't check HttpOnly from JS, but can warn)
  if (cookies.length > 0 && window.location.protocol !== 'https:') {
    issues.push('Cookies set over HTTP (insecure)');
  }
  
  // Check for SameSite
  const hasAuthCookie = cookies.some(c => c.includes('auth') || c.includes('session'|| c.includes('token'));
  if (hasAuthCookie) {
    issues.push('Auth cookies detected - ensure SameSite=Strict/Lax');
  }
  
  return {
    check: SECURITY_CHECKS.COOKIES,
    passed: issues.length === 0,
    severity: issues.length > 0 ? SEVERITY.MEDIUM : SEVERITY.INFO,
    message: issues.length === 0 ? 
      'Cookie security OK' : 
      issues.join(', '),
    recommendation: issues.length > 0 ? 'Set Secure, HttpOnly, SameSite attributes on cookies' : null
  };
}

/**
 * Check localStorage for sensitive data
 */
function checkLocalStorage() {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /credit[_-]?card/i,
    /ssn/i
  ];
  
  const issues = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    
    if (sensitivePatterns.some(pattern => pattern.test(key) || pattern.test(value))) {
      issues.push(`Sensitive data in localStorage: ${key}`);
    }
  }
  
  return {
    check: SECURITY_CHECKS.LOCAL_STORAGE,
    passed: issues.length === 0,
    severity: issues.length > 0 ? SEVERITY.HIGH : SEVERITY.INFO,
    message: issues.length === 0 ? 
      'No sensitive data in localStorage' : 
      issues.join(', '),
    recommendation: issues.length > 0 ? 'Never store sensitive data in localStorage - use httpOnly cookies' : null
  };
}

/**
 * Check for XSS vulnerabilities
 */
function checkXSS() {
  const issues = [];
  
  // Check for dangerous innerHTML usage
  const scripts = Array.from(document.querySelectorAll('script'));
  const hasInlineScripts = scripts.some(s => s.innerHTML.includes('innerHTML'));
  
  if (hasInlineScripts) {
    issues.push('Potential innerHTML usage detected');
  }
  
  // Check URL parameters for XSS
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of params) {
    if (/<script|javascript:|onerror=/i.test(value)) {
      issues.push(`Suspicious URL parameter: ${key}`);
    }
  }
  
  return {
    check: SECURITY_CHECKS.XSS,
    passed: issues.length === 0,
    severity: issues.length > 0 ? SEVERITY.HIGH : SEVERITY.INFO,
    message: issues.length === 0 ? 
      'No obvious XSS vulnerabilities' : 
      issues.join(', '),
    recommendation: issues.length > 0 ? 'Sanitize all user input and use textContent instead of innerHTML' : null
  };
}

/**
 * Check for mixed content
 */
function checkMixedContent() {
  if (window.location.protocol !== 'https:') {
    return {
      check: SECURITY_CHECKS.MIXED_CONTENT,
      passed: true,
      severity: SEVERITY.INFO,
      message: 'N/A (not HTTPS)',
      recommendation: null
    };
  }
  
  const issues = [];
  
  // Check images
  const images = Array.from(document.querySelectorAll('img'));
  const httpImages = images.filter(img => img.src.startsWith('http://'));
  if (httpImages.length > 0) {
    issues.push(`${httpImages.length} image(s) loaded over HTTP`);
  }
  
  // Check scripts
  const externalScripts = Array.from(document.querySelectorAll('script[src]'));
  const httpScripts = externalScripts.filter(s => s.src.startsWith('http://'));
  if (httpScripts.length > 0) {
    issues.push(`${httpScripts.length} script(s) loaded over HTTP`);
  }
  
  // Check stylesheets
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  const httpStyles = stylesheets.filter(l => l.href.startsWith('http://'));
  if (httpStyles.length > 0) {
    issues.push(`${httpStyles.length} stylesheet(s) loaded over HTTP`);
  }
  
  return {
    check: SECURITY_CHECKS.MIXED_CONTENT,
    passed: issues.length === 0,
    severity: issues.length > 0 ? SEVERITY.MEDIUM : SEVERITY.INFO,
    message: issues.length === 0 ? 
      'No mixed content detected' : 
      issues.join(', '),
    recommendation: issues.length > 0 ? 'Use HTTPS for all external resources' : null
  };
}

/**
 * Run all security checks
 */
export async function runSecurityScan() {
  console.log('🔍 Starting security scan...');
  
  scanResults = [];
  
  // Run checks
  scanResults.push(checkHTTPS());
  scanResults.push(await checkSecurityHeaders());
  scanResults.push(checkCookies());
  scanResults.push(checkLocalStorage());
  scanResults.push(checkXSS());
  scanResults.push(checkMixedContent());
  
  // Calculate score
  const totalChecks = scanResults.length;
  const passedChecks = scanResults.filter(r => r.passed).length;
  const score = ((passedChecks / totalChecks) * 100).toFixed(1);
  
  // Group by severity
  const critical = scanResults.filter(r => !r.passed && r.severity === SEVERITY.CRITICAL);
  const high = scanResults.filter(r => !r.passed && r.severity === SEVERITY.HIGH);
  const medium = scanResults.filter(r => !r.passed && r.severity === SEVERITY.MEDIUM);
  const low = scanResults.filter(r => !r.passed && r.severity === SEVERITY.LOW);
  
  const summary = {
    score: score,
    totalChecks: totalChecks,
    passedChecks: passedChecks,
    failedChecks: totalChecks - passedChecks,
    critical: critical.length,
    high: high.length,
    medium: medium.length,
    low: low.length,
    results: scanResults
  };
  
  console.log('✅ Security scan complete');
  console.log(`📊 Score: ${score}% (${passedChecks}/${totalChecks} checks passed)`);
  
  if (critical.length > 0) {
    console.error(`🔴 ${critical.length} CRITICAL issues found!`);
  }
  if (high.length > 0) {
    console.warn(`⚠️ ${high.length} HIGH severity issues found`);
  }
  
  return summary;
}

/**
 * Display scan results in console
 */
export function displayScanResults(summary = null) {
  if (!summary && scanResults.length === 0) {
    console.warn('No scan results available. Run runSecurityScan() first.');
    return;
  }
  
  const results = summary?.results || scanResults;
  
  console.group('🔒 Security Scan Results');
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const severityIcon = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
      info: 'ℹ️'
    }[result.severity];
    
    console.log(`${icon} ${result.check}: ${result.message}`);
    if (result.recommendation) {
      console.log(`   ${severityIcon} Recommendation: ${result.recommendation}`);
    }
  });
  
  console.groupEnd();
}

// Initialize
window.SecurityScanner = {
  scan: runSecurityScan,
  display: displayScanResults,
  getResults: () => scanResults
};

console.log('🔍 Security scanner ready. Run SecurityScanner.scan() to start');
