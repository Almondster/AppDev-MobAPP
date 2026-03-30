const fs = require('fs');

try {
  let f1 = 'app/add-service.tsx';
  let c1 = fs.readFileSync(f1, 'utf8');
  fs.writeFileSync(f1, c1.replace('...Shadows.sm,', '...(Shadows.sm as any),'));
  console.log('Fixed add-service.tsx');
} catch(e) { console.error('Error in add-service.tsx:', e); }

try {
  let f2 = 'app/onboarding/become-creator.tsx';
  let c2 = fs.readFileSync(f2, 'utf8');
  fs.writeFileSync(f2, c2.replace('...Shadows.md,', '...(Shadows.md as any),'));
  console.log('Fixed become-creator.tsx');
} catch(e) { console.error('Error in become-creator.tsx:', e); }

try {
  let f3 = 'app/(tabs)/message.tsx';
  let c3 = fs.readFileSync(f3, 'utf8');
  c3 = c3.replace(
    'inputContainer: { backgroundColor: theme.inputBackground },\\n    inputText: { color: theme.text },',
    'input: { backgroundColor: theme.inputBackground, color: theme.text },'
  );
  c3 = c3.replace(
    'input: { backgroundColor: theme.inputBackground, color: theme.text },',
    'inputContainer: { backgroundColor: theme.inputBackground },\n    inputText: { color: theme.text },'
  );
  c3 = c3.replace(
    '<View style={[styles.searchBarContainer, themeStyles.input]}>',
    '<View style={[styles.searchBarContainer, themeStyles.inputContainer]}>'
  );
  c3 = c3.replace(
    'style={[styles.searchInput, { color: theme.text }]}',
    'style={[styles.searchInput, themeStyles.inputText]}'
  );
  fs.writeFileSync(f3, c3);
  console.log('Fixed message.tsx');
} catch(e) { console.error('Error in message.tsx:', e); }
