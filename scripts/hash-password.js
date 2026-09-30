
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sql, getPool } = require('../db/db');

async function main() {
  const [, , usuario, passwordPlano] = process.argv;

  if (!usuario || !passwordPlano) {
    console.log('Uso: node scripts/hash-password.js <usuario> <password>');
    process.exit(1);
  }

  const hash = await bcrypt.hash(passwordPlano, 10);

  const pool = await getPool();
  const result = await pool
    .request()
    .input('usuario', sql.VarChar, usuario)
    .input('hash', sql.VarChar, hash)
    .query('UPDATE Usuarios SET password_hash = @hash WHERE usuario = @usuario');

  if (result.rowsAffected[0] === 0) {
    console.log(`⚠️  No se encontró el usuario "${usuario}" en la tabla Usuarios.`);
  } else {
    console.log(`✅ Contraseña de "${usuario}" actualizada con hash bcrypt.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
