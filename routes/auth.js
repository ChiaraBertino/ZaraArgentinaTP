const express = require('express');
const router = express.Router();
const mssql = require('mssql');
const bcrypt = require('bcrypt');
const { getPool } = require('../db/db');

router.post('/login', async (req, res) => {
    const { usuario, password } = req.body;

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('user', mssql.VarChar, usuario)
            .query('SELECT * FROM Usuarios WHERE usuario = @user');

        if (result.recordset.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }

        const user = result.recordset[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }

        req.session.usuario = user.usuario;

        res.json({ success: true, message: 'Login exitoso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

router.get('/session', (req, res) => {
    if (req.session && req.session.usuario) {
        return res.json({ autenticado: true, usuario: req.session.usuario });
    }
    res.json({ autenticado: false });
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

module.exports = router;