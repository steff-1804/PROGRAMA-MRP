let items = [];
let bom = [];
let demanda = {};

const $ = (id) => document.getElementById(id);

function num(v){
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function periodos(){
  return Math.max(1, Math.min(24, num($("periodos").value || 8)));
}

function cargarDemo(){
  $("periodos").value = 8;
  $("productoFinal").value = "A";
  items = [
    {codigo:"A", nivel:0, lt:1, inv:10, ss:0, rp:0},
    {codigo:"B", nivel:1, lt:2, inv:15, ss:0, rp:0},
    {codigo:"C", nivel:1, lt:1, inv:20, ss:0, rp:0},
    {codigo:"D", nivel:2, lt:1, inv:10, ss:0, rp:0},
    {codigo:"E", nivel:2, lt:2, inv:5, ss:0, rp:0},
    {codigo:"F", nivel:2, lt:3, inv:10, ss:0, rp:0},
    {codigo:"G", nivel:2, lt:2, inv:0, ss:0, rp:0}
  ];
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
  construirDemanda();
  demanda = {};
  for(let t=1;t<=periodos();t++) demanda[t] = 0;
  demanda[8] = 50;
  renderDemanda();
  renderItems();
  renderBom();
  renderArbol();
  $("resultado").innerHTML = "";
}

function construirDemanda(){
  const p = periodos();
  const nueva = {};
  for(let t=1;t<=p;t++) nueva[t] = demanda[t] || 0;
  demanda = nueva;
  renderDemanda();
}

function renderDemanda(){
  const cont = $("demandaGrid");
  cont.innerHTML = "";
  for(let t=1;t<=periodos();t++){
    const div = document.createElement("div");
    div.className = "week-box";
    div.innerHTML = `<label>Semana ${t}<input type="number" min="0" value="${demanda[t] || 0}" data-week="${t}"></label>`;
    div.querySelector("input").addEventListener("input", e => demanda[e.target.dataset.week] = num(e.target.value));
    cont.appendChild(div);
  }
}

function renderItems(){
  const tb = $("tablaItems tbody");
  tb.innerHTML = "";
  items.forEach((it, i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input value="${it.codigo}" data-i="${i}" data-k="codigo"></td>
      <td><input type="number" value="${it.nivel}" data-i="${i}" data-k="nivel"></td>
      <td><input type="number" value="${it.lt}" data-i="${i}" data-k="lt"></td>
      <td><input type="number" value="${it.inv}" data-i="${i}" data-k="inv"></td>
      <td><input type="number" value="${it.ss}" data-i="${i}" data-k="ss"></td>
      <td><input type="number" value="${it.rp}" data-i="${i}" data-k="rp"></td>
      <td><button onclick="eliminarItem(${i})">Eliminar</button></td>
    `;
    tb.appendChild(tr);
  });
  tb.querySelectorAll("input").forEach(inp=>{
    inp.addEventListener("input", e=>{
      const i = e.target.dataset.i;
      const k = e.target.dataset.k;
      items[i][k] = k === "codigo" ? e.target.value.trim().toUpperCase() : num(e.target.value);
      renderArbol();
    });
  });
}

function renderBom(){
  const tb = $("tablaBom tbody");
  tb.innerHTML = "";
  bom.forEach((r, i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input value="${r.padre}" data-i="${i}" data-k="padre"></td>
      <td><input value="${r.comp}" data-i="${i}" data-k="comp"></td>
      <td><input type="number" min="1" value="${r.qty}" data-i="${i}" data-k="qty"></td>
      <td><button onclick="eliminarBom(${i})">Eliminar</button></td>
    `;
    tb.appendChild(tr);
  });
  tb.querySelectorAll("input").forEach(inp=>{
    inp.addEventListener("input", e=>{
      const i = e.target.dataset.i;
      const k = e.target.dataset.k;
      bom[i][k] = k === "qty" ? num(e.target.value) : e.target.value.trim().toUpperCase();
      renderArbol();
    });
  });
}

function agregarItem(){
  items.push({codigo:"", nivel:0, lt:1, inv:0, ss:0, rp:0});
  renderItems();
}

function eliminarItem(i){
  const cod = items[i].codigo;
  items.splice(i,1);
  bom = bom.filter(r => r.padre !== cod && r.comp !== cod);
  renderItems();
  renderBom();
  renderArbol();
}

function agregarBom(){
  bom.push({padre:"", comp:"", qty:1});
  renderBom();
}

function eliminarBom(i){
  bom.splice(i,1);
  renderBom();
  renderArbol();
}

function renderArbol(){
  const root = $("productoFinal").value.trim().toUpperCase() || "A";
  const cont = $("arbol");
  const hijos = (padre) => bom.filter(r => r.padre === padre);

  function nodo(cod, qtyText=""){
    const children = hijos(cod);
    let html = `<div class="branch"><span class="node">${cod}${qtyText}</span>`;
    if(children.length){
      html += `<div class="children">`;
      children.forEach(h => html += nodo(h.comp, ` (${h.qty})`));
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  }
  cont.innerHTML = nodo(root);
}

function calcularItem(item, gross){
  const p = periodos();
  const disp = Array(p+1).fill(0);
  const netas = Array(p+1).fill(0);
  const recPlan = Array(p+1).fill(0);
  const lanzPlan = Array(p+1).fill(0);
  const recProg = Array(p+1).fill(0);

  for(let t=1;t<=p;t++) recProg[t] = num(item.rp);

  let inventario = num(item.inv);
  for(let t=1;t<=p;t++){
    const disponibleAntes = inventario + recProg[t];
    if(disponibleAntes - gross[t] < num(item.ss)){
      netas[t] = num(item.ss) + gross[t] - disponibleAntes;
      recPlan[t] = netas[t]; // Lote por lote
    }
    inventario = inventario + recProg[t] + recPlan[t] - gross[t];
    disp[t] = inventario;

    const semanaLanz = t - num(item.lt);
    if(recPlan[t] > 0 && semanaLanz >= 1){
      lanzPlan[semanaLanz] += recPlan[t];
    }
  }
  return {gross, recProg, disp, netas, recPlan, lanzPlan};
}

function calcularMRP(){
  sincronizarTablas();
  const p = periodos();
  const root = $("productoFinal").value.trim().toUpperCase();
  if(!root){ alert("Ingrese el producto final."); return; }

  const itemMap = Object.fromEntries(items.map(it => [it.codigo, it]));
  if(!itemMap[root]){ alert("El producto final no existe en la tabla de artículos."); return; }

  const orden = [...items].sort((a,b)=>num(a.nivel)-num(b.nivel)).map(x=>x.codigo);
  const grossMap = {};
  items.forEach(it => grossMap[it.codigo] = Array(p+1).fill(0));
  for(let t=1;t<=p;t++) grossMap[root][t] = num(demanda[t]);

  const resultados = {};

  for(const cod of orden){
    const item = itemMap[cod];
    if(!item) continue;
    resultados[cod] = calcularItem(item, grossMap[cod]);

    const hijos = bom.filter(r => r.padre === cod);
    hijos.forEach(r=>{
      if(!grossMap[r.comp]) grossMap[r.comp] = Array(p+1).fill(0);
      for(let t=1;t<=p;t++){
        grossMap[r.comp][t] += resultados[cod].lanzPlan[t] * num(r.qty);
      }
    });
  }

  renderResultado(resultados);
}

function sincronizarTablas(){
  document.querySelectorAll("#tablaItems tbody input").forEach(inp=>{
    const i = inp.dataset.i, k = inp.dataset.k;
    items[i][k] = k === "codigo" ? inp.value.trim().toUpperCase() : num(inp.value);
  });
  document.querySelectorAll("#tablaBom tbody input").forEach(inp=>{
    const i = inp.dataset.i, k = inp.dataset.k;
    bom[i][k] = k === "qty" ? num(inp.value) : inp.value.trim().toUpperCase();
  });
  document.querySelectorAll("#demandaGrid input").forEach(inp=> demanda[inp.dataset.week] = num(inp.value));
}

function fila(nombre, arr, roja=false){
  let html = `<tr><td class="${roja?'red':''}">${nombre}</td>`;
  for(let t=1;t<=periodos();t++){
    html += `<td class="${roja?'red':''}">${arr[t] ? arr[t] : ""}</td>`;
  }
  html += `</tr>`;
  return html;
}

function renderResultado(res){
  const p = periodos();
  const itemMap = Object.fromEntries(items.map(it => [it.codigo, it]));
  let html = "";
  const orden = [...items].sort((a,b)=>num(a.nivel)-num(b.nivel)).map(x=>x.codigo);

  orden.forEach(cod=>{
    const it = itemMap[cod];
    const r = res[cod];
    if(!r) return;

    html += `<div class="mrp-block">
      <div class="mrp-title">LOTE | Nivel inferior: ${it.nivel} | Lead time: ${it.lt} | Inventario disponible: ${it.inv} | Código del artículo: ${cod}</div>
      <table class="mrp-table">
        <thead>
          <tr><th>Conceptos</th>${Array.from({length:p},(_,i)=>`<th>${i+1}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${fila("Necesidades brutas", r.gross)}
          ${fila("Recepciones programadas", r.recProg)}
          ${fila("Disponible (inventarios)", r.disp)}
          ${fila("Necesidades netas", r.netas, true)}
          ${fila("Recepciones de orden programado", r.recPlan)}
          ${fila("Lanzamiento del orden planificado", r.lanzPlan)}
        </tbody>
      </table>
    </div>`;
  });

  $("resultado").innerHTML = html;
}

function exportarExcel(){
  const contenido = document.getElementById("resultado").innerHTML;
  if(!contenido.trim()){
    alert("Primero calcule el MRP.");
    return;
  }
  const html = `
    <html><head><meta charset="UTF-8"></head>
    <body>${contenido}</body></html>`;
  const blob = new Blob([html], {type:"application/vnd.ms-excel"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "resultado_mrp.xls";
  a.click();
}

$("btnDemo").addEventListener("click", cargarDemo);
$("btnConstruirDemanda").addEventListener("click", construirDemanda);
$("btnAddItem").addEventListener("click", agregarItem);
$("btnAddBom").addEventListener("click", agregarBom);
$("btnCalcular").addEventListener("click", calcularMRP);
$("btnExportar").addEventListener("click", exportarExcel);
$("btnLimpiar").addEventListener("click", () => $("resultado").innerHTML = "");
$("productoFinal").addEventListener("input", renderArbol);

cargarDemo();
