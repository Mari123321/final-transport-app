/**
 * Smart Payment Controller - Production Grade
 * 
 * CORE FEATURES:
 * - Client-driven date filtering (NO manual date entry)
 * - Automatic payment status calculation
 * - Partial payment with balance tracking
 * - Transaction audit history
 * - Invoice synchronization
 * 
 * BUSINESS RULES:
 * - Payment status is ALWAYS computed from amounts (never manual)
 * - All filtering happens in database queries
 * - Balance calculations are backend-enforced
 * - Every payment creates a transaction record
 */

import db from "../models/index.js";
import { Op, fn, col, literal } from "sequelize";

const { Client, Payment, Invoice, PaymentTransaction, Trip, sequelize } = db;

// ============================================================
// GET ALL CLIENTS - For dropdown selection
// ============================================================
export const getClientsForPayment = async (req, res) => {
  try {
    const clients = await Client.findAll({
      attributes: ["client_id", "client_name", "client_phone", "client_email"],
      order: [["client_name", "ASC"]],
    });

    res.json({
      success: true,
      data: clients.map(c => ({
        id: c.client_id,
        name: c.client_name,
        phone: c.client_phone,
        email: c.client_email,
      }))
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch clients",
      detail: error.message
    });
  }
};

// ============================================================
// GET BILL DATES FOR CLIENT - Dynamic date dropdown
// This is the CRITICAL endpoint for smart filtering
// User selects client → dates auto-populate
// ============================================================
export const getBillDatesForClient = async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: "Client ID is required",
        detail: "Please select a client first"
      });
    }

    // PRODUCTION FIX: Fetch dates from INVOICES only (not payments)
    // Include invoices with status: Pending, Partial, Unpaid, Overdue
    // Exclude fully Paid invoices
    const invoiceDates = await Invoice.findAll({
      where: { 
        client_id: clientId,
        payment_status: {
          [Op.in]: ['Pending', 'Partial', 'Unpaid']
        }
      },
      attributes: [[fn('DISTINCT', col('date')), 'date']],
      order: [['date', 'DESC']],
      raw: true
    });

    // Convert to sorted array (newest first)
    const sortedDates = invoiceDates
      .filter(d => d.date)
      .map(d => d.date)
      .sort((a, b) => new Date(b) - new Date(a));

    const formattedDates = sortedDates.map(date => ({
      iso: date,
      display: formatDateForDisplay(date)
    }));

    res.json({
      success: true,
      data: formattedDates,
      count: formattedDates.length
    });
  } catch (error) {
    console.error("Error fetching bill dates:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch bill dates",
      detail: error.message
    });
  }
};

