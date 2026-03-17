
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Escuta_anom',
  password: '4040',
  port: 3000,
});

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