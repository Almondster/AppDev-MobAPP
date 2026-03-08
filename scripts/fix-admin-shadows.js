const fs = require('fs');

const filesToFix = [
  'app/(tabs)/admin_users.tsx',
  'app/(tabs)/admin_projects.tsx',
  'app/(tabs)/admin_disputes.tsx',
  'app/(tabs)/AdminDashboardScreen.tsx'
];

filesToFix.forEach(f => {
  try {
    let cnt = fs.readFileSync(f, 'utf8');
    
    // Replace the block where they use Platform.select with just the shadow value.
    cnt = cnt.replace(/\s*\.\.\.Platform\.select\(\{\s*ios:\s*\{\s*\.\.\.Shadows\.(sm|md|lg|xl),\s*\},\s*android:\s*\{\s*elevation:\s*\d+,?\s*\}\s*\}\),?/g, '\n    ...Shadows.$1,');
    
    // AdminDashboardScreen has custom colored shadows in the Platform.select block, we need to handle that specifically
    if (f.includes('AdminDashboardScreen')) {
        // Red dispute card shadow
        cnt = cnt.replace(/\s*\.\.\.Platform\.select\(\{\s*ios:\s*\{\s*shadowColor:\s*['"]#ef4444['"],\s*shadowOffset:\s*\{\s*width:\s*0,\s*height:\s*4\s*\},\s*shadowOpacity:\s*0\.08,\s*shadowRadius:\s*8,?\s*\},\s*android:\s*\{\s*elevation:\s*4,?\s*\}\s*\}\),?/g, "\n    ...Shadows.md,\n    shadowColor: '#ef4444',");
    }

    fs.writeFileSync(f, cnt);
    console.log('Fixed wrapper in:', f);
  } catch (e) {
    console.error(`Error fixing ${f}:`, e.message);
  }
});
