const mysql = require("mysql2");

let connection;

if (process.env.DATABASE_URL) {
  // PRODUÇÃO
  connection = mysql.createConnection(process.env.DATABASE_URL);
} else {
  // DESENVOLVIMENTO LOCAL
  connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

connection.connect(err => {
  if (err) {
    console.error("Erro ao conectar no banco:", err);
    return;
  }
  console.log("Banco conectado com sucesso");
});

module.exports = connection;
