import postgres from 'postgres';

const sql = postgres({
  host: 'localhost',
  port: 5432,
  database: 'pixeltraderinc',
  username: 'postgres',
  password: 'postgresql',
});

export default sql;
