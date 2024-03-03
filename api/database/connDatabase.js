import pg from "pg"


export const dataBase = new pg.Client({
  user: 'admin',
  host: process.env.DB_HOSTNAME,
  database: 'rinha',
  password: '123',
  port: 5432,
})