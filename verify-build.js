const fs = require('fs');
const path = require('path');

console.log('');
console.log('🔍 Verifying dashboard build...');

const distPath = path.join(__dirname, 'dashboard', 'dist');
const assetsPath = path.join(distPath, 'assets');

if (!fs.existsSync(distPath)) {
  console.log('❌ dashboard/dist directory does NOT exist');
  process.exit(1);
}

if (!fs.existsSync(assetsPath)) {
  console.log('❌ dashboard/dist/assets directory does NOT exist');
  process.exit(1);
}

// Check all JS files in assets folder
const files = fs.readdirSync(assetsPath);
const jsFiles = files.filter(f => f.endsWith('.js'));

console.log('Checking ' + jsFiles.length + ' JavaScript bundles for YouTube code...');

let foundYoutube = false;
let foundText = false;

for (const file of jsFiles) {
  const filePath = path.join(assetsPath, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const fileSize = (content.length / 1024).toFixed(2);
  
  console.log('  Checking ' + file + ' (' + fileSize + ' KB)...');
  
  // Check for various YouTube-related strings
  if (content.includes('Connect YouTube')) {
    console.log('    ✅ Found "Connect YouTube" text');
    foundText = true;
  }
  
  if (content.includes('connectYouTube')) {
    console.log('    ✅ Found connectYouTube function');
    foundYoutube = true;
  }
  
  if (content.includes('/auth/youtube/url')) {
    console.log('    ✅ Found YouTube OAuth URL');
    foundYoutube = true;
  }
  
  if (content.includes('youtube')) {
    console.log('    ✅ Found youtube references');
    foundYoutube = true;
  }
}

console.log('');
console.log('📊 Results:');
console.log('  YouTube function found:', foundYoutube ? '✅' : '❌');
console.log('  YouTube button text found:', foundText ? '✅' : '❌');

if (foundYoutube || foundText) {
  console.log('');
  console.log('✅ BUILD VERIFICATION PASSED!');
  console.log('   YouTube integration is in the build.');
  process.exit(0);
} else {
  console.log('');
  console.log('❌ BUILD VERIFICATION FAILED!');
  console.log('   YouTube code NOT found in JavaScript bundles.');
  console.log('   This means the build is using old source code.');
  process.exit(1);
}
