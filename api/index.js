import express, { Router } from "express"
import { queryDatabase } from "./database/query.js"
import { dataBase } from "./database/connDatabase.js"
import cors from 'cors'

const app = express()
const port = process.env.PORT || 8080
const apiRouter = Router()
app.use(cors())
app.use(express.json())

app.use(apiRouter)

apiRouter.get('/clientes/:id/extrato', async (req, res) => {
  const {id} = req.params
  if (id && id.match(/^-?[\d.]+(?:e-?\d+)?$/)) {
    const client = await queryDatabase('select saldo, limite from clientes where id=$1', [id])
    const clientTransaction = await queryDatabase('select valor, tipo, descricao, realizado_em from transacoes where id_cliente=$1 ORDER BY realizado_em DESC LIMIT 10', [id])
    if(client.rowCount  === 0) {
      return res.status(404).send()
    } else {
      return res.status(200).json({
        "saldo": {
          "total": client.rows[0].saldo,
          "data_extrato": new Date().toISOString(),
          "limite": client.rows[0].limite,
        },
        "ultimas_transacoes": clientTransaction.rows
      })
    }
  } else {
    return res.status(422).send()
  }
  
})

apiRouter.post('/clientes/:id/transacoes', async (req, res) => {
  const {id} = req.params
  if (id && id.match(/^-?[\d.]+(?:e-?\d+)?$/)) {
    const { valor, tipo, descricao } = req.body
    if (!descricao || descricao.length === 0 ) return res.status(422).send()
    if (valor < 0 || parseInt(valor) != valor) return res.status(422).send()
    if (!['c', 'd'].includes(tipo))  return res.status(422).send()
    const clientData = await queryDatabase('select saldo, limite from clientes where id=$1', [id])
    if(clientData.rowCount === 0) {
      return res.status(404).send('client not found')
    }
    const clientResult = clientData.rows[0]
     
    if(tipo === 'd') {
      const newSaldo = valor + clientResult.saldo
      const result = await queryDatabase('UPDATE clientes SET saldo = $1 where id=$2 RETURNING *', [newSaldo, id])
      await queryDatabase('INSERT INTO transacoes(valor, tipo, descricao, realizado_em, id_cliente) VALUES($1, $2, $3, $4, $5)', [valor, tipo, descricao.substring(0,10), new Date(), id])
      return res.status(200).json({
        'limite': result.rows[0].limite,
        'saldo': result.rows[0].saldo,
        'total': result.rows[0].saldo + result.rows[0].limite 
      })
    }
    if(tipo === 'c') {
      if (valor <= (clientResult.limite + clientResult.saldo)) {
        const newSaldo = (clientResult.saldo - valor)
        const result = await queryDatabase('UPDATE clientes SET saldo = $1 where id=$2 RETURNING *', [newSaldo, id])
        await queryDatabase('INSERT INTO transacoes(valor, tipo, descricao, realizado_em, id_cliente) VALUES($1, $2, $3, $4, $5)', [valor, tipo, descricao.substring(0,10), new Date(), id])
  
        return res.status(200).json({
          'limite': result.rows[0].limite,
          'saldo': result.rows[0].saldo,
          'total': result.rows[0].saldo + result.rows[0].limite 
        })
      } else {
        return res.status(422).send()
      }
    }
   } else {
    return res.status(422).send()
  }
})

dataBase.connect()
  .then(() => app.listen(port, () => {
    console.log(`Server running PORT: ${port}`)
  }))
  .catch(console.error)
