# Mantenimiento · Flota Yuval

Base de datos en Google Sheets (formato nuevo, desde cero) + backend Apps Script + app para iPhone.

```
flota-yuval/
├── BD_MANTENIMIENTO_FLOTA_YUVAL.xlsx  ← planilla nueva = base de datos de la app
├── apps-script/
│   ├── Code.gs          ← pegar en el editor de Apps Script
│   ├── PdfOT.html       ← plantilla del PDF de la OT (archivo HTML en el mismo proyecto)
│   └── appsscript.json  ← manifiesto (zona horaria Chile, web app)
├── web/                 ← app para iPhone (subir completa a GitHub Pages)
│   ├── index.html, app.js, styles.css
│   ├── manifest.json, sw.js
│   ├── config.js        ← URL del deploy + token (único lugar a editar)
│   └── *.png            ← íconos 180/192/512 en la raíz (sin subcarpetas)
└── README.md
```

---

## 1. La planilla nueva

`BD_MANTENIMIENTO_FLOTA_YUVAL.xlsx` reemplaza a `DETALLE_MOVILES_YUVAL_SPA`. Es la base de datos que usa la app y parte **desde cero**: no trae registros antiguos.

| Hoja | Contenido |
|---|---|
| **LEEME** | Explicación de cada hoja, reglas y un **avance de carga** que se actualiza solo: cuántos móviles faltan sin patente, sin estado, sin km o sin vencimientos. |
| **MOVILES** | 77 móviles **precargados y ordenados** desde la planilla antigua. Patentes sin guion, tipos y estados unificados, zonal según sucursal; STOCK y la fila "-" eliminados. Las celdas **en amarillo** son datos por completar. |
| **PROVEEDORES** | 482 proveedores con datos bancarios: los 491 originales menos 9 con el RUT repetido en otro formato, más el taller interno. En amarillo, los que no tienen RUT o cuenta. |
| **GASTOS · OT · OT_ITEMS · OT_CHECKLIST · OT_FOTOS** | **Vacías**: se llenan desde la app. |
| **USUARIOS · LOG** | Vacías: `setup()` crea el admin y el LOG es automático. |
| **PARAMETROS** | Listas de la app, editables: categorías, documentos, formas de pago, zonales, sucursales→zonal, tipos de equipo, técnicos internos, checklist 5a–5d del formato OT. |

Todas las hojas traen encabezado carbón, filtros, listas desplegables y formatos ($, dd-mm-aaaa).

**Antes de usar la app conviene completar en MOVILES** (celdas amarillas): estado, km actual, vencimientos de revisión técnica, permiso y SOAP, y próxima mantención. Con eso funcionan las alertas del Inicio. Se puede hacer en Excel antes de subirla o después, en Google Sheets.

> Si prefieres partir con los catálogos vacíos, borra las filas de datos de MOVILES y PROVEEDORES y deja los encabezados.

## 2. Subir la planilla y conectarle el código

1. Subir `BD_MANTENIMIENTO_FLOTA_YUVAL.xlsx` a Google Drive.
2. Abrirla con **Hojas de cálculo de Google** → **Archivo › Guardar como Hojas de cálculo de Google**. Trabajar desde ahí en adelante con esa copia; el `.xlsx` ya no se usa.
3. En esa planilla: **Extensiones › Apps Script**.
4. Borrar el contenido de `Código.gs` y pegar `Code.gs` completo.
5. ⚙️ **Configuración del proyecto** → activar *Mostrar el archivo de manifiesto "appsscript.json"* → pegar `appsscript.json`.
6. En `Code.gs`, bloque `APP` al inicio: revisar `ADMIN_INICIAL` (usuario y **PIN** de 4 a 6 dígitos).
7. Guardar.

## 3. Ejecutar `setup()`

Seleccionar la función `setup` → **Ejecutar** → autorizar los permisos (Sheets, Drive).

`setup()` hace lo siguiente:
- Revisa las hojas y repara las que falten; aplica formatos y listas desplegables. No borra datos ni toca LEEME.
- Ordena los catálogos con `normalizarCatalogos()` y avisa en el registro de móviles o RUT repetidos.
- Genera el **API_TOKEN** y crea la carpeta Drive `/FLOTA YUVAL/` para fotos y PDF.
- Crea el usuario ADMIN inicial.

