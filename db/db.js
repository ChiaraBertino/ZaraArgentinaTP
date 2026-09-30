require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'ZaraArgentina',
  port: Number(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false, // true si usás Azure SQL
    trustServerCertificate: true, // útil para SQL Server local / instancias con cert. autofirmado
  },
};

if (process.env.DB_USE_WINDOWS_AUTH === 'true') {
  config.options.trustedConnection = true;
} else {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
}

let poolPromise;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then((pool) => {
        console.log('✅ Conectado a SQL Server:', config.database);
        return pool;
      })
      .catch((err) => {
        console.error('❌ Error al conectar a SQL Server:', err.message);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

module.exports = { sql, getPool };
