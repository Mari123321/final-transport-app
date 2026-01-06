import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.sqlite');

db.all("SELECT * FROM Clients", (err, rows) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log('\n📋 CLIENTS DATABASE');
  console.log('='.repeat(80));
  console.log(`Total Clients: ${rows.length}\n`);
  
  if (rows.length === 0) {
    console.log('No clients found in database.');
  } else {
    rows.forEach((client, index) => {
      console.log(`\n${index + 1}. Client ID: ${client.id}`);
      console.log(`   Name: ${client.name}`);
      console.log(`   Email: ${client.email || 'N/A'}`);
      console.log(`   Phone: ${client.phone || 'N/A'}`);
      console.log(`   Address: ${client.address || 'N/A'}`);
      console.log(`   GST Number: ${client.gstNumber || 'N/A'}`);
      console.log(`   Created: ${client.createdAt}`);
      console.log('-'.repeat(80));
    });
  }
  
  db.close();
});
