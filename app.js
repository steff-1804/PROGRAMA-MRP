let items = [];
let bom = [];
let demanda = {};
let ultimoResultado = null;

const $ = id => document.getElementById(id);
const val = x => {
  const n = Number(x);
  return isNaN(n) ? 0 : n;
};

function semanas(){
  return Math.max(1, Math.min(24, val($("periodos").value || 8)));
}

function calcularEOQ(){
  const D = Math.max(1, val($("eoqD").value));
  const S = Math.max(0.01, val($("eoqS").value));
  const H = Math.max(0.01, val($("eoqH").value));
  return Math.ceil(Math.sqrt((2 * D * S) / H));
}

function updatePolicyUI(){
  const isEOQ = $("politica").value === "EOQ";
  $("eoqBox").classList.toggle("hidden", !isEOQ);
  if(isEOQ){
    $("eoqResult").textContent = "EOQ calculado: " + calcularEOQ() + " unidades por orden";
  }
}

function crearArticuloPorNumero(i){
  const codigo = String.fromCharCode(65 + i);
  return {codigo, nivel: i === 0 ? 0 : 1, lt: 1, inv: 0, ss: 0, rp: 0};
}

function generarArticulosDesdeCantidad(){
  const cantidad = Math.max(1, Math.min(30, val($("cantidadArticulos").value || 1)));
  const anteriores = [...items];
  items = [];
  for(let i = 0; i < cantidad; i++){
    items.push(anteriores[i] || crearArticuloPorNumero(i));
  }
  const validos = new Set(items.map(x => x.codigo));
  bom = bom.filter(r => validos.has(r.padre) && validos.has(r.comp));
  renderAll();
}

function cargarBomEjemplo(){
  bom = [
    {padre:"A", comp:"B", qty:2},
    {padre:"A", comp:"C", qty:3},
    {padre:"B", comp:"D", qty:2},
    {padre:"B", comp:"E", qty:2},
    {padre:"C", comp:"E", qty:2},
    {padre:"C", comp:"F", qty:2},
    {padre:"F", comp:"G", qty:1},
    {padre:"F", comp:"D", qty:2}
  ];
  renderAll();
}

function cargarDemo(){
  items = [
    {codigo:"A", nivel:0, lt:1, inv:10, ss:0, rp:0},
    {codigo:"B", nivel:1, lt:2, inv:15, ss:0, rp:0},
    {codigo:"C", nivel:1, lt:1, inv:20, ss:0, rp:0},
    {codigo:"D", nivel:2, lt:1, inv:10, ss:0, rp:0},
    {codigo:"E", nivel:2, lt:2, inv:5, ss:0, rp:0},
    {codigo:"F", nivel:2, lt:3, inv:10, ss:0, rp:0},
    {codigo:"G", nivel:2, lt:2, inv:0, ss:0, rp:0}
  ];
  $("periodos").value = 8;
  $("politica").value = "L4L";
  $("cantidadArticulos").value = 7;
  cargarBomEjemplo();
  demanda = {};
  for(let t = 1; t <= semanas(); t++) demanda[t] = 0;
  demanda[8] = 50;
  ultimoResultado = null;
  updatePolicyUI();
  renderAll();
  clearResults();
}

function clearResults(){
  $("summaryCards").innerHTML = `
    <div class="metric"><b>0</b><span>Requerimientos Netos</span></div>
    <div class="metric"><b>0</b><span>Órdenes Planificadas</span></div>
    <div class="metric"><b>0</b><span>Costo Estimado</span></div>
    <div class="metric"><b>0</b><span>Cobertura Promedio</span></div>`;
  $("alerts").innerHTML = "";
  $("mrpTables").innerHTML = "";
  $("reportPage").classList.add("hidden");
}

function renderAll(){
  renderProductoFinalSelect();
  renderItemsCards();
  renderBomCards();
  renderDemanda();
  renderTreeList();
}

