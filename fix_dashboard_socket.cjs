const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const importsToAdd = `
import { io } from 'socket.io-client';
`;
code = code.replace("import React,", importsToAdd + "\nimport React,");

const hookRegex = /useEffect\(\(\) => \{\s*const fetchStats = async \(silent = false\) => \{[\s\S]*?return \(\) => clearInterval\(interval\);\s*\}, \[user\.kurum_id, user\.rol, user\.id, token\]\);/;

const match = code.match(hookRegex);
if(match) {
  const newHook = `
  useEffect(() => {
    const fetchStats = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await fetch(\`/api/dashboard/stats?kurum_id=\${user.kurum_id}&rol=\${user.rol}&user_id=\${user.id}\`, {
          headers: { 'Authorization': token }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Stats fetching error:", err);
      } finally {
        if (!silent) setLoading(false);
      }
    };
    
    fetchStats(false);
    
    // Fallback polling
    const interval = setInterval(() => {
      fetchStats(true);
    }, 15000); 
    
    // Real-time socket connection
    const socket = io(); // Connects to the same host
    socket.emit('join_kurum', user.kurum_id);
    
    socket.on('session_update', (newSession) => {
       setStats((prev: any) => {
          if (!prev) return prev;
          let students = prev.activeStudyingStudents ? [...prev.activeStudyingStudents] : [];
          const idx = students.findIndex((s: any) => s.id === newSession.id);
          
          if (!newSession.calisiyor) {
             if (idx !== -1) students.splice(idx, 1);
          } else {
             if (idx !== -1) {
                students[idx] = newSession;
             } else {
                students.push(newSession);
             }
          }
          
          return { ...prev, activeStudyingStudents: students, activeStudyingCount: students.length };
       });
    });

    return () => {
       clearInterval(interval);
       socket.disconnect();
    };
  }, [user.kurum_id, user.rol, user.id, token]);
`;
  code = code.replace(match[0], newHook.trim());
}

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Dashboard updated to use socket.io");
