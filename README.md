# Zara Argentina — Tablero de control de ventas

Trabajo cuatrimestral de Bases de Datos Aplicadas I/II.

## 1. Descripción

Dashboard web que muestra la facturación de las tiendas de Zara Argentina, con
navegación **Drill Down / Drill Up** en 3 niveles, un indicador de
**semaforización** por tienda y un sistema de **login** contra la base de datos.

## 2. Entidades representadas

| Entidad     | Por qué es relevante |
|-------------|------------------------------------------------------------|
| Provincias  | Nivel más alto de agregación geográfica de las ventas. |
| Tiendas     | Punto de venta físico; unidad clave para medir desempeño comercial. |
| Productos   | Permite ver qué se vende más y en qué categoría, útil para reposición/compras. |
| Ventas / DetalleVenta | Fuente de los montos y unidades que alimentan todos los indicadores. |

## 3. Niveles de Drill Down / Drill Up

1. **Provincia** → facturación total agrupada por provincia.
2. **Tienda** → al hacer clic en una provincia, se muestran sus tiendas y la
   facturación de cada una.
3. **Detalle de productos** → al hacer clic en una tienda, se muestra el
   detalle de unidades y facturación por producto/categoría vendidos en esa
   tienda.

Se puede volver al nivel anterior con el botón **"⬅ Volver"** o haciendo clic
en las migas de pan (breadcrumb) de arriba del gráfico.

## 4. Semaforización

Se compara la facturación total de cada tienda contra el **promedio de
facturación de todas las tiendas** de la cadena:

- 🟢 **Verde**: factura ≥ 100% del promedio general (desempeño normal o
  favorable).
- 🟡 **Amarillo**: factura entre 70% y 100% del promedio (advertencia).
- 🔴 **Rojo**: factura < 70% del promedio (situación crítica, requiere
  atención).

## 5. Login

- Las credenciales se validan contra la tabla `Usuarios` de la base de datos.
- La contraseña se guarda **hasheada con bcrypt** (nunca en texto plano).
- Si usuario/contraseña son incorrectos, se deniega el acceso.
- Al loguearse correctamente, se redirige automáticamente a `dashboard.html`.
- La sesión se maneja con `express-session` (cookie httpOnly).

## 6. Tecnologías

- **Backend**: Node.js + Express
- **Base de datos**: SQL Server (paquete `mssql`)
- **Autenticación**: `bcrypt` + `express-session`
- **Frontend**: HTML + CSS + JavaScript vanilla + Chart.js (gráficos de barra)

## 7. Instalación y ejecución (paso a paso)

### 7.1. Crear la base de datos

Ejecutá el archivo `ZaraArgentina.sql` en SQL Server Management Studio (SSMS)
o en Azure Data Studio para crear la base y las tablas. Este script ya trae un
usuario de ejemplo (`chiara` / `123456`), pero la contraseña está en texto
plano — el paso 7.4 la convierte a hash.

Te recomendamos además cargar algunos `INSERT` de prueba en `Provincias`,
`Tiendas`, `Categorias`, `Productos`, `Ventas` y `DetalleVenta` para poder ver
datos en el tablero (podés pedirme que te genere ese script de datos de
prueba).

### 7.2. Instalar dependencias

El backend vive en `zara-dashboard/backend/`. Desde ahí se instalan las
dependencias y se corre el servidor:

```bash
cd zara-dashboard/backend
npm install
```

### 7.3. Configurar la conexión

```bash
cp .env.example .env
```

Editá `.env` con los datos de tu instancia de SQL Server (servidor, usuario,
contraseña, nombre de la base, etc.).

### 7.4. Hashear la contraseña del usuario de prueba

El `INSERT` original guarda la contraseña `123456` sin proteger. Corré:

```bash
npm run hash-password chiara 123456
```

Esto reemplaza `password_hash` en la tabla `Usuarios` por un hash bcrypt real.
Repetí el comando (con otro usuario/contraseña) por cada usuario que agregues.

### 7.5. Levantar el servidor

```bash
npm start
```

Abrí `http://localhost:3000` en el navegador. Te va a redirigir a
`login.html`. Iniciá sesión con `chiara` / `123456` (o el usuario que hayas
configurado).

## 8. Estructura del proyecto

El proyecto está separado en dos carpetas: **backend** (Node/Express + SQL) y
**frontend** (HTML/CSS/JS que corre en el navegador). El backend sirve los
archivos del frontend como estáticos.

```
zara-dashboard/
├── backend/
│   ├── server.js              # Punto de entrada de Express
│   ├── db/db.js                # Conexión a SQL Server (pool)
│   ├── middleware/auth.js      # Protege rutas privadas
│   ├── routes/
│   │   ├── auth.js              # /api/login, /api/logout, /api/session
│   │   └── api.js                # KPIs, drill down (3 niveles), semáforo
│   ├── scripts/hash-password.js # Utilidad para hashear contraseñas
│   ├── ZaraArgentina.sql        # Script original de la base
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
└── frontend/
    ├── login.html
    ├── dashboard.html
    ├── css/style.css
    └── js/
        ├── login.js
        └── dashboard.js
```

El `frontend/` no tiene servidor propio ni build: Express (`backend/server.js`)
lo sirve directamente como archivos estáticos, así que no hace falta instalar
nada dentro de esa carpeta.

## 9. Pendiente para la entrega final

- Cargar los `INSERT` con datos reales/de prueba de provincias, tiendas,
  categorías, productos, ventas y detalle de venta.
- Sacar capturas de pantalla de `login.html` y `dashboard.html` en sus 3
  niveles de drill down para el PDF de entrega.
- Armar el diagrama canónico de la base (podés usar SSMS → Database Diagrams,
  o dbdiagram.io a partir de `ZaraArgentina.sql`).
- Subir el proyecto a un repositorio de GitHub y linkearlo en el PDF.
