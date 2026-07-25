const fs = require('fs');
let code = fs.readFileSync('db.json', 'utf8');

// The corrupted part is:
/*
  "coupons": [
    {
      "id": 1,
      "code": "YENISEZON10",
    },
    {
      "id": 2,
      "code": "KURUM100",
      "discount_type": "percentage",
      "discount_value": 100,
      "applies_to": "once",
      "active": true
    },
    {
      "id": 3,
      "code": "KAS100",
      "discount_type": "percentage",
      "discount_value": 100,
      "applies_to": "once",
      "active": true
      "discount_type": "percentage",
      "discount_value": 10,
      "applies_to": "once",
      "active": true
    }
  ],
*/

const newCoupons = `  "coupons": [
    {
      "id": 1,
      "code": "YENISEZON10",
      "discount_type": "percentage",
      "discount_value": 10,
      "applies_to": "once",
      "active": true
    },
    {
      "id": 2,
      "code": "KURUM100",
      "discount_type": "percentage",
      "discount_value": 100,
      "applies_to": "once",
      "active": true
    },
    {
      "id": 3,
      "code": "KAS100",
      "discount_type": "percentage",
      "discount_value": 100,
      "applies_to": "once",
      "active": true
    }
  ],`;

code = code.replace(/  "coupons": \[[\s\S]*?\],/, newCoupons);

fs.writeFileSync('db.json', code);
console.log("REPLACED");