Se puede volver a ejecutar sin perder datos. Las OT parten en `OT-2026-0001` y los gastos en `G-2026-00001`.

## 4. Mantener los catálogos

- Móviles y proveedores se pueden editar directo en la hoja. Si se escribe una patente con guion o un RUT con puntos, ejecutar `normalizarCatalogos()` lo deja en el formato correcto. También asigna el COD a los proveedores nuevos y la zonal según la sucursal.
- Para dar de baja un móvil o proveedor: **ACTIVO = NO**; no borrar la fila.
- Los proveedores también se pueden crear desde la app al registrar un gasto.
- Después de editar catálogos en la hoja: en la app, menú (iniciales) › **Actualizar catálogos**.
- No cambiar nombres de hojas, encabezados ni el orden de las columnas.

## 5. Publicar la API

1. **Implementar › Nueva implementación** → ⚙️ tipo **Aplicación web**.
2. *Ejecutar como:* **Yo** · *Quién tiene acceso:* **Cualquier persona** (no "Cualquier persona de Yuval": el iPhone llama a la API sin sesión de Google).
3. Copiar la **URL de la aplicación web**, la que termina en **`/exec`**. La que termina en `/dev` es solo de prueba para el editor y no sirve.
4. Ejecutar `mostrarConfig()` y copiar el **TOKEN**.
5. Pegar URL y TOKEN en `web/config.js`.

**Verificar:** abrir la URL `/exec` en una **ventana de incógnito**. Debe mostrar `{"ok":true,"app":"Mantenimiento · Flota Yuval",...}`.
- Si Chrome muestra *"No se pudo abrir el archivo en este momento"* y la URL tiene `/u/1/` o `/u/2/`, es por tener varias cuentas de Google abiertas. En incógnito no pasa, y a la app no le afecta.
- Si en incógnito pide iniciar sesión, la implementación no quedó con acceso "Cualquier persona". Corregirlo en **Gestionar implementaciones › ✏️ › Quién tiene acceso**. Si esa opción no aparece, el administrador de Google Workspace de yuval.cl bloquea el acceso público y hay que pedirle que lo habilite.

> Cada cambio en `Code.gs` requiere **Implementar › Gestionar implementaciones › Editar › Nueva versión** para que la URL use el código nuevo.

### Prueba rápida (consola del navegador)

```js
const API = 'https://script.google.com/macros/s/XXXX/exec', TOKEN = 'XXXX';
const call = (o) => fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({ token: TOKEN, ...o }) }).then(r => r.json());
const s = await call({ action: 'login', usuario: 'bastian', pin: '1234' });
await call({ action: 'dashboard', usuario: 'bastian', sk: s.data.sk, data: {} });
```

## 6. Usuarios

Desde la app: menú (iniciales) › **Administración › Usuarios** (solo ADMIN). También desde el editor: `crearUsuario('juan', 'Juan Pérez', 'correo@x.cl', '4321', 'TECNICO')`. Roles: ADMIN, SUPERVISOR, TECNICO.
El PIN se guarda con hash. Si se ejecuta con un usuario existente, cambia su PIN y rol.

---

## Referencia API (POST `text/plain`, JSON)

Formato de cada llamada: `{ token, action, usuario, sk, clientId?, data }`. La respuesta es `{ ok, data }` o `{ ok:false, error }`.

