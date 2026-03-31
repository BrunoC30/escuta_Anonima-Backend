
const { Pool } = require('pg');

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
} else {
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port:process.env.DB_PORT 
  });
}

async function checkDatabase() {
  try {
    const client = await pool.connect();
    console.log("✅ Banco conectado com sucesso!");

    const result = await client.query("SELECT NOW()");
    console.log("⏰ Hora do servidor:", result.rows[0].now);

    client.release();
  } catch (error) {
    console.error("❌ Erro ao conectar no banco:");
    console.error(error.message);
  }
}

checkDatabase();

module.exports = pool;