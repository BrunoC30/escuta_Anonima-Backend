const express = require("express");
const router = express.Router();
const pool = require("./db");

/* ============================
   GET /api/relatos
============================ */
router.get("/api/relatos", async (req, res) => {
  try {
    const userId = req.headers["x-usuario"];

    // garante que o usuário exista
    if (userId) {
      const [user] = await pool.query(
        "SELECT id FROM usuarios WHERE id = ?",
        [userId]
      );

      if (user.length === 0) {
        await pool.query(
          "INSERT INTO usuarios (id, nickname) VALUES (?, ?)",
          [userId, "anonimo"]
        );
      }
    }

    // busca relatos + total de apoios
    const [relatos] = await pool.query(`
      SELECT r.*, COUNT(a.id_usuario) AS total_apoios
      FROM relatos r
      LEFT JOIN apoios a
        ON a.id_relato = r.id_relato
        AND a.ativo = true
      GROUP BY r.id_relato
    `);

    res.json(relatos);
  } catch (err) {
    console.error("Erro ao buscar relatos:", err);
    res.status(500).json({ error: "erro ao coletar dados" });
  }
});

/* ============================
   GET /api/analise
============================ */
router.get("/api/analise", async (req, res) => {
  try {
    const userId = req.headers["x-usuario"];

    const [[totalRelatos]] = await pool.query(`
      SELECT COUNT(*) AS total_relatos FROM relatos
    `);

    const [[totalApoiados]] = await pool.query(`
      SELECT COUNT(*) AS total_apoios
      FROM apoios
      WHERE id_usuario = ?
      AND ativo = true
    `, [userId]);

    const [categorias] = await pool.query(`
      SELECT categoria,
      ROUND(
        COUNT(*) / (SELECT COUNT(*) FROM relatos) * 100
      ) AS porcentagem
      FROM relatos
      GROUP BY categoria
      ORDER BY porcentagem DESC
    `);

    res.json({
      relatos: totalRelatos,
      apoios: totalApoiados,
      categorias
    });
  } catch (err) {
    console.error("Erro na análise:", err);
    res.status(500).json({ error: "erro ao coletar dados" });
  }
});

/* ============================
   POST /api/relatos
============================ */
router.post("/api/relatos", async (req, res) => {
  try {
    const r = req.body;

    await pool.query(`
      INSERT INTO relatos (
        id_relato,
        id_usuario,
        data_relato,
        sensivel,
        conteudo,
        categoria,
        titulo
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      r.id_relato,
      r.id_usuario,
      r.data_relato,
      r.sensivel,
      r.conteudo,
      r.categoria,
      r.titulo
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao inserir relato:", err);
    res.status(500).json({ error: "falha ao inserir no banco" });
  }
});

/* ============================
   PUT /api/apoio/:relato
============================ */
router.put("/api/apoio/:relato", async (req, res) => {
  try {
    const userId = req.headers["x-usuario"];
    const relatoId = Number(req.params.relato.slice(8));

    const [registro] = await pool.query(`
      SELECT ativo
      FROM apoios
      WHERE id_usuario = ? AND id_relato = ?
    `, [userId, relatoId]);

    if (registro.length === 0) {
      await pool.query(`
        INSERT INTO apoios (id_usuario, id_relato)
        VALUES (?, ?)
      `, [userId, relatoId]);
    } else {
      const novoEstado = !registro[0].ativo;

      await pool.query(`
        UPDATE apoios
        SET ativo = ?
        WHERE id_usuario = ? AND id_relato = ?
      `, [novoEstado, userId, relatoId]);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao registrar apoio:", err);
    res.status(500).json({ error: "erro ao registrar apoio" });
  }
});

module.exports = router;