const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const faultyBlock = `  const planCapacity = getPlanCapacity(user?.abonelik_turu);
  const studentRatio = planCapacity ? Math.min(100, Math.round(((stats.totalStudents || 0) / planCapacity) * 100)) : 0;`;

code = code.replace(faultyBlock, `  const planCapacity = getPlanCapacity(user?.abonelik_turu);`);

const hookBlock = `  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalClasses: 0,
    totalExams: 0,
    riskCount: 0,
    averageTytNet: 0,
    activeStudyingCount: 0,
    riskStudents: [] as RiskStudent[],
    trends: [] as TrendData[],
    recentExams: [] as any[],
    thresholds: { TYT: 60, AYT: 45, LGS: 55 } as Record<string, number>,
    classAnalysis: [] as any[],
    teacherAnalysis: [] as any[]
  });`;

const hookBlockWithRatio = hookBlock + `\n  const studentRatio = planCapacity ? Math.min(100, Math.round(((stats.totalStudents || 0) / planCapacity) * 100)) : 0;`;

code = code.replace(hookBlock, hookBlockWithRatio);

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log('patched Dashboard order');
