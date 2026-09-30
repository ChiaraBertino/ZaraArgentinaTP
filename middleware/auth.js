function requireAuth(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();
  }

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  return res.redirect('/login.html');
}

module.exports = { requireAuth };
