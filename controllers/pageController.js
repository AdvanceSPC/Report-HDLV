const pool = require('../database/db');
const { Parser } = require('json2csv');
const exceljs = require('exceljs');

const vistaPrincipal = async (req, res) => {
  try {
    let { fechaDesde, fechaHasta } = req.query;
    let fechaHastaOriginal = fechaHasta; // Guardar el valor original para el input

    let query = `SELECT call_id, agent, tipo_llamada, genero, tipo_identificacion, 
                 identificacion, nombre_apellidos, campana, tipo, 
                 motivo, submotivo, observaciones, 
                 DATE_FORMAT(fecha_atencion, '%d/%m/%Y') AS fecha, 
                 TIME_FORMAT(fecha_atencion, '%H:%i:%s') AS hora 
                 FROM gestion_llamadas`;
    let params = [];
    
    if (fechaDesde && fechaHasta) {
      fechaHasta += " 23:59:59"; // Modificar solo para la consulta
      query += " WHERE fecha_atencion BETWEEN ? AND ?";
      params.push(fechaDesde, fechaHasta);
    } else if (fechaDesde) {
      query += " WHERE fecha_atencion >= ?";
      params.push(fechaDesde);
    }
    
    const [rows] = await pool.query(query, params);
    res.render("index", { llamadas: rows, fechaDesde, fechaHasta: fechaHastaOriginal }); // Enviar el valor original
  } catch (error) {
    console.error("Error al obtener datos:", error);
    res.status(500).send("Error interno del servidor");
  }
};


const exportCSV = async (req, res) => {
  try {
    let { fechaDesde, fechaHasta } = req.query;
    let query = `SELECT call_id, agent, tipo_llamada, genero, tipo_identificacion, 
                 identificacion, nombre_apellidos, campana, tipo, 
                 motivo, submotivo, observaciones, 
                 DATE_FORMAT(fecha_atencion, '%d/%m/%Y') AS fecha, 
                 TIME_FORMAT(fecha_atencion, '%H:%i') AS hora 
                 FROM gestion_llamadas`;
    let params = [];

    if (fechaDesde && fechaHasta) {
      fechaHasta += " 23:59:59";
      query += " WHERE fecha_atencion BETWEEN ? AND ?";
      params.push(fechaDesde, fechaHasta);
    } else if (fechaDesde) {
      query += " WHERE fecha_atencion >= ?";
      params.push(fechaDesde);
    }

    const [rows] = await pool.query(query, params);

    // Definir cabeceras manualmente si no hay registros
    const defaultHeaders = [
      "call_id", "agent", "tipo_llamada", "genero", "tipo_identificacion",
      "identificacion", "nombre_apellidos", "campana", "tipo",
      "motivo", "submotivo", "observaciones", "fecha", "hora"
    ];
    
    const fields = rows.length > 0 ? Object.keys(rows[0]) : defaultHeaders;
    const parser = new Parser({ fields });
    const csv = parser.parse(rows.length > 0 ? rows : [{}]); // Asegurar salida con cabeceras

    res.header("Content-Type", "text/csv");
    res.attachment("gestion_llamadas.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error al exportar CSV:", error);
    res.status(500).send("Error al generar CSV");
  }
};

const exportExcel = async (req, res) => {
  try {
    let { fechaDesde, fechaHasta } = req.query;
    let query = `SELECT call_id, agent, tipo_llamada, genero, tipo_identificacion, 
                 identificacion, nombre_apellidos, campana, tipo, 
                 motivo, submotivo, observaciones, 
                 DATE_FORMAT(fecha_atencion, '%d/%m/%Y') AS fecha, 
                 TIME_FORMAT(fecha_atencion, '%H:%i') AS hora 
                 FROM gestion_llamadas`;
    let params = [];

    if (fechaDesde && fechaHasta) {
      fechaHasta += " 23:59:59";
      query += " WHERE fecha_atencion BETWEEN ? AND ?";
      params.push(fechaDesde, fechaHasta);
    } else if (fechaDesde) {
      query += " WHERE fecha_atencion >= ?";
      params.push(fechaDesde);
    }

    const [rows] = await pool.query(query, params);
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("Llamadas");

    // Definir cabeceras manualmente si no hay registros
    const defaultHeaders = [
      "Call ID", "Agente", "Tipo de Llamada", "Género", "Tipo de Identificación",
      "Identificación", "Nombre y Apellidos", "Campaña", "Tipo",
      "Motivo", "Submotivo", "Observaciones", "Fecha Atención", "Hora Atención"
    ];

    worksheet.addRow(defaultHeaders); // Agregar cabeceras
    
    if (rows.length > 0) {
      rows.forEach(row => worksheet.addRow(Object.values(row)));
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=gestion_llamadas.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error al exportar Excel:", error);
    res.status(500).send("Error al generar Excel");
  }
};

module.exports = { vistaPrincipal, exportCSV, exportExcel };
