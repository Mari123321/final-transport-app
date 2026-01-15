import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../database.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err);
    process.exit(1);
  }

  console.log("🔄 Recreating bills table with proper schema...");

  // Drop old bills table
  db.run("DROP TABLE IF EXISTS bills", (err) => {
    if (err) {
      console.error("❌ Error dropping bills table:", err);
      process.exit(1);
    }

    // Create new bills table with proper schema
    const createTableSQL = `
      CREATE TABLE bills (
        bill_id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_number VARCHAR(255) NOT NULL UNIQUE,
        invoice_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        vehicle_id INTEGER,
        bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
        total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        pending_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'UNPAID',
        notes TEXT,
        deleted_at DATETIME,
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
        FOREIGN KEY (client_id) REFERENCES clients(client_id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
      )
    `;

    db.run(createTableSQL, (err) => {
      if (err) {
        console.error("❌ Error creating bills table:", err);
        process.exit(1);
      }

      // Create indexes
      const createIndexesSQL = [
        "CREATE INDEX bills_invoice_id ON bills(invoice_id)",
        "CREATE INDEX bills_client_id ON bills(client_id)",
        "CREATE INDEX bills_vehicle_id ON bills(vehicle_id)",
        "CREATE INDEX bills_bill_date ON bills(bill_date)",
        "CREATE INDEX bills_payment_status ON bills(payment_status)",
        "CREATE INDEX bills_deleted_at ON bills(deleted_at)"
      ];

      let completed = 0;
      createIndexesSQL.forEach((sql) => {
        db.run(sql, (err) => {
          if (err) {
            console.error("⚠️  Error creating index:", err.message);
          }
          completed++;
          if (completed === createIndexesSQL.length) {
            console.log("✅ Bills table recreated successfully with proper schema");
            console.log("📋 New Bills Table Schema:");
            
            db.all(`PRAGMA table_info(bills)`, (err, rows) => {
              if (err) {
                console.error("Error getting table info:", err);
              } else {
                if (rows && rows.length > 0) {
                  console.table(rows);
                }
              }
              db.close();
            });
          }
        });
      });
    });
  });
});
