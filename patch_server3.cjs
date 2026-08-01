const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const saveRegex = /app\.post\('\/api\/pdf\/save', \(req, res\) => \{\n\s*try \{/g;
code = code.replace(saveRegex, `app.post('/api/pdf/save', (req, res) => {\n  try {\n    const limitCheck = checkStudentLimit(req, db);\n    if (!limitCheck.allowed) return res.status(403).json({ error: limitCheck.error });`);

fs.writeFileSync('server.ts', code);
console.log('server.ts pdf save limit patched');
