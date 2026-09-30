const estado = {
  nivel: 1,
  id_provincia: null,
  nombre_provincia: null,
  id_tienda: null,
  nombre_tienda: null,
};

let chart; 

const fmtMoneda = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

async function init() {
  await cargarSesion();
  await cargarKPIs();
  await cargarNivel1();
  await cargarSemaforo();

  document.getElementById('btn-logout').addEventListener('click', logout);
  document.getElementById('btn-drillup').addEventListener('click', drillUp);
}

async function cargarSesion() {
  const resp = await fetch('/api/session');
  const data = await resp.json();
  if (!data.autenticado) {
    window.location.href = '/login.html';
    return;
  }
  document.getElementById('usuario-actual').textContent = `👤 ${data.usuario}`;
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

async function cargarKPIs() {
  const resp = await fetch('/api/resumen');
  const data = await resp.json();
  document.getElementById('kpi-facturacion').textContent = fmtMoneda(data.facturacion_total);
  document.getElementById('kpi-ventas').textContent = data.total_ventas;
  document.getElementById('kpi-tiendas').textContent = data.total_tiendas;
  document.getElementById('kpi-provincias').textContent = data.total_provincias;
}

async function cargarNivel1() {
  estado.nivel = 1;
  estado.id_provincia = null;
  estado.id_tienda = null;

  const resp = await fetch('/api/ventas/provincias');
  const datos = await resp.json();

  pintarBreadcrumb();
  pintarGrafico(
    datos.map((d) => d.provincia),
    datos.map((d) => d.total_ventas),
    'Facturación por provincia'
  );
  pintarTabla(
    ['Provincia', 'Ventas', 'Facturación'],
    datos.map((d) => [d.provincia, d.cantidad_ventas, fmtMoneda(d.total_ventas)]),
    datos,
    (fila) => drillDownAProvincia(fila.id_provincia, fila.provincia)
  );

  document.getElementById('btn-drillup').disabled = true;
}

async function drillDownAProvincia(id_provincia, nombre_provincia) {
  estado.nivel = 2;
  estado.id_provincia = id_provincia;
  estado.nombre_provincia = nombre_provincia;

  const resp = await fetch(`/api/ventas/tiendas/${id_provincia}`);
  const datos = await resp.json();

  pintarBreadcrumb();
  pintarGrafico(
    datos.map((d) => d.tienda),
    datos.map((d) => d.total_ventas),
    `Facturación por tienda — ${nombre_provincia}`
  );
  pintarTabla(
    ['Tienda', 'Ciudad', 'Ventas', 'Facturación'],
    datos.map((d) => [d.tienda, d.ciudad, d.cantidad_ventas, fmtMoneda(d.total_ventas)]),
    datos,
    (fila) => drillDownATienda(fila.id_tienda, fila.tienda)
  );

  document.getElementById('btn-drillup').disabled = false;
}

async function drillDownATienda(id_tienda, nombre_tienda) {
  estado.nivel = 3;
  estado.id_tienda = id_tienda;
  estado.nombre_tienda = nombre_tienda;

  const resp = await fetch(`/api/ventas/detalle/${id_tienda}`);
  const datos = await resp.json();

  pintarBreadcrumb();
  pintarGrafico(
    datos.map((d) => d.producto),
    datos.map((d) => d.total_vendido),
    `Detalle de ventas — ${nombre_tienda}`
  );
  pintarTabla(
    ['Producto', 'Categoría', 'Unidades', 'Total vendido'],
    datos.map((d) => [d.producto, d.categoria, d.unidades_vendidas, fmtMoneda(d.total_vendido)]),
    datos,
    null // nivel más profundo: no hay más drill down
  );

  document.getElementById('btn-drillup').disabled = false;
}

function drillUp() {
  if (estado.nivel === 3) {
    drillDownAProvincia(estado.id_provincia, estado.nombre_provincia);
  } else if (estado.nivel === 2) {
    cargarNivel1();
  }
}

function pintarBreadcrumb() {
  const cont = document.getElementById('breadcrumb');
  const partes = [];

  partes.push(
    `<span class="crumb ${estado.nivel === 1 ? 'activo' : 'clicable'}" data-ir="1">Argentina (por provincia)</span>`
  );

  if (estado.nivel >= 2) {
    partes.push('<span class="sep">›</span>');
    partes.push(
      `<span class="crumb ${estado.nivel === 2 ? 'activo' : 'clicable'}" data-ir="2">${estado.nombre_provincia}</span>`
    );
  }

  if (estado.nivel === 3) {
    partes.push('<span class="sep">›</span>');
    partes.push(`<span class="crumb activo" data-ir="3">${estado.nombre_tienda}</span>`);
  }

  cont.innerHTML = partes.join('');

  cont.querySelectorAll('.crumb.clicable').forEach((el) => {
    el.addEventListener('click', () => {
      const ir = el.dataset.ir;
      if (ir === '1') cargarNivel1();
      if (ir === '2') drillDownAProvincia(estado.id_provincia, estado.nombre_provincia);
    });
  });
}

function pintarGrafico(labels, valores, titulo) {
  const ctx = document.getElementById('chart-drilldown').getContext('2d');

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: titulo,
          data: valores,
          backgroundColor: '#111',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: titulo },
      },
      onClick: (evt, elementos) => {
        if (!elementos.length) return;
        const idx = elementos[0].index;
        manejarClickPorIndice(idx);
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

let filasActuales = [];
let onFilaClick = null;

function manejarClickPorIndice(idx) {
  if (!onFilaClick) return;
  const fila = filasActuales[idx];
  if (fila) onFilaClick(fila);
}

function pintarTabla(encabezados, filas, filasCrudas, onClickFila) {
  filasActuales = filasCrudas;
  onFilaClick = onClickFila;

  document.getElementById('tabla-drilldown-head').innerHTML =
    '<tr>' + encabezados.map((h) => `<th>${h}</th>`).join('') + '</tr>';

  const body = document.getElementById('tabla-drilldown-body');
  body.innerHTML = filas
    .map(
      (fila, idx) =>
        `<tr data-idx="${idx}">${fila.map((c) => `<td>${c}</td>`).join('')}</tr>`
    )
    .join('');

  if (onClickFila) {
    body.querySelectorAll('tr').forEach((tr) => {
      tr.addEventListener('click', () => {
        const idx = Number(tr.dataset.idx);
        onClickFila(filasCrudas[idx]);
      });
    });
  }
}

async function cargarSemaforo() {
  const resp = await fetch('/api/semaforo');
  const datos = await resp.json();

  const cont = document.getElementById('semaforo-lista');
  cont.innerHTML = datos
    .map(
      (t) => `
      <div class="semaforo-item ${t.estado}">
        <div>
          <div class="nombre"><span class="dot ${t.estado}"></span>${t.tienda}</div>
          <div class="ciudad">${t.ciudad} · ${t.provincia}</div>
        </div>
        <div class="monto">${fmtMoneda(t.total_ventas)}</div>
      </div>
    `
    )
    .join('');
}

init();
