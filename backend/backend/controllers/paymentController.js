/**
 * Payment Controller - Enterprise Grade
 * Handles all payment operations with proper business logic
 * 
 * Business Rules:
 * - Payment status is ALWAYS computed from amounts (never manual)
 * - All filtering happens in database queries
 * - Overdue tracking is automatic
 * - Balance calculations are backend-enforced
 */

import db from "../models/index.js";
import { Op, fn, col } from "sequelize";

const { Client, Payment, Invoice, sequelize } = db;

// ============================================================
// PAYMENT MODE NORMALIZATION - UPPERCASE ENUM
// ============================================================
const normalizePaymentMode = (mode) => {
  if (!mode) return 'CASH';
  
  // Convert to uppercase
  const upper = String(mode).toUpperCase();
  
  // Handle common variations
  const normalizedMap = {
    'CASH': 'CASH',
    'CHEQUE': 'CHEQUE',
    'CHECK': 'CHEQUE',
    'BANK': 'BANK',
    'BANK TRANSFER': 'BANK',
    'BANKTRANSFER': 'BANK',
    'ONLINE': 'BANK',
    'UPI': 'UPI',
    'UPIPAYMENT': 'UPI'
  };
  
  const normalized = normalizedMap[upper];
  if (!normalized) {
    console.warn(`Unknown payment mode: ${mode}, defaulting to CASH`);
    return 'CASH';
  }
  
  return normalized;
};

// ============================================================
// GET ALL PAYMENTS - With Full Filtering Support
// ============================================================
export const getAllPayments = async (req, res) => {
  try {
    const {
      clientId,
      invoiceId,
      status,           // Paid, Partial, Pending
      paymentMode,      // Cash, Bank, UPI, Cheque
      billDate,         // Exact date
      date,             // Alias for billDate
      startDate,        // Range start
      endDate,          // Range end
      isOverdue,        // true/false
      page = 1,
      limit = 50,
      sortBy = 'bill_date',
      sortOrder = 'DESC'
    } = req.query;

    // Build WHERE clause
    const where = {};

    if (clientId) where.client_id = clientId;
    if (invoiceId) where.invoice_id = invoiceId;
    if (status) where.payment_status = status;
    if (paymentMode) where.payment_mode = paymentMode;
    if (isOverdue === 'true') where.is_overdue = true;

    // Date filtering
    const effectiveDate = billDate || date;
    if (effectiveDate) {
      where.bill_date = effectiveDate;
    } else if (startDate && endDate) {
      where.bill_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.bill_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.bill_date = { [Op.lte]: endDate };
    }

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
          attributes: ["invoice_id", "invoice_number", "total_amount", "amount_paid", "payment_status"],
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
      status: payment.payment_status, // Alias for compatibility
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
    console.error("Error getting payments:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: "Database query failed while fetching payments"
    });
  }
};

// ============================================================
// GET PAYMENT SUMMARY - Aggregated Statistics
// ============================================================
export const getPaymentSummary = async (req, res) => {
  try {
    const {
      clientId,
      status,
      paymentMode,
      billDate,
      date,
      startDate,
      endDate,
      isOverdue
    } = req.query;

    // Build WHERE clause (same as getAllPayments)
    const where = {};
    if (clientId) where.client_id = clientId;
    if (status) where.payment_status = status;
    if (paymentMode) where.payment_mode = paymentMode;
    if (isOverdue === 'true') where.is_overdue = true;

    const effectiveDate = billDate || date;
    if (effectiveDate) {
      where.bill_date = effectiveDate;
    } else if (startDate && endDate) {
      where.bill_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.bill_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.bill_date = { [Op.lte]: endDate };
    }

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

    // Get overdue amount separately
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
// GET PAYMENT BY ID
// ============================================================
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Client,
          as: "client",
          attributes: ["client_id", "client_name", "client_phone", "client_email", "client_address", "client_gst"]
        },
        {
          model: Invoice,
          as: "invoice",
          attributes: ["invoice_id", "invoice_number", "total_amount", "amount_paid", "payment_status", "date"],
          required: false
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found",
        detail: `No payment exists with ID: ${id}`
      });
    }

    res.json({
      success: true,
      data: {
        paymentId: payment.payment_id,
        receiptNumber: payment.receipt_number,
        clientId: payment.client_id,
        client: payment.client,
        invoiceId: payment.invoice_id,
        invoice: payment.invoice,
        totalAmount: parseFloat(payment.total_amount),
        paidAmount: parseFloat(payment.paid_amount),
        balanceAmount: parseFloat(payment.balance_amount),
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
      }
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: "Failed to fetch payment details"
    });
  }
};

