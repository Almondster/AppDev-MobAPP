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
    
    // Remove unused Platform import
    cnt = cnt.replace(/,\s*Platform\b/g, '');
    
    fs.writeFileSync(f, cnt);
  } catch (e) {
    console.error(`Error fixing ${f}:`, e.message);
  }
});
