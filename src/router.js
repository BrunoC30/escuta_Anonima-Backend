//importações
const express = require("express");
const router = express.Router();
const connection = require("./db");

//rota GET
router.get("/api/relatos",(req,res)=>{
    connection.query(`
        SELECT r.*, COUNT(a.id_usuario) AS total_apoios
        FROM relatos r
        LEFT JOIN apoios a
        ON a.id_relato = r.id_relato
        AND a.ativo = true
        GROUP BY r.id_relato;
        `
        ,(err,result)=>{
        if(err){
            res.status(500).json({error:"erro ao coletar dados"});
        }
        res.json(result);
    })
    //adicionar usuário
    connection.query("SELECT * FROM usuarios WHERE id = ?",
        [req.headers['x-usuario']],(err,result)=>{
            if(err){console.error(err," falha ao buscar no banco")}
            if(result.length===0){
               connection.query(`
                    INSERT INTO usuarios(id,nickname)
                    VALUES (?,?)
                    `,[req.headers['x-usuario'],"anonimo"],(err,result)=>{
                    if(err){console.error(err,"Erro em insirir novo usuario\n")}
                    else{ console.log("inserido com sucesso!")}
                })
            }  
               console.log(result);
        });
})
router.get("/api/analise",(req,res)=>{
    const userId = req.headers['x-usuario'];
    let totalRelatos;
    let totalApoiados;
    let totalCategorias;
    //OBTER TOTAL DE RELATOS
    connection.query(`
        SELECT COUNT(*) AS total_relatos
        FROM relatos;
        `,(err,result)=>{//CALLBACK 1
            if(err){console.error("erro total relato",err)}
            totalRelatos = result;
            console.log("Cb 1 sucesso",totalRelatos);

    connection.query(`
        SELECT COUNT(*) AS total_apoios
        FROM apoios
        WHERE id_usuario = ?
        AND ativo = true;
        `,[userId],
        (err,result)=>{ //CALLBACK 2
            if(err){console.error("Falha ao contar apoios pelo usuario",err)}
            totalApoiados = result;
            console.log("Cb 2 sucesso",totalApoiados)

    connection.query(`
        SELECT categoria, ROUND(

        COUNT(*)/(SELECT COUNT(*)
        FROM relatos)*100.0

        ) AS porcentagem
        FROM relatos
        GROUP BY categoria
        ORDER BY porcentagem DESC;
            `,(err,result)=>{ //CALLBACK 3
                if(err){console.error(err)}
                    totalCategorias = result;
                    console.log("Cb 3 sucesso",totalCategorias)

                    res.json({
                        relatos:totalRelatos,
                        apoios:totalApoiados,
                        categorias:totalCategorias
                    });
                } //CALLBACK 3 END
            )

        } //CALLBACK 2 END
    )        

    } //CALLBACK 1 END
)

    
})
//rota POST
router.post("/api/relatos",(req,res)=>{
    const r = req.body;
    connection.query(
`INSERT INTO relatos(
id_relato,
id_usuario,
data_relato,
sensivel,
conteudo,
categoria,
titulo
)
VALUES(?, ?, ?, ?, ?, ?, ?)`,
[r.id_relato,
r.id_usuario,
r.data_relato,
r.sensivel,
r.conteudo,
r.categoria,
r.titulo
],
(err,result)=>{
    if(err){
        res.status(500).json({error:"falha ao inserir no banco\n",err})
        console.log("erro ao inserir no banco",err);
    }
    res.json(result);
}
)
})
//rota PUT
router.put("/api/apoio/:relato",(req,res)=>{
    const userID = req.headers['x-usuario'];
    const relatoID = Number(req.params.relato.slice(8));
    console.log(relatoID);
    //busca o registro no banco de dados
    connection.query(`
        SELECT id_usuario,id_relato,ativo
        FROM apoios
        WHERE id_usuario = ? AND id_relato = ?
        `,[userID,relatoID],
        (err,result)=>{
            if(err){console.error(err)}
            //caso não exista será criado
            if(result.length === 0){

                connection.query(`
                    INSERT INTO apoios (id_usuario,id_relato)
                    VALUES (?, ?)
                    `,[userID,relatoID],
                (err,result)=>{if(err){console.error(err," falha ao registrar apoio")}}
                )
            }else{ //caso exista será feito uma alternancia lógica
                //CASO SEJA TRUE MUDARÁ PARA FALSE
                if(result[0].ativo===1){
                    console.log("true")
                    connection.query(`
                        UPDATE apoios
                        SET ativo = false
                        WHERE id_usuario = ? AND id_relato = ?;
                        `,[userID,relatoID],(err,result)=>{if(err){console.error(err)}})
                }else{ //CSO SEJA FALSE MUDARÁ PARA TRUE
                    console.log("false");
                    connection.query(`
                        UPDATE apoios
                        SET ativo = true
                        WHERE id_usuario = ? AND id_relato = ?;
                        `,[userID,relatoID],(err,result)=>{if(err){console.error(err)}})
                    
                }
            }
        }
    ) 
res.json({ok:true});
})

module.exports = router;