// ============================================================
// GET FILTERED PAYMENTS - Client + Date filtered
// ============================================================
export const getFilteredPayments = async (req, res) => {
  try {
    const {
      clientId,
      billDate,
      status,
      paymentMode,
      page = 1,
      limit = 50,
      sortBy = 'bill_date',
      sortOrder = 'DESC'
    } = req.query;

    // Build WHERE clause
    const where = {};

    if (clientId) where.client_id = clientId;
    if (billDate) where.bill_date = billDate;
    if (status) where.payment_status = status;
    if (paymentMode) where.payment_mode = paymentMode;

    // Add overdue check - update is_overdue flag for all pending payments
    await updateOverdueStatus();

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch payments with associations
    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Client,
          as: "client",
          attributes: ["client_id", "client_name", "client_phone", "client_email"]
        },
        {
          model: Invoice,
          as: "invoice",
          attributes: ["invoice_id", "invoice_number", "total_amount", "amount_paid", "payment_status", "date"],
          required: false
        }
      ],
      order: [[sortBy, sortOrder], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    // Transform data for frontend
    const result = payments.map((payment) => ({
      paymentId: payment.payment_id,
      receiptNumber: payment.receipt_number,
      clientId: payment.client_id,
      clientName: payment.client?.client_name || "Unknown",
      clientPhone: payment.client?.client_phone || "",
      clientEmail: payment.client?.client_email || "",
      invoiceId: payment.invoice_id,
      invoiceNumber: payment.invoice?.invoice_number || "",
      totalAmount: parseFloat(payment.total_amount) || 0,
      paidAmount: parseFloat(payment.paid_amount) || 0,
      balanceAmount: parseFloat(payment.balance_amount) || 0,
      billDate: payment.bill_date,
      paymentDate: payment.payment_date,
      dueDate: payment.due_date,
      paymentMode: payment.payment_mode,
      paymentStatus: payment.payment_status,
      referenceNo: payment.reference_no,
      remarks: payment.remarks,
      isOverdue: payment.is_overdue,
      overdueDays: payment.overdue_days,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    res.json({
      success: true,
      data: result,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error getting filtered payments:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: "Database query failed while fetching payments"
    });
  }
};

// ============================================================
// GET PAYMENT SUMMARY - For filtered results
// ============================================================
export const getFilteredPaymentSummary = async (req, res) => {
  try {
    const { clientId, billDate, status, paymentMode } = req.query;

    // Build WHERE clause
    const where = {};
    if (clientId) where.client_id = clientId;
    if (billDate) where.bill_date = billDate;
    if (status) where.payment_status = status;
    if (paymentMode) where.payment_mode = paymentMode;

    // Aggregate query
    const summary = await Payment.findAll({
      where,
      attributes: [
        [fn('COUNT', col('payment_id')), 'count'],
        [fn('SUM', col('total_amount')), 'totalBilled'],
        [fn('SUM', col('paid_amount')), 'totalReceived'],
        [fn('SUM', col('balance_amount')), 'totalPending'],
      ],
      raw: true
    });

    // Get overdue data
    const overdueWhere = { ...where, is_overdue: true };
    const overdueData = await Payment.findAll({
      where: overdueWhere,
      attributes: [
        [fn('COUNT', col('payment_id')), 'overdueCount'],
        [fn('SUM', col('balance_amount')), 'overdueAmount'],
      ],
      raw: true
    });

    // Get status breakdown
    const statusBreakdown = await Payment.findAll({
      where,
      attributes: [
        'payment_status',
        [fn('COUNT', col('payment_id')), 'count'],
        [fn('SUM', col('total_amount')), 'amount']
      ],
      group: ['payment_status'],
      raw: true
    });

    const totalBilled = parseFloat(summary[0]?.totalBilled) || 0;
    const totalReceived = parseFloat(summary[0]?.totalReceived) || 0;
    const totalPending = parseFloat(summary[0]?.totalPending) || 0;
    const collectionRate = totalBilled > 0 ? ((totalReceived / totalBilled) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        count: parseInt(summary[0]?.count) || 0,
        totalBilled,
        totalReceived,
        totalPending,
        collectionRate: parseFloat(collectionRate),
        overdueCount: parseInt(overdueData[0]?.overdueCount) || 0,
        overdueAmount: parseFloat(overdueData[0]?.overdueAmount) || 0,
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item.payment_status] = {
            count: parseInt(item.count),
            amount: parseFloat(item.amount) || 0
          };
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error("Error getting payment summary:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: "Failed to calculate payment summary"
    });
  }
};

// ============================================================
// ADD PARTIAL PAYMENT - CRITICAL for balance calculation
// ============================================================
export const addSmartPartialPayment = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { amount, paymentMode, referenceNo, remarks } = req.body;

    // Validate amount
    if (!amount || Number(amount) <= 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Payment amount must be greater than 0",
        field: "amount"
      });
    }

    // Fetch payment
    const payment = await Payment.findByPk(id, {
      include: [
        { model: Client, as: "client", attributes: ["client_id", "client_name"] },
        { model: Invoice, as: "invoice", attributes: ["invoice_id", "invoice_number"], required: false }
      ],
      transaction: t
    });

    if (!payment) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: "Payment record not found"
      });
    }

    const paymentAmount = Number(amount);
    const currentBalance = parseFloat(payment.balance_amount);
    const currentPaid = parseFloat(payment.paid_amount);
    const totalAmount = parseFloat(payment.total_amount);

    // Validate amount doesn't exceed balance
    if (paymentAmount > currentBalance) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Payment exceeds pending balance",
        detail: `Maximum payable amount is ₹${currentBalance.toFixed(2)}`,
        maxPayable: currentBalance
      });
    }

    // Calculate new amounts
    const newPaidAmount = currentPaid + paymentAmount;
    const newBalanceAmount = totalAmount - newPaidAmount;

    // Auto-calculate status (NEVER from UI)
    let newStatus = 'Pending';
    if (newBalanceAmount <= 0) {
      newStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'Partial';
    }

    // Create transaction record BEFORE updating payment
    await PaymentTransaction.create({
      payment_id: payment.payment_id,
      client_id: payment.client_id,
      invoice_id: payment.invoice_id,
      transaction_type: 'payment',
      amount: paymentAmount,
      balance_before: currentBalance,
      balance_after: newBalanceAmount,
      payment_mode: paymentMode || 'Cash',
      reference_no: referenceNo || null,
      remarks: remarks || `Partial payment of ₹${paymentAmount.toFixed(2)}`,
      transaction_date: new Date(),
    }, { transaction: t });

    // Update payment record
    await payment.update({
      paid_amount: newPaidAmount,
      balance_amount: newBalanceAmount,
      payment_status: newStatus,
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: paymentMode || payment.payment_mode,
      reference_no: referenceNo || payment.reference_no,
      remarks: remarks 
        ? `${payment.remarks || ''}\n[${new Date().toLocaleDateString()}] ${remarks}`.trim() 
        : payment.remarks,
      is_overdue: newStatus === 'Paid' ? false : payment.is_overdue,
    }, { transaction: t });

    // Update linked invoice if exists
    if (payment.invoice_id) {
      await updateInvoicePaymentStatus(payment.invoice_id, t);
    }

    await t.commit();

    // Fetch updated payment for response
    const updatedPayment = await Payment.findByPk(id, {
      include: [
        { model: Client, as: "client", attributes: ["client_id", "client_name"] },
        { model: Invoice, as: "invoice", attributes: ["invoice_id", "invoice_number"], required: false }
      ]
    });

    res.json({
      success: true,
      message: `Payment of ₹${paymentAmount.toFixed(2)} recorded successfully`,
      data: {
        paymentId: updatedPayment.payment_id,
        receiptNumber: updatedPayment.receipt_number,
        clientName: updatedPayment.client?.client_name,
        invoiceNumber: updatedPayment.invoice?.invoice_number,
        totalAmount: parseFloat(updatedPayment.total_amount),
        paidAmount: parseFloat(updatedPayment.paid_amount),
        balanceAmount: parseFloat(updatedPayment.balance_amount),
        paymentStatus: updatedPayment.payment_status,
        paymentMode: updatedPayment.payment_mode,
        previousBalance: currentBalance,
        amountPaid: paymentAmount,
        newBalance: newBalanceAmount,
      }
    });
  } catch (error) {
    await t.rollback();
    console.error("Error adding partial payment:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: "Failed to record partial payment"
    });
  }
};

