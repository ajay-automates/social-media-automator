const fs = require('fs');
const path = require('path');

console.log('');
console.log('🔍 PRE-BUILD CHECK: Verifying source code...');
console.log('='.repeat(50));

const settingsPath = path.join(__dirname, 'dashboard', 'src', 'pages', 'Settings.jsx');

if (!fs.existsSync(settingsPath)) {
  console.log('❌ ERROR: Settings.jsx not found!');
  process.exit(1);
}

const content = fs.readFileSync(settingsPath, 'utf8');

const checks = {
  'connectYouTube function': content.includes('const connectYouTube'),
  'Connect YouTube button text': content.includes('Connect YouTube'),
  'YouTube OAuth URL': content.includes('/auth/youtube/url'),
  'onClick handler': content.includes('onClick={connectYouTube}')
};

console.log('');
console.log('Source code checks:');
for (const [check, result] of Object.entries(checks)) {
  console.log('  ' + check + ':', result ? '✅ FOUND' : '❌ MISSING');
}

const allPassed = Object.values(checks).every(v => v);

console.log('');
if (allPassed) {
  console.log('✅ ALL CHECKS PASSED - Source code has YouTube button!');
  console.log('='.repeat(50));
  process.exit(0);
} else {
  console.log('❌ CHECKS FAILED - Source code is missing YouTube code!');
  console.log('='.repeat(50));
  process.exit(1);
}
