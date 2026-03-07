/**
 * Patch ContentAgent.jsx to use the new BrandVoiceCard component
 * Run: node scripts/patch-content-agent.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'dashboard', 'src', 'pages', 'ContentAgent.jsx');

console.log('🔧 Patching ContentAgent.jsx with BrandVoiceCard...\n');

let content = fs.readFileSync(filePath, 'utf8');
let changed = false;

// Patch 1: Add BrandVoiceCard import after the last existing import
const oldImportLine = "} from 'react-icons/fa';";
const newImportLine = `} from 'react-icons/fa';
import BrandVoiceCard from '../components/BrandVoiceCard';`;

if (content.includes('BrandVoiceCard')) {
  console.log('⏭️  Patch 1: BrandVoiceCard import already exists');
} else if (content.includes(oldImportLine)) {
  content = content.replace(oldImportLine, newImportLine);
  console.log('✅ Patch 1: Added BrandVoiceCard import');
  changed = true;
} else {
  console.log('⚠️  Patch 1: Could not find import insertion point');
}

// Patch 2: Replace the Brand Voice section with BrandVoiceCard component
const oldBrandVoice = `            {/* Brand Voice */}
            <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FaEdit className="text-emerald-400" />
                Brand Voice
              </h2>

              {brandVoice ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                    <p className="text-[#a1a1aa]">Tone</p>
                    <p className="text-emerald-400 font-medium capitalize">{brandVoice.tone}</p>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                    <p className="text-[#a1a1aa]">Formality</p>
                    <p className="text-cyan-400 font-medium">{brandVoice.formality_level}/10</p>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                    <p className="text-[#a1a1aa]">Avg Length</p>
                    <p className="text-purple-400 font-medium">{brandVoice.avg_caption_length} chars</p>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                    <p className="text-[#a1a1aa]">Emoji Usage</p>
                    <p className={\`font-medium \${brandVoice.emoji_usage ? 'text-amber-400' : 'text-[#52525b]'}\`}>
                      {brandVoice.emoji_usage ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <p className="text-[#a1a1aa]">Posts Analyzed</p>
                    <p className="text-white font-bold">{brandVoice.analyzed_post_count}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[#a1a1aa] text-sm mb-3">No brand voice analyzed yet</p>
                  <button
                    onClick={analyzeBrandVoice}
                    className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg hover:bg-emerald-500/30 transition-all font-medium"
                  >
                    Analyze Now
                  </button>
                </div>
              )}
            </div>`;

const newBrandVoice = `            {/* Brand Voice - Train My Voice */}
            <BrandVoiceCard brandVoice={brandVoice} onVoiceUpdated={setBrandVoice} />`;

if (content.includes('<BrandVoiceCard')) {
  console.log('⏭️  Patch 2: BrandVoiceCard already in use');
} else if (content.includes('{/* Brand Voice */}')) {
  content = content.replace(oldBrandVoice, newBrandVoice);
  if (content.includes('<BrandVoiceCard')) {
    console.log('✅ Patch 2: Replaced Brand Voice section with BrandVoiceCard');
    changed = true;
  } else {
    console.log('⚠️  Patch 2: Replacement did not match exactly. Try manual edit.');
    console.log('   Find: {/* Brand Voice */}');
    console.log('   Replace the entire Brand Voice <div> block with:');
    console.log('   <BrandVoiceCard brandVoice={brandVoice} onVoiceUpdated={setBrandVoice} />');
  }
} else {
  console.log('⚠️  Patch 2: Could not find Brand Voice section');
}

if (changed) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('\n✅ ContentAgent.jsx patched successfully!');
  console.log('   Run: cd dashboard && npm run build');
} else {
  console.log('\n⏭️  No changes needed or manual edits required.');
}
