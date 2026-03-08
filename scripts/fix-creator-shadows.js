const fs = require('fs');

try {
  let file = 'app/(tabs)/ManageService.tsx';
  let cnt = fs.readFileSync(file, 'utf8');
  
  // Find "marginBottom: 16" specifically in "card:" and replace with "marginBottom: 16,\n    ...Shadows.md,"
  cnt = cnt.replace(/  card: \{\s*\n\s*borderRadius: 16,\s*\n\s*padding: 16,\s*\n\s*marginBottom: 16\s*\n\s*\}/g, 
    "  card: {\n    borderRadius: 16,\n    padding: 16,\n    marginBottom: 16,\n    ...Shadows.md\n  }");

  // Also verify that the theme import is right, there's already `import { Shadows } from '@/constants/theme';`
  
  fs.writeFileSync(file, cnt);
  console.log('Fixed ManageServices card shadows');
} catch (e) {
  console.error(e.message);
}

try {
  let f = 'constants/theme.ts';
  let cnt = fs.readFileSync(f, 'utf8');
  // Boost elevations slightly for Android visibility
  cnt = cnt.replace(/elevation: 1/g, 'elevation: 2');
  cnt = cnt.replace(/elevation: 2/g, 'elevation: 5');
  cnt = cnt.replace(/elevation: 4/g, 'elevation: 8');
  cnt = cnt.replace(/elevation: 8/g, 'elevation: 12');
  fs.writeFileSync(f, cnt);
  console.log('Fixed theme elevations');
} catch (e) {
  console.error(e.message);
}