function renderProductoFinalSelect(){
  const current = $("productoFinal").value || "A";
  $("productoFinal").innerHTML = items.map(it => `<option value="${it.codigo}" ${it.codigo === current ? "selected" : ""}>${it.codigo}</option>`).join("");
}

function opcionesArticulos(valor){
  let html = `<option value="">Seleccione...</option>`;
  items.forEach(it => {
    html += `<option value="${it.codigo}" ${it.codigo === valor ? "selected" : ""}>${it.codigo}</option>`;
  });
  return html;
}

function renderItemsCards(){
  const box = $("itemsCards");
  box.innerHTML = "";
  items.forEach((it, i) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-card-head">
        <div style="display:flex;gap:10px;align-items:center;">
          <div class="item-code">${it.codigo || "?"}</div>
          <div><div class="item-title">Artículo ${it.codigo || "nuevo"}</div><div class="item-sub">Nivel ${it.nivel} · LT ${it.lt} semana(s)</div></div>
        </div>
        <button class="btn-danger" onclick="deleteItem(${i})">Eliminar</button>
      </div>
      <div class="form-grid">
        <label>Código<input value="${it.codigo}" data-i="${i}" data-k="codigo"></label>
        <label>Nivel<input type="number" value="${it.nivel}" data-i="${i}" data-k="nivel"></label>
        <label>Lead time<input type="number" min="0" value="${it.lt}" data-i="${i}" data-k="lt"></label>
        <label>Inventario<input type="number" value="${it.inv}" data-i="${i}" data-k="inv"></label>
        <label>Stock seguridad<input type="number" value="${it.ss}" data-i="${i}" data-k="ss"></label>
        <label>Recepción programada<input type="number" value="${it.rp}" data-i="${i}" data-k="rp"></label>
      </div>`;
    box.appendChild(card);
  });
  box.querySelectorAll("input").forEach(input => {
    input.addEventListener("change", e => {
      const i = Number(e.target.dataset.i);
      const k = e.target.dataset.k;
      const old = items[i].codigo;
      items[i][k] = k === "codigo" ? e.target.value.trim().toUpperCase() : val(e.target.value);
      if(k === "codigo"){
        const nw = items[i].codigo;
        bom.forEach(r => {
          if(r.padre === old) r.padre = nw;
          if(r.comp === old) r.comp = nw;
        });
      }
      renderAll();
    });
  });
}

function renderBomCards(){
  const box = $("bomCards");
  box.innerHTML = "";
  bom.forEach((r, i) => {
    const card = document.createElement("div");
    card.className = "bom-card";
    card.innerHTML = `
      <div class="bom-card-head">
        <div><div class="item-title">Relación de estructura</div><div class="item-sub">Padre → componente</div></div>
        <button class="btn-danger" onclick="deleteBom(${i})">Eliminar</button>
      </div>
      <div class="bom-relation"><span>${r.padre || "?"}</span> → <span>${r.comp || "?"}</span> <small>x${r.qty}</small></div>
      <div class="form-grid">
        <label>Producto padre<select data-i="${i}" data-k="padre">${opcionesArticulos(r.padre)}</select></label>
        <label>Componente<select data-i="${i}" data-k="comp">${opcionesArticulos(r.comp)}</select></label>
        <label>Cantidad requerida<input type="number" min="1" value="${r.qty}" data-i="${i}" data-k="qty"></label>
      </div>`;
    box.appendChild(card);
  });
  box.querySelectorAll("select,input").forEach(input => {
    input.addEventListener("change", e => {
      const i = Number(e.target.dataset.i);
      const k = e.target.dataset.k;
      bom[i][k] = k === "qty" ? Math.max(1, val(e.target.value)) : e.target.value.trim().toUpperCase();
      renderAll();
    });
  });
}

function renderDemanda(){
  const p = semanas();
  const nueva = {};
  for(let t = 1; t <= p; t++) nueva[t] = demanda[t] || 0;
  demanda = nueva;
  const box = $("demandaGrid");
  box.innerHTML = "";
  for(let t = 1; t <= p; t++){
    const div = document.createElement("div");
    div.className = "week-box";
    div.innerHTML = `<label>S${t}<input type="number" min="0" value="${demanda[t]}" data-week="${t}"></label>`;
    div.querySelector("input").addEventListener("input", e => demanda[e.target.dataset.week] = val(e.target.value));
    box.appendChild(div);
  }
}

function renderTreeList(){
  const root = $("productoFinal").value || "A";
  const box = $("treeList");
  const itemCodes = new Set(items.map(x => x.codigo));
  const validBom = bom.filter(r => itemCodes.has(r.padre) && itemCodes.has(r.comp) && r.padre && r.comp);

  function children(code){
    return validBom.filter(r => r.padre === code);
  }

  const rows = [];
  function walk(code, level, qty, visited = new Set()){
    if(visited.has(code)) return;
    visited.add(code);
    const item = items.find(x => x.codigo === code) || {nivel:level};
    rows.push({code, level, qty, unidad:"und", final: level === 0});
    children(code).forEach(ch => walk(ch.comp, level + 1, ch.qty, new Set(visited)));
  }
  walk(root, 0, 1);

  box.innerHTML = rows.map((r, idx) => {
    const chev = children(r.code).length ? (idx === 0 || r.level === 1 ? "⌄" : "›") : "";
    const icon = r.level === 0 ? "⚙" : r.level === 1 ? "◇" : "○";
    const badge = r.final ? `<span class="badge-final">Producto Final</span>` : "";
    return `
      <div class="tree-row">
        <span class="comp-cell tree-indent-${Math.min(r.level,3)}">
          <span class="chev">${chev}</span>
          ${r.level > 0 ? '<span class="branch-line"></span>' : ''}
          <span class="item-icon">${icon}</span>
          <strong>${nombreVisual(r.code)}</strong>${badge}
        </span>
        <span>${r.level}</span>
        <span>${r.qty}</span>
        <span>${r.unidad}</span>
      </div>`;
  }).join("");
}

function nombreVisual(code){
  const names = {
    A:"PRODUCTO A",
    B:"COMPONENTE B",
    C:"COMPONENTE C",
    D:"COMPONENTE D",
    E:"COMPONENTE E",
    F:"COMPONENTE F",
    G:"COMPONENTE G"
  };
  return names[code] || code;
}

function syncFromCards(){
  document.querySelectorAll("#itemsCards input").forEach(inp => {
    const i = Number(inp.dataset.i);
    const k = inp.dataset.k;
    if(items[i]) items[i][k] = k === "codigo" ? inp.value.trim().toUpperCase() : val(inp.value);
  });
  document.querySelectorAll("#bomCards select,#bomCards input").forEach(inp => {
    const i = Number(inp.dataset.i);
    const k = inp.dataset.k;
    if(bom[i]) bom[i][k] = k === "qty" ? Math.max(1, val(inp.value)) : inp.value.trim().toUpperCase();
  });
  document.querySelectorAll("#demandaGrid input").forEach(inp => demanda[inp.dataset.week] = val(inp.value));
}

function addItem(){
  items.push(crearArticuloPorNumero(items.length));
  $("cantidadArticulos").value = items.length;
  renderAll();
}
function deleteItem(i){
  const code = items[i].codigo;
  items.splice(i,1);
  bom = bom.filter(r => r.padre !== code && r.comp !== code);
  $("cantidadArticulos").value = items.length;
  renderAll();
}
function addBom(){
  const padre = $("productoFinal").value || (items[0] ? items[0].codigo : "");
  const comp = items.find(x => x.codigo !== padre)?.codigo || "";
  bom.push({padre, comp, qty:1});
  renderAll();
}
function deleteBom(i){
  bom.splice(i,1);
  renderAll();
}

function plannedReceiptQty(net){
  if(net <= 0) return 0;
  if($("politica").value === "L4L") return net;
  const eoq = calcularEOQ();
  return Math.ceil(net / eoq) * eoq;
}

function calcItem(item, gross){
  const p = semanas();
  const recProg = Array(p + 1).fill(0);
  const disp = Array(p + 1).fill(0);
  const netas = Array(p + 1).fill(0);
  const recPlan = Array(p + 1).fill(0);
  const lanzPlan = Array(p + 1).fill(0);

  for(let t = 1; t <= p; t++){
    recProg[t] = $("optRecep").checked ? val(item.rp) : 0;
  }

  let inv = $("optInv").checked ? val(item.inv) : 0;
  const lt = $("optLead").checked ? val(item.lt) : 0;

  for(let t = 1; t <= p; t++){
    const before = inv + recProg[t];
    if(before - gross[t] < val(item.ss)){
      netas[t] = val(item.ss) + gross[t] - before;
      recPlan[t] = plannedReceiptQty(netas[t]);
    }
    inv = inv + recProg[t] + recPlan[t] - gross[t];
    disp[t] = inv;

    const launch = t - lt;
    if(recPlan[t] > 0 && launch >= 1) lanzPlan[launch] += recPlan[t];
  }
  return {gross, recProg, disp, netas, recPlan, lanzPlan};
}

function calcularMRP(){
  syncFromCards();
  const root = $("productoFinal").value;
  const itemMap = Object.fromEntries(items.map(i => [i.codigo, i]));
  if(!root || !itemMap[root]){
    alert("El producto final no existe en los artículos.");
    return;
  }

  const p = semanas();
  const grossMap = {};
  items.forEach(i => grossMap[i.codigo] = Array(p + 1).fill(0));
  for(let t = 1; t <= p; t++) grossMap[root][t] = val(demanda[t]);

  const order = [...items].sort((a,b) => val(a.nivel) - val(b.nivel)).map(i => i.codigo);
  const result = {};

  for(const code of order){
    if(!grossMap[code]) grossMap[code] = Array(p + 1).fill(0);
    result[code] = calcItem(itemMap[code], grossMap[code]);

    bom.filter(r => r.padre === code).forEach(r => {
      if(!grossMap[r.comp]) grossMap[r.comp] = Array(p + 1).fill(0);
      for(let t = 1; t <= p; t++){
        grossMap[r.comp][t] += result[code].lanzPlan[t] * val(r.qty);
      }
    });
  }

  ultimoResultado = {
    result,
    order,
    itemMap,
    policy:$("politica").value,
    eoq:$("politica").value === "EOQ" ? calcularEOQ() : null
  };

  renderMRP();
  generarReporte();
}

function arrTotal(arr){
  let s = 0;
  for(let t = 1; t <= semanas(); t++) s += val(arr[t]);
  return s;
}
function firstWeek(arr){
  for(let t = 1; t <= semanas(); t++) if(val(arr[t]) > 0) return t;
  return "-";
}
function weekHeads(){
  return Array.from({length:semanas()}, (_,i) => `<th>S${i+1}</th>`).join("");
}
function row(name, arr, red=false){
  let html = `<tr><td class="${red ? 'red' : ''}">${name}</td>`;
  for(let t = 1; t <= semanas(); t++) html += `<td class="${red ? 'red' : ''}">${arr[t] ? arr[t] : ""}</td>`;
  return html + "</tr>";
}

function buildAlerts(data){
  const alerts = [];
  data.order.forEach(code => {
    const it = data.itemMap[code];
    const r = data.result[code];
    for(let t = 1; t <= semanas(); t++){
      if(r.recPlan[t] > 0 && (t - val(it.lt)) < 1 && $("optLead").checked){
        alerts.push({type:"bad", text:`${code}: necesita recepción en semana ${t}, pero su lead time exige lanzamiento antes del horizonte.`});
      }
    }
  });
  bom.forEach(rel => {
    const count = bom.filter(x => x.comp === rel.comp).length;
    if(count > 1 && !alerts.some(a => a.text.includes(`componente ${rel.comp}`))){
      alerts.push({type:"", text:`El componente ${rel.comp} aparece en más de un padre. Se consolidan sus necesidades automáticamente.`});
    }
  });
  if(!alerts.length) alerts.push({type:"ok", text:"No se detectaron lanzamientos fuera del horizonte ni conflictos críticos."});
  return alerts;
}

function renderMRP(){
  const data = ultimoResultado;
  if(!data) return;

  const totalNet = data.order.reduce((s,c) => s + arrTotal(data.result[c].netas), 0);
  const totalOrders = data.order.reduce((s,c) => s + arrTotal(data.result[c].recPlan), 0);
  const totalLaunch = data.order.reduce((s,c) => s + arrTotal(data.result[c].lanzPlan), 0);
  const cobertura = data.order.length ? Math.round((totalOrders / Math.max(1,totalNet)) * 10) / 10 : 0;

  $("summaryCards").innerHTML = `
    <div class="metric"><b>${totalNet}</b><span>Requerimientos Netos</span></div>
    <div class="metric"><b>${totalOrders}</b><span>Órdenes Planificadas</span></div>
    <div class="metric"><b>$ ${totalOrders}</b><span>Costo Estimado</span></div>
    <div class="metric"><b>${cobertura}</b><span>Cobertura Promedio</span></div>`;

  $("alerts").innerHTML = buildAlerts(data).map(a => `<div class="alert ${a.type}">${a.text}</div>`).join("");

  let html = "";
  data.order.forEach(code => {
    const it = data.itemMap[code];
    const r = data.result[code];
    html += `
      <div class="mrp-card">
        <div class="mrp-title">
          <div>Artículo: ${code}</div>
          <div>Nivel: ${it.nivel}</div>
          <div>Lead time: ${it.lt}</div>
          <div>Inv.: ${it.inv}</div>
          <div>SS: ${it.ss}</div>
          <div>Política: ${data.policy}${data.eoq ? " / EOQ " + data.eoq : ""}</div>
        </div>
        <div class="table-wrap">
          <table class="mrp-table">
            <thead><tr><th>Conceptos</th>${weekHeads()}</tr></thead>
            <tbody>
              ${row("NECESIDADES BRUTAS", r.gross)}
              ${row("RECEPCIONES PROGRAMADAS", r.recProg)}
              ${row("DISPONIBLE (INVENTARIOS)", r.disp)}
              ${row("NECESIDADES NETAS", r.netas, true)}
              ${row("RECEPCIONES DE ORDEN PLANIFICADO", r.recPlan)}
              ${row("LANZAMIENTO DEL ORDEN PLANIFICADO", r.lanzPlan)}
            </tbody>
          </table>
        </div>
      </div>`;
  });
  $("mrpTables").innerHTML = html;
}

function generarReporte(){
  if(!ultimoResultado){
    $("reportPage").innerHTML = `<div class="report-header"><div><h2>Reporte MRP</h2><p>Presiona “Calcular MRP” para generar el reporte.</p></div><div class="report-tag">Pendiente</div></div>`;
    $("reportPage").classList.remove("hidden");
    return;
  }

  const data = ultimoResultado;
  const root = $("productoFinal").value;
  const totalNet = data.order.reduce((s,c) => s + arrTotal(data.result[c].netas), 0);
  const totalOrders = data.order.reduce((s,c) => s + arrTotal(data.result[c].recPlan), 0);
  const starts = data.order.map(c => firstWeek(data.result[c].lanzPlan)).filter(x => x !== "-");
  const firstLaunch = starts.length ? Math.min(...starts) : "-";
  const policyName = data.policy === "L4L" ? "Lote por lote" : `EOQ (${data.eoq} unidades)`;
  const today = new Date().toLocaleDateString("es-EC");

  const rows = data.order.map(code => {
    const r = data.result[code];
    return `<tr><td>${code}</td><td>${arrTotal(r.gross)}</td><td>${arrTotal(r.netas)}</td><td>${arrTotal(r.recPlan)}</td><td>${firstWeek(r.lanzPlan)}</td><td>${r.disp[semanas()]}</td></tr>`;
  }).join("");

  const alerts = buildAlerts(data).slice(0,5).map(a => `<li>${a.text}</li>`).join("");

  $("reportPage").innerHTML = `
    <div class="report-header">
      <div><h2>Reporte ejecutivo MRP</h2><p><strong>Planificación de Requerimientos de Materiales</strong></p><p>Fecha de emisión: ${today}</p></div>
      <div class="report-tag">${policyName}</div>
    </div>
    <div class="report-grid">
      <div class="report-box"><span>Producto final</span><strong>${root}</strong></div>
      <div class="report-box"><span>Horizonte</span><strong>${semanas()} semanas</strong></div>
      <div class="report-box"><span>Necesidad neta total</span><strong>${totalNet}</strong></div>
      <div class="report-box"><span>Recepción planificada total</span><strong>${totalOrders}</strong></div>
      <div class="report-box"><span>Primera semana de lanzamiento</span><strong>${firstLaunch}</strong></div>
      <div class="report-box"><span>Artículos evaluados</span><strong>${data.order.length}</strong></div>
    </div>
    <div class="report-section"><h3>Conclusión operativa</h3><p>Bajo la política <strong>${policyName}</strong>, el sistema determina las órdenes necesarias para cubrir la demanda del producto <strong>${root}</strong>.</p></div>
    <div class="report-section"><h3>Resumen por artículo</h3><table class="report-table"><thead><tr><th>Artículo</th><th>Nec. brutas</th><th>Nec. netas</th><th>Rec. planificadas</th><th>Primera orden</th><th>Inv. final</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="report-section"><h3>Alertas y observaciones</h3><ul>${alerts}</ul></div>
    <div class="report-section"><h3>Recomendación</h3><p>Validar inventarios físicos antes de liberar órdenes, confirmar lead times y revisar componentes compartidos para evitar duplicidad de pedidos.</p></div>
    <div class="report-sign"><div class="sign-line">Elaborado por</div><div class="sign-line">Revisado por</div></div>`;
  $("reportPage").classList.remove("hidden");
  $("reportPage").scrollIntoView({behavior:"smooth"});
}

function printReport(){
  generarReporte();
  setTimeout(() => window.print(), 250);
}

document.querySelectorAll(".step").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.section;
    if(id === "datos") window.scrollTo({top:0, behavior:"smooth"});
    else document.getElementById(id)?.scrollIntoView({behavior:"smooth", block:"start"});
    document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
  });
});

$("btnCalcular").addEventListener("click", calcularMRP);
$("btnEditar").addEventListener("click", () => $("editorPanel").classList.remove("hidden"));
$("btnCerrarEditor").addEventListener("click", () => $("editorPanel").classList.add("hidden"));
$("btnExpandir").addEventListener("click", renderTreeList);
$("btnActualizarSemanas").addEventListener("click", renderDemanda);
$("btnGenerarArticulos").addEventListener("click", generarArticulosDesdeCantidad);
$("btnAddItem").addEventListener("click", addItem);
$("btnAddBom").addEventListener("click", addBom);
$("btnBomDemo").addEventListener("click", cargarBomEjemplo);
$("btnGenerarReporte").addEventListener("click", generarReporte);
$("btnReporteCompleto").addEventListener("click", generarReporte);
$("btnPrint").addEventListener("click", printReport);
$("btnPrintTop").addEventListener("click", printReport);
$("btnVerDetalle").addEventListener("click", () => $("detalleMRP").classList.remove("hidden"));
$("btnOcultarDetalle").addEventListener("click", () => $("detalleMRP").classList.add("hidden"));
$("politica").addEventListener("change", updatePolicyUI);
$("eoqD").addEventListener("input", updatePolicyUI);
$("eoqS").addEventListener("input", updatePolicyUI);
$("eoqH").addEventListener("input", updatePolicyUI);
$("periodos").addEventListener("change", renderDemanda);
$("productoFinal").addEventListener("change", renderTreeList);

cargarDemo();
