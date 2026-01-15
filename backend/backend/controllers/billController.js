import db from "../models/index.js";
import { Op, fn, col } from "sequelize";

const { Bill, Invoice, Client, Vehicle, Trip } = db;

/**
 * Get all bills with filtering and pagination
 * GET /api/bills?clientId=1&status=UNPAID&page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31
 */
export const getAllBills = async (req, res) => {
  try {
    const {
      clientId,
      status,
      page = 1,
      limit = 10,
      startDate,
      endDate,
      sortBy = "bill_date",
      sortOrder = "DESC"
    } = req.query;

    const where = { deleted_at: null };
    
    if (clientId) where.client_id = clientId;
    if (status) where.payment_status = status;
    if (startDate && endDate) {
      where.bill_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.bill_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.bill_date = { [Op.lte]: endDate };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Bill.findAndCountAll({
      where,
      include: [
        {
          model: Invoice,
          as: "invoice",
          attributes: ["invoice_id", "invoice_number", "date", "total_amount", "client_id"],
          required: false,
          include: [
            { model: Client, as: "client", attributes: ["client_id", "client_name"] },
          ],
        },
        {
          model: Client,
          as: "client",
          attributes: ["client_id", "client_name", "client_phone"],
          required: false
        },
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vehicle_id", "vehicle_number"],
          required: false
        }
      ],
      order: [[sortBy, sortOrder]],
      offset,
      limit: parseInt(limit)
    });

    // Fetch trips for all invoices to derive vehicles
    const invoiceIds = rows.map(b => b.invoice_id).filter(Boolean);
    const trips = invoiceIds.length
      ? await Trip.findAll({
          where: { invoice_id: { [Op.in]: invoiceIds } },
          include: [{ model: Vehicle, as: "vehicle", attributes: ["vehicle_id", "vehicle_number"] }],
          attributes: ["invoice_id", "vehicle_id", "trip_id"],
        })
      : [];

    const tripMap = trips.reduce((acc, trip) => {
      const key = trip.invoice_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(trip);
      return acc;
    }, {});

    const billData = rows.map((bill) => {
      const tripsForInvoice = tripMap[bill.invoice_id] || [];
      const vehicleNumbers = Array.from(
        new Set(tripsForInvoice.map((t) => t.vehicle?.vehicle_number).filter(Boolean))
      );
      return {
        ...bill.toJSON(),
        client: bill.client || bill.invoice?.client || null,
        vehicle_numbers: vehicleNumbers,
      };
    });

    res.status(200).json({
      bills: billData,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({ message: "Failed to fetch bills", error: error.message });
  }
};

/**
 * Get single bill by ID
 * GET /api/bills/:id
 */
export const getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findByPk(id, {
      include: [
        {
          model: Invoice,
          as: "invoice",
          attributes: ["invoice_id", "invoice_number", "date", "total_amount"]
        },
        {
          model: Client,
          as: "client",
          attributes: ["client_id", "client_name", "client_phone", "client_email"]
        },
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vehicle_id", "vehicle_number", "vehicle_type"]
        }
      ]
    });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.status(200).json(bill);
  } catch (error) {
    console.error("Error fetching bill:", error);
    res.status(500).json({ message: "Failed to fetch bill", error: error.message });
  }
};

/**
 * Generate next bill number in format: PREFIX-XXX
 */
