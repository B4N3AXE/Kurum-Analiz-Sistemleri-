import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const similarityFunc = `
function calculateSimilarity(str1, str2) {
  const normalize = (s) => {
    return s.toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');
  };
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.round((Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)) * 100);
  }
  
  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) matrix[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return Math.max(0, Math.round(((maxLength - distance) / maxLength) * 100));
}
`;

const replaceTarget = `
    // Map and match with existing students in DB
    const students = db.getOgrenciler();
    const results = parsedResults.map((parsed: any) => {
      const parsedName = parsed.okunan_isim || parsed.ad_soyad || 'Bilinmeyen Öğrenci';
      const normalizedParsedName = parsedName.toLowerCase().replace(/\\s/g, '');
      
      let matchedStudent = students.find(s => s.ad_soyad.toLowerCase().replace(/\\s/g, '') === normalizedParsedName);
      if (!matchedStudent) {
        matchedStudent = students.find(s => {
          const sName = s.ad_soyad.toLowerCase();
          const pName = parsedName.toLowerCase();
          return sName.includes(pName) || pName.includes(sName);
        });
      }
`;

const replaceWith = `
    // Map and match with existing students in DB
    const students = db.getOgrenciler();
    const results = parsedResults.map((parsed: any) => {
      const parsedName = parsed.okunan_isim || parsed.ad_soyad || 'Bilinmeyen Öğrenci';
      
      let matchedStudent = null;
      let highestSimilarity = 0;

      students.forEach(s => {
        const sim = calculateSimilarity(s.ad_soyad, parsedName);
        if (sim > highestSimilarity) {
          highestSimilarity = sim;
          matchedStudent = s;
        }
      });

      // Eşleşme oranını threshold ile kontrol et
      if (highestSimilarity < 40) {
        matchedStudent = null; // Too low similarity
      }
`;

if (!code.includes('function calculateSimilarity')) {
  code = similarityFunc + "\n" + code;
}

code = code.replace(/const students = db\.getOgrenciler\(\);\s+const results = parsedResults\.map\(\(parsed: any\) => \{\s+const parsedName = parsed\.okunan_isim \|\| parsed\.ad_soyad \|\| 'Bilinmeyen Öğrenci';\s+const normalizedParsedName = parsedName\.toLowerCase\(\)\.replace\(\/\\s\/g, ''\);\s+let matchedStudent = students\.find\(s => s\.ad_soyad\.toLowerCase\(\)\.replace\(\/\\s\/g, ''\) === normalizedParsedName\);\s+if \(\!matchedStudent\) \{\s+matchedStudent = students\.find\(s => \{\s+const sName = s\.ad_soyad\.toLowerCase\(\);\s+const pName = parsedName\.toLowerCase\(\);\s+return sName\.includes\(pName\) \|\| pName\.includes\(sName\);\s+\}\);\s+\}/, replaceWith.trim());

// Also replace the eslesme_orani logic
code = code.replace(/eslesme_orani: matchedStudent \? 100 : 0,/, "eslesme_orani: matchedStudent ? highestSimilarity : 0,");

fs.writeFileSync('server.ts', code);
console.log('patched');
