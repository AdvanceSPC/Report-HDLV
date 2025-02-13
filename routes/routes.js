const express = require("express");
const router = express.Router();
const { vistaPrincipal, exportCSV, exportExcel } = require("../controllers/pageController");

router.get("/", vistaPrincipal);
router.get("/export/csv", exportCSV);
router.get("/export/excel", exportExcel);

module.exports = router;
