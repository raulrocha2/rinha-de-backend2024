import { dataBase } from "./connDatabase.js"

export const queryDatabase = async (text, params) => {
  return await dataBase.query(text, params)  
}