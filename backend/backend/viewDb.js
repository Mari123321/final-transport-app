import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.sqlite');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('\n📊 DATABASE TABLES:\n' + '='.repeat(50));
  
  let completed = 0;
  tables.forEach((table, index) => {
    db.all(`SELECT * FROM ${table.name}`, (err, rows) => {
      if (err) {
        console.error(`Error in ${table.name}:`, err);
      } else {
        console.log(`\n✅ ${table.name.toUpperCase()}: ${rows.length} records`);
        if (rows.length > 0) {
          console.log('Sample data:', JSON.stringify(rows[0], null, 2));
        }
      }
      
      completed++;
      if (completed === tables.length) {
        db.close();
      }
    });
  });
});