| Acción | data | Rol |
|---|---|---|
| `login` | `usuario, pin` (en la raíz) → `sk` | todos |
| `bootstrap` | — → móviles, proveedores, parámetros, checklist, técnicos | todos |
| `dashboard` | `mes:'2026-10'` → gasto mes, pendientes, OT abiertas, taller/FS, alertas, últimos 5 | todos |
| `saveGasto` | `total, categoria, movil, proveedor_cod \| proveedor_nuevo{rut,nombre}, tipo_doc, n_doc, forma_pago, estado_pago?, venc, foto, obs` (`id` para editar) | todos |
| `listGastos` | `mes \| desde,hasta, estado, movil, categoria` | todos |
| `pendientes` | — → agrupado por proveedor con datos bancarios y días | ADMIN/SUP |
| `marcarPagado` | `ids[], fecha_pago, medio, comprobante` | ADMIN/SUP |
| `saveOT` | cabecera + `items[]` + `checklist[]` + `fotos[]` (`n_ot` para editar) · minuta: `tipo_registro:'Minuta', movil, categoria, descripcion, ejecuta:'TECNICO'\|'PROVEEDOR', monto, …` | todos |
| `listOT` / `getOT` | filtros / `n_ot` | todos |
| `fichaMovil` | `movil` → datos, alertas, gasto mes/año/categoría, historial | todos |
| `reportes` | `desde, hasta, exportar?` → por mes, categoría, móvil (costo/km), proveedor, zonal, preventivo/correctivo | ADMIN/SUP |
| `uploadFoto` | `n_ot \| id_gasto, tipo, mime, base64` → link Drive | todos |
| `saveProveedor` / `saveMovil` / `cambiarPin` | — | según rol |

**Reglas implementadas:**
- **Anti-duplicados:** los correlativos se generan en el servidor con `LockService`. Un `clientId` repetido devuelve el mismo ID con `duplicado:true`.
- **Un costo se cuenta una sola vez:** un repuesto *Compra* o un servicio externo de una OT crea o actualiza su gasto vinculado (`ID GASTO`). Si el ítem se elimina, el gasto pendiente queda *Anulado*. Bodega y mano de obra interna suman al costo de la OT, pero no a la caja.
- **Al cerrar la OT** se actualizan en MOVILES el km, el horómetro, el estado, la restricción y la próxima mantención.
- **Estado de pago por defecto:** Crédito proveedor, o Factura sin forma de pago = *Pendiente*; el resto = *Pagado*. En factura, neto e IVA se calculan desde el total.

---

# Fase 2 — App para iPhone (GitHub Pages)

## 7. Publicar en GitHub Pages

1. Crear un repositorio en GitHub (por ejemplo `flota-yuval`). Puede ser público: no contiene datos, y el acceso a la API exige token + usuario + PIN.
2. Editar `web/config.js` con la **API_URL** y el **API_TOKEN** que entrega `mostrarConfig()`.
3. Subir **el contenido** de la carpeta `web/` a la raíz del repositorio (index.html debe quedar en la raíz).
4. **Settings › Pages** → *Deploy from a branch* → `main` / `(root)` → **Save**. Al minuto queda en `https://<usuario>.github.io/flota-yuval/`.

## 8. Instalar en el iPhone

1. Abrir la URL en **Safari** (no en Chrome).
2. Botón **Compartir** → **Agregar a pantalla de inicio** → **Agregar**.
3. Queda el ícono del logo (fondo carbón) y la app abre a pantalla completa.
4. Ingresar con usuario y PIN (los crea el ADMIN con `crearUsuario`).

## 9. Publicar una versión nueva

Al cambiar `app.js` o `styles.css`, subir el número de versión en tres lugares: el `?v=` de `index.html`, `VERSION` y `SHELL` en `sw.js`, y `VERSION` en `app.js`. Así el iPhone toma la versión nueva en vez de la que tiene guardada. Basta con cerrar la app y volver a abrirla.

## Qué incluye la Fase 2

