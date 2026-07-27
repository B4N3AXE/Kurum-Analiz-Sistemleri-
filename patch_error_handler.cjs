const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('app.use((req, res, next) => {')) {
  const handlerCode = `
  // Error handling for API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    next();
  });

  app.use((err, req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    next(err);
  });
`;
  
  // Insert before httpServer.listen
  code = code.replace('httpServer.listen(PORT', handlerCode + '\n  httpServer.listen(PORT');
  fs.writeFileSync('server.ts', code);
  console.log("PATCHED ERROR HANDLERS");
}
