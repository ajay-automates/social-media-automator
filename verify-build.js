const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying dashboard build...');

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

console.log('Checking', jsFiles.length, 'JavaScript files...');

let found = false;
for (const file of jsFiles) {
  const content = fs.readFileSync(path.join(assetsPath, file), 'utf8');
  if (content.includes('Connect YouTube') || content.includes('youtube')) {
    console.log('✅ YouTube button found in', file);
    found = true;
    break;
  }
}

if (found) {
  console.log('✅ Build verification PASSED!');
  process.exit(0);
} else {
  console.log('❌ YouTube button NOT found in any JS files');
  console.log('   Build may be using old source code');
  process.exit(1);
}
