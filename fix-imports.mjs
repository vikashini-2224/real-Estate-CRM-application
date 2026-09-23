import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('apps/backend/src');
files.forEach((file) => {
  if (file.endsWith('.ts')) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('@/lib/')) {
      const depth = file.split(path.sep).length - 4; // apps/backend/src = 3
      const relativePrefix = '../'.repeat(depth) + 'lib/';
      content = content.replace(/@\/lib\//g, relativePrefix);
      fs.writeFileSync(file, content);
      console.log(`Updated ${file} to use ${relativePrefix}`);
    }
  }
});
