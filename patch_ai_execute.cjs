const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `    while (loopCount < maxLoops) {
      const availableTools = (userRole === 'veli' || userRole === 'ogrenci') 
        ? [getStudentDetailDeclaration] 
        : [searchStudentsDeclaration, getStudentDetailDeclaration];`;

const replacement1 = `    while (loopCount < maxLoops) {
      const availableTools = (userRole === 'veli' || userRole === 'ogrenci') 
        ? [getStudentDetailDeclaration, getStudentPaymentInfoDeclaration] 
        : [searchStudentsDeclaration, getStudentDetailDeclaration, getStudentPaymentInfoDeclaration, getInstitutionTrendsDeclaration];`;

const target2 = `          if (cleanCallName === 'searchStudents') {
            const searchTerm = args.searchTerm as string;
            toolResult = searchStudentsLocal(searchTerm || '');
          } else if (cleanCallName === 'getStudentDetail') {
            const sId = Number(args.studentId);
            toolResult = getStudentDetailLocal(sId);
          }`;

const replacement2 = `          if (cleanCallName === 'searchStudents') {
            const searchTerm = args.searchTerm as string;
            toolResult = searchStudentsLocal(searchTerm || '');
          } else if (cleanCallName === 'getStudentDetail') {
            const sId = Number(args.studentId);
            toolResult = getStudentDetailLocal(sId);
          } else if (cleanCallName === 'getStudentPaymentInfo') {
            const sId = Number(args.studentId);
            toolResult = getStudentPaymentInfoLocal(sId);
          } else if (cleanCallName === 'getInstitutionTrends') {
            toolResult = getInstitutionTrendsLocal();
          }`;


code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);

fs.writeFileSync('server.ts', code);
console.log("PATCHED AI EXECUTION");
