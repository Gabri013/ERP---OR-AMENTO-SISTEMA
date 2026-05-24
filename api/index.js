// Função serverless única para servir o backend Express
// Usar JavaScript compilado para evitar múltiplas funções serverless
const app = require('../api-server/dist/index.mjs');

// Exportar como handler da Vercel
module.exports = (req, res) => {
  app.default(req, res);
};