async function generateBillNumber(prefix = "BL") {
  try {
    const latestBill = await Bill.findOne({
      where: {
        bill_number: {
          [Op.like]: `${prefix}-%`
        }
      },
      order: [["bill_number", "DESC"]],
      attributes: ["bill_number"]
    });

    let nextNumber = 1;
    
    if (latestBill && latestBill.bill_number) {
      const match = latestBill.bill_number.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const paddedNumber = String(nextNumber).padStart(3, "0");
    return `${prefix}-${paddedNumber}`;
  } catch (error) {
    console.error("Error generating bill number:", error);
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  }
}

/**
 * Create bill from invoice
 * POST /api/bills
 * Body: { invoice_id, bill_date, notes }
 */
export const createBillFromInvoice = async (req, res) => {
  try {
    const { invoice_id, bill_date, notes } = req.body;

    if (!invoice_id) {
      return res.status(400).json({ message: "invoice_id is required" });
    }

    // Fetch invoice with relationships (client) and trips for vehicle derivation
    const invoice = await Invoice.findByPk(invoice_id, {
      include: [
        { model: Client, as: "client", attributes: ["client_id", "client_name"] },
      ]
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Fetch trips linked to this invoice (source of truth for vehicles)
    const trips = await Trip.findAll({
      where: { invoice_id },
      include: [
        { model: Vehicle, as: "vehicle", attributes: ["vehicle_id", "vehicle_number"] },
      ],
      attributes: ["trip_id", "vehicle_id"],
    });

    // Check if bill already exists for this invoice
    const existingBill = await Bill.findOne({
      where: { invoice_id, deleted_at: null }
    });

    if (existingBill) {
      return res.status(400).json({ 
        message: "Bill already exists for this invoice",
        bill_id: existingBill.bill_id,
        bill_number: existingBill.bill_number
      });
    }

    // Generate unique bill number
    const billNumber = await generateBillNumber("BL");

    const vehicleIdForBill = trips.find((t) => t.vehicle_id)?.vehicle_id || null;

    // Create bill
    const bill = await Bill.create({
      bill_number: billNumber,
      invoice_id,
      client_id: invoice.client_id,
      vehicle_id: vehicleIdForBill,
      bill_date: bill_date || invoice.date || new Date(),
      total_amount: invoice.total_amount || 0,
      paid_amount: invoice.amount_paid || 0,
      pending_amount: (invoice.total_amount || 0) - (invoice.amount_paid || 0),
      payment_status: (invoice.amount_paid || 0) === 0 ? "UNPAID" : 
                      (invoice.amount_paid || 0) >= (invoice.total_amount || 0) ? "PAID" : "PARTIAL",
      notes: notes || `Bill created from Invoice ${invoice.invoice_number || invoice_id}`,
      created_by: req.user?.id || "system"
    });

    // Reload with relationships
    const newBill = await Bill.findByPk(bill.bill_id, {
      include: [
        { model: Invoice, as: "invoice", attributes: ["invoice_number", "date"] },
        { model: Client, as: "client", attributes: ["client_name"] },
        { model: Vehicle, as: "vehicle", attributes: ["vehicle_number"] }
      ]
    });

    res.status(201).json({
      message: "Bill created successfully",
      bill: newBill
    });
  } catch (error) {
    console.error("Error creating bill:", error);
    res.status(500).json({ message: "Failed to create bill", error: error.message });
  }
};

/**
 * Update bill amounts and notes
 * PUT /api/bills/:id
 * Body: { total_amount, paid_amount, notes }
 */
export const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { total_amount, paid_amount, notes } = req.body;

    const bill = await Bill.findByPk(id);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Update bill
    const updates = {};
    if (total_amount !== undefined) updates.total_amount = total_amount;
    if (paid_amount !== undefined) {
      updates.paid_amount = paid_amount;
      // Calculate pending amount
      const total = total_amount !== undefined ? total_amount : bill.total_amount;
      updates.pending_amount = Math.max(0, total - paid_amount);
    }
    if (notes !== undefined) updates.notes = notes;

    updates.updated_by = req.user?.id || "system";

    await bill.update(updates);

    const updatedBill = await Bill.findByPk(id, {
      include: [
        { model: Invoice, as: "invoice", attributes: ["invoice_number"] },
        { model: Client, as: "client", attributes: ["client_name"] },
        { model: Vehicle, as: "vehicle", attributes: ["vehicle_number"] }
      ]
    });

    res.status(200).json({
      message: "Bill updated successfully",
      bill: updatedBill
    });
  } catch (error) {
    console.error("Error updating bill:", error);
    res.status(500).json({ message: "Failed to update bill", error: error.message });
  }
};

/**
 * Update bill payment status
 * PATCH /api/bills/:id/status
 * Body: { payment_status } - UNPAID, PARTIAL, PAID
 */
export const updateBillStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    if (!["UNPAID", "PARTIAL", "PAID"].includes(payment_status)) {
      return res.status(400).json({ 
        message: "Invalid payment status. Must be UNPAID, PARTIAL, or PAID" 
      });
    }

    const bill = await Bill.findByPk(id);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    await bill.update({
      payment_status,
      updated_by: req.user?.id || "system"
    });

    const updatedBill = await Bill.findByPk(id, {
      include: [
        { model: Invoice, as: "invoice", attributes: ["invoice_number"] },
        { model: Client, as: "client", attributes: ["client_name"] },
        { model: Vehicle, as: "vehicle", attributes: ["vehicle_number"] }
      ]
    });

    res.status(200).json({
      message: "Payment status updated successfully",
      bill: updatedBill
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Failed to update payment status", error: error.message });
  }
};

/**
 * Delete bill (soft delete)
 * DELETE /api/bills/:id
 */
export const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findByPk(id);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Soft delete
    await bill.update({
      deleted_at: new Date(),
      updated_by: req.user?.id || "system"
    });

    res.status(200).json({ message: "Bill deleted successfully" });
  } catch (error) {
    console.error("Error deleting bill:", error);
    res.status(500).json({ message: "Failed to delete bill", error: error.message });
  }
};

/**
 * Get bills summary (dashboard KPIs)
 * GET /api/bills/summary
 * Returns: totalBills, totalAmount, paidAmount, pendingAmount, by payment_status
 */
export const getBillsSummary = async (req, res) => {
  try {
    const { startDate, endDate, clientId } = req.query;

    const where = { deleted_at: null };
    if (clientId) where.client_id = clientId;
    if (startDate && endDate) {
      where.bill_date = { [Op.between]: [startDate, endDate] };
    }

    const [
      totalBills,
      unpaidBills,
      partialBills,
      paidBills,
      summary
    ] = await Promise.all([
      Bill.count({ where }),
      Bill.count({ where: { ...where, payment_status: "UNPAID" } }),
      Bill.count({ where: { ...where, payment_status: "PARTIAL" } }),
      Bill.count({ where: { ...where, payment_status: "PAID" } }),
      Bill.findOne({
        where,
        attributes: [
          [fn("SUM", col("total_amount")), "totalAmount"],
          [fn("SUM", col("paid_amount")), "paidAmount"],
          [fn("SUM", col("pending_amount")), "pendingAmount"]
        ],
        raw: true
      })
    ]);

    res.status(200).json({
      kpis: {
        totalBills: totalBills || 0,
        totalAmount: parseFloat(summary?.totalAmount) || 0,
        paidAmount: parseFloat(summary?.paidAmount) || 0,
        pendingAmount: parseFloat(summary?.pendingAmount) || 0,
        byStatus: {
          unpaid: unpaidBills || 0,
          partial: partialBills || 0,
          paid: paidBills || 0
        }
      }
    });
  } catch (error) {
    console.error("Error fetching bills summary:", error);
    res.status(500).json({ message: "Failed to fetch bills summary", error: error.message });
  }
};
