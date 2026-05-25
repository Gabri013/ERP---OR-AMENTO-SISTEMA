let handler;

module.exports = async (req, res) => {
  if (!handler) {
    const mod = await import('../api-server/dist/index.mjs');
    handler = mod.default;
  }

  // When Vercel rewrites /api/auth/login → /api, the original path is lost.
  // Reconstruct it from x-matched-path or x-vercel-forwarded-for headers,
  // or from the path query param injected by the rewrite rule.
  const originalUrl = req.headers['x-forwarded-path'] || req.headers['x-original-url'];
  if (originalUrl) {
    req.url = originalUrl;
  } else if (req.query && req.query.path) {
    const segments = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    const qs = Object.entries(req.query)
      .filter(([k]) => k !== 'path')
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    req.url = '/api/' + segments + (qs ? '?' + qs : '');
  }

  return handler(req, res);
};
