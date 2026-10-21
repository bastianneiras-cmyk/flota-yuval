/* Mantenimiento · Flota Yuval — Frontend (vanilla JS) · Fase 2: Inicio, Gastos y Pagos */
'use strict';
(() => {
  const CFG = window.FLOTA_CONFIG || {};
  const VERSION = '2.0.0';
  const PAGADORES = ['ADMIN', 'SUPERVISOR'];

  // ───────────────────────── utilidades ─────────────────────────
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const on = (root, sel, ev, fn) => $$(sel, root).forEach((el) => el.addEventListener(ev, (e) => fn(e, el)));
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('fy_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('fy_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem('fy_' + k); } catch (e) { } }
  };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2));
  const miles = (n) => { const v = Math.round(Number(n) || 0); return (v < 0 ? '-' : '') + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  const clp = (n) => '$' + miles(n);
  const pad = (n) => String(n).padStart(2, '0');
  const hoyISO = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const mesActual = () => hoyISO().slice(0, 7);
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MES3 = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const fecha = (s) => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '-' + m[2] + '-' + m[1] : (s || ''); };
  const fechaLarga = (s) => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? Number(m[3]) + ' ' + MES3[Number(m[2]) - 1] + ' ' + m[1] : ''; };
  const mesLabel = (m) => MESES[Number(m.slice(5, 7)) - 1] + ' ' + m.slice(0, 4);
  const mesMas = (m, d) => { const y = Number(m.slice(0, 4)), mm = Number(m.slice(5, 7)) - 1 + d; const dt = new Date(y, mm, 1); return dt.getFullYear() + '-' + pad(dt.getMonth() + 1); };
  const patente = (p) => { const m = String(p || '').match(/^([A-Z]+)(\d+)$/); return m ? m[1] + '-' + m[2] : String(p || ''); };
  const rutFmt = (r) => { const m = String(r || '').match(/^(\d+)-([\dK])$/i); return m ? miles(m[1]) + '-' + m[2].toUpperCase() : (r || ''); };
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const normAZ = (s) => norm(s).replace(/[^A-Z0-9]/g, '');
  const iniciales = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase();

  const ICON = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    ot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v3h6V3M9 11h6M9 15h4"/></svg>',
    gasto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10h19M16 15h2"/><path d="M6 6V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
    flota: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16V7a1 1 0 0 1 1-1h11v10M14 9h4l3 4v3h-7"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/></svg>',
    rep: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    nube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.2 4.5 4.5 0 0 0 7 18z"/><path d="M12 11v5M9.5 13.5 12 11l2.5 2.5"/></svg>',
    recargar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>'
  };

  // ───────────────────────── estado ─────────────────────────
  const S = {
    ses: LS.get('ses', null),
    boot: LS.get('boot', null),
    cola: LS.get('cola', []),
    mes: mesActual(),
    mesGastos: mesActual(),
    dash: LS.get('dash', {}),
    gastos: {},
    filtroEstado: '',
    tabGastos: 'mes',
    lastGasto: LS.get('lastGasto', null),
    recProv: LS.get('recProv', []),
    sincronizando: false
  };
  const puedePagar = () => S.ses && PAGADORES.indexOf(S.ses.rol) >= 0;
  const P = () => (S.boot && S.boot.parametros) || {};

  // ───────────────────────── API ─────────────────────────
  async function api(action, data, opt) {
    opt = opt || {};
    if (!CFG.API_URL || /PEGAR/.test(CFG.API_URL)) throw new Error('Configure API_URL y API_TOKEN en config.js');
    const body = Object.assign({ token: CFG.API_TOKEN, action: action, data: data || {}, clientId: opt.clientId || '' },
      S.ses ? { usuario: S.ses.usuario, sk: S.ses.sk } : {}, opt.extra || {});
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), opt.timeout || 30000);
    let res;
    try {
      res = await fetch(CFG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), signal: ctrl.signal });
    } catch (e) { const err = new Error('Sin conexión'); err.red = true; throw err; } finally { clearTimeout(t); }
    let j;
    try { j = await res.json(); } catch (e) { const err = new Error('El servidor no respondió bien (' + res.status + ')'); err.red = true; throw err; }
    if (!j.ok) {
      const err = new Error(j.error || 'Error del servidor'); err.code = j.code;
      if (j.code === 401 && action !== 'login') { cerrarSesion(); toast('Sesión vencida: ingrese de nuevo', true); }
      throw err;
    }
    return j.data;
  }

  // ───────────────────────── cola offline ─────────────────────────
  function guardarCola() {
    if (!LS.set('cola', S.cola)) { // sin espacio: se descartan fotos pendientes
      S.cola.forEach((j) => { if (j.foto) { j.foto = null; j.sinFoto = true; } });
      LS.set('cola', S.cola);
      toast('Memoria llena: se descartaron fotos pendientes', true);
    }
    pintarBadge();
  }
  function encolar(job) { S.cola.push(job); guardarCola(); }
  async function ejecutarJob(job) {
    if (job.foto && !job.data.foto) {
      const r = await api('uploadFoto', { tipo: job.fotoTipo || 'Respaldo', mime: 'image/jpeg', base64: job.foto, n_ot: job.data.n_ot || '' }, { timeout: 60000 });
      job.data.foto = r.link; job.foto = null; guardarCola();
    }
    return api(job.action, job.data, { clientId: job.clientId });
  }
  async function sincronizar(manual) {
    if (S.sincronizando || !S.ses || !S.cola.length) { if (manual && !S.cola.length) toast('Todo sincronizado'); return; }
    S.sincronizando = true; pintarBadge();
    let ok = 0, err = 0;
    for (const job of S.cola.slice()) {
      try {
        await ejecutarJob(job);
        S.cola = S.cola.filter((j) => j.id !== job.id); ok++;
      } catch (e) {
        if (e.red) break;
        job.error = e.message; job.intentos = (job.intentos || 0) + 1; err++;
      }
      guardarCola();
    }
    S.sincronizando = false; pintarBadge();
    if (ok) { toast(ok + (ok === 1 ? ' registro enviado' : ' registros enviados')); S.gastos = {}; refrescarVista(); }
    if (err && manual) toast(err + ' con error: revise en Sincronización', true);
  }
  function pintarBadge() {
    const b = $('#btnSync .badge');
    if (!b) return;
    b.textContent = S.cola.length; b.classList.toggle('hidden', !S.cola.length);
    $('#btnSync').style.opacity = S.sincronizando ? '.5' : '1';
  }

  // ───────────────────────── UI base ─────────────────────────
  let toastT;
  function toast(msg, err) {
    $$('.toast').forEach((t) => t.remove());
    const t = document.createElement('div');
    t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastT); toastT = setTimeout(() => t.remove(), err ? 4200 : 2600);
  }
  function abrirHoja(titulo, cuerpo, pie, extraHeader) {
    const el = document.createElement('div');
    el.className = 'sheet';
    el.innerHTML = '<div class="sheet-h"><button class="cerrar" aria-label="Cerrar">✕</button><h3>' + esc(titulo) + '</h3>' + (extraHeader || '') + '</div>' +
      '<div class="sheet-b">' + cuerpo + '</div>' + (pie ? '<div class="sheet-f">' + pie + '</div>' : '');
    document.body.appendChild(el);
    document.body.style.overflow = 'hidden';
    el.cerrar = () => { el.remove(); if (!$('.sheet')) document.body.style.overflow = ''; };
    $('.cerrar', el).onclick = el.cerrar;
    return el;
  }
  function setBtnCargando(btn, cargando, texto) {
    btn.disabled = cargando;
    if (cargando) { btn.dataset.txt = btn.innerHTML; btn.innerHTML = '<span class="spin"></span>' + (texto || 'Guardando…'); }
    else if (btn.dataset.txt) btn.innerHTML = btn.dataset.txt;
  }
  const tagPago = (e) => '<span class="tag ' + ({ Pendiente: 'pend', Pagado: 'pag', Anulado: 'anu' }[e] || '') + '">' + esc(e || '—') + '</span>';
  const tagEquipo = (e) => '<span class="tag ' + ({ 'Operativo': 'op', 'Operativo con restricción': 'tal', 'En taller': 'tal', 'Fuera de servicio': 'fs' }[e] || '') + '">' + esc(e || 'Sin estado') + '</span>';
  const movilDe = (id) => ((S.boot && S.boot.moviles) || []).find((m) => String(m.movil) === String(id));
  const movilTxt = (id) => { if (!id || id === 'GENERAL') return 'General / Stock'; const m = movilDe(id); return 'Móvil ' + id + (m && m.patente ? ' · ' + patente(m.patente) : ''); };

  // ───────────────────────── sesión ─────────────────────────
  function cerrarSesion() { S.ses = null; LS.del('ses'); pintarLogin(); }

  function pintarLogin() {
    $$('.sheet').forEach((s) => s.remove());
    const app = $('#app');
    let pin = '';
    app.innerHTML = '<div class="login">' +
      '<img src="icons/icon-192.png" alt="">' +
      '<h1>MANTENIMIENTO</h1><p class="s">FLOTA <i>•</i> YUVAL</p>' +
      '<input class="inp" id="lgUser" placeholder="Usuario" autocapitalize="off" autocomplete="username" value="' + esc(LS.get('ultUser', '')) + '">' +
      '<div class="pin-dots">' + '<i></i>'.repeat(6) + '</div><div class="err" id="lgErr"></div>' +
      '<div class="keypad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => '<button data-k="' + n + '">' + n + '</button>').join('') +
      '<button data-k="del">⌫</button><button data-k="0">0</button><button data-k="ok" style="background:var(--rojo)">→</button></div></div>';
    const dots = () => $$('.pin-dots i').forEach((d, i) => d.classList.toggle('on', i < pin.length));
    const entrar = async () => {
      const usuario = $('#lgUser').value.trim().toLowerCase();
      if (!usuario) { $('#lgErr').textContent = 'Ingrese su usuario'; return; }
      if (pin.length < 4) { $('#lgErr').textContent = 'PIN de 4 a 6 dígitos'; return; }
      $('#lgErr').textContent = 'Ingresando…';
      try {
        const r = await api('login', {}, { extra: { usuario: usuario, pin: pin } });
        S.ses = r; LS.set('ses', r); LS.set('ultUser', usuario);
        await cargarBoot(true);
        iniciarApp();
      } catch (e) { $('#lgErr').textContent = e.message; pin = ''; dots(); }
    };
    on(app, '.keypad button', 'click', (e, b) => {
      const k = b.dataset.k;
      if (k === 'del') pin = pin.slice(0, -1);
      else if (k === 'ok') return entrar();
      else if (pin.length < 6) pin += k;
      $('#lgErr').textContent = ''; dots();
      if (pin.length === 6) entrar();
    });
  }

  async function cargarBoot(forzar) {
    if (S.boot && !forzar) { api('bootstrap').then((b) => { S.boot = b; LS.set('boot', b); }).catch(() => { }); return; }
    const b = await api('bootstrap');
    S.boot = b; LS.set('boot', b);
  }

  // ───────────────────────── shell + router ─────────────────────────
  const TABS = [['inicio', 'Inicio', ICON.home], ['ot', 'OT', ICON.ot], ['gastos', 'Gastos', ICON.gasto], ['flota', 'Flota', ICON.flota], ['reportes', 'Reportes', ICON.rep]];

  function iniciarApp() {
    const app = $('#app');
    app.innerHTML = '<header class="top"><img src="icons/emblema.png" alt=""><div class="brand"><b>MANTENIMIENTO</b><span>FLOTA <i>•</i> YUVAL</span></div>' +
      '<button class="top-btn" id="btnSync" aria-label="Sincronizar">' + ICON.nube + '<span class="badge hidden">0</span></button>' +
      '<button class="top-btn avatar" id="btnUser">' + esc(iniciales(S.ses.nombre)) + '</button></header>' +
      '<main id="view"></main>' +
      '<nav class="tabs">' + TABS.map((t) => '<a href="#/' + t[0] + '" data-tab="' + t[0] + '">' + t[2] + t[1] + '</a>').join('') + '</nav>' +
      '<button class="fab" id="fab" aria-label="Nuevo">' + ICON.plus + '</button>';
    $('#fab').onclick = toggleFab;
    $('#btnSync').onclick = abrirSync;
    $('#btnUser').onclick = abrirMenuUsuario;
    pintarBadge();
    if (!location.hash) location.hash = '#/inicio'; else router();
    cargarBoot(false);
    sincronizar();
  }

  function router() {
    if (!S.ses) return;
    cerrarFab();
    const [ruta, q] = location.hash.replace(/^#\//, '').split('?');
    const tab = ruta || 'inicio';
    $$('nav.tabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === tab));
    if (q && /tab=pend/.test(q)) S.tabGastos = 'pend';
    const v = $('#view');
    if (!v) return;
    window.scrollTo(0, 0);
    ({ inicio: vistaInicio, gastos: vistaGastos, flota: vistaFlota, ot: vistaOT, reportes: vistaReportes }[tab] || vistaInicio)(v);
  }
  function refrescarVista() { if ($('#view')) router(); }

  function toggleFab() {
    if ($('.fab-menu')) return cerrarFab();
    $('#fab').classList.add('open');
    const velo = document.createElement('div'); velo.className = 'velo'; velo.onclick = cerrarFab;
    const m = document.createElement('div'); m.className = 'fab-menu';
    m.innerHTML = '<button data-a="gasto"><i></i>Nuevo gasto</button><button data-a="minuta"><i style="background:var(--carbon)"></i>Nueva minuta</button>' +
      '<button data-a="ot"><i style="background:var(--carbon)"></i>Nueva OT completa</button>';
    document.body.append(velo, m);
    on(m, 'button', 'click', (e, b) => {
      cerrarFab();
      if (b.dataset.a === 'gasto') abrirGasto();
      else toast('Minutas y OT se habilitan en la Fase 3');
    });
  }
  function cerrarFab() { $$('.fab-menu,.velo').forEach((x) => x.remove()); const f = $('#fab'); if (f) f.classList.remove('open'); }

  function selectorMes(mes, onCambio) {
    const div = document.createElement('div');
    div.className = 'mes';
    div.innerHTML = '<button aria-label="Mes anterior">‹</button><b>' + esc(mesLabel(mes)) + '</b><button aria-label="Mes siguiente">›</button>';
    const [a, , b] = div.children;
    a.onclick = () => onCambio(mesMas(mes, -1));
    b.onclick = () => onCambio(mesMas(mes, 1));
    return div;
  }

  // ───────────────────────── INICIO ─────────────────────────
  function vistaInicio(v) {
    v.innerHTML = '';
    v.appendChild(selectorMes(S.mes, (m) => { S.mes = m; vistaInicio(v); }));
    const cont = document.createElement('div');
    v.appendChild(cont);
    const cache = S.dash[S.mes];
    if (cache) pintarDash(cont, cache);
    else cont.innerHTML = '<div class="kpis"><div class="skel" style="grid-column:1/-1"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>';
    const mes = S.mes;
    api('dashboard', { mes: mes }).then((d) => {
      S.dash[mes] = d; LS.set('dash', S.dash);
      if (S.mes === mes && cont.isConnected) pintarDash(cont, d);
    }).catch((e) => { if (!cache && cont.isConnected) cont.innerHTML = '<div class="card vacio">' + esc(e.message) + '<br><br><button class="btn sec sm" id="reint">Reintentar</button></div>'; const r = $('#reint', cont); if (r) r.onclick = () => vistaInicio(v); });
  }

  function pintarDash(c, d) {
    const cats = Object.entries(d.porCategoria || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxCat = cats.length ? cats[0][1] : 1;
    c.innerHTML =
      '<div class="kpis">' +
      '<div class="kpi main"><span class="lbl">Gasto del mes</span><span class="val num">' + clp(d.gastoMes) + '</span><span class="sub">' + d.nGastosMes + ' registros</span></div>' +
      '<button class="kpi ' + (d.pendiente ? 'rojo' : '') + '" id="kPend"><span class="lbl">Pendiente por pagar</span><span class="val num">' + clp(d.pendiente) + '</span><span class="sub">' + d.nPendientes + ' docs' + (d.vencidos ? ' · <b style="color:var(--rojo)">' + d.vencidos + ' vencidos</b>' : '') + '</span></button>' +
      '<button class="kpi" id="kOT"><span class="lbl">OT abiertas</span><span class="val num">' + d.otAbiertas + '</span><span class="sub">en curso</span></button>' +
      '<button class="kpi" id="kTaller"><span class="lbl">En taller</span><span class="val num">' + d.enTaller + '</span><span class="sub">móviles</span></button>' +
      '<button class="kpi ' + (d.fueraServicio ? 'rojo' : '') + '" id="kFS"><span class="lbl">Fuera de servicio</span><span class="val num">' + d.fueraServicio + '</span><span class="sub">móviles</span></button>' +
      '</div>' +
      (cats.length ? '<h3 class="sec">Gasto por categoría</h3><div class="card bars">' + cats.map((x) =>
        '<div class="row"><span>' + esc(x[0]) + '</span><span class="bar"><i style="width:' + Math.max(3, Math.round(x[1] / maxCat * 100)) + '%"></i></span><b class="num">' + clp(x[1]) + '</b></div>').join('') + '</div>' : '') +
      '<h3 class="sec">Alertas</h3>' +
      (d.alertas && d.alertas.length ? '<div class="list">' + d.alertas.map((a) =>
        '<div class="alerta ' + a.nivel + '"><span class="dot"></span><div class="bd"><b>Móvil ' + esc(a.movil) + '</b> ' + esc(patente(a.patente)) + '<br><span class="muted small">' + esc(a.tipo) +
        (a.fecha ? ' · ' + fecha(a.fecha) : a.prox_km ? ' · ' + miles(a.km) + ' / ' + miles(a.prox_km) + ' km' : '') + '</span></div><span class="d">' +
        (a.fecha ? (a.dias < 0 ? 'Vencido' : a.dias === 0 ? 'Hoy' : a.dias + ' días') : (a.nivel === 'vencido' ? 'Pasado' : 'Próximo')) + '</span></div>').join('') + '</div>'
        : '<div class="card muted small">Sin vencimientos ni mantenciones en los próximos 30 días.' + (d.alertas ? '' : '') + ' Las alertas usan las fechas de revisión técnica, permiso, SOAP y próxima mantención de la hoja MOVILES.</div>') +
      '<h3 class="sec">Últimos movimientos</h3>' +
      (d.ultimos && d.ultimos.length ? '<div class="list">' + d.ultimos.map(itemMov).join('') + '</div>' : '<div class="card vacio">Aún no hay registros en la app. Toque <b>+</b> para el primero.</div>');
    $('#kPend', c).onclick = () => { if (puedePagar()) { S.tabGastos = 'pend'; location.hash = '#/gastos'; } };
    $('#kOT', c).onclick = () => { location.hash = '#/ot'; };
    $('#kTaller', c).onclick = () => { S.filtroFlota = 'En taller'; location.hash = '#/flota'; };
    $('#kFS', c).onclick = () => { S.filtroFlota = 'Fuera de servicio'; location.hash = '#/flota'; };
    on(c, '[data-gasto]', 'click', (e, el) => abrirDetalleGastoPorId(el.dataset.gasto));
  }
  function itemMov(m) {
    const esOT = m.tipo === 'OT';
    return '<button class="item" ' + (esOT ? '' : 'data-gasto="' + esc(m.id) + '"') + '><span class="ic ' + (esOT ? 'ot' : 'g') + '">' + (esOT ? 'OT' : '$') + '</span>' +
      '<span class="bd"><div class="t1">' + esc(m.titulo) + '</div><div class="t2">' + esc(m.detalle) + '</div></span>' +
      '<span class="rt"><div class="monto num">' + clp(m.monto) + '</div><div class="t2 small">' + fechaLarga(m.fecha) + '</div></span></button>';
  }

  // ───────────────────────── GASTOS ─────────────────────────
  function vistaGastos(v) {
    if (!puedePagar()) S.tabGastos = 'mes';
    v.innerHTML = (puedePagar() ? '<div class="seg"><button data-t="mes">Gastos del mes</button><button data-t="pend">Pagos pendientes</button></div>' : '') + '<div id="gCont"></div>';
    $$('.seg button', v).forEach((b) => { b.classList.toggle('on', b.dataset.t === S.tabGastos); b.onclick = () => { quitarBarra(); S.tabGastos = b.dataset.t; vistaGastos(v); }; });
    const c = $('#gCont', v);
    if (S.tabGastos === 'pend') vistaPendientes(c); else vistaGastosMes(c);
  }

  function vistaGastosMes(c) {
    c.innerHTML = '';
    c.appendChild(selectorMes(S.mesGastos, (m) => { S.mesGastos = m; vistaGastosMes(c); }));
    const filtros = document.createElement('div');
    filtros.className = 'chips scroll'; filtros.style.marginBottom = '12px';
    filtros.innerHTML = [['', 'Todos'], ['Pendiente', 'Pendientes'], ['Pagado', 'Pagados']].map((f) => '<button class="chip sm ' + (S.filtroEstado === f[0] ? 'on' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>').join('');
    c.appendChild(filtros);
    on(filtros, 'button', 'click', (e, b) => { S.filtroEstado = b.dataset.f; vistaGastosMes(c); });
    const lista = document.createElement('div');
    c.appendChild(lista);
    const mes = S.mesGastos;
    const pintar = (d) => {
      const items = d.items.filter((g) => !S.filtroEstado || g.estado_pago === S.filtroEstado);
      const total = items.reduce((s, g) => s + (Number(g.total) || 0), 0);
      if (!items.length) { lista.innerHTML = '<div class="card vacio">Sin gastos en ' + esc(mesLabel(mes)) + '.</div>'; return; }
      let html = '<div class="card" style="display:flex;justify-content:space-between;align-items:center"><span class="muted">' + items.length + ' registros</span><b class="num" style="font-family:var(--f-tit);font-size:26px">' + clp(total) + '</b></div>';
      let dia = '';
      items.forEach((g) => {
        if (g.fecha !== dia) { if (dia) html += '</div>'; dia = g.fecha; html += '<div class="dia">' + fechaLarga(g.fecha) + '</div><div class="list">'; }
        html += '<button class="item" data-id="' + esc(g.id) + '"><span class="ic g">$</span><span class="bd"><div class="t1">' + esc(g.categoria) + ' · ' + esc(movilTxt(g.movil)) + '</div>' +
          '<div class="t2">' + esc(g.proveedor || 'Sin proveedor') + (g.n_doc ? ' · ' + esc(g.tipo_doc) + ' ' + esc(g.n_doc) : '') + '</div></span>' +
          '<span class="rt"><div class="monto num">' + clp(g.total) + '</div>' + tagPago(g.estado_pago) + '</span></button>';
      });
      lista.innerHTML = html + '</div>';
      on(lista, '[data-id]', 'click', (e, el) => abrirDetalleGasto(d.items.find((g) => g.id === el.dataset.id)));
    };
    if (S.gastos[mes]) pintar(S.gastos[mes]); else lista.innerHTML = '<div class="skel"></div>';
    api('listGastos', { mes: mes }).then((d) => { S.gastos[mes] = d; if (lista.isConnected && S.mesGastos === mes) pintar(d); })
      .catch((e) => { if (!S.gastos[mes] && lista.isConnected) lista.innerHTML = '<div class="card vacio">' + esc(e.message) + '</div>'; });
  }

  async function abrirDetalleGastoPorId(id) {
    for (const k in S.gastos) { const g = S.gastos[k].items.find((x) => x.id === id); if (g) return abrirDetalleGasto(g); }
    try {
      const mes = (Object.values(S.dash).flatMap((d) => d.ultimos || []).find((u) => u.id === id) || {}).fecha;
      const d = await api('listGastos', { mes: (mes || hoyISO()).slice(0, 7) });
      const g = d.items.find((x) => x.id === id);
      if (g) abrirDetalleGasto(g); else toast('Gasto no encontrado', true);
    } catch (e) { toast(e.message, true); }
  }

  function abrirDetalleGasto(g) {
    if (!g) return;
    const kv = (k, v) => v || v === 0 ? '<div class="kv"><span>' + k + '</span><b>' + v + '</b></div>' : '';
    const cuerpo = '<div class="monto-box"><div class="m num">' + clp(g.total) + '</div><div class="ni">' + tagPago(g.estado_pago) + '</div></div>' +
      '<div class="card">' + kv('ID', esc(g.id)) + kv('Fecha', fecha(g.fecha)) + kv('Categoría', esc(g.categoria)) + kv('Móvil', esc(movilTxt(g.movil))) +
      kv('N° OT', esc(g.n_ot)) + kv('Proveedor', esc(g.proveedor)) + kv('RUT', esc(rutFmt(g.proveedor_rut))) + kv('Documento', esc([g.tipo_doc, g.n_doc].filter(Boolean).join(' '))) +
      (g.neto ? kv('Neto / IVA', clp(g.neto) + ' / ' + clp(g.iva)) : '') + kv('Forma de pago', esc(g.forma_pago)) + kv('Vencimiento', fecha(g.venc)) +
      kv('Fecha pago', fecha(g.fecha_pago)) + kv('Medio / comprobante', esc([g.medio_pago, g.comprobante].filter(Boolean).join(' · '))) +
      kv('Solicitado por', esc(g.solicitado_por)) + kv('Observación', esc(g.obs)) + kv('Registrado por', esc(g.creado_por)) +
      (g.foto ? kv('Respaldo', '<a href="' + esc(g.foto) + '" target="_blank" rel="noopener">Ver foto</a>') : '') + '</div>';
    const editable = g.origen !== 'Histórico' && g.estado_pago !== 'Anulado';
    const pie = '<button class="btn sec" id="dDup">Duplicar</button>' +
      (editable ? '<button class="btn osc" id="dEdit">Editar</button>' : '') +
      (puedePagar() && g.estado_pago === 'Pendiente' ? '<button class="btn pri" id="dPagar">Pagar</button>' : '');
    const anular = puedePagar() && editable ? '<button id="dAnular">Anular</button>' : '';
    const h = abrirHoja('Gasto', cuerpo, pie, anular);
    $('#dDup', h).onclick = () => { h.cerrar(); abrirGasto(Object.assign({}, g, { id: '', fecha: hoyISO(), n_doc: '', foto: '', estado_pago: '' }), { titulo: 'Duplicar gasto' }); };
    if ($('#dEdit', h)) $('#dEdit', h).onclick = () => { h.cerrar(); abrirGasto(g, { editar: true }); };
    if ($('#dPagar', h)) $('#dPagar', h).onclick = () => { h.cerrar(); abrirPago([g]); };
    if ($('#dAnular', h)) $('#dAnular', h).onclick = async () => {
      if (!confirm('¿Anular el gasto ' + g.id + ' por ' + clp(g.total) + '? Dejará de sumar en los totales.')) return;
      try { await api('saveGasto', Object.assign({}, g, { estado_pago: 'Anulado' })); toast('Gasto anulado'); h.cerrar(); S.gastos = {}; S.dash = {}; refrescarVista(); }
      catch (e) { toast(e.message, true); }
    };
  }

  // ── Pendientes ──
  function vistaPendientes(c) {
    c.innerHTML = '<div class="skel"></div>';
    const sel = new Set();
    api('pendientes').then((d) => {
      if (!c.isConnected) return;
      if (!d.proveedores.length) { c.innerHTML = '<div class="card vacio">No hay pagos pendientes. 🎉</div>'; return; }
      const docs = {};
      let html = '<div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span class="muted">' + d.n + (d.n === 1 ? ' documento · ' : ' documentos · ') + d.proveedores.length + (d.proveedores.length === 1 ? ' proveedor' : ' proveedores') + '</span><b class="num" style="font-family:var(--f-tit);font-size:26px;color:var(--rojo)">' + clp(d.total) + '</b></div>';
      d.proveedores.forEach((p, i) => {
        p.docs.forEach((g) => { docs[g.id] = g; });
        const fila = (lbl, val) => val ? '<div class="r"><span>' + lbl + '</span><b>' + esc(val) + '</b><button data-copy="' + esc(val) + '">Copiar</button></div>' : '';
        html += '<div class="card prov"><button class="prov-h" data-p="' + i + '"><span class="bd"><div class="t1">' + esc(p.proveedor) + '</div><div class="muted small">' + esc(rutFmt(p.rut)) + ' · ' + p.docs.length + ' docs</div></span><span class="monto num">' + clp(p.total) + '</span></button>' +
          '<div class="prov-b hidden" id="pb' + i + '">' +
          (p.banco || p.n_cuenta ? '<div class="banco">' + fila('Nombre', p.proveedor) + fila('RUT', rutFmt(p.rut)) + fila('Banco', p.banco) + fila('Cuenta', p.tipo_cuenta) + fila('N° cuenta', p.n_cuenta) + fila('Correo', p.correo) + '</div>'
            : '<div class="muted small" style="margin-top:8px">Sin datos bancarios en PROVEEDORES.</div>') +
          '<div class="doc"><input type="checkbox" data-all="' + i + '"><div class="bd"><b>Seleccionar todos</b></div></div>' +
          p.docs.map((g) => '<label class="doc"><input type="checkbox" data-doc="' + esc(g.id) + '" data-pi="' + i + '"><div class="bd"><b>' + esc([g.tipo_doc, g.n_doc].filter(Boolean).join(' ') || g.id) + '</b> · ' + esc(movilTxt(g.movil)) +
            '<div class="muted small">' + fecha(g.fecha) + ' · ' + (g.dias_venc != null ? (g.dias_venc > 0 ? '<b style="color:var(--rojo)">vencida hace ' + g.dias_venc + ' días</b>' : 'vence en ' + (-g.dias_venc) + ' días') : 'emitida hace ' + g.dias_emision + ' días') + '</div></div>' +
            '<span class="monto num">' + clp(g.total) + '</span></label>').join('') + '</div></div>';
      });
      c.innerHTML = html;
      on(c, '.prov-h', 'click', (e, b) => $('#pb' + b.dataset.p, c).classList.toggle('hidden'));
      on(c, '[data-copy]', 'click', (e, b) => { e.preventDefault(); copiar(b.dataset.copy); });
      const barra = () => {
        quitarBarra();
        if (!sel.size) return;
        document.body.classList.add('con-barra');
        const tot = Array.from(sel).reduce((s, id) => s + (Number(docs[id].total) || 0), 0);
        const b = document.createElement('div'); b.className = 'barra-sel';
        b.innerHTML = '<div class="bd"><div class="small" style="color:#C9CDD1">' + sel.size + ' seleccionados</div><b class="num">' + clp(tot) + '</b></div><button class="btn pri sm">Marcar pagado</button>';
        document.body.appendChild(b);
        $('button', b).onclick = () => abrirPago(Array.from(sel).map((id) => docs[id]));
      };
      on(c, '[data-doc]', 'change', (e, cb) => { cb.checked ? sel.add(cb.dataset.doc) : sel.delete(cb.dataset.doc); barra(); });
      on(c, '[data-all]', 'change', (e, cb) => { $$('[data-pi="' + cb.dataset.all + '"]', c).forEach((x) => { x.checked = cb.checked; cb.checked ? sel.add(x.dataset.doc) : sel.delete(x.dataset.doc); }); barra(); });
      window.addEventListener('hashchange', quitarBarra, { once: true });
    }).catch((e) => { if (c.isConnected) c.innerHTML = '<div class="card vacio">' + esc(e.message) + '</div>'; });
  }

  function quitarBarra() { $$('.barra-sel').forEach((x) => x.remove()); document.body.classList.remove('con-barra'); }

  function copiar(t) {
    const ok = () => toast('Copiado: ' + t);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok).catch(() => fallbackCopy(t, ok));
    else fallbackCopy(t, ok);
  }
  function fallbackCopy(t, ok) { const i = document.createElement('textarea'); i.value = t; document.body.appendChild(i); i.select(); try { document.execCommand('copy'); ok(); } catch (e) { } i.remove(); }

  function abrirPago(docs) {
    const tot = docs.reduce((s, g) => s + (Number(g.total) || 0), 0);
    let medio = 'Transferencia';
    const medios = ['Transferencia', 'Tarjeta', 'Efectivo', 'Caja chica'];
    const h = abrirHoja('Registrar pago',
      '<div class="monto-box"><div class="m num">' + clp(tot) + '</div><div class="ni">' + docs.length + ' documento(s)</div></div>' +
      '<label class="field"><span class="lbl">Fecha de pago</span><input class="inp" type="date" id="pFecha" value="' + hoyISO() + '"></label>' +
      '<div class="field"><span class="lbl">Medio</span><div class="chips" id="pMedio">' + medios.map((m) => '<button class="chip ' + (m === medio ? 'on' : '') + '">' + m + '</button>').join('') + '</div></div>' +
      '<label class="field"><span class="lbl">N° comprobante / transferencia</span><input class="inp" id="pComp" autocomplete="off"></label>',
      '<button class="btn pri" id="pOk">Confirmar pago</button>');
    on(h, '#pMedio .chip', 'click', (e, b) => { medio = b.textContent; $$('#pMedio .chip', h).forEach((x) => x.classList.toggle('on', x === b)); });
    $('#pOk', h).onclick = async (e) => {
      const btn = e.currentTarget;
      const data = { ids: docs.map((g) => g.id), fecha_pago: $('#pFecha', h).value, medio: medio, comprobante: $('#pComp', h).value.trim() };
      const job = { id: uuid(), action: 'marcarPagado', data: data, clientId: uuid(), desc: 'Pago ' + clp(tot), ts: Date.now() };
      setBtnCargando(btn, true);
      try { const r = await ejecutarJob(job); toast(r.actualizados + ' documento(s) pagados · ' + clp(r.monto)); }
      catch (err) {
        if (!err.red) { setBtnCargando(btn, false); return toast(err.message, true); }
        encolar(job); toast('Sin señal: el pago se registrará al reconectar');
      }
      quitarBarra();
      h.cerrar(); S.gastos = {}; S.dash = {}; refrescarVista();
    };
  }

  // ───────────────────────── NUEVO / EDITAR GASTO ─────────────────────────
  function estadoAuto(forma, tipo) {
    if (forma === 'Crédito proveedor') return 'Pendiente';
    if (!forma && tipo === 'Factura') return 'Pendiente';
    return 'Pagado';
  }

  function abrirGasto(pre, opt) {
    opt = opt || {};
    pre = pre || {};
    const par = P();
    const g = {
      id: opt.editar ? pre.id : '', total: Math.round(Number(pre.total) || 0), categoria: pre.categoria || '', movil: pre.movil && pre.movil !== 'GENERAL' ? String(pre.movil) : (pre.movil === 'GENERAL' ? 'GENERAL' : ''),
      fecha: pre.fecha || hoyISO(), proveedor_cod: pre.proveedor_cod || '', proveedor: pre.proveedor || '', proveedor_rut: pre.proveedor_rut || '', proveedor_nuevo: null,
      tipo_doc: pre.tipo_doc || 'Factura', n_doc: pre.n_doc || '', forma_pago: pre.forma_pago || '', estado_pago: pre.estado_pago || '', estadoManual: !!(opt.editar && pre.estado_pago),
      venc: pre.venc || '', n_ot: pre.n_ot || '', obs: pre.obs || '', solicitado_por: pre.solicitado_por || '', foto: pre.foto || '', fotoData: null,
      clientId: uuid()
    };
    const yaPagado = opt.editar && pre.estado_pago === 'Pagado';
    const cats = par.CATEGORIAS || ['Mantención', 'Otros'];
    const tipos = par.TIPOS_DOC || ['Factura', 'Boleta', 'Inventario Yuval', 'Sin respaldo', 'Otros'];
    const formas = par.FORMAS_PAGO || ['Transferencia', 'Tarjeta', 'Efectivo', 'Crédito proveedor', 'Caja chica'];
    const titulo = opt.titulo || (opt.editar ? 'Editar ' + pre.id : 'Nuevo gasto');
    const extra = !opt.editar && S.lastGasto ? '<button id="gRep">↻ Repetir último</button>' : '';
    const cuerpo =
      '<div class="monto-box"><div class="m num" id="gMonto"></div><div class="ni" id="gNI"></div></div>' +
      '<div class="chips scroll" id="gCats" style="display:grid;grid-template-rows:repeat(2,auto);grid-auto-flow:column;gap:8px">' +
      cats.map((c) => '<button class="chip" data-c="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>' +
      '<div class="keypad" id="gKey">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'].map((k) => '<button data-k="' + k + '">' + k + '</button>').join('') + '</div>' +
      '<div class="field"><span class="lbl">Móvil</span><div id="gMovil"></div></div>' +
      '<div class="field"><span class="lbl">Proveedor</span><div id="gProv"></div></div>' +
      '<div class="field"><span class="lbl">Documento</span><div class="chips" id="gTipo">' + tipos.map((t) => '<button class="chip sm" data-v="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div></div>' +
      '<div class="row2"><label class="field"><span class="lbl">N° documento</span><input class="inp" id="gNDoc" inputmode="numeric" autocomplete="off"></label>' +
      '<label class="field"><span class="lbl">Fecha</span><input class="inp" type="date" id="gFecha"></label></div>' +
      '<div class="field"><span class="lbl">Forma de pago</span><div class="chips" id="gForma">' + formas.map((t) => '<button class="chip sm" data-v="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div></div>' +
      '<div class="field"><span class="lbl">Estado</span><div class="seg" id="gEstado" style="margin:0"><button data-v="Pagado">Pagado</button><button data-v="Pendiente">Pendiente</button></div></div>' +
      '<label class="field" id="gVencW"><span class="lbl">Vencimiento</span><input class="inp" type="date" id="gVenc"></label>' +
      '<div class="field"><span class="lbl">Foto del documento</span><div class="foto-prev" id="gFotoW"></div><input type="file" accept="image/*" id="gFotoIn" class="hidden"></div>' +
      '<div class="row2"><label class="field"><span class="lbl">N° OT</span><input class="inp" id="gOT" autocomplete="off" placeholder="Opcional"></label>' +
      '<label class="field"><span class="lbl">Solicitado por</span><input class="inp" id="gSol" autocomplete="off"></label></div>' +
      '<label class="field"><span class="lbl">Observación</span><textarea class="inp" id="gObs" rows="2"></textarea></label>';
    const h = abrirHoja(titulo, cuerpo, '<button class="btn pri" id="gGuardar">Guardar</button>', extra);

    // ── pintado ──
    const pintarMonto = () => {
      $('#gMonto', h).textContent = clp(g.total); $('#gMonto', h).classList.toggle('cero', !g.total);
      if (g.tipo_doc === 'Factura' && g.total) { const n = Math.round(g.total / 1.19); $('#gNI', h).textContent = 'Neto ' + clp(n) + ' · IVA ' + clp(g.total - n); }
      else $('#gNI', h).textContent = '';
    };
    const pintarChips = () => {
      $$('#gCats .chip', h).forEach((b) => b.classList.toggle('on', b.dataset.c === g.categoria));
      $$('#gTipo .chip', h).forEach((b) => b.classList.toggle('on', b.dataset.v === g.tipo_doc));
      $$('#gForma .chip', h).forEach((b) => b.classList.toggle('on', b.dataset.v === g.forma_pago));
      if (!g.estadoManual && !yaPagado) g.estado_pago = estadoAuto(g.forma_pago, g.tipo_doc);
      $$('#gEstado button', h).forEach((b) => b.classList.toggle('on', b.dataset.v === g.estado_pago));
      $('#gVencW', h).classList.toggle('hidden', g.estado_pago !== 'Pendiente');
      pintarMonto();
    };
    const pintarFoto = () => {
      const w = $('#gFotoW', h);
      const src = g.fotoData || (g.foto ? null : '');
      if (g.fotoData) w.innerHTML = '<img src="' + g.fotoData + '" alt=""><button class="btn sec sm" id="gFotoX">Quitar</button>';
      else if (g.foto) w.innerHTML = '<a href="' + esc(g.foto) + '" target="_blank" rel="noopener" class="btn sec sm">Ver foto actual</a><button class="btn sec sm" id="gFotoCam">Reemplazar</button>';
      else w.innerHTML = '<button class="btn sec" id="gFotoCam">📷 Agregar foto</button>';
      if ($('#gFotoX', h)) $('#gFotoX', h).onclick = () => { g.fotoData = null; pintarFoto(); };
      if ($('#gFotoCam', h)) $('#gFotoCam', h).onclick = () => $('#gFotoIn', h).click();
      return src;
    };
    const llenarCampos = () => {
      $('#gNDoc', h).value = g.n_doc; $('#gFecha', h).value = g.fecha; $('#gVenc', h).value = g.venc;
      $('#gOT', h).value = g.n_ot; $('#gSol', h).value = g.solicitado_por; $('#gObs', h).value = g.obs;
      pickMovil($('#gMovil', h), g.movil, (v) => { g.movil = v; });
      pickProveedor($('#gProv', h), g, () => { });
      pintarChips(); pintarFoto();
    };
    llenarCampos();

    // ── eventos ──
    on(h, '#gKey button', 'click', (e, b) => {
      const k = b.dataset.k;
      let s = String(g.total || '');
      if (k === '⌫') s = s.slice(0, -1); else if (s.length < 11) s = (s === '0' ? '' : s) + k;
      g.total = Number(s) || 0; pintarMonto();
    });
    on(h, '#gCats .chip', 'click', (e, b) => { g.categoria = b.dataset.c; pintarChips(); });
    on(h, '#gTipo .chip', 'click', (e, b) => { g.tipo_doc = b.dataset.v; pintarChips(); });
    on(h, '#gForma .chip', 'click', (e, b) => { g.forma_pago = g.forma_pago === b.dataset.v ? '' : b.dataset.v; pintarChips(); });
    on(h, '#gEstado button', 'click', (e, b) => {
      if (yaPagado) return toast('El gasto ya está pagado');
      if (b.dataset.v === 'Pagado' && g.forma_pago === 'Crédito proveedor' && !puedePagar()) return toast('Solo supervisión registra pagos a crédito', true);
      g.estado_pago = b.dataset.v; g.estadoManual = true; pintarChips();
    });
    $('#gFotoIn', h).onchange = async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try { g.fotoData = await comprimirImagen(f, 1280, 0.72); pintarFoto(); } catch (err) { toast('No se pudo leer la imagen', true); }
      e.target.value = '';
    };
    if ($('#gRep', h)) $('#gRep', h).onclick = () => {
      const l = S.lastGasto;
      Object.assign(g, { total: l.total, categoria: l.categoria, movil: l.movil || '', proveedor_cod: l.proveedor_cod || '', proveedor: l.proveedor || '', proveedor_rut: l.proveedor_rut || '',
        proveedor_nuevo: null, tipo_doc: l.tipo_doc || 'Factura', forma_pago: l.forma_pago || '', estadoManual: false, n_doc: '', fecha: hoyISO(), obs: l.obs || '', solicitado_por: l.solicitado_por || '' });
      llenarCampos(); toast('Copiado el último gasto: revise N° de documento');
    };

    $('#gGuardar', h).onclick = async (e) => {
      const btn = e.currentTarget;
      if (btn.disabled) return;
      g.n_doc = $('#gNDoc', h).value.trim(); g.fecha = $('#gFecha', h).value || hoyISO(); g.venc = $('#gVenc', h).value;
      g.n_ot = $('#gOT', h).value.trim().toUpperCase(); g.solicitado_por = $('#gSol', h).value.trim(); g.obs = $('#gObs', h).value.trim();
      if (!g.total) return toast('Ingrese el monto', true);
      if (!g.categoria) return toast('Elija una categoría', true);
      const data = {
        id: g.id || '', total: g.total, categoria: g.categoria, movil: g.movil || 'GENERAL', fecha: g.fecha, n_ot: g.n_ot,
        proveedor_cod: g.proveedor_cod, proveedor: g.proveedor, proveedor_rut: g.proveedor_rut, proveedor_nuevo: g.proveedor_nuevo,
        tipo_doc: g.tipo_doc, n_doc: g.n_doc, forma_pago: g.forma_pago, estado_pago: g.estado_pago, venc: g.estado_pago === 'Pendiente' ? g.venc : '',
        solicitado_por: g.solicitado_por, obs: g.obs, foto: g.fotoData ? '' : g.foto
      };
      if (opt.editar) Object.assign(data, { fecha_pago: pre.fecha_pago, medio_pago: pre.medio_pago, comprobante: pre.comprobante });
      const job = { id: uuid(), action: 'saveGasto', data: data, clientId: g.clientId, foto: g.fotoData ? g.fotoData.split(',')[1] : null, fotoTipo: 'Respaldo',
        desc: g.categoria + ' ' + clp(g.total), ts: Date.now() };
      setBtnCargando(btn, true);
      let msg;
      try {
        const r = await ejecutarJob(job);
        msg = r.duplicado ? 'Ya estaba registrado: ' + r.id : (opt.editar ? 'Gasto actualizado' : 'Gasto ' + r.id + ' guardado');
      } catch (err) {
        if (!err.red) { setBtnCargando(btn, false); return toast(err.message, true); }
        encolar(job); msg = 'Sin señal: se enviará automáticamente';
      }
      if (!opt.editar) {
        S.lastGasto = Object.assign({}, data, { foto: '' }); LS.set('lastGasto', S.lastGasto);
        if (g.proveedor_cod) { S.recProv = [g.proveedor_cod].concat(S.recProv.filter((x) => x !== g.proveedor_cod)).slice(0, 6); LS.set('recProv', S.recProv); }
      }
      if (g.proveedor_nuevo) cargarBoot(true).catch(() => { });
      toast(msg);
      h.cerrar(); S.gastos = {}; S.dash = {}; refrescarVista();
    };
  }

  // ── buscador de móvil ──
  function pickMovil(cont, valor, onCambio) {
    const pintar = () => {
      if (valor) {
        const m = movilDe(valor);
        cont.innerHTML = '<div class="pick-sel"><div class="bd"><b>' + esc(movilTxt(valor)) + '</b><div class="muted small">' +
          esc(valor === 'GENERAL' ? 'Sin móvil asociado' : m ? [m.tipo, m.marca, m.modelo, m.conductor].filter(Boolean).join(' · ') : '') + '</div></div><button class="x" aria-label="Quitar">✕</button></div>';
        $('.x', cont).onclick = () => { valor = ''; onCambio(''); pintar(); setTimeout(() => $('input', cont).focus(), 50); };
        return;
      }
      cont.innerHTML = '<div class="pick"><input class="inp" placeholder="N° móvil o patente (vacío = General)" autocomplete="off" autocapitalize="characters"><div class="pick-res hidden"></div></div>';
      const inp = $('input', cont), res = $('.pick-res', cont);
      const buscar = () => {
        const q = normAZ(inp.value);
        const ms = ((S.boot && S.boot.moviles) || []);
        const lista = (q ? ms.filter((m) => String(m.movil).toUpperCase().startsWith(q) || normAZ(m.patente).includes(q) || normAZ(m.conductor).includes(q)) : ms).slice(0, 8);
        res.innerHTML = lista.map((m) => '<button data-m="' + esc(m.movil) + '"><b>' + esc(m.movil) + '</b> · ' + esc(patente(m.patente)) + ' <span class="muted small">' + esc([m.tipo, m.marca].filter(Boolean).join(' ')) + '</span></button>').join('') +
          '<button data-m="GENERAL"><b>General / Stock</b> <span class="muted small">sin móvil</span></button>';
        res.classList.remove('hidden');
        on(res, 'button', 'click', (e, b) => { valor = b.dataset.m; onCambio(valor); pintar(); });
      };
      inp.addEventListener('input', buscar);
      inp.addEventListener('focus', buscar);
    };
    pintar();
  }

  // ── buscador de proveedor (con recientes y creación) ──
  function pickProveedor(cont, g) {
    const provs = (S.boot && S.boot.proveedores) || [];
    const porCod = (c) => provs.find((p) => String(p.cod) === String(c));
    const pintar = () => {
      if (g.proveedor_cod || g.proveedor_nuevo || g.proveedor) {
        const nom = g.proveedor_nuevo ? g.proveedor_nuevo.nombre : (porCod(g.proveedor_cod) || {}).nombre || g.proveedor;
        const rut = g.proveedor_nuevo ? g.proveedor_nuevo.rut : (porCod(g.proveedor_cod) || {}).rut || g.proveedor_rut;
        cont.innerHTML = '<div class="pick-sel"><div class="bd"><b>' + esc(nom) + '</b><div class="muted small">' + esc(rutFmt(rut)) + (g.proveedor_nuevo ? ' · nuevo' : '') + '</div></div><button class="x" aria-label="Quitar">✕</button></div>';
        $('.x', cont).onclick = () => { g.proveedor_cod = ''; g.proveedor = ''; g.proveedor_rut = ''; g.proveedor_nuevo = null; pintar(); };
        return;
      }
      const rec = S.recProv.map(porCod).filter(Boolean);
      cont.innerHTML = (rec.length ? '<div class="chips scroll" style="margin-bottom:8px">' + rec.map((p) => '<button class="chip sm" data-cod="' + esc(p.cod) + '">' + esc(p.nombre.length > 22 ? p.nombre.slice(0, 22) + '…' : p.nombre) + '</button>').join('') + '</div>' : '') +
        '<div class="pick"><input class="inp" placeholder="Nombre o RUT del proveedor" autocomplete="off"><div class="pick-res hidden"></div></div>';
      on(cont, '[data-cod]', 'click', (e, b) => { g.proveedor_cod = b.dataset.cod; pintar(); });
      const inp = $('input', cont), res = $('.pick-res', cont);
      inp.addEventListener('input', () => {
        const txt = inp.value.trim();
        if (txt.length < 2) { res.classList.add('hidden'); return; }
        const q = norm(txt), qd = txt.replace(/[^0-9kK]/g, '');
        const lista = provs.filter((p) => norm(p.nombre).includes(q) || (qd.length >= 3 && String(p.rut || '').replace(/[^0-9K]/gi, '').includes(qd.toUpperCase()))).slice(0, 8);
        res.innerHTML = lista.map((p) => '<button data-cod="' + esc(p.cod) + '"><b>' + esc(p.nombre) + '</b><div class="muted small">' + esc(rutFmt(p.rut)) + (p.rubro ? ' · ' + esc(p.rubro) : '') + '</div></button>').join('') +
          '<button class="nuevo" data-nuevo="1">+ Crear proveedor «' + esc(txt) + '»</button>';
        res.classList.remove('hidden');
        on(res, '[data-cod]', 'click', (e, b) => { g.proveedor_cod = b.dataset.cod; pintar(); });
        on(res, '[data-nuevo]', 'click', () => {
          res.innerHTML = '<div style="padding:12px"><input class="inp" id="pnNom" value="' + esc(txt.toUpperCase()) + '" placeholder="Nombre"><input class="inp" id="pnRut" style="margin-top:8px" placeholder="RUT (opcional) 12.345.678-9" autocomplete="off">' +
            '<button class="btn osc" style="margin-top:8px" id="pnOk">Usar este proveedor</button></div>';
          $('#pnOk', res).onclick = () => {
            const nombre = $('#pnNom', res).value.trim().toUpperCase();
            if (!nombre) return;
            g.proveedor_nuevo = { nombre: nombre, rut: $('#pnRut', res).value.trim() }; g.proveedor_cod = ''; pintar();
          };
        });
      });
    };
    pintar();
  }

  // ── compresión de foto ──
  function comprimirImagen(file, max, q) {
    return new Promise((ok, mal) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth, hh = img.naturalHeight;
        const k = Math.min(1, max / Math.max(w, hh)); w = Math.round(w * k); hh = Math.round(hh * k);
        const cv = document.createElement('canvas'); cv.width = w; cv.height = hh;
        cv.getContext('2d').drawImage(img, 0, 0, w, hh);
        URL.revokeObjectURL(url);
        ok(cv.toDataURL('image/jpeg', q));
      };
      img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('imagen')); };
      img.src = url;
    });
  }

  // ───────────────────────── FLOTA (lista) ─────────────────────────
  function vistaFlota(v) {
    const ms = ((S.boot && S.boot.moviles) || []).slice().sort((a, b) => (Number(a.movil) || 999) - (Number(b.movil) || 999));
    const estados = ['', 'Operativo', 'En taller', 'Fuera de servicio'];
    S.filtroFlota = S.filtroFlota || '';
    v.innerHTML = '<h2 class="tit">Flota</h2><input class="inp" id="fBus" placeholder="Buscar N°, patente o conductor" autocomplete="off" style="margin-bottom:10px">' +
      '<div class="chips scroll" id="fEst" style="margin-bottom:12px">' + estados.map((e) => '<button class="chip sm" data-e="' + e + '">' + (e || 'Todos') + '</button>').join('') + '</div><div id="fList"></div>';
    const pintar = () => {
      const q = normAZ($('#fBus', v).value);
      $$('#fEst .chip', v).forEach((b) => b.classList.toggle('on', b.dataset.e === S.filtroFlota));
      const l = ms.filter((m) => (!S.filtroFlota || m.estado === S.filtroFlota) && (!q || String(m.movil).toUpperCase().startsWith(q) || normAZ(m.patente).includes(q) || normAZ(m.conductor).includes(q)));
      $('#fList', v).innerHTML = l.length ? '<div class="muted small" style="margin:0 2px 8px">' + l.length + ' móviles</div><div class="list">' + l.map((m) =>
        '<button class="item" data-m="' + esc(m.movil) + '"><span class="ic">' + esc(m.movil) + '</span><span class="bd"><div class="t1">' + esc(patente(m.patente) || 'Sin patente') + ' · ' + esc(m.tipo || '') + '</div>' +
        '<div class="t2">' + esc([m.marca, m.modelo, m.conductor].filter(Boolean).join(' · ')) + '</div></span><span class="rt">' + tagEquipo(m.estado) + '</span></button>').join('') + '</div>'
        : '<div class="card vacio">Sin resultados</div>';
      on($('#fList', v), '[data-m]', 'click', (e, b) => abrirMovilSimple(movilDe(b.dataset.m)));
    };
    $('#fBus', v).addEventListener('input', pintar);
    on(v, '#fEst .chip', 'click', (e, b) => { S.filtroFlota = b.dataset.e; pintar(); });
    pintar();
  }
  function abrirMovilSimple(m) {
    const kv = (k, val) => val ? '<div class="kv"><span>' + k + '</span><b>' + esc(val) + '</b></div>' : '';
    const h = abrirHoja('Móvil ' + m.movil,
      '<div class="card">' + kv('Patente', patente(m.patente)) + kv('Tipo', m.tipo) + kv('Marca / modelo', [m.marca, m.modelo].filter(Boolean).join(' ')) + kv('Año', m.anio) +
      kv('Conductor', m.conductor) + kv('Departamento', m.depto) + kv('Sucursal / zonal', [m.sucursal, m.zonal].filter(Boolean).join(' · ')) + kv('Estado', m.estado) +
      kv('Restricción', m.restriccion) + kv('Km actual', m.km ? miles(m.km) : '') + kv('Rev. técnica', fecha(m.venc_rt)) + kv('Permiso circ.', fecha(m.venc_permiso)) + kv('SOAP', fecha(m.venc_soap)) +
      kv('Próx. mantención', [m.prox_km ? miles(m.prox_km) + ' km' : '', fecha(m.prox_fecha)].filter(Boolean).join(' · ')) + '</div>' +
      '<p class="muted small" style="text-align:center;margin-top:16px">El historial y el gasto por móvil se habilitan en la Fase 4.</p>',
      '<button class="btn pri" id="mGasto">Nuevo gasto para este móvil</button>');
    $('#mGasto', h).onclick = () => { h.cerrar(); abrirGasto({ movil: m.movil }); };
  }

  // ───────────────────────── OT y Reportes (fases siguientes) ─────────────────────────
  function vistaOT(v) {
    v.innerHTML = '<h2 class="tit">Órdenes de trabajo</h2><div class="card muted small" style="margin-bottom:12px">Las minutas y las OT completas (checklist, fotos, firmas y PDF) se habilitan en la Fase 3. Abajo, las últimas OT registradas.</div><div id="otL"><div class="skel"></div></div>';
    api('listOT', { limit: 40 }).then((d) => {
      const c = $('#otL', v); if (!c) return;
      c.innerHTML = d.items.length ? '<div class="list">' + d.items.map((o) => '<div class="item"><span class="ic ot">' + (o.tipo_registro === 'Histórico' ? 'H' : 'OT') + '</span><span class="bd"><div class="t1">' + esc(o.n_ot) + ' · Móvil ' + esc(o.movil) + '</div>' +
        '<div class="t2">' + esc([o.categoria, o.descripcion].filter(Boolean).join(' · ')) + '</div></span><span class="rt"><div class="monto num">' + clp(o.total) + '</div><div class="t2 small">' + fechaLarga(o.fecha_emision) + '</div></span></div>').join('') + '</div>'
        : '<div class="card vacio">Sin OT</div>';
    }).catch((e) => { const c = $('#otL', v); if (c) c.innerHTML = '<div class="card vacio">' + esc(e.message) + '</div>'; });
  }
  function vistaReportes(v) {
    v.innerHTML = '<h2 class="tit">Reportes</h2><div class="card muted">Gasto por mes, categoría, móvil, proveedor y zonal, preventivo vs. correctivo y costo/km se habilitan en la Fase 4.</div>';
  }

  // ───────────────────────── menú usuario / sincronización ─────────────────────────
  function abrirMenuUsuario() {
    const tema = document.documentElement.dataset.theme === 'dark';
    const h = abrirHoja(S.ses.nombre,
      '<div class="card">' +
      '<div class="kv"><span>Usuario</span><b>' + esc(S.ses.usuario) + '</b></div><div class="kv"><span>Rol</span><b>' + esc(S.ses.rol) + '</b></div>' +
      '<div class="kv"><span>Catálogos</span><b>' + (S.boot ? S.boot.moviles.length + ' móviles · ' + S.boot.proveedores.length + ' proveedores' : '—') + '</b></div>' +
      '<div class="kv"><span>Versión</span><b>' + VERSION + '</b></div></div>' +
      '<div class="stack" style="margin-top:14px">' +
      '<button class="btn sec" id="uBoot">' + ICON.recargar.replace('<svg', '<svg width="20" height="20"') + ' Actualizar catálogos</button>' +
      '<button class="btn sec" id="uTema">' + (tema ? '☀️ Modo claro' : '🌙 Modo oscuro') + '</button>' +
      '<button class="btn sec" id="uPin">Cambiar PIN</button>' +
      '<button class="btn sec" id="uSalir" style="color:var(--rojo)">Cerrar sesión</button></div>');
    $('#uBoot', h).onclick = async (e) => { setBtnCargando(e.currentTarget, true, 'Actualizando…'); try { await cargarBoot(true); toast('Catálogos actualizados'); h.cerrar(); refrescarVista(); } catch (err) { toast(err.message, true); setBtnCargando(e.currentTarget, false); } };
    $('#uTema', h).onclick = () => { aplicarTema(tema ? 'light' : 'dark'); h.cerrar(); };
    $('#uSalir', h).onclick = () => { if (S.cola.length && !confirm('Hay ' + S.cola.length + ' registros sin enviar. Si cierra sesión se enviarán al volver a entrar. ¿Continuar?')) return; h.cerrar(); cerrarSesion(); };
    $('#uPin', h).onclick = () => {
      h.cerrar();
      const p = abrirHoja('Cambiar PIN', '<label class="field"><span class="lbl">PIN actual</span><input class="inp" id="pa" type="password" inputmode="numeric" maxlength="6"></label>' +
        '<label class="field"><span class="lbl">PIN nuevo (4 a 6 dígitos)</span><input class="inp" id="pn" type="password" inputmode="numeric" maxlength="6"></label>', '<button class="btn pri" id="pOk">Guardar</button>');
      $('#pOk', p).onclick = async (e) => {
        const btn = e.currentTarget; setBtnCargando(btn, true);
        try { const r = await api('cambiarPin', { pinActual: $('#pa', p).value, pinNuevo: $('#pn', p).value }); S.ses.sk = r.sk; LS.set('ses', S.ses); toast('PIN actualizado'); p.cerrar(); }
        catch (err) { toast(err.message, true); setBtnCargando(btn, false); }
      };
    };
  }
  function abrirSync() {
    const h = abrirHoja('Sincronización',
      (S.cola.length ? '<div class="list">' + S.cola.map((j) => '<div class="item"><span class="ic g">' + (j.action === 'marcarPagado' ? '✓' : '$') + '</span><span class="bd"><div class="t1">' + esc(j.desc || j.action) + '</div>' +
        '<div class="t2">' + new Date(j.ts).toLocaleString('es-CL') + (j.error ? ' · <b style="color:var(--rojo)">' + esc(j.error) + '</b>' : ' · en espera') + (j.sinFoto ? ' · sin foto' : '') + '</div></span>' +
        '<button class="btn sec sm" data-del="' + esc(j.id) + '">Descartar</button></div>').join('') + '</div>'
        : '<div class="card vacio">Todo está enviado ✓</div>') +
      '<p class="muted small" style="text-align:center;margin-top:14px">Los registros hechos sin señal quedan aquí y se envían solos al recuperar conexión.</p>',
      S.cola.length ? '<button class="btn pri" id="sYa">Enviar ahora</button>' : '');
    on(h, '[data-del]', 'click', (e, b) => {
      if (!confirm('¿Descartar este registro? No se enviará.')) return;
      S.cola = S.cola.filter((j) => j.id !== b.dataset.del); guardarCola(); h.cerrar(); abrirSync();
    });
    if ($('#sYa', h)) $('#sYa', h).onclick = async () => { h.cerrar(); await sincronizar(true); };
  }

  function aplicarTema(t) { document.documentElement.dataset.theme = t; LS.set('tema', t); }

  // ───────────────────────── arranque ─────────────────────────
  aplicarTema(LS.get('tema', 'light'));
  window.addEventListener('hashchange', router);
  window.addEventListener('online', () => sincronizar());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { sincronizar(); if (S.ses && location.hash.startsWith('#/inicio')) refrescarVista(); } });
  setInterval(() => { if (navigator.onLine) sincronizar(); }, 60000);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
  if (S.ses) iniciarApp(); else pintarLogin();
})();
