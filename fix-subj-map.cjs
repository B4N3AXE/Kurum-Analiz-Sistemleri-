const fs = require('fs');
let code = fs.readFileSync('src/components/OgrenciPaneli.tsx', 'utf-8');

const replacementLogic = `                  let subjMap = {};
                  const isLgs = detailData.student.alan === 'LGS' || detailData.student.sinif_adi?.toLowerCase().includes('lgs');
                  if (isLgs) {
                    subjMap = LGS_SUBJECT_TOPICS;
                  } else {
                    subjMap = { ...TYT_SUBJECT_TOPICS };
                    if (detailData.student.alan === 'Sayısal') {
                      subjMap = { ...subjMap, ...AYT_SAY_SUBJECT_TOPICS };
                    } else if (detailData.student.alan === 'Sözel') {
                      subjMap = { ...subjMap, ...AYT_SOZ_SUBJECT_TOPICS };
                    } else if (detailData.student.alan === 'Eşit Ağırlık') {
                      subjMap = { ...subjMap, ...AYT_EA_SUBJECT_TOPICS };
                    }
                  }`;

const target1 = `                  const isLgs = detailData.student.alan === 'LGS' || detailData.student.sinif_adi?.toLowerCase().includes('lgs');
                  const subjMap = isLgs ? LGS_SUBJECT_TOPICS : TYT_SUBJECT_TOPICS;`;

code = code.split(target1).join(replacementLogic);

fs.writeFileSync('src/components/OgrenciPaneli.tsx', code);
