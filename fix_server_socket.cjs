const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const importsToAdd = `
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
`;

code = code.replace("import express from 'express';", "import express from 'express';\n" + importsToAdd);

const appDef = "const app = express();";
const socketDef = `
const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join_kurum', (kurumId) => {
    socket.join(\`kurum_\${kurumId}\`);
  });
});
`;
code = code.replace(appDef, socketDef);

const activeSessionEndpoint = /app\.post\('\/api\/ogrenci\/:id\/aktif-seans',[\s\S]*?res\.json\(\{ success: true, activeSession: activeSessions\[studentId\] \}\);\n\}\);/;
const match = code.match(activeSessionEndpoint);
if (match) {
  const newEndpoint = `
app.post('/api/ogrenci/:id/aktif-seans', (req, res) => {
  const studentId = Number(req.params.id);
  const access = checkStudentAccess(req, studentId);
  if (!access.allowed) {
    return res.status(access.status || 403).json({ error: access.error });
  }

  const { ders_adi, mod, kalan_sure, toplam_sure, calisiyor } = req.body;
  
  activeSessions[studentId] = {
    ders_adi: ders_adi || 'Genel Çalışma',
    mod: mod || 'pomodoro',
    kalan_sure: typeof kalan_sure === 'number' ? kalan_sure : 0,
    toplam_sure: typeof toplam_sure === 'number' ? toplam_sure : 1500,
    calisiyor: Boolean(calisiyor),
    son_guncelleme: new Date().toISOString()
  };
  
  // Real-time broadcast to dashboard
  const student = db.getOgrenciler().find(s => s.id === studentId);
  if (student) {
    const ioInstance = req.app.get('io');
    const studentClass = db.getSiniflar().find(c => c.id === student.sinif_id);
    ioInstance.to(\`kurum_\${student.kurum_id}\`).emit('session_update', {
      id: student.id,
      ad_soyad: student.ad_soyad,
      sinif_adi: studentClass?.ad || 'Sınıf Yok',
      ders_adi: activeSessions[studentId].ders_adi,
      mod: activeSessions[studentId].mod,
      kalan_sure: activeSessions[studentId].kalan_sure,
      toplam_sure: activeSessions[studentId].toplam_sure,
      calisiyor: activeSessions[studentId].calisiyor
    });
  }

  res.json({ success: true, activeSession: activeSessions[studentId] });
});
`;
  code = code.replace(match[0], newEndpoint.trim());
}

// Replace app.listen with httpServer.listen
code = code.replace(/app\.listen\(PORT,/g, 'httpServer.listen(PORT,');

fs.writeFileSync('server.ts', code);
console.log("Socket.io integrated into server.ts");
