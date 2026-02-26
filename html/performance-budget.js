/**
 * Performance Budget Monitor
 * Track and enforce performance budgets for assets and metrics
 */

// Performance budgets
const BUDGETS = {
  // Asset sizes (in bytes)
  assets: {
    javascript: 500 * 1024,      // 500 KB
    css: 150 * 1024,             // 150 KB
    images: 1000 * 1024,         // 1 MB
    fonts: 200 * 1024,           // 200 KB
    total: 2000 * 1024           // 2 MB
  },
  
  // Core Web Vitals
  metrics: {
    LCP: 2500,    // Largest Contentful Paint (ms)
    FID: 100,     // First Input Delay (ms)
    CLS: 0.1,     // Cumulative Layout Shift
    FCP: 1800,    // First Contentful Paint (ms)
    TTFB: 600     // Time to First Byte (ms)
  },
  
  // Resource counts
  resources: {
    scripts: 20,
    stylesheets: 10,
    images: 50,
    fonts: 5
  }
};

/**
 * Check asset size budget
 */
function checkAssetBudget() {
  const results = {
    passed: true,
    details: {},
    totalSize: 0,
    violations: []
  };
  
  const resources = performance.getEntriesByType('resource');
  
  const byType = {
    javascript: 0,
    css: 0,
    images: 0,
    fonts: 0,
    other: 0
  };
  
  resources.forEach(resource => {
    const size = resource.transferSize || 0;
    results.totalSize += size;
    
    if (resource.name.match(/\.js$/i)) {
      byType.javascript += size;
    } else if (resource.name.match(/\.css$/i)) {
      byType.css += size;
    } else if (resource.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
      byType.images += size;
    } else if (resource.name.match(/\.(woff|woff2|ttf|otf|eot)$/i)) {
      byType.fonts += size;
    } else {
      byType.other += size;
    }
  });
  
  // Check budgets
  Object.keys(byType).forEach(type => {
    if (BUDGETS.assets[type]) {
      const budget = BUDGETS.assets[type];
      const actual = byType[type];
      const percentUsed = ((actual / budget) * 100).toFixed(1);
      
      results.details[type] = {
        budget: budget,
        actual: actual,
        percentUsed: percentUsed,
        over: actual > budget
      };
      
      if (actual > budget) {
        results.passed = false;
        results.violations.push({
          type: type,
          budget: budget,
          actual: actual,
          overage: actual - budget
        });
      }
    }
  });
  
  // Check total
  if (results.totalSize > BUDGETS.assets.total) {
    results.passed = false;
    results.violations.push({
      type: 'total',
      budget: BUDGETS.assets.total,
      actual: results.totalSize,
      overage: results.totalSize - BUDGETS.assets.total
    });
  }
  
  return results;
}

/**
 * Check Web Vitals budget
 */
async function checkMetricsBudget() {
  return new Promise((resolve) => {
    const results = {
      passed: true,
      details: {},
      violations: []
    };
    
    // Import Web Vitals
    import('https://cdn.jsdelivr.net/npm/web-vitals@3/dist/web-vitals.js')
      .then(({ onLCP, onFID, onCLS, onFCP, onTTFB }) => {
        const checkMetric = (name, value) => {
          const budget = BUDGETS.metrics[name];
          if (budget) {
            const percentUsed = ((value / budget) * 100).toFixed(1);
            
            results.details[name] = {
              budget: budget,
              actual: value,
              percentUsed: percentUsed,
              over: value > budget
            };
            
            if (value > budget) {
              results.passed = false;
              results.violations.push({
                type: name,
                budget: budget,
                actual: value,
                overage: value - budget
              });
            }
          }
        };
        
        onLCP((metric) => checkMetric('LCP', metric.value));
        onFID((metric) => checkMetric('FID', metric.value));
        onCLS((metric) => checkMetric('CLS', metric.value));
        onFCP((metric) => checkMetric('FCP', metric.value));
        onTTFB((metric) => checkMetric('TTFB', metric.value));
        
        // Wait a bit for metrics to collect
        setTimeout(() => resolve(results), 3000);
      })
      .catch(err => {
        console.error('Failed to load Web Vitals', err);
        resolve(results);
      });
  });
}

