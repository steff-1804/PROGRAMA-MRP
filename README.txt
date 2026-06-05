# Programa MRP - Ejercicios de clase

## Cómo usar
1. Abrir `index.html` en el navegador.
2. Presionar `Cargar ejemplo de clase`.
3. Modificar semanas, demanda, inventario, lead time o estructura BOM.
4. Presionar `Calcular MRP`.
5. Usar `Exportar a Excel` para descargar el resultado.

## Archivos
- `index.html`: estructura de la página.
- `style.css`: diseño visual similar al ejercicio de clase.
- `app.js`: lógica de cálculo MRP.

## Nota técnica
El cálculo usa política lote por lote (L4L). Las necesidades brutas de los componentes se generan desde el lanzamiento del orden planificado del padre, que es el procedimiento correcto en MRP.