// ============================================================
// GET PAYMENT TRANSACTION HISTORY
// ============================================================
export const getPaymentTransactions = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const transactions = await PaymentTransaction.findAll({
      where: { payment_id: paymentId },
      include: [
        { model: Client, as: "client", attributes: ["client_id", "client_name"] }
      ],
      order: [['transaction_date', 'DESC']],
    });

    res.json({
      success: true,
      data: transactions.map(t => ({
        transactionId: t.transaction_id,
        paymentId: t.payment_id,
        clientName: t.client?.client_name,
        transactionType: t.transaction_type,
        amount: parseFloat(t.amount),
        balanceBefore: parseFloat(t.balance_before),
        balanceAfter: parseFloat(t.balance_after),
        paymentMode: t.payment_mode,
        referenceNo: t.reference_no,
        remarks: t.remarks,
        transactionDate: t.transaction_date,
        createdAt: t.createdAt,
      }))
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: "Failed to fetch payment transactions"
    });
  }
};

// ============================================================
// CREATE PAYMENT FROM INVOICE
// ============================================================
export const createPaymentFromInvoice = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const {
      clientId,
      invoiceId,
      billDate,
      paidAmount = 0,
      dueDate,
      paymentMode = 'Cash',
      referenceNo,
      remarks,
    } = req.body;

    // Validation
    if (!clientId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Client is required",
        field: "clientId"
      });
    }

    if (!invoiceId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Invoice is required",
        field: "invoiceId"
      });
    }

    // Verify client exists
    const client = await Client.findByPk(clientId, { transaction: t });
    if (!client) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Invalid client",
        detail: `Client with ID ${clientId} does not exist`
      });
    }

    // Verify invoice exists and get total
    const invoice = await Invoice.findByPk(invoiceId, { transaction: t });
    if (!invoice) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Invalid invoice",
        detail: `Invoice with ID ${invoiceId} does not exist`
      });
    }

    const totalAmount = parseFloat(invoice.total_amount) || 0;
    const paid = Number(paidAmount) || 0;
    const balance = totalAmount - paid;
    const effectiveBillDate = billDate || invoice.date;

    // Create payment
    const newPayment = await Payment.create({
      client_id: clientId,
      invoice_id: invoiceId,
      total_amount: totalAmount,
      paid_amount: paid,
      balance_amount: balance,
      bill_date: effectiveBillDate,
      payment_date: paid > 0 ? new Date().toISOString().split('T')[0] : null,
      due_date: dueDate,
      payment_mode: paymentMode,
      reference_no: referenceNo,
      remarks,
    }, { transaction: t });

    // Create initial transaction record if there's an initial payment
    if (paid > 0) {
      await PaymentTransaction.create({
        payment_id: newPayment.payment_id,
        client_id: clientId,
        invoice_id: invoiceId,
        transaction_type: 'initial',
        amount: paid,
        balance_before: totalAmount,
        balance_after: balance,
        payment_mode: paymentMode,
        reference_no: referenceNo,
        remarks: remarks || `Initial payment of ₹${paid.toFixed(2)}`,
        transaction_date: new Date(),
      }, { transaction: t });
    }

    // Update invoice payment status
    await updateInvoicePaymentStatus(invoiceId, t);

    await t.commit();

    // Fetch full payment with associations
    const payment = await Payment.findByPk(newPayment.payment_id, {
      include: [
        { model: Client, as: "client", attributes: ["client_id", "client_name"] },
        { model: Invoice, as: "invoice", attributes: ["invoice_id", "invoice_number"] }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Payment record created successfully",
      data: {
        paymentId: payment.payment_id,
        receiptNumber: payment.receipt_number,
        clientName: payment.client?.client_name,
        invoiceNumber: payment.invoice?.invoice_number,
        totalAmount: parseFloat(payment.total_amount),
        paidAmount: parseFloat(payment.paid_amount),
        balanceAmount: parseFloat(payment.balance_amount),
        paymentStatus: payment.payment_status,
        billDate: payment.bill_date,
      }
    });
  } catch (error) {
    await t.rollback();
    console.error("Error creating payment:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: "Failed to create payment record"
    });
  }
};

