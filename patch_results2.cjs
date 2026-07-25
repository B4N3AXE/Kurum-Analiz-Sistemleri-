const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `    // Calculate trends for chart
    const trends = exams
      .map(e => {
        const examResults = results.filter(r => r.sinav_id === e.id);`;
const replacement1 = `    // Calculate trends for chart
    const trends = exams
      .map(e => {
        const examResults = results.filter(r => r.sinav_id === e.id && studentIds.includes(r.ogrenci_id));`;

const target2 = `    // Applied exams recap list
    const recentExams = exams
      .map(e => {
        const examResults = results.filter(r => r.sinav_id === e.id);`;
const replacement2 = `    // Applied exams recap list
    const recentExams = exams
      .map(e => {
        const examResults = results.filter(r => r.sinav_id === e.id && studentIds.includes(r.ogrenci_id));`;


code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);

fs.writeFileSync('server.ts', code);
console.log("PATCHED TRENDS");