| Pantalla | Funciones |
|---|---|
| **Ingreso** | Usuario + PIN en campos normales: el teclado numérico aparece solo al tocar el PIN. La sesión queda guardada en el teléfono. |
| **Inicio** | Selector ◀ mes ▶. Tarjetas: gasto del mes, pendiente por pagar (monto, documentos y vencidos), OT abiertas, móviles en taller y fuera de servicio. Gasto por categoría, alertas de vencimiento y mantención, y últimos 5 movimientos. Muestra lo último guardado al instante y se actualiza en segundo plano. |
| **Nuevo gasto** (botón +) | Monto grande (el teclado aparece al tocarlo) y categoría en una ventana con todas las opciones. Debajo, opcionales: móvil (busca por N°, patente o conductor; también "General / Stock"), proveedor (busca por nombre o RUT, muestra los 6 recientes y permite crear uno nuevo), tipo y N° de documento, fecha, forma de pago, estado, vencimiento, foto del documento (comprimida a 1280 px), N° OT, solicitante y observación. En factura calcula neto e IVA en vivo. Botón **↻ Repetir último**. |
| **Gastos del mes** | Lista por día con total y filtro Todos / Pendientes / Pagados. El detalle permite **Duplicar** y **Editar**; ADMIN y SUPERVISOR además pueden **Pagar** y **Anular**. |
| **Pagos pendientes** (ADMIN/SUP) | Agrupados por proveedor con total adeudado y días desde la emisión o el vencimiento. Datos bancarios con botón **Copiar**. Selección múltiple → **Marcar pagado** (fecha, medio, N° comprobante). |
| **Flota** | Lista con buscador y filtro por estado, ficha básica del móvil y botón "Nuevo gasto para este móvil". |
| **OT** | Lista de las últimas OT, solo lectura. Minuta y OT completa llegan en la Fase 3. |
| **Menú** (iniciales) | Actualizar catálogos, modo oscuro, cambiar PIN y cerrar sesión. |

**Sin señal en terreno.** Si un gasto o pago no se puede enviar, queda en una cola en el teléfono (ícono ☁︎ con contador). Se reenvía solo al recuperar la señal, al volver a abrir la app y cada 60 segundos. Cada registro lleva un `clientId` fijo, así que reenviarlo nunca lo duplica. El botón Guardar se bloquea mientras envía.

**Probado** en Chromium con viewport de iPhone 13 contra el backend de la Fase 1:
- Login y dashboard.
- Gasto completo con móvil, proveedor y crédito, tocando Guardar dos veces seguidas: se creó **un** solo registro.
- Gasto sin señal: quedó en cola y se envió al reconectar.
- Pago múltiple, edición, anulación y modo oscuro.
- Permisos del técnico: no ve pendientes ni puede anular ni pagar.

Falta probar en Safari de un iPhone real la cámara para la foto y el agregar a pantalla de inicio.

---

# Fases 3 y 4 — OT, minutas, PDF, ficha del móvil y reportes

## 10. Actualizar el backend (una vez)

1. En Apps Script, reemplazar todo el contenido de `Code.gs` por la versión nueva (1.2.0).
2. Agregar la plantilla del PDF: **＋ › HTML**, nombre **`PdfOT`** (sin ".html"). Borrar su contenido y pegar `PdfOT.html`.
3. Guardar.
4. **Implementar › Gestionar implementaciones › ✏️ › Versión: Nueva versión › Implementar**. La URL `/exec` no cambia.
5. Verificar: la URL `/exec` debe mostrar `"version":"1.2.0"`.

Si al usarla Google pide autorizar de nuevo, ejecutar `mostrarConfig()` una vez en el editor y aceptar.

## Qué incluyen las Fases 3 y 4

