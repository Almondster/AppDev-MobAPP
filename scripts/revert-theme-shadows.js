const fs = require('fs');

try {
  let f = 'constants/theme.ts';
  let cnt = fs.readFileSync(f, 'utf8');
  
  // Revert the debug shadow bumps
  cnt = cnt.replace(/shadowOpacity: 0.25/g, 'shadowOpacity: 0.10');
  cnt = cnt.replace(/shadowRadius: 10/g, 'shadowRadius: 4');
  
  fs.writeFileSync(f, cnt);
  console.log('Reverted theme.ts shadow opacity/radius to normal aesthetic levels');
} catch (e) {
  console.error(e.message);
}
