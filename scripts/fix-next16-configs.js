const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      const regexRuntime = /export\s+const\s+runtime\s*=\s*['"][a-zA-Z]+['"];?\r?\n?/g;
      if (regexRuntime.test(content)) {
        content = content.replace(regexRuntime, '');
        changed = true;
      }

      const regexPPR = /export\s+const\s+experimental_ppr\s*=\s*(true|false);?\r?\n?/g;
      if (regexPPR.test(content)) {
        content = content.replace(regexPPR, '');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
