const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Fix 1: match.tsx - broken import injection
function fixMatchImport() {
  const file = path.join(ROOT, 'app', 'smart-match', 'match.tsx');
  let content = fs.readFileSync(file, 'utf-8');
  
  // The broken pattern: "import {\nimport { Shadows }..." mixed line endings
  content = content.replace(
    /import \{\s*\n\s*import \{ Shadows \} from '@\/constants\/theme';\s*\n/,
    "import { Shadows } from '@/constants/theme';\r\nimport {\r\n"
  );
  
  fs.writeFileSync(file, content, 'utf-8');
  console.log('Fixed: match.tsx import');
}

// Fix 2: add-service.tsx - input style has inline shadow
function fixAddService() {
  const file = path.join(ROOT, 'app', 'add-service.tsx');
  let content = fs.readFileSync(file, 'utf-8');
  
  content = content.replace(
    /shadowColor: "#000",\s*\r?\n\s*shadowOffset: \{ width: 0, height: 1 \},\s*\r?\n\s*shadowOpacity: 0\.05,\s*\r?\n\s*shadowRadius: 1\.5,\s*\r?\n\s*elevation: 2,/,
    '...Shadows.sm,'
  );
  
  fs.writeFileSync(file, content, 'utf-8');
  console.log('Fixed: add-service.tsx input shadow');
}

// Fix 3: _layout.tsx - tabBarStyle inline shadow (negative offset - upward shadow)
function fixLayout() {
  const file = path.join(ROOT, 'app', '(tabs)', '_layout.tsx');
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace all 5 shadow lines with spread of Shadows.md but keep the negative offset conceptually
  // Using Shadows.md for the tab bar (medium elevation)
  content = content.replace(
    /shadowColor: '#000',\s*\r?\n\s*shadowOffset: \{ width: 0, height: -4 \},\s*\r?\n\s*shadowOpacity: 0\.05,\s*\r?\n\s*shadowRadius: 8,\s*\r?\n\s*elevation: 10,/,
    '...Shadows.md,\n          shadowOffset: { width: 0, height: -2 },'
  );
  
  fs.writeFileSync(file, content, 'utf-8');
  console.log('Fixed: _layout.tsx tabBar shadow');
}

// Fix 4: services.tsx filterFooter - upward shadow
function fixServices() {
  const file = path.join(ROOT, 'app', 'search', 'services.tsx');
  let content = fs.readFileSync(file, 'utf-8');
  
  content = content.replace(
    /shadowColor: "#000",\s*\r?\n\s*shadowOffset: \{ width: 0, height: -2 \},\s*\r?\n\s*shadowOpacity: 0\.05,\s*\r?\n\s*shadowRadius: 4,\s*\r?\n\s*elevation: 3,/,
    '...Shadows.sm,\n    shadowOffset: { width: 0, height: -2 },'
  );
  
  // Also fix the filterChipSelected and ratingButtonSelected that override with inline values
  // These are overrides for active state, which is fine to keep
  
  fs.writeFileSync(file, content, 'utf-8');
  console.log('Fixed: services.tsx filterFooter shadow');
}

// Fix 5: become-creator.tsx - green colored shadow on trustBanner (intentional colored glow)
function fixBecomeCreator() {
  const file = path.join(ROOT, 'app', 'onboarding', 'become-creator.tsx');
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace the colored shadow with Shadows.sm + override shadowColor
  content = content.replace(
    /shadowColor: '#10b981',\s*\r?\n\s*shadowOffset: \{ width: 0, height: 4 \},\s*\r?\n\s*shadowOpacity: 0\.1,\s*\r?\n\s*shadowRadius: 8,\s*\r?\n\s*elevation: 3/,
    "...Shadows.lg,\n    shadowColor: '#10b981'"
  );
  
  fs.writeFileSync(file, content, 'utf-8');
  console.log('Fixed: become-creator.tsx trustBanner shadow');
}

// Fix 6: AnalyticsScreen.tsx
function fixAnalytics() {
  const file = path.join(ROOT, 'app', '(tabs)', 'AnalyticsScreen.tsx');
  let content = fs.readFileSync(file, 'utf-8');
  
  // Pattern: shadowColor + shadowOffset + shadowOpacity + shadowRadius + elevation
  content = content.replace(
    /shadowColor: '#000',\s*\r?\n\s*shadowOffset: \{ width: 0, height: (\d+) \},\s*\r?\n\s*shadowOpacity: ([\d.]+),\s*\r?\n\s*shadowRadius: (\d+),\s*\r?\n\s*elevation: (\d+),?/g,
    (match, height, opacity, radius, elev) => {
      const op = parseFloat(opacity);
      const rad = parseInt(radius);
      let tier = 'md';
      if (op <= 0.08 && rad <= 2) tier = 'sm';
      else if (op <= 0.12 && rad <= 5) tier = 'md';
      else if (op <= 0.15 && rad <= 10) tier = 'lg';
      else tier = 'xl';
      return `...Shadows.${tier},`;
    }
  );
  
  // Add import if needed
  if (content.includes('...Shadows.') && !content.match(/import[^;]*Shadows[^;]*from/)) {
    const themeImportRegex = /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*\/constants\/theme|@\/constants\/theme)['"]/;
    const themeMatch = content.match(themeImportRegex);
    if (themeMatch) {
      const existingImports = themeMatch[1].trim();
      if (!existingImports.includes('Shadows')) {
        content = content.replace(
          themeImportRegex,
          `import { ${existingImports}, Shadows } from '${themeMatch[2]}'`
        );
      }
    } else {
      // Add new import
      const lastImportIdx = content.lastIndexOf('\nimport ');
      if (lastImportIdx !== -1) {
        const endOfLine = content.indexOf('\n', lastImportIdx + 1);
        content = content.slice(0, endOfLine + 1) +
          "import { Shadows } from '@/constants/theme';\n" +
          content.slice(endOfLine + 1);
      }
    }
  }
  
  fs.writeFileSync(file, content, 'utf-8');
  console.log('Fixed: AnalyticsScreen.tsx shadows');
}

// Fix 7: AdminDashboardScreen.tsx - red colored shadow
function fixAdminDashboard() {
  const file = path.join(ROOT, 'app', '(tabs)', 'AdminDashboardScreen.tsx');
  let content = fs.readFileSync(file, 'utf-8');
  
  // This is an inline colored shadow - replace with Shadows preset + color override
  content = content.replace(
    /shadowColor: '#ef4444',\s*\r?\n\s*shadowOffset: \{ width: 0, height: (\d+) \},\s*\r?\n\s*shadowOpacity: ([\d.]+),\s*\r?\n\s*shadowRadius: (\d+),\s*\r?\n\s*elevation: (\d+),?/g,
    "...Shadows.lg,\n        shadowColor: '#ef4444',"
  );
  
  // Add import if needed
  if (content.includes('...Shadows.') && !content.match(/import[^;]*Shadows[^;]*from/)) {
    const themeImportRegex = /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*\/constants\/theme|@\/constants\/theme)['"]/;
    const themeMatch = content.match(themeImportRegex);
    if (themeMatch) {
      const existingImports = themeMatch[1].trim();
      if (!existingImports.includes('Shadows')) {
        content = content.replace(
          themeImportRegex,
          `import { ${existingImports}, Shadows } from '${themeMatch[2]}'`
        );
      }
    } else {
      const lastImportIdx = content.lastIndexOf('\nimport ');
      if (lastImportIdx !== -1) {
        const endOfLine = content.indexOf('\n', lastImportIdx + 1);
        content = content.slice(0, endOfLine + 1) +
          "import { Shadows } from '@/constants/theme';\n" +
          content.slice(endOfLine + 1);
      }
    }
  }
  
  fs.writeFileSync(file, content, 'utf-8');
  console.log('Fixed: AdminDashboardScreen.tsx shadow');
}

// Run all fixes
fixMatchImport();
fixAddService();
fixLayout();
fixServices();
fixBecomeCreator();
fixAnalytics();
fixAdminDashboard();

console.log('\nAll remaining fixes applied.');