// ============================================================
// CREATE NEW PAYMENT
// ============================================================
export const createPayment = async (req, res) => {
  try {
    const {
      clientId,
      invoiceId,
      totalAmount,
      paidAmount = 0,
      billDate,
      payment_date,
      paymentDate,
      dueDate,
      paymentMode,
      payment_mode,
      referenceNo,
      reference_no,
      remarks,
    } = req.body;

    // Validation
    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: "Client is required",
        field: "clientId"
      });
    }

    if (!totalAmount || Number(totalAmount) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Total amount must be greater than 0",
        field: "totalAmount"
      });
    }

    const effectiveBillDate = billDate || payment_date;
    if (!effectiveBillDate) {
      return res.status(400).json({
        success: false,
        error: "Bill date is required",
        field: "billDate"
      });
    }

    // Verify client exists
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(400).json({
        success: false,
        error: "Invalid client ID",
        detail: `Client with ID ${clientId} does not exist`
      });
    }

    // Verify invoice exists if provided
    if (invoiceId) {
      const invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) {
        return res.status(400).json({
          success: false,
          error: "Invalid invoice ID",
          detail: `Invoice with ID ${invoiceId} does not exist`
        });
      }
    }

    const total = Number(totalAmount);
    const paid = Number(paidAmount) || 0;
    const rawPaymentMode = paymentMode || payment_mode || 'CASH';
    const normalizedPaymentMode = normalizePaymentMode(rawPaymentMode);
    const effectiveReferenceNo = referenceNo || reference_no;

    // Validate payment amount doesn't exceed total
    if (paid > total) {
      return res.status(400).json({
        success: false,
        error: "Payment amount cannot exceed total amount",
        detail: `Paid amount (₹${paid}) exceeds total amount (₹${total})`
      });
    }

    // Start atomic transaction
    const transaction = await sequelize.transaction();

    try {
      // Create payment record
      const newPayment = await Payment.create({
        client_id: clientId,
        invoice_id: invoiceId || null,
        total_amount: total,
        paid_amount: paid,
        balance_amount: total - paid,
        bill_date: effectiveBillDate,
        payment_date: paymentDate || (paid > 0 ? new Date().toISOString().split('T')[0] : null),
        due_date: dueDate || null,
        payment_mode: normalizedPaymentMode,
        reference_no: effectiveReferenceNo || null,
        remarks: remarks || null,
      }, { transaction });

      // If linked to invoice, update invoice payment status within transaction
      if (invoiceId) {
        const invoice = await Invoice.findByPk(invoiceId, { transaction });
        if (invoice) {
          const currentPaid = parseFloat(invoice.amount_paid) || 0;
          const newPaidAmount = currentPaid + paid;
          const newPendingAmount = parseFloat(invoice.total_amount) - newPaidAmount;
          
          await invoice.update({
            amount_paid: newPaidAmount,
            pending_amount: Math.max(0, newPendingAmount),
            payment_status: newPendingAmount <= 0 ? 'Paid' : newPaidAmount > 0 ? 'Partial' : 'Unpaid'
          }, { transaction });
        }
      }

      // Commit transaction
      await transaction.commit();

      // Fetch full payment with associations
      const payment = await Payment.findByPk(newPayment.payment_id, {
        include: [
          { model: Client, as: "client", attributes: ["client_id", "client_name"] },
          { model: Invoice, as: "invoice", attributes: ["invoice_id", "invoice_number", "total_amount", "amount_paid", "pending_amount"], required: false }
        ]
      });

      res.status(201).json({
        success: true,
        message: "Payment created successfully",
        data: {
          paymentId: payment.payment_id,
          receiptNumber: payment.receipt_number,
          clientName: payment.client?.client_name,
          invoiceNumber: payment.invoice?.invoice_number,
          totalAmount: parseFloat(payment.total_amount),
          paidAmount: parseFloat(payment.paid_amount),
          balanceAmount: parseFloat(payment.balance_amount),
          paymentStatus: payment.payment_status,
          paymentMode: payment.payment_mode,
          billDate: payment.bill_date,
          // Include updated invoice summary if available
          invoice: payment.invoice ? {
            invoiceId: payment.invoice.invoice_id,
            invoiceNumber: payment.invoice.invoice_number,
            totalAmount: parseFloat(payment.invoice.total_amount),
            amountPaid: parseFloat(payment.invoice.amount_paid),
            pendingAmount: parseFloat(payment.invoice.pending_amount)
          } : null
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: "Failed to create payment record"
    });
  }
};

