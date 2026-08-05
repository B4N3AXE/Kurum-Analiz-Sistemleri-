const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldCondition = `{(isAdminLoggedIn || !["rev-1", "rev-2", "rev-3", "rev-4"].includes(rev.id)) && (`;
const newCondition = `{isAdminLoggedIn && (`;

if (code.includes(oldCondition)) {
  code = code.replace(oldCondition, newCondition);
  fs.writeFileSync('src/App.tsx', code);
  console.log('patched delete button');
} else {
  console.log('could not find old condition');
}
