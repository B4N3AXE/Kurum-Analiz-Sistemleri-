const fs = require('fs');
let code = fs.readFileSync('src/components/OgrenciPaneli.tsx', 'utf-8');
code = code.replace(
  "import { getTopicAnalysisForStudent, TYT_SUBJECT_TOPICS, LGS_SUBJECT_TOPICS } from './Dashboard';",
  "import { getTopicAnalysisForStudent, TYT_SUBJECT_TOPICS, LGS_SUBJECT_TOPICS, AYT_SAY_SUBJECT_TOPICS, AYT_EA_SUBJECT_TOPICS, AYT_SOZ_SUBJECT_TOPICS } from './Dashboard';"
);
fs.writeFileSync('src/components/OgrenciPaneli.tsx', code);
