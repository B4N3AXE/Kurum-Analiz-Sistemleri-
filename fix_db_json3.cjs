const fs = require('fs');
let db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

db.coupons = [
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
];

fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
