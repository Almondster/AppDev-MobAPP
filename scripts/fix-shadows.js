/**
 * Script to replace inline shadow definitions with centralized Shadows presets.
 *
 * Strategy:
 *  - Find every style block that has shadowColor + shadowOpacity + shadowRadius + shadowOffset + elevation
 *  - Based on the values, map to: sm, md, lg, or xl preset
 *  - Replace the 5 lines with `...Shadows.<tier>,`
 *  - Add `import { Shadows } from '..../constants/theme';` if not already imported
 *
 * Mapping rules (by shadowOpacity + shadowRadius):
 *   sm: opacity <= 0.08, radius <= 2   (subtle)
 *   md: opacity <= 0.12, radius <= 5   (cards, default)
 *   lg: opacity <= 0.15, radius <= 10  (overlays)
 *   xl: everything above              (prominent)
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// The files that contain shadows
const TARGET_FILES = [
  'components/profile/NotificationToggle.tsx',
  'components/profile/NotificationSectionHeader.tsx',
  'components/home/sections/HomeHeader.tsx',
  'components/home/modals/ServiceModal.tsx',
  'components/home/modals/BookingModal.tsx',
  'components/home/cards/ServiceCard.tsx',
  'components/home/cards/MatchCard.tsx',
  'components/home/cards/CreatorCard.tsx',
  'components/home/cards/CategoryCard.tsx',
  'app/smart-match/step4.tsx',
  'app/smart-match/step3.tsx',
  'app/smart-match/step2.tsx',
  'app/smart-match/match.tsx',
  'app/smart-match/loading.tsx',
  'app/search/subcategory.tsx',
  'app/search/services.tsx',
  'app/search/recentmatch.tsx',
  'app/search/creators.tsx',
  'app/register.tsx',
  'app/onboarding/become-creator.tsx',
  'app/notifications.tsx',
  'app/login.tsx',
  'app/creator/[id].tsx',
  'app/chat/[id].tsx',
  'app/add-service.tsx',
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/search.tsx',
  'app/(tabs)/profile.tsx',
  'app/(tabs)/order.tsx',
  'app/(tabs)/message.tsx',
  'app/(tabs)/ManageService.tsx',
  'app/(tabs)/AnalyticsScreen.tsx',
  'app/(tabs)/admin_users.tsx',
  'app/(tabs)/admin_projects.tsx',
  'app/(tabs)/admin_disputes.tsx',
  'app/(tabs)/AdminDashboardScreen.tsx',
];

const ROOT = path.resolve(__dirname, '..');

function determineTier(opacity, radius) {
  if (opacity <= 0.08 && radius <= 2) return 'sm';
  if (opacity <= 0.12 && radius <= 5) return 'md';
  if (opacity <= 0.15 && radius <= 10) return 'lg';
  return 'xl';
}

function getRelativeImportPath(filePath) {
  const fileDir = path.dirname(filePath);
  const themePath = path.join(ROOT, 'constants', 'theme');
  let rel = path.relative(fileDir, themePath).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

// Multi-line shadow block pattern: matches 4-5 consecutive shadow-related lines
// Handles both multi-line and single-line (inline object) patterns
const SHADOW_BLOCK_MULTILINE = /^(\s*)shadowColor:\s*["']#000["'],?\s*\r?\n\s*shadowOff(?:set)?: \{ width: 0, height: (\d+) \},?\s*\r?\n\s*shadowOpacity:\s*([\d.]+),?\s*\r?\n\s*shadowRadius:\s*(\d+),?\s*\r?\n\s*elevation:\s*(\d+),?/gm;

// Alternative order: shadowColor, shadowOpacity, shadowRadius, shadowOffset, elevation
const SHADOW_BLOCK_ALT = /^(\s*)shadowColor:\s*["']#000["'],?\s*\r?\n\s*shadowOpacity:\s*([\d.]+),?\s*\r?\n\s*shadowRadius:\s*(\d+),?\s*\r?\n\s*shadowOffset:\s*\{ width: 0, height: (\d+) \},?\s*\r?\n\s*elevation:\s*(\d+),?/gm;

function processFile(relPath) {
  const filePath = path.join(ROOT, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP (not found): ${relPath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;
  let shadowImportNeeded = false;

  // Pattern 1: Standard order (shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation)
  const pat1 = /^([ \t]*)shadowColor:\s*["']#000["'],?\s*\r?\n\s*shadowOffset:\s*\{\s*width:\s*0,\s*height:\s*(\d+)\s*\},?\s*\r?\n\s*shadowOpacity:\s*([\d.]+),?\s*\r?\n\s*shadowRadius:\s*(\d+),?\s*\r?\n\s*elevation:\s*(\d+),?/gm;

  content = content.replace(pat1, (match, indent, _height, opacityStr, radiusStr, _elev) => {
    const opacity = parseFloat(opacityStr);
    const radius = parseInt(radiusStr, 10);
    const tier = determineTier(opacity, radius);
    changed = true;
    shadowImportNeeded = true;
    return `${indent}...Shadows.${tier},`;
  });

  // Pattern 2: Alt order (shadowColor, shadowOpacity, shadowRadius, shadowOffset, elevation)
  const pat2 = /^([ \t]*)shadowColor:\s*["']#000["'],?\s*\r?\n\s*shadowOpacity:\s*([\d.]+),?\s*\r?\n\s*shadowRadius:\s*(\d+),?\s*\r?\n\s*shadowOffset:\s*\{\s*width:\s*0,\s*height:\s*(\d+)\s*\},?\s*\r?\n\s*elevation:\s*(\d+),?/gm;

  content = content.replace(pat2, (match, indent, opacityStr, radiusStr, _height, _elev) => {
    const opacity = parseFloat(opacityStr);
    const radius = parseInt(radiusStr, 10);
    const tier = determineTier(opacity, radius);
    changed = true;
    shadowImportNeeded = true;
    return `${indent}...Shadows.${tier},`;
  });

  // Pattern 3: Inline single-line pattern (e.g., in loading.tsx)
  const pat3 = /shadowColor:\s*["']#000["'],\s*shadowOffset:\s*\{\s*width:\s*0,\s*height:\s*(\d+)\s*\},\s*shadowOpacity:\s*([\d.]+),\s*shadowRadius:\s*(\d+),\s*elevation:\s*(\d+)/g;

  content = content.replace(pat3, (match, _height, opacityStr, radiusStr, _elev) => {
    const opacity = parseFloat(opacityStr);
    const radius = parseInt(radiusStr, 10);
    const tier = determineTier(opacity, radius);
    changed = true;
    shadowImportNeeded = true;
    return `...Shadows.${tier}`;
  });

  // Pattern 4: 4-line version without elevation
  const pat4 = /^([ \t]*)shadowColor:\s*["']#000["'],?\s*\r?\n\s*shadowOffset:\s*\{\s*width:\s*0,\s*height:\s*(\d+)\s*\},?\s*\r?\n\s*shadowOpacity:\s*([\d.]+),?\s*\r?\n\s*shadowRadius:\s*(\d+),?$/gm;

  content = content.replace(pat4, (match, indent, _height, opacityStr, radiusStr) => {
    // Check there's no elevation on next line — only replace if this stands alone
    const opacity = parseFloat(opacityStr);
    const radius = parseInt(radiusStr, 10);
    const tier = determineTier(opacity, radius);
    changed = true;
    shadowImportNeeded = true;
    return `${indent}...Shadows.${tier},`;
  });

  // Pattern 5: Inline style objects like `{ shadowColor: ..., shadowOffset: ..., shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 }`
  const pat5 = /shadowColor:\s*["']#000["'],?\s*\r?\n\s*shadowOffset:\s*\{\s*width:\s*0,\s*height:\s*(\d+)\s*\},?\s*\r?\n\s*shadowOpacity:\s*([\d.]+),?\s*\r?\n\s*shadowRadius:\s*(\d+),?\s*\r?\n\s*elevation:\s*(\d+)/g;

  content = content.replace(pat5, (match, _height, opacityStr, radiusStr, _elev) => {
    const opacity = parseFloat(opacityStr);
    const radius = parseInt(radiusStr, 10);
    const tier = determineTier(opacity, radius);
    changed = true;
    shadowImportNeeded = true;
    return `...Shadows.${tier}`;
  });

  if (shadowImportNeeded) {
    // Add Shadows to import if not already present
    if (!content.includes('Shadows')) {
      // Need to add import
      const importPath = getRelativeImportPath(filePath);

      // Check if there's already a theme import we can extend
      const themeImportRegex = /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*\/constants\/theme|@\/constants\/theme)['"]/;
      const themeMatch = content.match(themeImportRegex);

      if (themeMatch) {
        // Extend existing import
        const existingImports = themeMatch[1].trim();
        content = content.replace(
          themeImportRegex,
          `import { ${existingImports}, Shadows } from '${themeMatch[2]}'`
        );
      } else {
        // Check if using @/ alias pattern
        const usesAlias = content.includes("from '@/");
        const finalImportPath = usesAlias ? '@/constants/theme' : importPath;

        // Add new import after last import line
        const lastImportIdx = content.lastIndexOf('\nimport ');
        if (lastImportIdx !== -1) {
          const endOfLine = content.indexOf('\n', lastImportIdx + 1);
          content = content.slice(0, endOfLine + 1) +
            `import { Shadows } from '${finalImportPath}';\n` +
            content.slice(endOfLine + 1);
        } else {
          // Prepend
          content = `import { Shadows } from '${finalImportPath}';\n` + content;
        }
      }
    } else if (content.includes('Shadows') && !content.match(/import[^;]*Shadows[^;]*from/)) {
      // Shadows is used but not imported (was already in file but from spread)
      const importPath = getRelativeImportPath(filePath);
      const usesAlias = content.includes("from '@/");
      const finalImportPath = usesAlias ? '@/constants/theme' : importPath;

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
            `import { Shadows } from '${finalImportPath}';\n` +
            content.slice(endOfLine + 1);
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  UPDATED: ${relPath}`);
  } else {
    console.log(`  NO MATCH: ${relPath}`);
  }
}

console.log('Fixing shadow inconsistencies...\n');
let count = 0;
for (const f of TARGET_FILES) {
  processFile(f);
  count++;
}
console.log(`\nProcessed ${count} files.`);
