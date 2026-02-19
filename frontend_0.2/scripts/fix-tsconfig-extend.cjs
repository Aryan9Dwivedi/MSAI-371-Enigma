const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'node_modules', 'call-bind-apply-helpers', 'tsconfig.json');
if (fs.existsSync(p)) {
  let c = fs.readFileSync(p, 'utf8');
  if (/"extends":\s*"@ljharb\/tsconfig"/.test(c)) {
    c = c.replace(/"extends":\s*"@ljharb\/tsconfig"/, '"extends": "../@ljharb/tsconfig/tsconfig.json"');
    fs.writeFileSync(p, c);
  }
}
