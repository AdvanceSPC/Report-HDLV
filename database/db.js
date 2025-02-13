const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Verificar conexión
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error de conexión a la base de datos:", err.message);
  } else {
    console.log("✅ Conectado a la base de datos MySQL correctamente.");
    connection.release();
  }
});

module.exports = pool.promise();
