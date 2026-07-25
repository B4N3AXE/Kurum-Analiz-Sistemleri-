const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{isMobileMenuOpen && (
            <div className="md:hidden absolute top-[60px] left-0 w-full h-[calc(100vh-60px)] bg-slate-950/95 backdrop-blur-xl z-40 flex flex-col overflow-y-auto">
              <div className="p-4 flex-1 flex flex-col gap-2">`;

const correct = `<AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="md:hidden absolute top-[60px] left-0 w-full h-[calc(100vh-60px)] bg-slate-950/95 backdrop-blur-xl z-40 flex flex-col overflow-y-auto"
              >
                <div className="p-4 flex-1 flex flex-col gap-2">`;

code = code.replace(target, correct);
fs.writeFileSync('src/App.tsx', code);
