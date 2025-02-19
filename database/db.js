const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true, 
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true, 
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

// Mantener la conexión activa con pings cada 30 segundos
setInterval(async () => {
  try {
    const [rows] = await pool.promise().query("SELECT 1");
    console.log("✅ Ping a MySQL exitoso");
  } catch (err) {
    console.error("❌ Error en el ping a MySQL:", err.message);
  }
}, 30000);

module.exports = pool.promise();
