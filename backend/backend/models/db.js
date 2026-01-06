// models/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "Lokesh@210905",
  database: process.env.DB_NAME || "transport_company",
  
});

export default db;
