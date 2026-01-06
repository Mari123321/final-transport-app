import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js'; 
import { startLicenseAlertJob } from './jobs/licenseAlerts.js';

// Import API routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import advanceRoutes from './routes/advanceRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import distanceRoutes from './routes/distanceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import billRoutes from './routes/billRoutes.js';
import demoRoutes from './routes/demoRoutes.js';
import driverExpenseRoutes from './routes/driverExpenseRoutes.js';
import dashboardAnalyticsRoutes from './routes/dashboardAnalyticsRoutes.js';
import smartPaymentRoutes from './routes/smartPaymentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/distance', distanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/advances', advanceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/driver-expenses', driverExpenseRoutes);
app.use('/api/analytics', dashboardAnalyticsRoutes);
app.use('/api/smart-payments', smartPaymentRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('✅ Transport Management System API is running...');
});

// Helper: ensure new payment columns exist without altering entire schema (SQLite-safe)
async function ensurePaymentColumns() {
  const cols = await sequelize.query("PRAGMA table_info(payments);", { type: sequelize.QueryTypes.SELECT });
  const names = cols.map((c) => c.name);
  const addColumnIfMissing = async (name, type, defaultVal = null) => {
    if (!names.includes(name)) {
      let sql = `ALTER TABLE payments ADD COLUMN ${name} ${type}`;
      if (defaultVal !== null) sql += ` DEFAULT ${defaultVal}`;
      await sequelize.query(sql);
      console.log(`✅ Added missing column payments.${name}`);
    }
  };

  // Core fields (new schema uses snake_case)
  await addColumnIfMissing('payment_id', 'INTEGER');
  await addColumnIfMissing('receipt_number', 'TEXT');
  await addColumnIfMissing('client_id', 'INTEGER');
  await addColumnIfMissing('invoice_id', 'INTEGER');
  await addColumnIfMissing('total_amount', 'REAL', '0');
  await addColumnIfMissing('paid_amount', 'REAL', '0');
  await addColumnIfMissing('balance_amount', 'REAL', '0');
  await addColumnIfMissing('bill_date', 'TEXT');
  await addColumnIfMissing('payment_date', 'TEXT');
  await addColumnIfMissing('due_date', 'TEXT');
  await addColumnIfMissing('payment_mode', 'TEXT', "'Cash'");
  await addColumnIfMissing('payment_status', 'TEXT', "'Pending'");
  await addColumnIfMissing('reference_no', 'TEXT');
  await addColumnIfMissing('remarks', 'TEXT');
  await addColumnIfMissing('is_overdue', 'INTEGER', '0');
  await addColumnIfMissing('overdue_days', 'INTEGER', '0');
  
  // Legacy fields for backward compatibility
  await addColumnIfMissing('invoiceId', 'INTEGER');
  await addColumnIfMissing('clientId', 'INTEGER');
  await addColumnIfMissing('status', 'TEXT');
  await addColumnIfMissing('balanceAmount', 'REAL');
  await addColumnIfMissing('totalAmount', 'REAL');
  await addColumnIfMissing('paidAmount', 'REAL');
}

// Helper: ensure invoice columns exist
async function ensureInvoiceColumns() {
  const cols = await sequelize.query("PRAGMA table_info(invoices);", { type: sequelize.QueryTypes.SELECT });
  const names = cols.map((c) => c.name);
  const addColumnIfMissing = async (name, type, defaultVal = null) => {
    if (!names.includes(name)) {
      let sql = `ALTER TABLE invoices ADD COLUMN ${name} ${type}`;
      if (defaultVal !== null) sql += ` DEFAULT ${defaultVal}`;
      await sequelize.query(sql);
      console.log(`✅ Added missing column invoices.${name}`);
    }
  };

  await addColumnIfMissing('invoice_number', 'TEXT');
  await addColumnIfMissing('vehicle_id', 'INTEGER');
  await addColumnIfMissing('due_date', 'TEXT');
  await addColumnIfMissing('notes', 'TEXT');
}