// ============================================================
// GET INVOICES FOR CLIENT - For linking payments to invoices
// ============================================================
export const getInvoicesForClient = async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: "Client ID is required"
      });
    }

    const invoices = await Invoice.findAll({
      where: { client_id: clientId },
      attributes: [
        "invoice_id", 
        "invoice_number", 
        "total_amount", 
        "amount_paid", 
        "pending_amount",
        "payment_status", 
        "date"
      ],
      order: [["date", "DESC"]],
    });

    res.json({
      success: true,
      data: invoices.map(inv => ({
        id: inv.invoice_id,
        invoiceNumber: inv.invoice_number,
        totalAmount: parseFloat(inv.total_amount) || 0,
        amountPaid: parseFloat(inv.amount_paid) || 0,
        pendingAmount: parseFloat(inv.pending_amount) || (parseFloat(inv.total_amount) - parseFloat(inv.amount_paid)) || 0,
        status: inv.payment_status,
        date: inv.date,
        displayLabel: `${inv.invoice_number} - ₹${(parseFloat(inv.total_amount) || 0).toLocaleString()} (${inv.payment_status})`
      }))
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================================
// HELPER: Update Invoice Payment Status
// ============================================================
async function updateInvoicePaymentStatus(invoiceId, transaction = null) {
  try {
    const options = transaction ? { transaction } : {};
    
    const invoice = await Invoice.findByPk(invoiceId, options);
    if (!invoice) return;

    // Get all payments for this invoice
    const payments = await Payment.findAll({
      where: { invoice_id: invoiceId },
      attributes: [[fn('SUM', col('paid_amount')), 'totalPaid']],
      raw: true,
      ...options
    });

    const totalPaid = parseFloat(payments[0]?.totalPaid) || 0;
    const totalAmount = parseFloat(invoice.total_amount) || 0;

    let status = 'Unpaid';
    if (totalPaid >= totalAmount && totalAmount > 0) {
      status = 'Paid';
    } else if (totalPaid > 0) {
      status = 'Partial';
    }

    await invoice.update({
      amount_paid: totalPaid,
      pending_amount: totalAmount - totalPaid,
      payment_status: status
    }, options);
  } catch (error) {
    console.error("Error updating invoice status:", error);
  }
}

// ============================================================
// HELPER: Update Overdue Status
// ============================================================
async function updateOverdueStatus() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all payments that are overdue
    const overduePayments = await Payment.findAll({
      where: {
        due_date: { [Op.lt]: today },
        payment_status: { [Op.ne]: 'Paid' }
      }
    });

    // Update each overdue payment
    for (const payment of overduePayments) {
      const dueDate = new Date(payment.due_date);
      const overdueDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      
      if (!payment.is_overdue || payment.overdue_days !== overdueDays) {
        await payment.update({
          is_overdue: true,
          overdue_days: overdueDays
        });
      }
    }

    // Reset overdue flag for paid payments
    await Payment.update(
      { is_overdue: false, overdue_days: 0 },
      { where: { payment_status: 'Paid', is_overdue: true } }
    );
  } catch (error) {
    console.error("Error updating overdue status:", error);
  }
}

