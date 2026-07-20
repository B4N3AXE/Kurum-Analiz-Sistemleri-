const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/ioInstance\.to\(\`kurum_\$\{student\.kurum_id\}\`\)\.emit/g, "ioInstance.to(`kurum_${studentClass ? studentClass.kurum_id : 1}`).emit");

fs.writeFileSync('server.ts', code);
console.log("Fixed kurum_id issue");