// Helper: ensure client columns exist (status, billing_address)
async function ensureClientColumns() {
  try {
    const cols = await sequelize.query("PRAGMA table_info(clients);", { type: sequelize.QueryTypes.SELECT });
    const names = cols.map((c) => c.name);
    const addColumnIfMissing = async (name, type, defaultVal = null) => {
      if (!names.includes(name)) {
        let sql = `ALTER TABLE clients ADD COLUMN ${name} ${type}`;
        if (defaultVal !== null) sql += ` DEFAULT ${defaultVal}`;
        await sequelize.query(sql);
        console.log(`✅ Added missing column clients.${name}`);
      }
    };

    await addColumnIfMissing('billing_address', 'TEXT');
    await addColumnIfMissing('status', 'TEXT', "'Active'");
  } catch (err) {
    console.error('Error ensuring client columns:', err);
  }
}

// Helper: ensure vehicle columns exist (status)
async function ensureVehicleColumns() {
  try {
    const cols = await sequelize.query("PRAGMA table_info(vehicles);", { type: sequelize.QueryTypes.SELECT });
    const names = cols.map((c) => c.name);
    const addColumnIfMissing = async (name, type, defaultVal = null) => {
      if (!names.includes(name)) {
        let sql = `ALTER TABLE vehicles ADD COLUMN ${name} ${type}`;
        if (defaultVal !== null) sql += ` DEFAULT ${defaultVal}`;
        await sequelize.query(sql);
        console.log(`✅ Added missing column vehicles.${name}`);
      }
    };

    await addColumnIfMissing('status', 'TEXT', "'Active'");
  } catch (err) {
    console.error('Error ensuring vehicle columns:', err);
  }
}

// Helper: ensure trip columns exist (invoice_id, is_invoiced)
async function ensureTripColumns() {
  try {
    const cols = await sequelize.query("PRAGMA table_info(Trips);", { type: sequelize.QueryTypes.SELECT });
    const names = cols.map((c) => c.name);
    const addColumnIfMissing = async (name, type, defaultVal = null) => {
      if (!names.includes(name)) {
        let sql = `ALTER TABLE Trips ADD COLUMN ${name} ${type}`;
        if (defaultVal !== null) sql += ` DEFAULT ${defaultVal}`;
        await sequelize.query(sql);
        console.log(`✅ Added missing column Trips.${name}`);
      }
    };

    await addColumnIfMissing('invoice_id', 'INTEGER');
    await addColumnIfMissing('is_invoiced', 'INTEGER', '0');
  } catch (err) {
    console.error('Error ensuring trip columns:', err);
  }
}

// Helper: ensure payment_transactions table exists
async function ensurePaymentTransactionsTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        invoice_id INTEGER,
        transaction_type TEXT DEFAULT 'payment',
        amount REAL NOT NULL,
        balance_before REAL DEFAULT 0,
        balance_after REAL DEFAULT 0,
        payment_mode TEXT DEFAULT 'Cash',
        reference_no TEXT,
        remarks TEXT,
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES payments(payment_id),
        FOREIGN KEY (client_id) REFERENCES clients(client_id),
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id)
      );
    `);
    console.log('✅ payment_transactions table ready.');
  } catch (err) {
    console.error('Error creating payment_transactions table:', err);
  }
}

// Sequelize DB sync and server start
(async () => {
  try {
    await sequelize.authenticate();
    console.log('🔗 Database connection established successfully.');

    // Clean up any leftover backup tables that could cause issues
    try {
      await sequelize.query('DROP TABLE IF EXISTS clients_backup;');
      await sequelize.query('DROP TABLE IF EXISTS payments_backup;');
      await sequelize.query('DROP TABLE IF EXISTS invoices_backup;');
    } catch (e) {
      // Ignore errors from cleanup
    }

    await ensurePaymentColumns();
    await ensureInvoiceColumns();
    await ensureClientColumns();
    await ensureVehicleColumns();
    await ensureTripColumns();
    await ensurePaymentTransactionsTable();
    await sequelize.sync();
    console.log('✅ Database synced successfully.');

    startLicenseAlertJob();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Database connection or sync failed:', err);
    process.exit(1);
  }
})();
