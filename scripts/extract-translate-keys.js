const fs = require('fs');
const path = require('path');

const srcDir = './src';
const htmlRegex = /{{\s*'([^']+)'[^}]*\|\s*translate\s*}}/g;
const tsRegex = /this\.translate\.instant\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
const keys = new Set();

function scanDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.html') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      let match;
      if (file.endsWith('.html')) {
        while ((match = htmlRegex.exec(content)) !== null) {
          keys.add(match[1]);
        }
      } else if (file.endsWith('.ts')) {
        while ((match = tsRegex.exec(content)) !== null) {
          keys.add(match[1]);
        }
      }
    }
  });
}

scanDir(srcDir);

const result = {};
keys.forEach(key => result[key] = key);

const outPath = './src/assets/i18n/en.json';
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`Extracted ${keys.size} keys to ${outPath}`);