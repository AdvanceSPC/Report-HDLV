const pool = require("../database/db");
const { Parser } = require("json2csv");
const exceljs = require("exceljs");

const vistaPrincipal = async (req, res) => {
  try {
    let { fechaDesde, fechaHasta, pagina = 1, limit = 10 } = req.query;
    let fechaHastaOriginal = fechaHasta;

    pagina = parseInt(pagina);
    limit = parseInt(limit);
    const offset = (pagina - 1) * limit;

    let queryBase = `SELECT call_id, agent, tipo_llamada, genero, tipo_identificacion, 
                     identificacion, nombre_apellidos, campana, tipo, 
                     motivo, submotivo, observaciones, 
                     DATE_FORMAT(fecha_atencion, '%d/%m/%Y') AS fecha, 
                     TIME_FORMAT(fecha_atencion, '%H:%i:%s') AS hora 
                     FROM gestion_llamadas`;

    let countQuery = `SELECT COUNT(*) AS total FROM gestion_llamadas`;
    let params = [];

    if (fechaDesde && fechaHasta) {
      fechaHasta += " 23:59:59";
      queryBase += " WHERE fecha_atencion BETWEEN ? AND ?";
      countQuery += " WHERE fecha_atencion BETWEEN ? AND ?";
      params.push(fechaDesde, fechaHasta);
    } else if (fechaDesde) {
      queryBase += " WHERE fecha_atencion >= ?";
      countQuery += " WHERE fecha_atencion >= ?";
      params.push(fechaDesde);
    }

    // Obtener total de registros
    const [[{ total }]] = await pool.query(countQuery, params);

    // Agregar paginación
    queryBase += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.query(queryBase, params);

    const totalPaginas = Math.ceil(total / limit);

    res.render("index", {
      llamadas: rows,
      fechaDesde,
      fechaHasta: fechaHastaOriginal,
      paginaActual: pagina,
      totalPaginas,
      limit,
    });
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
      "call_id",
      "agent",
      "tipo_llamada",
      "genero",
      "tipo_identificacion",
      "identificacion",
      "nombre_apellidos",
      "campana",
      "tipo",
      "motivo",
      "submotivo",
      "observaciones",
      "fecha",
      "hora",
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
      "Call ID",
      "Agente",
      "Tipo de Llamada",
      "Género",
      "Tipo de Identificación",
      "Identificación",
      "Nombre y Apellidos",
      "Campaña",
      "Tipo",
      "Motivo",
      "Submotivo",
      "Observaciones",
      "Fecha Atención",
      "Hora Atención",
    ];

    worksheet.addRow(defaultHeaders); // Agregar cabeceras

    if (rows.length > 0) {
      rows.forEach((row) => worksheet.addRow(Object.values(row)));
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=gestion_llamadas.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error al exportar Excel:", error);
    res.status(500).send("Error al generar Excel");
  }
};

const obtenerLlamadas = async (req, res) => {
  try {
    let { pagina = 1, limit = 10, fechaDesde, fechaHasta } = req.query;

    pagina = parseInt(pagina);
    limit = parseInt(limit);
    const offset = (pagina - 1) * limit;

    let queryBase = `SELECT call_id, agent, tipo_llamada, genero, tipo_identificacion, 
                     identificacion, nombre_apellidos, campana, tipo, 
                     motivo, submotivo, observaciones, 
                     DATE_FORMAT(fecha_atencion, '%d/%m/%Y') AS fecha, 
                     TIME_FORMAT(fecha_atencion, '%H:%i:%s') AS hora 
                     FROM gestion_llamadas`;

    let countQuery = `SELECT COUNT(*) AS total FROM gestion_llamadas`;
    let params = [];

    if (fechaDesde && fechaHasta) {
      // Agregamos la hora final para incluir todo el día
      fechaHasta += " 23:59:59";
      queryBase += " WHERE fecha_atencion BETWEEN ? AND ?";
      countQuery += " WHERE fecha_atencion BETWEEN ? AND ?";
      params.push(fechaDesde, fechaHasta);
    } else if (fechaDesde) {
      queryBase += " WHERE fecha_atencion >= ?";
      countQuery += " WHERE fecha_atencion >= ?";
      params.push(fechaDesde);
    }

    // Obtener total de registros
    const [[{ total }]] = await pool.query(countQuery, params);

    // Agregar paginación
    queryBase += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.query(queryBase, params);

    const totalPaginas = Math.ceil(total / limit);

    // Construir la paginación (puedes ajustar la lógica de paginación si es necesario)
    let paginationHTML = `
      <li class="page-item ${pagina === 1 ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="1">««</a>
      </li>
      <li class="page-item ${pagina === 1 ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="${pagina - 1}">«</a>
      </li>`;

    const maxPagesToShow = 6;
    let startPage = Math.max(1, pagina - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPaginas, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <li class="page-item ${pagina === i ? "active" : ""}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>`;
    }

    paginationHTML += `
      <li class="page-item ${pagina === totalPaginas ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="${pagina + 1}">»</a>
      </li>
      <li class="page-item ${pagina === totalPaginas ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="${totalPaginas}">»»</a>
      </li>`;

    res.json({
      html: rows
        .map(
          (row) => `
        <tr>
          <td>${row.call_id}</td>
          <td>${row.agent}</td>
          <td>${row.tipo_llamada}</td>
          <td>${row.genero}</td>
          <td>${row.identificacion}</td>
          <td>${row.nombre_apellidos}</td>
          <td>${row.campana}</td>
          <td>${row.tipo}</td>
          <td>${row.motivo}</td>
          <td>${row.submotivo}</td>
          <td>${row.observaciones}</td>
          <td>${row.fecha}</td>
          <td>${row.hora}</td>
        </tr>
      `
        )
        .join(""),
      pagination: paginationHTML,
    });
  } catch (error) {
    console.error("Error al obtener datos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = { vistaPrincipal, exportCSV, exportExcel, obtenerLlamadas };
