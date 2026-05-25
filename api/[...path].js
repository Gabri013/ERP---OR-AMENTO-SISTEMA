let handler;

module.exports = async (req, res) => {
  if (!handler) {
    const mod = await import('../api-server/dist/index.mjs');
    handler = mod.default;
  }
  return handler(req, res);
};
