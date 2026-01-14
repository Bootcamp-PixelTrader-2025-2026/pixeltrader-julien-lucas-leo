import postgres from 'postgres'

const sql = postgres('postgres://username:password@host:port/database', {
  host                 : 'localhost',            
  port                 : 3306,   
  database             : 'pixeltraderinc',            
  username             : 'root',            
  password             : '',            
})

export default sql

console.log(sql)