// ============================================================
// RECEIVE INVOICE FROM INVOICE CREATION MODULE
// Automatically adds invoice to Smart Payment system
// ============================================================
export const receiveInvoiceFromCreation = async (req, res) => {
  try {
    const {
      invoiceId,
      clientId,
      clientName,
      invoiceCreatedDate,
      invoiceAmount,
      invoiceStatus,
      sourceModule,
    } = req.body;

    // Validate required fields
    if (!invoiceId || !clientId || !invoiceCreatedDate || !invoiceAmount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        detail:
          "invoiceId, clientId, invoiceCreatedDate, and invoiceAmount are required",
      });
    }

    // Get the actual client details
    const client = await Client.findByPk(clientId, {
      attributes: ["client_id", "client_name"],
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: "Client not found",
        detail: `Client with ID ${clientId} does not exist`,
      });
    }

    // Verify invoice exists in the system
    const invoice = await Invoice.findByPk(invoiceId, {
      attributes: [
        "invoice_id",
        "client_id",
        "total_amount",
        "amount_paid",
        "pending_amount",
        "payment_status",
        "date",
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found in system",
        detail: `Invoice with ID ${invoiceId} does not exist`,
      });
    }

    // Verify invoice belongs to the same client
    if (invoice.client_id !== clientId) {
      return res.status(400).json({
        success: false,
        error: "Client mismatch",
        detail: `Invoice ${invoiceId} does not belong to client ${clientId}`,
      });
    }

    // Log invoice creation event (for audit trail)
    console.log(
      `✅ Invoice ${invoiceId} received from ${sourceModule} for client ${client.client_name}`
    );

    // Response indicating invoice is now available in Smart Payment
    res.json({
      success: true,
      message: `Invoice ${invoiceId} successfully loaded in Smart Payment system`,
      data: {
        invoiceId: invoice.invoice_id,
        clientId: client.client_id,
        clientName: client.client_name,
        invoiceCreatedDate: invoice.date,
        totalAmount: invoice.total_amount,
        paidAmount: invoice.amount_paid,
        pendingAmount: invoice.pending_amount,
        paymentStatus: invoice.payment_status,
        sourceModule,
        timestamp: new Date().toISOString(),
      },
      note: "Invoice is now available under 'Invoices created by requesting client' in Smart Payments",
    });
  } catch (error) {
    console.error("Error receiving invoice from creation module:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process invoice",
      detail: error.message,
    });
  }
};

