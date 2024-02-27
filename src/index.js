import express from "express"
import { queryDatabase } from "./database/query.js"
import { dataBase } from "./database/connDatabase.js"
import cors from 'cors'

const app = express()
const port = process.env.PORT
app.use(express.json())

app.post('/start-database', cors(), async (req, res) => {
  const clinets = [
    {saldo: 0, limite: 100000 },
    {saldo: 0, limite: 80000},
    {saldo: 0, limite: 1000000},
    {saldo: 0, limite: 10000000 },
    {saldo: 0, limite: 500000}
  ]
  const text = 'INSERT INTO clientes(saldo, limite) VALUES($1, $2) RETURNING *'
   
  clinets.map(user => queryDatabase(text, [user.saldo, user.limite]))
  res.send(`Clients saved`);
})

app.get('/clientes/:id/extrato', cors(), async (req, res) => {
  const {id} = req.params
  const client = await queryDatabase('select saldo, limite from clientes where id=$1', [id])
  const clientTransaction = await queryDatabase('select valor, tipo, descricao, realizado_em from transacoes where id_cliente=$1 ORDER BY realizado_em DESC LIMIT 10', [id])
  if(client.rowCount  === 0) {
    res.status(404).send()
  } else {
    res.status(200).json({
      "saldo": {
        "total": client.rows[0].saldo,
        "data_extrato": new Date(),
        "limite": client.rows[0].limite,
      },
      "ultimas_transacoes": clientTransaction.rows
    })
  }
  
})

app.post('/clientes/:id/transacoes', cors(), async (req, res) => {
  const {id} = req.params
  const { saldo, tipo, descricao } = req.body
  const clientData = await queryDatabase('select saldo, limite from clientes where id=$1', [id])
  if(clientData.rowCount === 0) {
    res.status(404).send('client not found')
  }
  const clientResult = clientData.rows[0]
  if(tipo === 'c') {
    if (saldo <= (clientResult.limite + clientResult.saldo)) {
      console.log('(clientResult.limite - clientResult.saldo)', (clientResult.limite - Math.abs(clientResult.saldo)))
      const newSaldo = (clientResult.saldo - saldo)
      console.log('newSaldo', newSaldo)
      const result = await queryDatabase('UPDATE clientes SET saldo = $1 where id=$2 RETURNING *', [newSaldo, id])
      await queryDatabase('INSERT INTO transacoes(valor, tipo, descricao, realizado_em, id_cliente) VALUES($1, $2, $3, $4, $5)', [saldo, tipo, descricao.substring(0,10), new Date(), id])

      res.status(200).json({
        'limite': result.rows[0].limite,
        'saldo': result.rows[0].saldo,
        'total': result.rows[0].saldo + result.rows[0].limite 
      })
    } else {
      res.status(204).send()
    }
  } else if(tipo === 'd') {
    const newSaldo = saldo + clientResult.saldo
    console.log('newSaldo', clientResult.saldo)
    const result = await queryDatabase('UPDATE clientes SET saldo = $1 where id=$2 RETURNING *', [newSaldo, id])
    await queryDatabase('INSERT INTO transacoes(valor, tipo, descricao, realizado_em, id_cliente) VALUES($1, $2, $3, $4, $5)', [saldo, tipo, descricao.substring(0,10), new Date(), id])
    res.status(200).json({
      'limite': result.rows[0].limite,
      'saldo': result.rows[0].saldo,
      'total': result.rows[0].saldo + result.rows[0].limite 
    })
  } 
})

dataBase.connect()
  .then(() => app.listen(port, () => {
    console.log(`Server running PORT: ${port}`)
  }))
  .catch(console.error)
