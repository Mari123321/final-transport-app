import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.sqlite');

// First, get the table structure
db.all("PRAGMA table_info(Clients)", (err, columns) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('\n📊 CLIENTS TABLE STRUCTURE:');
  console.log('='.repeat(80));
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });
  
  // Now get all client data
  db.all("SELECT * FROM Clients", (err, clients) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }
    
    console.log('\n\n👥 CLIENTS DATABASE');
    console.log('='.repeat(80));
    console.log(`Total Clients: ${clients.length}\n`);
    
    if (clients.length === 0) {
      console.log('No clients found.');
    } else {
      clients.forEach((client, index) => {
        console.log(`\n${index + 1}. Client ID: ${client.client_id || 'N/A'}`);
        console.log(`   Name: ${client.client_name || 'N/A'}`);
        console.log(`   Email: ${client.client_email || 'N/A'}`);
        console.log(`   Phone: ${client.client_phone || 'N/A'}`);
        console.log(`   Address: ${client.client_address || 'N/A'}`);
        console.log(`   City: ${client.client_city || 'N/A'}`);
        console.log(`   State: ${client.client_state || 'N/A'}`);
        console.log(`   GST Number: ${client.client_gst || 'N/A'}`);
        console.log(`   PAN: ${client.client_pan || 'N/A'}`);
        console.log(`   Type: ${client.client_type || 'N/A'}`);
        console.log(`   Created: ${client.createdAt || 'N/A'}`);
        console.log(`   Updated: ${client.updatedAt || 'N/A'}`);
        console.log('-'.repeat(80));
      });
    }
    
    db.close();
  });
});
