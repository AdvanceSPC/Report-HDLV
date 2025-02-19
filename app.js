const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

const app = express();

// Configuración de vistas
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

// Configuración de variables de entorno
dotenv.config({ path: "./env/.env" });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const routes = require("./routes/routes");
app.use("/", routes);

app.use((req, res) => {
  res.status(404).render("404");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SERVER UP running in http://localhost:${PORT}`);
});
