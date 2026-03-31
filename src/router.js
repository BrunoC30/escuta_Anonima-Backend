const express = require("express");
const router = express.Router();
const pool = require("./db");

/* ============================
   GET /api/relatos
============================ */
router.get("/api/relatos", async (req, res) => {
  try {
    const userId = req.headers["x-usuario"];

    if (userId) {
      const result = await pool.query(
        "SELECT id FROM usuarios WHERE id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        await pool.query(
          "INSERT INTO usuarios (id, nickname) VALUES ($1, $2)",
          [userId, "anonimo"]
        );
      }
    }

    const relatosResult = await pool.query(`
      SELECT r.*, COUNT(a.id_usuario) AS total_apoios
      FROM relatos r
      LEFT JOIN apoios a
        ON a.id_relato = r.id_relato
        AND a.ativo = true
      GROUP BY r.id_relato
      ORDER BY r.data_relato DESC
    `);

    res.json(relatosResult.rows);

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

    const totalRelatosResult = await pool.query(`
      SELECT COUNT(*) AS total_relatos FROM relatos
    `);

    const totalApoiadosResult = await pool.query(`
      SELECT COUNT(*) AS total_apoios
      FROM apoios
      WHERE id_usuario = $1
      AND ativo = true
    `, [userId]);

    const categoriasResult = await pool.query(`
      SELECT categoria,
      ROUND(
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM relatos)
      ) AS porcentagem
      FROM relatos
      GROUP BY categoria
      ORDER BY porcentagem DESC
    `);

    res.json({
      relatos: totalRelatosResult.rows[0],
      apoios: totalApoiadosResult.rows[0],
      categorias: categoriasResult.rows
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
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
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
    const relatoId = Number(req.params.relato);

    console.log(req.params.relato);

    const result = await pool.query(`
      SELECT ativo
      FROM apoios
      WHERE id_usuario = $1 AND id_relato = $2
    `, [userId, relatoId]);

    if (result.rows.length === 0) {
      await pool.query(`
        INSERT INTO apoios (id_usuario, id_relato, ativo)
        VALUES ($1,$2,true)
      `, [userId, relatoId]);
    } else {
      const novoEstado = !result.rows[0].ativo;

      await pool.query(`
        UPDATE apoios
        SET ativo = $1
        WHERE id_usuario = $2 AND id_relato = $3
      `, [novoEstado, userId, relatoId]);
    }

    res.json({ ok: true });

  } catch (err) {
    console.error("Erro ao registrar apoio:", err);
    res.status(500).json({ error: "erro ao registrar apoio" });
  }
});

module.exports = router;