| Pantalla | Funciones |
|---|---|
| **Nueva minuta** (botón +) | Una sola pantalla: móvil, categoría, trabajo realizado, quién lo ejecuta (técnico del taller o proveedor), km, monto opcional, documento, forma de pago y foto. Queda como OT tipo *Minuta*, cerrada. Con proveedor o con "Es una compra" genera su gasto. |
| **Nueva OT completa** (botón +) | Asistente de 4 pasos con barra de avance; se puede saltar entre pasos. **1 Equipo:** móvil, km, horómetro, zonal, prioridad, tipo y categoría, falla. **2 Trabajo:** descripción, diagnóstico, causa raíz y el **checklist del formato OT** según el tipo de equipo (5a siempre; 5b camión; 5c grúa; 5d hidroelevador con ensayo dieléctrico), con botones OK/OBS/REP/N/A, comentario y "Todo OK". **3 Costos:** repuestos (bodega o compra), horas de técnicos internos (sin costo) y servicios externos, con subtotales en vivo. **4 Cierre:** 4 fotos (antes, después, falla 1 y 2), estado final, restricción, próxima mantención y **firmas en pantalla** del técnico, el supervisor y el conductor. |
| | **Guardar** deja la OT *Abierta* para retomarla después. **Cerrar OT** la cierra, actualiza km, estado y próxima mantención del móvil, y genera el **PDF con el formato OT de YUVAL SPA** en `Drive/FLOTA YUVAL/OT/{año}/{N° OT}/`. |
| | Si se cierra el asistente a mitad de camino, queda un **borrador** en el teléfono (aviso en la pestaña OT). |
| **OT** (pestaña) | Abiertas o del mes. El detalle muestra costos, checklist (OBS/REP con comentario), fotos y firmas, con botones **Ver PDF**, **Compartir** (WhatsApp, correo, etc.) y **Continuar/Editar**. |
| **Ficha del móvil** (Flota, alertas o ranking) | Patente, tipo, estado y restricción. Gasto del mes y del año, OT abiertas, km y vencimientos con días restantes, gasto por categoría e historial de OT y gastos. Atajos para minuta, OT o gasto del móvil. ADMIN y SUP pueden **Editar** estado, km y vencimientos. |
| **Reportes** (ADMIN/SUP) | Este mes, mes anterior, últimos 3 meses, el año u otro rango. Gasto de caja y costo total de OT; gasto por mes, categoría, preventivo vs. correctivo, ranking por móvil con costo/km, proveedor y zonal. **Descargar Excel** con el resumen y el detalle. |

**Sin señal.** La OT o minuta se envía por pasos: datos, luego fotos y firmas, luego PDF. Si se corta la señal, lo que falta queda en la cola y continúa desde donde quedó, sin duplicar la OT ni los gastos.

**PDF.** Replica el formato `OT_Mantenimiento_Vehiculos_Yuval`: logo YUVAL SPA, 11 secciones y casillas marcadas, en 3 páginas tamaño carta. Lo revisé renderizado en Chromium; el conversor de Google puede variar algo el espaciado.


---

# Versión 3 — Ajustes solicitados (app 3.0.0 · backend 1.3.0)

## 11. Actualizar (una vez)

1. **Backend:** reemplazar `Code.gs` y `PdfOT.html` en Apps Script por las versiones nuevas → **Implementar › Gestionar implementaciones › ✏️ › Versión: Nueva versión › Implementar**. La URL `/exec` no cambia y debe mostrar `"version":"1.3.0"`.
2. Al abrir la app por primera vez con el backend nuevo, se agrega **Cheque** a las formas de pago y se ajusta la planilla (columna CATEGORÍA en OT_ITEMS y CLIENT ID en OT_FOTOS). No hay que hacer nada a mano.
3. **App:** ya está publicada en GitHub. En el iPhone basta con cerrarla y abrirla. Si el ícono no cambió, eliminarla y agregarla de nuevo desde Safari.

> Mientras el backend siga en 1.2, la app avisa a administración con una franja roja y sube las fotos por el método anterior, así no se pierden.

## Cambios

