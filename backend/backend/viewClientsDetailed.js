import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.sqlite');

// First, get table structure
db.all("PRAGMA table_info(Clients)", (err, columns) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log('\n📊 CLIENTS TABLE STRUCTURE:');
  console.log('Columns:', columns.map(c => c.name).join(', '));
  
  // Now get all data
  db.all("SELECT * FROM Clients", (err, rows) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }
    
    console.log('\n📋 CLIENTS DATA');
    console.log('='.repeat(80));
    console.log(`Total Clients: ${rows.length}\n`);
    
    if (rows.length === 0) {
      console.log('No clients found in database.');
    } else {
      rows.forEach((client, index) => {
        console.log(`\n${index + 1}. Client Data:`);
        console.log(JSON.stringify(client, null, 2));
        console.log('-'.repeat(80));
      });
    }
    
    db.close();
  });
});
