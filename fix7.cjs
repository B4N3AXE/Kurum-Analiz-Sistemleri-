const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                  </div>
                </div>
              </div>
              </motion.div>`;

const correct = `                  </div>
                </div>
              </motion.div>`;

code = code.replace(target, correct);
fs.writeFileSync('src/App.tsx', code);
