/**
 * Simple icon generator for ReqSploit extension
 * Run with: node create-icons.js
 */

const fs = require('fs');
const path = require('path');

// Create icons directory
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Simple SVG icon template
const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>

  <!-- Letter R -->
  <text
    x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="Arial, sans-serif"
    font-weight="bold"
    font-size="${size * 0.6}"
    fill="white"
  >R</text>

  <!-- Small S overlay -->
  <circle cx="${size * 0.75}" cy="${size * 0.25}" r="${size * 0.18}" fill="#10B981"/>
  <text
    x="${size * 0.75}"
    y="${size * 0.25}"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="Arial, sans-serif"
    font-weight="bold"
    font-size="${size * 0.25}"
    fill="white"
  >S</text>
</svg>
`;

// Create SVG files (Chrome can use SVG for icons)
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(filename, svg.trim());
  console.log(`✓ Created ${filename}`);
});

console.log('\n✅ All icons created successfully!');
console.log('\nNote: Chrome extension prefers PNG icons.');
console.log('To convert SVG to PNG:');
console.log('1. Open each SVG in a browser');
console.log('2. Take a screenshot');
console.log('3. Save as PNG with the same filename');
console.log('\nOr use an online converter: https://convertio.co/svg-png/');
