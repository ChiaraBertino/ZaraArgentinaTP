const express = require('express');
const { sql, getPool } = require('../db/db');

const router = express.Router();

router.get('/resumen', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Provincias)              AS total_provincias,
        (SELECT COUNT(*) FROM Tiendas)                  AS total_tiendas,
        (SELECT COUNT(*) FROM Ventas)                   AS total_ventas,
        (SELECT ISNULL(SUM(cantidad * precio_unitario), 0) FROM DetalleVenta) AS facturacion_total
    `);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error en /api/resumen:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/ventas/provincias', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        p.id_provincia,
        p.nombre AS provincia,
        ISNULL(SUM(dv.cantidad * dv.precio_unitario), 0) AS total_ventas,
        COUNT(DISTINCT v.id_venta) AS cantidad_ventas
      FROM Provincias p
      LEFT JOIN Tiendas t       ON t.id_provincia = p.id_provincia
      LEFT JOIN Ventas v        ON v.id_tienda = t.id_tienda
      LEFT JOIN DetalleVenta dv ON dv.id_venta = v.id_venta
      GROUP BY p.id_provincia, p.nombre
      ORDER BY total_ventas DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error en /api/ventas/provincias:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/ventas/tiendas/:id_provincia', async (req, res) => {
  const { id_provincia } = req.params;
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id_provincia', sql.Int, id_provincia)
      .query(`
        SELECT
          t.id_tienda,
          t.nombre AS tienda,
          t.ciudad,
          ISNULL(SUM(dv.cantidad * dv.precio_unitario), 0) AS total_ventas,
          COUNT(DISTINCT v.id_venta) AS cantidad_ventas
        FROM Tiendas t
        LEFT JOIN Ventas v        ON v.id_tienda = t.id_tienda
        LEFT JOIN DetalleVenta dv ON dv.id_venta = v.id_venta
        WHERE t.id_provincia = @id_provincia
        GROUP BY t.id_tienda, t.nombre, t.ciudad
        ORDER BY total_ventas DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error en /api/ventas/tiendas/:id_provincia:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/ventas/detalle/:id_tienda', async (req, res) => {
  const { id_tienda } = req.params;
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id_tienda', sql.Int, id_tienda)
      .query(`
        SELECT
          prod.id_producto,
          prod.nombre AS producto,
          c.nombre AS categoria,
          SUM(dv.cantidad) AS unidades_vendidas,
          SUM(dv.cantidad * dv.precio_unitario) AS total_vendido
        FROM DetalleVenta dv
        JOIN Ventas v      ON v.id_venta = dv.id_venta
        JOIN Productos prod ON prod.id_producto = dv.id_producto
        JOIN Categorias c   ON c.id_categoria = prod.id_categoria
        WHERE v.id_tienda = @id_tienda
        GROUP BY prod.id_producto, prod.nombre, c.nombre
        ORDER BY total_vendido DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error en /api/ventas/detalle/:id_tienda:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/tienda/:id_tienda', async (req, res) => {
  const { id_tienda } = req.params;
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id_tienda', sql.Int, id_tienda)
      .query(`
        SELECT t.id_tienda, t.nombre AS tienda, t.ciudad, t.id_provincia, p.nombre AS provincia
        FROM Tiendas t
        JOIN Provincias p ON p.id_provincia = t.id_provincia
        WHERE t.id_tienda = @id_tienda
      `);
    res.json(result.recordset[0] || null);
  } catch (err) {
    console.error('Error en /api/tienda/:id_tienda:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/semaforo', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      WITH VentasPorTienda AS (
        SELECT
          t.id_tienda,
          t.nombre AS tienda,
          t.ciudad,
          p.nombre AS provincia,
          ISNULL(SUM(dv.cantidad * dv.precio_unitario), 0) AS total_ventas
        FROM Tiendas t
        JOIN Provincias p         ON p.id_provincia = t.id_provincia
        LEFT JOIN Ventas v        ON v.id_tienda = t.id_tienda
        LEFT JOIN DetalleVenta dv ON dv.id_venta = v.id_venta
        GROUP BY t.id_tienda, t.nombre, t.ciudad, p.nombre
      ),
      Promedio AS (
        SELECT AVG(total_ventas) AS promedio FROM VentasPorTienda
      )
      SELECT
        vt.id_tienda,
        vt.tienda,
        vt.ciudad,
        vt.provincia,
        vt.total_ventas,
        pr.promedio,
        CASE
          WHEN pr.promedio = 0 THEN 'amarillo'
          WHEN vt.total_ventas >= pr.promedio THEN 'verde'
          WHEN vt.total_ventas >= pr.promedio * 0.7 THEN 'amarillo'
          ELSE 'rojo'
        END AS estado
      FROM VentasPorTienda vt
      CROSS JOIN Promedio pr
      ORDER BY vt.total_ventas DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error en /api/semaforo:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
