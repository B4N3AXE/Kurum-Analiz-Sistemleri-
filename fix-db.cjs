const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
if (db.siniflar.length === 0) {
  db.siniflar.push({
    "id": 1,
    "ad": "12-A",
    "seviye": "12",
    "kurum_id": 1,
    "alan": "Sayısal"
  });
  db.siniflar.push({
    "id": 2,
    "ad": "Mezun",
    "seviye": "Mezun",
    "kurum_id": 1,
    "alan": "Eşit Ağırlık"
  });
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
  console.log("Fixed db.json by adding default class");
} else {
  console.log("Classes exist");
}
