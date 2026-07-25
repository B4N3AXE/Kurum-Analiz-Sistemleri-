const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startServerCode = `async function startServer() {
  await db.loadFromFirestore();

  // Serve frontend SPA in development or production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start Server on configured port
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(\`Server started on http://0.0.0.0:\${PORT} under NODE_ENV=\${process.env.NODE_ENV}\`);
  });
}

startServer();
`;

code = code.replace(startServerCode, '');
code += "\n\n" + startServerCode;

fs.writeFileSync('server.ts', code);
console.log("PATCHED SERVER ORDER");
