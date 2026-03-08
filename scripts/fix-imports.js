const fs = require('fs');

const filesToFix = [
  'app/(tabs)/order.tsx',
  'app/smart-match/loading.tsx',
  'app/smart-match/step2.tsx',
  'app/smart-match/step3.tsx',
  'app/smart-match/step4.tsx'
];

filesToFix.forEach(f => {
  try {
    let cnt = fs.readFileSync(f, 'utf8');
    // More flexible regex to catch various path formats for the theme import inside an open import block
    cnt = cnt.replace(/import\s*\{\s*\r?\n\s*import\s*\{\s*Shadows\s*\}\s*from\s*['"][^'"]*constants\/theme['"];\s*\r?\n/g, "import { Shadows } from '@/constants/theme';\nimport {\n");
    fs.writeFileSync(f, cnt);
    console.log('Fixed:', f);
  } catch (e) {
    console.error(`Error fixing ${f}:`, e.message);
  }
});
