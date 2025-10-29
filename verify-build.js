const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying dashboard build...');

const distPath = path.join(__dirname, 'dashboard', 'dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(distPath)) {
  console.log('❌ dashboard/dist directory does NOT exist');
  console.log('   Build did not run or failed!');
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  console.log('❌ dashboard/dist/index.html does NOT exist');
  console.log('   Build did not complete!');
  process.exit(1);
}

const indexContent = fs.readFileSync(indexPath, 'utf8');

if (indexContent.includes('Connect YouTube') || indexContent.includes('youtube')) {
  console.log('✅ YouTube button found in built index.html!');
  process.exit(0);
} else {
  console.log('⚠️  index.html exists but YouTube button not found');
  console.log('   Possible old build');
  process.exit(1);
}
