#!/bin/bash

# Week 3 Days 1-2: Resource Optimization Script
# Adds resource hints and optimizes CSS/font loading

echo "🚀 Starting Resource Optimization for Week 3 Days 1-2..."

# Function to add resource hints to HTML files
optimize_html() {
    local file="$1"
    echo "  📄 Optimizing $file..."
    
    # Check if already optimized
    if grep -q "<!-- Resource Optimization -->" "$file"; then
        echo "    ⏭️  Already optimized, skipping..."
        return
    fi
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Add resource hints after charset meta tag
    awk '
    /<meta charset=/ {
        print
        print "    <!-- Resource Optimization -->"
        print "    <!-- DNS Prefetch for external resources -->"
        print "    <link rel=\"dns-prefetch\" href=\"https://cdnjs.cloudflare.com\">"
        print "    <link rel=\"dns-prefetch\" href=\"https://fonts.googleapis.com\">"
        print "    <link rel=\"dns-prefetch\" href=\"https://fonts.gstatic.com\">"
        print "    <link rel=\"dns-prefetch\" href=\"https://cdn.jsdelivr.net\">"
        print "    "
        print "    <!-- Preconnect to critical origins -->"
        print "    <link rel=\"preconnect\" href=\"https://cdnjs.cloudflare.com\" crossorigin>"
        print "    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">"
        print "    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>"
        next
    }
    
    # Optimize Font Awesome loading
    /<link rel="stylesheet" href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome/ {
        print "    <!-- Critical CSS: Font Awesome with async loading -->"
        print "    <link rel=\"preload\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\" as=\"style\" onload=\"this.onload=null;this.rel='stylesheet'\">"
        print "    <noscript><link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\"></noscript>"
        next
    }
    
    # Optimize Google Fonts loading
    /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=/ {
        # Extract the href
        match($0, /href="([^"]+)"/, arr)
        if (arr[1]) {
            print "    <!-- Optimized Google Fonts loading -->"
            print "    <link rel=\"preload\" href=\"" arr[1] "\" as=\"style\" onload=\"this.onload=null;this.rel='stylesheet'\">"
            print "    <noscript><link rel=\"stylesheet\" href=\"" arr[1] "\"></noscript>"
        }
        next
    }
    
    { print }
    ' "$file.backup" > "$file"
    
    echo "    ✅ Optimized"
}

# Find all HTML files and optimize them
html_files=$(find . -maxdepth 1 -name "*.html" -not -name "ROADMAP-TRACKER.html")

count=0
for file in $html_files; do
    optimize_html "$file"
    ((count++))
done

echo ""
echo "✅ Resource Optimization Complete!"
echo "📊 Optimized $count HTML files"
echo ""
echo "🎯 Improvements:"
echo "   • Added DNS prefetch for external resources"
echo "   • Added preconnect to critical origins"
echo "   • Async loading for Font Awesome CSS"
echo "   • Async loading for Google Fonts"
echo "   • Reduced render-blocking resources"
echo ""