// ============================================================
// CREATE PAYMENT FOR TRIP - Direct trip payment with validation
// ============================================================
export const createTripPayment = async (req, res) => {
  // STEP 1: LOG REQUEST BODY FOR DEBUGGING
  console.log('\n=== CREATE TRIP PAYMENT REQUEST ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('Request Headers:', req.headers);
  
  const t = await sequelize.transaction();
  
  try {
    const { 
      trip_id, 
      tripId,
      client_id,
      clientId, 
      amount, 
      payment_mode, 
      paymentMode,
      payment_date,
      paymentDate,
      remarks 
    } = req.body;

    // Normalize field names (handle both snake_case and camelCase)
    const effectiveTripId = trip_id || tripId;
    const effectiveClientId = client_id || clientId;
    const effectivePaymentMode = payment_mode || paymentMode || 'CASH';
    const effectivePaymentDate = payment_date || paymentDate || new Date().toISOString().split('T')[0];

    console.log('\nNormalized values:');
    console.log('- Trip ID:', effectiveTripId);
    console.log('- Client ID:', effectiveClientId);
    console.log('- Amount:', amount, typeof amount);
    console.log('- Payment Mode:', effectivePaymentMode);
    console.log('- Payment Date:', effectivePaymentDate);

    // STEP 2: COMPREHENSIVE VALIDATION
    const validationErrors = [];

    if (!effectiveTripId) {
      validationErrors.push({ field: 'trip_id', message: 'Trip ID is required' });
    }

    if (!effectiveClientId) {
      validationErrors.push({ field: 'client_id', message: 'Client ID is required' });
    }

    if (!amount) {
      validationErrors.push({ field: 'amount', message: 'Payment amount is required' });
    } else if (isNaN(Number(amount))) {
      validationErrors.push({ field: 'amount', message: 'Amount must be a valid number' });
    } else if (Number(amount) <= 0) {
      validationErrors.push({ field: 'amount', message: 'Amount must be greater than 0' });
    }

    const validPaymentModes = ['CASH', 'CHEQUE', 'BANK', 'UPI'];
    if (!validPaymentModes.includes(effectivePaymentMode.toUpperCase())) {
      validationErrors.push({ 
        field: 'payment_mode', 
        message: `Payment mode must be one of: ${validPaymentModes.join(', ')}`,
        received: effectivePaymentMode
      });
    }

    if (validationErrors.length > 0) {
      console.log('\n❌ VALIDATION FAILED:');
      console.log(JSON.stringify(validationErrors, null, 2));
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validationErrors,
        detail: validationErrors.map(e => `${e.field}: ${e.message}`).join('; ')
      });
    }

    // STEP 3: FETCH TRIP WITH FULL DETAILS
    const trip = await Trip.findByPk(effectiveTripId, {
      include: [
        { model: Client, as: 'client', attributes: ['client_id', 'client_name'] }
      ],
      transaction: t
    });

    if (!trip) {
      console.log(`\n❌ Trip not found: ${effectiveTripId}`);
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Trip not found',
        detail: `Trip with ID ${effectiveTripId} does not exist`,
        field: 'trip_id'
      });
    }

    console.log('\n✅ Trip found:');
    console.log('- Trip ID:', trip.trip_id);
    console.log('- Client:', trip.client?.client_name);
    console.log('- Total Amount:', trip.amount);
    console.log('- Paid Amount:', trip.amount_paid);
    console.log('- Pending Amount:', (trip.amount || 0) - (trip.amount_paid || 0));

    // Verify client matches
    if (trip.client_id !== parseInt(effectiveClientId)) {
      console.log(`\n❌ Client mismatch: Trip belongs to ${trip.client_id}, but ${effectiveClientId} was provided`);
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Client mismatch',
        detail: `Trip ${effectiveTripId} belongs to client ${trip.client_id}, not ${effectiveClientId}`,
        field: 'client_id'
      });
    }

    // STEP 4: CALCULATE AMOUNTS
    const paymentAmount = Number(amount);
    const totalAmount = Number(trip.amount) || 0;
    const currentPaid = Number(trip.amount_paid) || 0;
    const currentPending = totalAmount - currentPaid;

    console.log('\n💰 Amount Calculations:');
    console.log('- Total Amount:', totalAmount);
    console.log('- Current Paid:', currentPaid);
    console.log('- Current Pending:', currentPending);
    console.log('- Payment Amount:', paymentAmount);

    // STEP 5: OVERPAYMENT PREVENTION
    if (paymentAmount > currentPending) {
      console.log(`\n❌ OVERPAYMENT DETECTED: Payment ${paymentAmount} exceeds pending ${currentPending}`);
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Payment exceeds pending amount',
        detail: `Cannot pay ₹${paymentAmount}. Maximum payable is ₹${currentPending}`,
        field: 'amount',
        maxPayable: currentPending,
        totalAmount,
        currentPaid,
        currentPending
      });
    }

    // STEP 6: UPDATE TRIP AMOUNTS
    const newPaidAmount = currentPaid + paymentAmount;
    const newPendingAmount = totalAmount - newPaidAmount;

    console.log('\n📊 New Amounts:');
    console.log('- New Paid Amount:', newPaidAmount);
    console.log('- New Pending Amount:', newPendingAmount);
    console.log('- Payment Status:', newPendingAmount <= 0 ? 'PAID' : newPaidAmount > 0 ? 'PARTIAL' : 'PENDING');

    await trip.update({
      amount_paid: newPaidAmount,
      payment_mode: effectivePaymentMode.toUpperCase()
    }, { transaction: t });

    // STEP 7: CREATE PAYMENT TRANSACTION RECORD (if PaymentTransaction model exists)
    try {
      await PaymentTransaction.create({
        trip_id: effectiveTripId,
        client_id: effectiveClientId,
        transaction_type: 'payment',
        amount: paymentAmount,
        balance_before: currentPending,
        balance_after: newPendingAmount,
        payment_mode: effectivePaymentMode.toUpperCase(),
        remarks: remarks || `Payment of ₹${paymentAmount} for trip ${effectiveTripId}`,
        transaction_date: new Date(effectivePaymentDate),
      }, { transaction: t });
      console.log('✅ Payment transaction record created');
    } catch (transErr) {
      console.log('⚠️  Payment transaction record creation failed (non-critical):', transErr.message);
      // Don't fail the whole transaction if this is just for audit
    }

    // STEP 8: COMMIT TRANSACTION
    await t.commit();
    console.log('\n✅ TRANSACTION COMMITTED SUCCESSFULLY');

    // STEP 9: FETCH UPDATED TRIP
    const updatedTrip = await Trip.findByPk(effectiveTripId, {
      include: [
        { model: Client, as: 'client', attributes: ['client_id', 'client_name'] }
      ]
    });

    // STEP 10: RETURN SUCCESS RESPONSE
    const response = {
      success: true,
      message: `Payment of ₹${paymentAmount} recorded successfully`,
      data: {
        trip_id: updatedTrip.trip_id,
        client_id: updatedTrip.client_id,
        client_name: updatedTrip.client?.client_name,
        payment_amount: paymentAmount,
        payment_mode: effectivePaymentMode.toUpperCase(),
        payment_date: effectivePaymentDate,
        total_amount: totalAmount,
        paid_amount: newPaidAmount,
        pending_amount: newPendingAmount,
        payment_status: newPendingAmount <= 0 ? 'Paid' : newPaidAmount > 0 ? 'Partial' : 'Pending',
        previous_paid: currentPaid,
        previous_pending: currentPending
      }
    };

    console.log('\n✅ RESPONSE:');
    console.log(JSON.stringify(response, null, 2));
    console.log('=== END CREATE TRIP PAYMENT ===\n');

    return res.status(201).json(response);

  } catch (error) {
    await t.rollback();
    console.log('\n❌ ERROR IN CREATE TRIP PAYMENT:');
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);

    // ENHANCED ERROR RESPONSE WITH SPECIFIC FIELD INFO
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value,
        validatorKey: err.validatorKey
      }));

      console.log('\nSequelize Validation Errors:');
      console.log(JSON.stringify(validationErrors, null, 2));

      return res.status(400).json({
        success: false,
        error: 'Sequelize validation failed',
        validationErrors,
        detail: validationErrors.map(e => `${e.field}: ${e.message}`).join('; '),
        originalError: error.message
      });
    }

    if (error.name === 'SequelizeDatabaseError') {
      console.log('\nDatabase Error:', error.original?.message);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        detail: error.original?.message || error.message,
        sqlMessage: error.original?.sqlMessage
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment',
      detail: 'An unexpected error occurred while processing payment',
      errorType: error.name
    });
  }
};

// ============================================================
// HELPER: Format Date for Display
// ============================================================
function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// ============================================================
// EXPORT ALL
// ============================================================
export default {
  getClientsForPayment,
  getBillDatesForClient,
  getFilteredPayments,
  getFilteredPaymentSummary,
  addSmartPartialPayment,
  getPaymentTransactions,
  createPaymentFromInvoice,
  getInvoicesForClient,
  receiveInvoiceFromCreation,
  createTripPayment,
};