// ============================================================
// UPDATE PAYMENT
// ============================================================
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found",
        detail: `No payment exists with ID: ${id}`
      });
    }

    const {
      clientId,
      invoiceId,
      totalAmount,
      paidAmount,
      billDate,
      payment_date,
      paymentDate,
      dueDate,
      paymentMode,
      payment_mode,
      referenceNo,
      reference_no,
      remarks,
    } = req.body;

    // Build update object
    const updates = {};
    
    if (clientId !== undefined) updates.client_id = clientId;
    if (invoiceId !== undefined) updates.invoice_id = invoiceId;
    if (billDate !== undefined) updates.bill_date = billDate;
    if (payment_date !== undefined) updates.bill_date = payment_date;
    if (paymentDate !== undefined) updates.payment_date = paymentDate;
    if (dueDate !== undefined) updates.due_date = dueDate;
    if (paymentMode !== undefined) updates.payment_mode = paymentMode;
    if (payment_mode !== undefined) updates.payment_mode = payment_mode;
    if (referenceNo !== undefined) updates.reference_no = referenceNo;
    if (reference_no !== undefined) updates.reference_no = reference_no;
    if (remarks !== undefined) updates.remarks = remarks;

    // Handle amount updates (balance and status recalculated by hooks)
    if (totalAmount !== undefined) updates.total_amount = Number(totalAmount);
    if (paidAmount !== undefined) updates.paid_amount = Number(paidAmount);

    await payment.update(updates);

    // Update invoice status if linked
    const effectiveInvoiceId = invoiceId !== undefined ? invoiceId : payment.invoice_id;
    if (effectiveInvoiceId) {
      await updateInvoicePaymentStatus(effectiveInvoiceId);
    }

    // Fetch updated payment
    const updatedPayment = await Payment.findByPk(id, {
      include: [
        { model: Client, as: "client", attributes: ["client_id", "client_name"] },
        { model: Invoice, as: "invoice", attributes: ["invoice_id", "invoice_number"], required: false }
      ]
    });

    res.json({
      success: true,
      message: "Payment updated successfully",
      data: {
        paymentId: updatedPayment.payment_id,
        receiptNumber: updatedPayment.receipt_number,
        clientName: updatedPayment.client?.client_name,
        totalAmount: parseFloat(updatedPayment.total_amount),
        paidAmount: parseFloat(updatedPayment.paid_amount),
        balanceAmount: parseFloat(updatedPayment.balance_amount),
        paymentStatus: updatedPayment.payment_status,
      }
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: "Failed to update payment"
    });
  }
};

