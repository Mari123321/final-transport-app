import db from '../models/index.js';

const { sequelize, Client, Driver, Vehicle, Trip, Invoice, Expense, Payment, PaymentTransaction, Dispatch, ExtraCharge } = db;

/**
 * Generate demo data for testing - creates exactly 10 records for each entity
 */
export const generateDemoData = async (req, res) => {
  let transaction;
  try {
    console.log('🔄 Starting demo data generation...');

    // CRITICAL: Disable foreign key constraints BEFORE creating transaction
    // SQLite foreign key pragmas don't work inside transactions
    await sequelize.query('PRAGMA foreign_keys = OFF');

    // Use a single transaction so we don't leave partial data on failure
    transaction = await sequelize.transaction();

    // Clean previous demo data first to avoid unique key clashes
    console.log('🧹 Clearing existing demo data...');
    
    // Delete all tables - order matters for cascading deletes
    // Delete dependent tables first
    await PaymentTransaction.destroy({ where: {}, transaction });
    await Payment.destroy({ where: {}, transaction });
    await ExtraCharge.destroy({ where: {}, transaction });
    await Dispatch.destroy({ where: {}, transaction });
    
    // Delete main tables
    await Trip.destroy({ where: {}, transaction });
    await Invoice.destroy({ where: {}, transaction });
    await Expense.destroy({ where: {}, transaction });
    await Vehicle.destroy({ where: {}, transaction });
    await Driver.destroy({ where: {}, transaction });
    await Client.destroy({ where: {}, transaction });
    
    console.log('✅ Existing demo data cleared');

    // Ensure generated values stay unique across repeated runs
    const seed = Date.now().toString().slice(-6);

    // Demo Clients - EXACTLY 10
    const clients = [];
    for (let i = 1; i <= 10; i++) {
      clients.push({
        client_name: `Client ${i} Logistics`,
        client_address: `${i}23 Business Street, Chennai`,
        client_city: 'Chennai',
        client_state: 'Tamil Nadu',
        client_phone: `98${i}00${i}0000`,
        client_email: `client${i}@example.com`,
        client_gst: `33AAAAA${i}${i}${i}${i}Z1Z5`,
        client_pan: `AAAAA${i}${i}${i}${i}A`,
        client_type: i % 2 === 0 ? 'Corporate' : 'Individual'
      });
    }
    console.log('📦 Creating 10 clients...');
    const createdClients = await Client.bulkCreate(clients, { validate: true, transaction });
    console.log(`✅ Created ${createdClients.length} clients`);

    // Demo Drivers - EXACTLY 10
    const drivers = [];
    const driverNames = ['Rajesh Kumar', 'Vijay Singh', 'Suresh Babu', 'Ravi Kumar', 'Karthik Raja', 
                         'Murali Krishnan', 'Prakash Kumar', 'Ganesh Babu', 'Kumar Swamy', 'Dinesh Kumar'];
    for (let i = 1; i <= 10; i++) {
      drivers.push({
        name: driverNames[i - 1],
        phone: `99${i}00${i}0000`,
        license_number: `TN${String(i).padStart(2, '0')}${seed}`,
        license_expiry_date: new Date(2026, 11, 31),
        address: `${i}45 Driver Colony, Chennai`,
        date_of_birth: new Date(1985 + i, i % 12, i),
        blood_group: ['A+', 'B+', 'O+', 'AB+'][i % 4],
        emergency_contact: `98765432${i}0`,
        aadhaar_no: `${i}234${i}678${i}012${i}`,
        status: 'active'
      });
    }
    console.log('🚗 Creating 10 drivers...');
    const createdDrivers = await Driver.bulkCreate(drivers, { validate: true, transaction });
    console.log(`✅ Created ${createdDrivers.length} drivers`);

    // Demo Vehicles - EXACTLY 10
    const vehicles = [];
    for (let i = 1; i <= 10; i++) {
      const driverId = createdDrivers[i - 1]?.id; // driver primary key is `id`
      const clientId = createdClients[i - 1]?.client_id;

      vehicles.push({
        vehicle_number: `TN${String(i).padStart(2, '0')}AB${seed.slice(-4)}${i}`,
        permit_number: `PER${seed}${i}`,
        rc_status: 'Current',
        rc_book_number: `RCB${i}234567${i}`,
        rc_expiry_date: new Date(2027, 11, 31),
        driver_id: driverId,
        client_id: clientId
      });
    }
    console.log('🚛 Creating 10 vehicles...');
    const createdVehicles = await Vehicle.bulkCreate(vehicles, { validate: true, transaction });
    console.log(`✅ Created ${createdVehicles.length} vehicles`);

    // Demo Trips - EXACTLY 10
    const trips = [];
    const routes = [
      { from: 'Chennai', to: 'Bangalore' },
      { from: 'Chennai', to: 'Coimbatore' },
      { from: 'Chennai', to: 'Madurai' },
      { from: 'Chennai', to: 'Salem' },
      { from: 'Bangalore', to: 'Chennai' },
      { from: 'Coimbatore', to: 'Chennai' },
      { from: 'Madurai', to: 'Chennai' },
      { from: 'Salem', to: 'Chennai' },
      { from: 'Chennai', to: 'Trichy' },
      { from: 'Trichy', to: 'Chennai' }
    ];

    for (let i = 1; i <= 10; i++) {
      const route = routes[i - 1];
      const minQty = 10 + i;
      const actQty = 12 + i;
      const rate = 500 + (i * 50);
      const amount = actQty * rate;
      
      const driverId = createdDrivers[i - 1]?.id;
      const clientId = createdClients[i - 1]?.client_id;
      const vehicleId = createdVehicles[i - 1]?.vehicle_id;

      trips.push({
        client_id: createdClients[i - 1].client_id,
        driver_id: driverId,
        vehicle_id: vehicleId,
        date: new Date(2026, 0, i),
        dispatch_date: new Date(2026, 0, i).toISOString().split('T')[0],
        from_place: route.from,
        to_place: route.to,
        minimum_quantity: minQty,
        actual_quantity: actQty,
        rate_per_tonne: rate,
        diesel_litre: 50 + i,
        diesel_payment: (50 + i) * 95,
        amount: amount,
        amount_paid: amount / 2,
        pending_amount: amount / 2,
        payment_mode: ['Cash', 'UPI', 'Cheque'][i % 3],
        status: ['Pending', 'Running', 'Completed'][i % 3]
      });
    }
    console.log('🚚 Creating 10 trips...');
    const createdTrips = await Trip.bulkCreate(trips, { validate: true, transaction });
    console.log(`✅ Created ${createdTrips.length} trips`);

    // Demo Expenses - 5 records
    const expenses = [];
    const categories = ['Fuel', 'Maintenance', 'Toll', 'Salary', 'Other'];
    for (let i = 1; i <= 5; i++) {
      expenses.push({
        date: new Date(2026, 0, i * 2),
        category: categories[i - 1],
        amount: 1000 + (i * 500),
        description: `Demo expense ${i} - ${categories[i - 1]}`,
        payment_mode: ['Cash', 'UPI', 'Cheque'][i % 3]
      });
    }
    console.log('💰 Creating 5 expenses...');
    const createdExpenses = await Expense.bulkCreate(expenses, { validate: true, transaction });
    console.log(`✅ Created ${createdExpenses.length} expenses`);

    await transaction.commit();
    console.log('✅ Demo data generation completed successfully!');

    // Re-enable foreign key constraints after transaction
    await sequelize.query('PRAGMA foreign_keys = ON');

    res.status(201).json({
      success: true,
      message: 'Demo data generated successfully',
      data: {
        clients: createdClients.length,
        drivers: createdDrivers.length,
        vehicles: createdVehicles.length,
        trips: createdTrips.length,
        expenses: createdExpenses.length,
        total: createdClients.length + createdDrivers.length + createdVehicles.length + createdTrips.length + createdExpenses.length
      }
    });
  } catch (error) {
    console.error('❌ Error generating demo data:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('❌ Failed to rollback transaction:', rollbackError);
      }
    }
    
    // Always try to re-enable foreign keys on error
    try {
      await sequelize.query('PRAGMA foreign_keys = ON');
    } catch (fkError) {
      console.error('Failed to re-enable foreign keys:', fkError);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate demo data',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Clear all demo data - CASCADE DELETE
 */
export const clearDemoData = async (req, res) => {
  try {
    console.log('🗑️ Starting data cleanup...');
    
    // Disable foreign key constraints for SQLite to allow deletion
    await sequelize.query('PRAGMA foreign_keys = OFF');
    
    // Delete all tables - order matters
    const ptCount = await PaymentTransaction.destroy({ where: {} });
    const paymentCount = await Payment.destroy({ where: {} });
    const extraChargeCount = await ExtraCharge.destroy({ where: {} });
    const dispatchCount = await Dispatch.destroy({ where: {} });
    
    const tripCount = await Trip.destroy({ where: {} });
    const invoiceCount = await Invoice.destroy({ where: {} });
    const expenseCount = await Expense.destroy({ where: {} });
    const vehicleCount = await Vehicle.destroy({ where: {} });
    const driverCount = await Driver.destroy({ where: {} });
    const clientCount = await Client.destroy({ where: {} });

    // Re-enable foreign key constraints
    await sequelize.query('PRAGMA foreign_keys = ON');
    
    console.log('✅ Data cleanup completed successfully!');

    res.json({
      success: true,
      message: 'All data cleared successfully',
      deleted: {
        paymentTransactions: ptCount,
        payments: paymentCount,
        extraCharges: extraChargeCount,
        dispatches: dispatchCount,
        trips: tripCount,
        invoices: invoiceCount,
        expenses: expenseCount,
        vehicles: vehicleCount,
        drivers: driverCount,
        clients: clientCount,
        total: ptCount + paymentCount + extraChargeCount + dispatchCount + tripCount + invoiceCount + expenseCount + vehicleCount + driverCount + clientCount
      }
    });
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    // Try to re-enable foreign keys even on error
    try {
      await sequelize.query('PRAGMA foreign_keys = ON');
    } catch (e) {
      console.error('Failed to re-enable foreign keys:', e);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to clear data',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};