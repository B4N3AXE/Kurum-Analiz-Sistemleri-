const fs = require('fs');
let code = fs.readFileSync('db.json', 'utf8');
let db = JSON.parse(code);
console.log(db.coupons);
