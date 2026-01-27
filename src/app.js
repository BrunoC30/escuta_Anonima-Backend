const express = require("express");
const cors = require("cors");

//importando as rotas
const router = require("./router");
//ativa o express
const app = express();
//habilita formato json
app.use(express.json());
//habilita cors
app.use(cors());
app.use(router);

module.exports = app;