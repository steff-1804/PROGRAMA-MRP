<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>MRP Planner | Universidad Politécnica Salesiana</title>
  <link rel="stylesheet" href="style.css"/>
</head>
<body>
  <header class="institutional-header">
    <div class="header-pattern"></div>

    <div class="brand-zone">
      <img src="assets/logo-ups.png" alt="Universidad Politécnica Salesiana" class="ups-logo"/>
      <div class="brand-divider"></div>
      <div class="app-title">
        <h1>MRP Planner</h1>
        <p>Planificación de Requerimientos de Materiales</p>
      </div>
    </div>

    <div class="header-tools">
      <div class="user-chip">
        <div class="avatar">U</div>
        <div>
          <strong>Usuario académico</strong>
          <span>Herramienta educativa</span>
        </div>
      </div>
      <button id="btnDemo" class="top-icon-btn" title="Cargar ejemplo">↻</button>
      <button id="btnPrintTop" class="top-icon-btn" title="Imprimir reporte">⇩</button>
    </div>
  </header>

  <main class="layout">
    <section class="hero-panel">
      <div>
        <span class="eyebrow">Ingeniería Industrial</span>
        <h2>Sistema educativo para cálculo MRP</h2>
        <p>
          Construye la estructura del producto, registra inventarios, calcula requerimientos
          y genera un reporte ejecutivo listo para entregar.
        </p>
      </div>

      <div class="hero-stats">
        <div>
          <strong id="heroArticulos">7</strong>
          <span>Artículos</span>
        </div>
        <div>
          <strong id="heroSemanas">8</strong>
          <span>Semanas</span>
        </div>
        <div>
          <strong id="heroPolitica">L4L</strong>
          <span>Política</span>
        </div>
      </div>
    </section>

    <nav class="steps">
      <button class="step active" data-view="datos">
        <span class="step-number">1</span>
        <span>
          <strong>Datos</strong>
          <small>Parámetros generales</small>
        </span>
      </button>

      <button class="step" data-view="arbol">
        <span class="step-number">2</span>
        <span>
          <strong>Árbol</strong>
          <small>Estructura del producto</small>
        </span>
      </button>

      <button class="step" data-view="demanda">
        <span class="step-number">3</span>
        <span>
          <strong>Demanda</strong>
          <small>Pronóstico semanal</small>
        </span>
      </button>

      <button class="step" data-view="resultado">
        <span class="step-number">4</span>
        <span>
          <strong>Resultado</strong>
          <small>Cálculo de requerimientos</small>
        </span>
      </button>

      <button class="step" data-view="reporte">
        <span class="step-number">5</span>
        <span>
          <strong>Reporte</strong>
          <small>Resumen ejecutivo</small>
        </span>
      </button>
    </nav>

    <section id="view-datos" class="view active">
      <div class="dashboard-grid datos-grid">
        <div class="card main-card">
          <div class="card-title">
            <div class="icon-box">▦</div>
            <div>
              <h2>Parámetros generales</h2>
              <p>Configura el horizonte, el producto final y la política de lote.</p>
            </div>
          </div>

          <div class="grid-4">
            <label>Nombre del ejercicio
              <input id="nombreEjercicio" value="Ejercicio MRP - Producto A">
            </label>

            <label>Producto final
              <input id="productoFinal" value="A">
            </label>

            <label>Semanas
              <input id="periodos" type="number" min="1" max="24" value="8">
            </label>

            <label>Política
              <select id="politica">
                <option value="L4L">Lote por lote</option>
                <option value="EOQ">EOQ - Lote económico</option>
              </select>
            </label>
          </div>

          <div id="eoqBox" class="eoq-box hidden">
            <h3>Parámetros EOQ</h3>
            <p>EOQ necesita demanda anual, costo de ordenar y costo anual de mantener inventario.</p>
            <div class="grid-3">
              <label>Demanda anual estimada
                <input id="eoqD" type="number" min="1" value="1200">
              </label>
              <label>Costo por orden
                <input id="eoqS" type="number" min="0.01" step="0.01" value="25">
              </label>
              <label>Costo mantener unidad/año
                <input id="eoqH" type="number" min="0.01" step="0.01" value="5">
              </label>
            </div>
            <div class="eoq-result" id="eoqResult">EOQ calculado: -</div>
          </div>
        </div>

        <aside class="card side-card">
          <div class="card-title compact">
            <div class="icon-box gold">⚙</div>
            <div>
              <h2>Configuración rápida</h2>
              <p>Genera tarjetas automáticamente.</p>
            </div>
          </div>

          <label>Cantidad de artículos
            <input id="cantidadArticulos" type="number" min="1" max="30" value="7">
          </label>

          <button id="btnGenerarArticulos" class="btn primary full">Generar tarjetas</button>
          <button id="btnAddItem" class="btn secondary full">Agregar artículo</button>

          <div class="note-box">
            <strong>Consejo:</strong>
            usa códigos A, B, C... para que el árbol se forme con claridad.
          </div>
        </aside>
      </div>

      <div class="card">
        <div class="section-head">
          <div class="card-title compact">
            <div class="icon-box">📦</div>
            <div>
              <h2>Artículos</h2>
              <p>Inventario, lead time, stock de seguridad y recepción programada.</p>
            </div>
          </div>
        </div>

        <div id="itemsCards" class="items-grid"></div>
      </div>
    </section>

    <section id="view-arbol" class="view">
      <div class="dashboard-grid tree-grid">
        <div class="card tree-card">
          <div class="section-head">
            <div class="card-title compact">
              <div class="icon-box">⌁</div>
              <div>
                <h2>Árbol de producto</h2>
                <p>Visualiza la estructura padre-componente del producto final.</p>
              </div>
            </div>
            <button id="btnBomDemo" class="btn secondary">Usar estructura ejemplo</button>
          </div>

          <div id="treeCanvas" class="tree-canvas"></div>

          <div class="legend">
            <span><i class="dot gold"></i> Producto final</span>
            <span><i class="dot blue"></i> Nivel 1</span>
            <span><i class="dot sky"></i> Nivel 2+</span>
          </div>
        </div>

        <aside class="card side-card">
          <div class="card-title compact">
            <div class="icon-box gold">＋</div>
            <div>
              <h2>Relaciones</h2>
              <p>Define qué componente necesita cada artículo.</p>
            </div>
          </div>
          <button id="btnAddBom" class="btn primary full">Agregar relación</button>
          <div class="note-box">
            <strong>Ejemplo:</strong>
            A → B x2 significa que para fabricar 1 unidad de A se necesitan 2 unidades de B.
          </div>
        </aside>
      </div>

      <div class="card">
        <div class="card-title compact">
          <div class="icon-box">☷</div>
          <div>
            <h2>Estructura del producto</h2>
            <p>Selecciona producto padre, componente y cantidad requerida.</p>
          </div>
        </div>

        <div id="bomCards" class="bom-grid"></div>
      </div>
    </section>

    <section id="view-demanda" class="view">
      <div class="card">
        <div class="section-head">
          <div class="card-title compact">
            <div class="icon-box">📈</div>
            <div>
              <h2>Demanda por semana</h2>
              <p>Ingresa la demanda independiente del producto final.</p>
            </div>
          </div>
          <button id="btnActualizarSemanas" class="btn secondary">Actualizar semanas</button>
        </div>

        <div id="demandaGrid" class="week-grid"></div>
      </div>
    </section>

    <section id="view-resultado" class="view">
      <div class="card">
        <div class="section-head">
          <div class="card-title compact">
            <div class="icon-box">▥</div>
            <div>
              <h2>Resultado del plan MRP</h2>
              <p>Revisa necesidades, recepciones y lanzamientos planificados.</p>
            </div>
          </div>
          <button id="btnCalcular" class="btn primary">Calcular MRP</button>
        </div>

        <div id="summaryCards" class="summary-cards"></div>
        <div id="alerts" class="alerts"></div>
        <div id="mrpTables"></div>
      </div>
    </section>

    <section id="view-reporte" class="view">
      <div class="card no-print">
        <div class="section-head">
          <div class="card-title compact">
            <div class="icon-box">☑</div>
            <div>
              <h2>Reporte ejecutivo</h2>
              <p>Resumen listo para imprimir o guardar como PDF.</p>
            </div>
          </div>
          <div class="actions no-margin">
            <button id="btnGenerarReporte" class="btn secondary">Generar reporte</button>
            <button id="btnPrint" class="btn primary">Imprimir / Guardar PDF</button>
          </div>
        </div>
      </div>

      <article id="reportPage" class="report-page"></article>
    </section>
  </main>

  <footer class="institutional-footer">
    <div class="footer-left">
      <div class="cap-icon">⌂</div>
      <div>
        <strong>Formamos buenos cristianos y honrados ciudadanos</strong>
        <span>Excelencia académica y compromiso con la sociedad.</span>
      </div>
    </div>
    <div class="footer-values">
      <span>Innovación</span>
      <span>Excelencia</span>
      <span>Compromiso</span>
      <span>Integridad</span>
    </div>
  </footer>

  <script src="app.js"></script>
</body>
</html>
