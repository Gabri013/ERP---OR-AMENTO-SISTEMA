const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
  // Caminho do arquivo solicitado
  const filePath = path.join(process.cwd(), 'sistema-os/dist', req.url === '/' ? 'index.html' : req.url);
  
  // Verifica se o arquivo existe
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    // Serve o arquivo estático
    const content = fs.readFileSync(filePath);
    res.setHeader('Content-Type', getContentType(filePath));
    res.status(200).send(content);
  } else {
    // Se não for um arquivo existente, serve index.html (para rotas SPA)
    const indexPath = path.join(process.cwd(), 'sistema-os/dist/index.html');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(indexContent);
    } else {
      res.status(404).send('Not found');
    }
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };
  return types[ext] || 'application/octet-stream';
}
