import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../database.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
    process.exit(1);
  }

  console.log("📋 Current Bills Table Schema:");
  db.all(`PRAGMA table_info(bills)`, (err, rows) => {
    if (err) {
      console.error("Error getting table info:", err);
    } else {
      if (rows && rows.length > 0) {
        console.table(rows);
      } else {
        console.log("❌ Bills table does not exist or is empty");
      }
    }
    db.close();
  });
});
