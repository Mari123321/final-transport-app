/**
 * Migration Script: Add invoice_number field to invoices table
 * 
 * This script:
 * 1. Adds invoice_number column to invoices table
 * 2. Generates invoice numbers for existing invoices
 * 3. Adds unique constraint
 * 
 * Run with: node migrations/add-invoice-number.js
 */

import db from '../models/index.js';
import { Op } from 'sequelize';

const { Invoice, sequelize } = db;

/**
 * Generate invoice number in format: PREFIX-XXX
 */
function generateInvoiceNumber(index, prefix = 'IN') {
  const paddedNumber = String(index).padStart(3, '0');
  return `${prefix}-${paddedNumber}`;
}

async function migrate() {
  console.log('🚀 Starting invoice_number migration...\n');

  try {
    // Step 1: Check if column exists
    const tableDescription = await sequelize.getQueryInterface().describeTable('invoices');
    
    if (tableDescription.invoice_number) {
      console.log('✅ invoice_number column already exists');
    } else {
      console.log('📝 Adding invoice_number column...');
      await sequelize.getQueryInterface().addColumn('invoices', 'invoice_number', {
        type: sequelize.Sequelize.STRING,
        allowNull: true, // Allow null temporarily during migration
      });
      console.log('✅ invoice_number column added');
    }

    // Step 2: Fetch all invoices that don't have invoice_number
    const invoicesWithoutNumber = await Invoice.findAll({
      where: {
        [Op.or]: [
          { invoice_number: null },
          { invoice_number: '' }
        ]
      },
      order: [['invoice_id', 'ASC']]
    });

    if (invoicesWithoutNumber.length === 0) {
      console.log('✅ All invoices already have invoice numbers\n');
      return;
    }

    console.log(`📋 Found ${invoicesWithoutNumber.length} invoices without invoice numbers`);
    console.log('🔢 Generating invoice numbers...\n');

    // Step 3: Generate and assign invoice numbers
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < invoicesWithoutNumber.length; i++) {
      const invoice = invoicesWithoutNumber[i];
      const invoiceNumber = generateInvoiceNumber(i + 1, 'IN');

      try {
        await invoice.update({ invoice_number: invoiceNumber });
        successCount++;
        console.log(`  ✓ Invoice #${invoice.invoice_id} → ${invoiceNumber}`);
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Failed to update invoice #${invoice.invoice_id}:`, error.message);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    // Step 4: Add unique constraint and NOT NULL constraint
    if (errorCount === 0) {
      console.log('\n🔒 Adding unique constraint...');
      
      try {
        // First, ensure no null values remain
        const nullCount = await Invoice.count({
          where: {
            [Op.or]: [
              { invoice_number: null },
              { invoice_number: '' }
            ]
          }
        });

        if (nullCount === 0) {
          // Change column to NOT NULL and add unique constraint
          await sequelize.getQueryInterface().changeColumn('invoices', 'invoice_number', {
            type: sequelize.Sequelize.STRING,
            allowNull: false,
            unique: true,
          });
          console.log('✅ Unique constraint added successfully');
        } else {
          console.log(`⚠️  Cannot add constraint: ${nullCount} invoices still have null invoice_number`);
        }
      } catch (error) {
        console.error('⚠️  Could not add unique constraint:', error.message);
        console.log('   You may need to add it manually via SQL');
      }
    }

    console.log('\n🎉 Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('✅ All done! You can now restart your server.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration error:', error);
    process.exit(1);
  });
