/**
 * Test Script for Available Dates API
 * 
 * This script tests the getBillDatesForClient endpoint
 * to verify it's correctly fetching invoice dates
 */

import db from "./models/index.js";
import { Op, fn, col } from "sequelize";

const { Client, Invoice } = db;

async function testAvailableDates() {
  try {
    console.log("\n=== Testing Available Dates API ===\n");

    // 1. Get all clients
    const clients = await Client.findAll({
      attributes: ["client_id", "client_name"],
      order: [["client_name", "ASC"]],
    });

    console.log(`Found ${clients.length} clients in database`);

    if (clients.length === 0) {
      console.log("\n⚠️  No clients found. Please add some test data first.");
      process.exit(0);
    }

    // 2. Test with first client
    const testClient = clients[0];
    console.log(`\nTesting with client: ${testClient.client_name} (ID: ${testClient.client_id})`);

    // 3. Get all invoices for this client
    const allInvoices = await Invoice.findAll({
      where: { client_id: testClient.client_id },
      attributes: ["invoice_id", "invoice_number", "date", "payment_status", "total_amount", "amount_paid"],
      order: [["date", "DESC"]],
    });

    console.log(`\nTotal invoices for this client: ${allInvoices.length}`);
    allInvoices.forEach(inv => {
      console.log(`  - Invoice ${inv.invoice_number}: ${inv.date} (Status: ${inv.payment_status}, Amount: ${inv.total_amount})`);
    });

    // 4. Get invoice dates with the NEW logic (Pending, Partial, Unpaid only)
    const invoiceDates = await Invoice.findAll({
      where: { 
        client_id: testClient.client_id,
        payment_status: {
          [Op.in]: ['Pending', 'Partial', 'Unpaid']
        }
      },
      attributes: [[fn('DISTINCT', col('date')), 'date']],
      order: [['date', 'DESC']],
      raw: true
    });

    console.log(`\nFiltered invoice dates (Pending/Partial/Unpaid): ${invoiceDates.length}`);
    invoiceDates.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.date}`);
    });

    // 5. Test with ALL clients
    console.log("\n\n=== Testing with all clients ===\n");
    for (const client of clients) {
      const dates = await Invoice.findAll({
        where: { 
          client_id: client.client_id,
          payment_status: {
            [Op.in]: ['Pending', 'Partial', 'Unpaid']
          }
        },
        attributes: [[fn('DISTINCT', col('date')), 'date']],
        order: [['date', 'DESC']],
        raw: true
      });

      console.log(`${client.client_name} (${client.client_id}): ${dates.length} available dates`);
      if (dates.length > 0) {
        console.log(`  Dates: ${dates.map(d => d.date).join(", ")}`);
      }
    }

    console.log("\n✅ Test completed successfully!\n");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error during test:", error);
    process.exit(1);
  }
}

// Run the test
testAvailableDates();
