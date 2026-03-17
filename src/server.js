//importando variavel de ambiente
//require("dotenv").config();
//definindo porta do servidor
const PORT = process.env.PORT||3000;
//importanto arquivo app
const app = require("./app");
//deixa o servidor escutando
app.listen(PORT,()=>{
console.log(`Rodando na porta ${PORT}`)
});