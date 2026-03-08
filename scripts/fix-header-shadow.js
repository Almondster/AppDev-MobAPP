const fs = require('fs');

try {
  let file = 'app/(tabs)/ManageService.tsx';
  let cnt = fs.readFileSync(file, 'utf8');

  // Find the header structure and add ...Shadows.md
  // Using more robust regex matching taking into account line breaks
  const headerRegex = /  header: \{\s*\r?\n\s*paddingTop: 60,\s*\r?\n\s*paddingHorizontal: 24,\s*\r?\n\s*paddingBottom: 24,\s*\r?\n\s*borderBottomLeftRadius: 24,\s*\r?\n\s*borderBottomRightRadius: 24\s*\r?\n\s*\}/g;
  
  const headerReplace = `  header: {\n    paddingTop: 60,\n    paddingHorizontal: 24,\n    paddingBottom: 24,\n    borderBottomLeftRadius: 24,\n    borderBottomRightRadius: 24,\n    ...Shadows.md,\n  }`;

  cnt = cnt.replace(headerRegex, headerReplace);

  // Remove the aggressive red shadow debug block from the card style
  cnt = cnt.replace(/\s*shadowColor: 'red',\s*\r?\n\s*shadowOpacity: 0\.9,\s*\r?\n\s*shadowRadius: 15,\s*\r?\n\s*elevation: 15,?\s*/g, '\n');

  fs.writeFileSync(file, cnt);
  console.log('Fixed header and reverted card red shadows');
} catch (e) {
  console.error(e.message);
}
