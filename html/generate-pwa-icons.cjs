// Simple PWA Icon Generator using Sharp
const fs = require('fs');
const path = require('path');

// Create assets/images directory if it doesn't exist
const assetsDir = path.join(process.cwd(), 'assets', 'images');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// For now, create SVG-based icons that will work as placeholders
const sizes = [64, 192, 512];

sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2E86AB;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00D4AA;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.125}"/>
  <text x="${size / 2}" y="${size * 0.6}" font-size="${size * 0.5}" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-weight="bold">LT</text>
</svg>`;

  fs.writeFileSync(path.join(assetsDir, `pwa-${size}x${size}.svg`), svg);
  console.log(`✓ Created pwa-${size}x${size}.svg`);
});

// Create maskable icon (with padding for safe zone)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2E86AB;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00D4AA;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#grad)" rx="64"/>
  <circle cx="256" cy="256" r="180" fill="rgba(255,255,255,0.2)"/>
  <text x="256" y="310" font-size="200" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-weight="bold">LT</text>
</svg>`;

fs.writeFileSync(path.join(assetsDir, 'maskable-icon-512x512.svg'), maskableSvg);
console.log('✓ Created maskable-icon-512x512.svg');

console.log('\n✅ PWA icons generated successfully!');
console.log('📁 Location: assets/images/');
