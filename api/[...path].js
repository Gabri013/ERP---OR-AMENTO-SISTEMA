// Vercel serverless function handler for the Express API
// Uses dynamic import() because api-server outputs ESM (.mjs)
let appPromise;

function getApp() {
  if (!appPromise) {
    appPromise = import('../api-server/dist/index.mjs').then(m => m.default);
  }
  return appPromise;
}

module.exports = async (req, res) => {
  const app = await getApp();
  app(req, res);
};