| # | Ajuste | Cómo quedó |
|---|---|---|
| 1 | Teclado numérico fijo | PIN y montos son campos normales; el teclado numérico del iPhone aparece solo al tocarlos. |
| 2 | Editar vehículos | **Flota › + Agregar móvil**. En la ficha, **Editar** permite cambiar todos los datos: patente, tipo, marca, modelo, año, conductor, departamento, sucursal, estado, km y vencimientos. **Dar de baja / Reactivar**; los dados de baja se ven con el filtro "Dados de baja" y conservan su historial. |
| 3 | Logo YUVAL | En el ingreso, al pie del Inicio, en el menú y en la barra lateral de escritorio. |
| 4 | Usuarios desde la app | **Administración › Usuarios** (ADMIN): crear, cambiar rol, resetear PIN y desactivar. Un usuario desactivado no puede seguir usando la app. |
| 5 | Versión escritorio | Desde 1024 px de ancho: barra lateral con menú y botón "Nuevo registro", Inicio en columnas, **tablas** en gastos, OT, flota y proveedores, y los detalles se abren en un panel lateral. |
| 6 | Excel y gestión completa | **Administración › Excel:** descarga una hoja por tabla (gastos, OT, ítems, checklist, fotos, móviles, proveedores, registro), por período o como respaldo completo. **Reportes › Descargar Excel:** resumen más detalle. Se quitó "Exportar a hoja del Sheets". También se gestionan desde la app: **Proveedores** (datos bancarios, alta y baja) y **Listas** (categorías, formas de pago, documentos, técnicos, departamentos y unidades). |
| 7 | Cheque | Nueva forma de pago. Se puede marcar pagado o pendiente, y el N° de cheque va en "comprobante". |
| 8 | Opciones sin deslizar | La categoría se elige en una ventana con todas las opciones. Las demás opciones se muestran en varias filas, nunca hacia el lado. |
| 9 | Rapidez al guardar | Guardar libera la pantalla de inmediato (menos de 0,1 s en las pruebas) y el envío sigue en segundo plano. Las fotos y firmas viajan en la misma llamada que el registro, y el servidor guarda en caché las lecturas, la sesión y las carpetas de Drive. Al terminar aparece "OT-… guardada ✓" con el botón **Ver**. |
| 10 | Varias categorías por OT | Se eligen varias categorías en el paso 1, y cada repuesto o servicio se asigna a una de ellas para que el gasto quede en la categoría correcta. |
| 11 | Sin códigos de repuesto | Se quitó el campo (también en el PDF). |
| 12–13 | Mano de obra | **Interna:** solo técnico y horas, no suma al costo; el total de HH aparece en la OT y en el PDF. **Mecánico externo que cobra un total:** "Servicio o mecánico externo", con su monto y su gasto. |
| 14 | Sin internet | La app funciona sin señal. Todo lo que se registre queda guardado en el teléfono (almacenamiento interno, con fotos) y se envía solo al volver la conexión. Una franja amarilla avisa que no hay señal, y el ícono ☁︎ muestra cuántos registros faltan por enviar, con su detalle. Las listas muestran la última información guardada. Solo el primer ingreso, los reportes y el Excel requieren conexión. |
| 15 | Resumen de la minuta | En el detalle de una OT o minuta: **Compartir** (WhatsApp, correo…) y **Copiar** generan un resumen en texto. Las OT completas mantienen además su **PDF**. |

**Para que no se pierda información:**
- Cada registro lleva un identificador del teléfono. Si un envío se corta y se repite, el servidor no lo duplica, y lo mismo vale para cada foto y firma.
- Si un envío falla por un dato (por ejemplo, una OT que ya no existe), el registro no se borra: queda marcado en ☁︎ con el motivo, para reintentarlo o descartarlo.
- Si el PDF falla, la OT igual queda guardada y se avisa el error.

## Cambios 3.1 (backend 1.3.1)

| # | Ajuste | Cómo quedó |
|---|---|---|
| 1 y 3 | Checklist elegido por el usuario | En el paso 2 de la OT, **Secciones a revisar** abre una ventana con 5a, 5b, 5c y 5d (se pueden marcar varias). Solo las elegidas despliegan su formulario; sin elegir, el checklist queda en blanco. La ventana indica las sugeridas para el tipo de equipo, pero no las impone. El PDF muestra completas solo las elegidas y las demás como "No aplica". Se guarda en la nueva columna SECCIONES CHECKLIST de la hoja OT. Las OT anteriores toman como elegidas las secciones que tienen puntos marcados. |
| 2 | Firmas en el PDF | La app recorta el espacio en blanco alrededor de la firma y el PDF la muestra a todo el alto del recuadro. Las firmas guardadas antes de este cambio conservan su margen; para agrandarlas, vuelva a firmar al editar la OT. |
| 4 | Salto de página en el PDF | Se quitó el salto forzado después del checklist: el registro fotográfico sigue a continuación si cabe. Cada par de fotos se mantiene junto. |
| 6 | Ingreso en escritorio | Se quitó el recuadro blanco a la izquierda: la barra lateral solo existe con la sesión iniciada. |

**Actualizar:** reemplazar `Code.gs` y `PdfOT.html` en Apps Script, crear **Nueva versión** de la implementación y comprobar que `/exec` muestre `"version":"1.3.1"`. La columna nueva se agrega sola en la primera llamada.
