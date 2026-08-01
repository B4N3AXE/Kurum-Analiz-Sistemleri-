const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const helperFunc = `
function checkStudentLimit(req: any, db: any): { allowed: boolean; limit?: number; current?: number; error?: string } {
  const requester = getRequesterFromToken(req);
  if (!requester) return { allowed: false, error: 'Yetkisiz erişim' };
  
  const kurumId = requester.kurum_id || 1;
  const kurum = db.getKurumlar().find((k: any) => k.id === kurumId);
  const abonelik = kurum?.abonelik_turu || 'mikro';
  
  let limit = 25;
  if (abonelik === 'mikro') limit = 25;
  else if (abonelik === 'bronz') limit = 50;
  else if (abonelik === 'gumus') limit = 100;
  else if (abonelik === 'altin') limit = 150;
  else if (abonelik === 'platin') limit = 200;
  else if (abonelik === 'elmas' || abonelik === 'premium' || abonelik === 'trial') limit = 999999;
  
  const classIds = db.getSiniflar().filter((c: any) => c.kurum_id === kurumId).map((c: any) => c.id);
  const currentStudents = db.getOgrenciler().filter((s: any) => classIds.includes(s.sinif_id)).length;
  
  if (currentStudents >= limit) {
    return { allowed: false, limit, current: currentStudents, error: \`Öğrenci kapasiteniz (\${limit}) doldu. Daha fazla öğrenci ekleyebilmek için K.A.S Abonelik Paketleri bölümünden lisansınızı yükseltmelisiniz.\` };
  }
  
  return { allowed: true };
}
`;

// Insert the helper after checkStudentAccess
const regex = /function checkStudentAccess[\s\S]*?\n\}/;
code = code.replace(regex, (match) => match + "\n" + helperFunc);

// Insert checking into POST /api/students
const postStudentsRegex = /app\.post\('\/api\/students', \(req, res\) => \{\n\s*const \{ ad_soyad/g;
code = code.replace(postStudentsRegex, `app.post('/api/students', (req, res) => {\n  const limitCheck = checkStudentLimit(req, db);\n  if (!limitCheck.allowed) return res.status(403).json({ error: limitCheck.error });\n  const { ad_soyad`);

// Insert checking into POST /api/ogrenci
const postOgrenciRegex = /app\.post\('\/api\/ogrenci', \(req, res\) => \{\n\s*const \{ ad_soyad/g;
code = code.replace(postOgrenciRegex, `app.post('/api/ogrenci', (req, res) => {\n  const limitCheck = checkStudentLimit(req, db);\n  if (!limitCheck.allowed) return res.status(403).json({ error: limitCheck.error });\n  const { ad_soyad`);

// Insert checking into excel upload: /api/upload-students
const uploadExcelRegex = /app\.post\('\/api\/upload-students',[\s\S]*?const requester = getRequesterFromToken\(req\);\n\s*if \(!requester\) \{[\s\S]*?return res\.status\(401\).json\(\{ error: 'Yetkisiz erişim' \}\);\n\s*\}/;
const uploadExcelReplacement = `app.post('/api/upload-students', upload.single('file'), async (req, res) => {
  const requester = getRequesterFromToken(req);
  if (!requester) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }
  const limitCheck = checkStudentLimit(req, db);
  if (!limitCheck.allowed) {
    return res.status(403).json({ error: limitCheck.error });
  }`;
code = code.replace(uploadExcelRegex, uploadExcelReplacement);

fs.writeFileSync('server.ts', code);
console.log('server.ts student limits patched');
