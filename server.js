require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secreto-de-desarrollo',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 4, // 4 horas
    },
  })
);

app.use('/api', authRoutes);

app.use('/api', requireAuth, apiRoutes);

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR, { index: false }));

app.get('/', (req, res) => {
  if (req.session && req.session.usuario) {
    return res.redirect('/dashboard.html');
  }
  return res.redirect('/login.html');
});

app.get('/dashboard.html', requireAuth, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'dashboard.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