// ============================================================
// ADD PARTIAL PAYMENT
// ============================================================
export const addPartialPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMode, referenceNo, remarks } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Payment amount must be greater than 0",
        field: "amount"
      });
    }

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found"
      });
    }

    const newPaidAmount = parseFloat(payment.paid_amount) + Number(amount);
    const totalAmount = parseFloat(payment.total_amount);

    if (newPaidAmount > totalAmount) {
      return res.status(400).json({
        success: false,
        error: "Payment exceeds balance",
        detail: `Maximum payable amount is ₹${parseFloat(payment.balance_amount).toFixed(2)}`
      });
    }

    await payment.update({
      paid_amount: newPaidAmount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: paymentMode || payment.payment_mode,
      reference_no: referenceNo || payment.reference_no,
      remarks: remarks ? `${payment.remarks || ''}\n${remarks}`.trim() : payment.remarks
    });

    // Update invoice if linked
    if (payment.invoice_id) {
      await updateInvoicePaymentStatus(payment.invoice_id);
    }

    res.json({
      success: true,
      message: `Partial payment of ₹${Number(amount).toFixed(2)} recorded successfully`,
      data: {
        paymentId: payment.payment_id,
        newPaidAmount: parseFloat(payment.paid_amount),
        newBalanceAmount: parseFloat(payment.balance_amount),
        paymentStatus: payment.payment_status
      }
    });
  } catch (error) {
    console.error("Error adding partial payment:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: "Failed to record partial payment"
    });
  }
};

// ============================================================
// DELETE PAYMENT
// ============================================================
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found"
      });
    }

    const invoiceId = payment.invoice_id;
    
    await payment.destroy();

    // Update invoice if linked
    if (invoiceId) {
      await updateInvoicePaymentStatus(invoiceId);
    }

    res.json({
      success: true,
      message: "Payment deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: "Failed to delete payment"
    });
  }
};

// ============================================================
// GET CLIENTS FOR DROPDOWN
// ============================================================
export const getClients = async (req, res) => {
  try {
    const clients = await Client.findAll({
      attributes: ["client_id", "client_name"],
      order: [["client_name", "ASC"]],
    });

    res.json({
      success: true,
      data: clients.map(c => ({
        id: c.client_id,
        name: c.client_name
      }))
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================================
// GET INVOICES FOR DROPDOWN (filtered by client)
// ============================================================
export const getInvoices = async (req, res) => {
  try {
    const { clientId } = req.query;
    const where = {};
    
    if (clientId) where.client_id = clientId;

    const invoices = await Invoice.findAll({
      where,
      attributes: ["invoice_id", "invoice_number", "total_amount", "amount_paid", "payment_status", "date"],
      include: [{
        model: Client,
        as: "client",
        attributes: ["client_name"]
      }],
      order: [["date", "DESC"]],
    });

    res.json({
      success: true,
      data: invoices.map(inv => ({
        id: inv.invoice_id,
        invoiceNumber: inv.invoice_number,
        clientName: inv.client?.client_name,
        totalAmount: parseFloat(inv.total_amount),
        amountPaid: parseFloat(inv.amount_paid),
        pendingAmount: parseFloat(inv.total_amount) - parseFloat(inv.amount_paid),
        status: inv.payment_status,
        date: inv.date
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
// GET AVAILABLE BILL DATES (for filter dropdown)
// ============================================================
export const getAvailableDates = async (req, res) => {
  try {
    const { clientId } = req.query;
    const where = {};
    
    if (clientId) where.client_id = clientId;

    const dates = await Payment.findAll({
      where,
      attributes: [[fn('DISTINCT', col('bill_date')), 'bill_date']],
      order: [['bill_date', 'DESC']],
      raw: true
    });

    res.json({
      success: true,
      data: dates
        .filter(d => d.bill_date)
        .map(d => ({
          iso: d.bill_date,
          display: new Date(d.bill_date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        }))
    });
  } catch (error) {
    console.error("Error fetching available dates:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Alias for backward compatibility
export const fetchClients = getClients;

// ============================================================
// HELPER: Update Invoice Payment Status
// ============================================================
async function updateInvoicePaymentStatus(invoiceId) {
  try {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) return;

    // Get all payments for this invoice
    const payments = await Payment.findAll({
      where: { invoice_id: invoiceId },
      attributes: [[fn('SUM', col('paid_amount')), 'totalPaid']],
      raw: true
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
    });
  } catch (error) {
    console.error("Error updating invoice status:", error);
  }
}

// ============================================================
// EXPORT DEFAULT
// ============================================================
export default {
  getAllPayments,
  getPaymentSummary,
  getPaymentById,
  createPayment,
  updatePayment,
  addPartialPayment,
  deletePayment,
  getClients,
  fetchClients,
  getInvoices,
  getAvailableDates
};