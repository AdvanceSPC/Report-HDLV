const express = require("express");
const router = express.Router();
const {
  vistaPrincipal,
  exportCSV,
  exportExcel,
  obtenerLlamadas,
} = require("../controllers/pageController");

router.get("/", vistaPrincipal);
router.get("/export/csv", exportCSV);
router.get("/export/excel", exportExcel);
router.get("/api/llamadas", obtenerLlamadas);

module.exports = router;