/**
 * Check resource count budget
 */
function checkResourceBudget() {
  const results = {
    passed: true,
    details: {},
    violations: []
  };
  
  const counts = {
    scripts: document.querySelectorAll('script').length,
    stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
    images: document.querySelectorAll('img').length,
    fonts: performance.getEntriesByType('resource')
      .filter(r => r.name.match(/\.(woff|woff2|ttf|otf|eot)$/i)).length
  };
  
  Object.keys(counts).forEach(type => {
    const budget = BUDGETS.resources[type];
    const actual = counts[type];
    const percentUsed = ((actual / budget) * 100).toFixed(1);
    
    results.details[type] = {
      budget: budget,
      actual: actual,
      percentUsed: percentUsed,
      over: actual > budget
    };
    
    if (actual > budget) {
      results.passed = false;
      results.violations.push({
        type: type,
        budget: budget,
        actual: actual,
        overage: actual - budget
      });
    }
  });
  
  return results;
}

/**
 * Format bytes
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Run complete budget check
 */
export async function checkPerformanceBudgets() {
  console.log('📊 Checking performance budgets...');
  
  const assetCheck = checkAssetBudget();
  const resourceCheck = checkResourceBudget();
  const metricsCheck = await checkMetricsBudget();
  
  const allPassed = assetCheck.passed && resourceCheck.passed && metricsCheck.passed;
  const totalViolations = assetCheck.violations.length + 
                          resourceCheck.violations.length + 
                          metricsCheck.violations.length;
  
  const summary = {
    passed: allPassed,
    totalViolations: totalViolations,
    assets: assetCheck,
    resources: resourceCheck,
    metrics: metricsCheck
  };
  
  console.log(`${allPassed ? '✅' : '❌'} Performance Budget: ${allPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`Total violations: ${totalViolations}`);
  
  return summary;
}

/**
 * Display budget results
 */
export function displayBudgetResults(summary) {
  console.group('📊 Performance Budget Report');
  
  // Asset budgets
  console.group('💾 Asset Sizes');
  Object.entries(summary.assets.details).forEach(([type, data]) => {
    const icon = data.over ? '🔴' : '✅';
    console.log(`${icon} ${type}: ${formatBytes(data.actual)} / ${formatBytes(data.budget)} (${data.percentUsed}%)`);
  });
  console.log(`Total: ${formatBytes(summary.assets.totalSize)} / ${formatBytes(BUDGETS.assets.total)}`);
  console.groupEnd();
  
  // Resource counts
  console.group('📦 Resource Counts');
  Object.entries(summary.resources.details).forEach(([type, data]) => {
    const icon = data.over ? '🔴' : '✅';
    console.log(`${icon} ${type}: ${data.actual} / ${data.budget} (${data.percentUsed}%)`);
  });
  console.groupEnd();
  
  // Metrics
  console.group('⚡ Core Web Vitals');
  Object.entries(summary.metrics.details).forEach(([type, data]) => {
    const icon = data.over ? '🔴' : '✅';
    const unit = type === 'CLS' ? '' : 'ms';
    console.log(`${icon} ${type}: ${data.actual.toFixed(1)}${unit} / ${data.budget}${unit} (${data.percentUsed}%)`);
  });
  console.groupEnd();
  
  // Violations
  if (summary.totalViolations > 0) {
    console.group(`🔴 ${summary.totalViolations} Budget Violations`);
    [...summary.assets.violations, ...summary.resources.violations, ...summary.metrics.violations]
      .forEach(v => {
        const unit = v.type === 'CLS' ? '' : (typeof v.budget === 'string' ? '' : ' B');
        console.warn(`${v.type}: ${formatBytes(v.overage)} over budget`);
      });
    console.groupEnd();
  }
  
  console.groupEnd();
}

// Initialize
window.PerformanceBudget = {
  check: checkPerformanceBudgets,
  display: displayBudgetResults,
  budgets: BUDGETS
};

console.log('📊 Performance budget monitor ready. Run PerformanceBudget.check() to start');
