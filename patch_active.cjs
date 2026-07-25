const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    Object.entries(activeSessions).forEach(([idStr, session]) => {
      const sId = Number(idStr);
      const sessionWithClean = getStudentActiveSession(sId);
      if (sessionWithClean && sessionWithClean.calisiyor) {
        const student = db.getOgrenciler().find(s => s.id === sId);
        if (student && (assignedClassIds.length === 0 || assignedClassIds.includes(student.sinif_id))) {`;

const replacement = `    Object.entries(activeSessions).forEach(([idStr, session]) => {
      const sId = Number(idStr);
      const sessionWithClean = getStudentActiveSession(sId);
      if (sessionWithClean && sessionWithClean.calisiyor) {
        const student = students.find(s => s.id === sId); // Use the already filtered students array
        if (student && (assignedClassIds.length === 0 || assignedClassIds.includes(student.sinif_id))) {`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
console.log("PATCHED ACTIVE");
