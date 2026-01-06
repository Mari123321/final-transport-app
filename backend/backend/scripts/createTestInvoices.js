import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.sqlite');

// Get first client
db.get('SELECT client_id, client_name FROM Clients LIMIT 1', (err, client) => {
  if (err || !client) {
    console.log('No clients found');
    db.close();
    return;
  }
  console.log('Using client:', client.client_id, client.client_name);
  
  const sql = `INSERT INTO invoices (client_id, date, total_amount, amount_paid, pending_amount, payment_status, createdAt, updatedAt) 
               VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;
  
  // Insert test invoices with different statuses and dates
  db.run(sql, [client.client_id, '2025-12-01', 50000, 0, 50000, 'Pending'], function(err) {
    if (err) console.log('Error 1:', err.message);
    else console.log('Inserted invoice 1, ID:', this.lastID);
  });
  
  db.run(sql, [client.client_id, '2025-12-05', 75000, 25000, 50000, 'Partial'], function(err) {
    if (err) console.log('Error 2:', err.message);
    else console.log('Inserted invoice 2, ID:', this.lastID);
  });
  
  db.run(sql, [client.client_id, '2025-12-15', 45000, 0, 45000, 'Pending'], function(err) {
    if (err) console.log('Error 3:', err.message);
    else console.log('Inserted invoice 3, ID:', this.lastID);
  });
  
  // Check results after insertions
  setTimeout(() => {
    db.all('SELECT invoice_id, client_id, date, payment_status FROM invoices', (err, rows) => {
      console.log('\nInvoices in database:');
      rows.forEach(r => console.log(r));
      db.close();
    });
  }, 500);
});
