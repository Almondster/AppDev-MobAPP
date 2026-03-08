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
    
    // The previous regex removed the shadow size 'md' etc.
    // Replace the syntax error ",    ...Shadows.," with ",\n    ...Shadows.md,"
    cnt = cnt.replace(/,    \.\.\.Shadows\.,/g, ',\n    ...Shadows.md,');
    
    fs.writeFileSync(f, cnt);
    console.log('Fixed:', f);
  } catch (e) {
    console.error(`Error fixing ${f}:`, e.message);
  }
});
