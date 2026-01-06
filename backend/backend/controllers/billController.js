import db from "../models/index.js";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { Op, fn, col, where as seqWhere } from "sequelize";

const { Invoice, Client, Vehicle, Trip, Bill } = db;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get available invoice dates for a specific client from the Trips table
export const getAvailableDates = async (req, res) => {
  try {
    const clientId = req.query.clientId || req.params.clientId;

    if (!clientId) {
      return res.status(400).json({ message: "Client ID is required" });
    }

    // Query distinct dispatch dates from the Trip table for the given client
    const dates = await Trip.findAll({
      where: { client_id: clientId },
      attributes: [[fn("DATE", col("dispatch_date")), "date"]],
      group: [fn("DATE", col("dispatch_date"))],
      order: [[fn("DATE", col("dispatch_date")), "DESC"]],
      raw: true,
    });

    const uniqueDates = Array.from(
      new Map(
        dates
          .map((item) => item.date)
          .filter(Boolean)
          .map((date) => {
            const normalized = new Date(date);
            if (Number.isNaN(normalized.getTime())) return null;
            const iso = normalized.toISOString().slice(0, 10);
            return [iso, iso];
          })
          .filter(Boolean)
      ).values()
    );

    const formattedDates = uniqueDates.map((iso) => ({
      iso,
      display: new Date(iso).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    }));

    res.status(200).json({
      dates: formattedDates,
      message: formattedDates.length
        ? `Found ${formattedDates.length} unique dates for client ${clientId}`
        : "No trip dates found for this client",
    });
  } catch (error) {
    console.error("Error fetching available dates:", error);
    res.status(500).json({ message: "Failed to fetch available dates", error: error.message });
  }
};

// Get all bills with optional filtering by client and date range
export const getAllBills = async (req, res) => {
  try {
    const { clientId, startDate, endDate } = req.query;
    const where = {};

    if (clientId) where.client_id = clientId;
    if (startDate && endDate) {
      where.invoice_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.invoice_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.invoice_date = { [Op.lte]: endDate };
    }

    const bills = await Invoice.findAll({
      where,
      include: [
        { model: Client, as: "client", attributes: ["client_id", "client_name"] },
      ],
      attributes: [
        ["invoice_id", "bill_id"],
        "invoice_no",
        ["invoice_date", "date"],
        "dispatch_date",
        "total_amount",
        "payment_status",
        "min_charge_qty",
        "qty",
        "rate",
        "particulars",
        "client_id"
      ],
      order: [["invoice_date", "DESC"]],
    });
    res.status(200).json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({ message: "Failed to fetch bills" });
  }
};

// Create new bill
export const createBill = async (req, res) => {
  try {
    const {
      invoice_no,
      invoice_date,
      dispatch_date,
      client_id,
      vehicle_number,
      particulars,
      qty,
      min_charge_qty,
      rate,
      payment_status
    } = req.body;

    // Calculate total amount based on max(qty, min_charge_qty) * rate
    const effectiveQty = Math.max(Number(qty) || 0, Number(min_charge_qty) || 0);
    const total_amount = effectiveQty * (Number(rate) || 0);

    const newBill = await Invoice.create({
      invoice_no,
      invoice_date,
      dispatch_date,
      client_id,
      vehicle_number,
      particulars,
      qty: Number(qty) || 0,
      min_charge_qty: Number(min_charge_qty) || 0,
      rate: Number(rate) || 0,
      total_amount,
      payment_status: payment_status || "Pending",
      amount_paid: 0,
      pending_amount: total_amount
    });

    res.status(201).json({ message: "Bill created successfully", bill: newBill });
  } catch (error) {
    console.error("Error creating bill:", error);
    res.status(500).json({ message: "Failed to create bill", error: error.message });
  }
};

// Update bill
export const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Invoice.findByPk(id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    const updates = { ...req.body };
    
    // Recalculate total if qty, min_charge_qty, or rate changes
    if (req.body.qty !== undefined || req.body.min_charge_qty !== undefined || req.body.rate !== undefined) {
      const qty = req.body.qty !== undefined ? Number(req.body.qty) : bill.qty;
      const minQty = req.body.min_charge_qty !== undefined ? Number(req.body.min_charge_qty) : bill.min_charge_qty;
      const rate = req.body.rate !== undefined ? Number(req.body.rate) : bill.rate;
      
      const effectiveQty = Math.max(qty || 0, minQty || 0);
      updates.total_amount = effectiveQty * (rate || 0);
      updates.pending_amount = updates.total_amount - (bill.amount_paid || 0);
    }

    await bill.update(updates);
    res.json({ message: "Bill updated successfully", bill });
  } catch (error) {
    console.error("Error updating bill:", error);
    res.status(500).json({ message: "Failed to update bill" });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { payment_status } = req.body;
    const invoice = await Invoice.findByPk(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    await invoice.update({ payment_status });
    res.json({ message: "Payment status updated", payment_status });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Failed to update payment status" });
  }
};

export const updateMinChargeQty = async (req, res) => {
  try {
    const id = req.params.id;
    const { min_charge_qty } = req.body;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    // Recalculate total amount with new min_charge_qty
    const effectiveQty = Math.max(invoice.qty || 0, Number(min_charge_qty) || 0);
    const total_amount = effectiveQty * (invoice.rate || 0);
    const pending_amount = total_amount - (invoice.amount_paid || 0);

    await invoice.update({ 
      min_charge_qty: Number(min_charge_qty),
      total_amount,
      pending_amount
    });
    
    res.json({ 
      message: "Min charge quantity updated", 
      min_charge_qty: Number(min_charge_qty),
      total_amount,
      pending_amount
    });
  } catch (error) {
    console.error("Error updating min_charge_qty:", error);
    res.status(500).json({ message: "Failed to update min charge quantity" });
  }
};

// Delete bill
export const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Invoice.findByPk(id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    await bill.destroy();
    res.json({ message: "Bill deleted successfully" });
  } catch (error) {
    console.error("Error deleting bill:", error);
    res.status(500).json({ message: "Failed to delete bill" });
  }
};

export const downloadBillPDF = async (req, res) => {
  try {
    const bill = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Client, as: "client", attributes: ["client_name"] },
        
      ],
    });

    if (!bill) return res.status(404).json({ message: "Bill not found" });

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=bill-${bill.invoice_no || bill.id}.pdf`);
    doc.pipe(res);

    doc.fontSize(16).font("Helvetica-Bold").text("R.K.S.BRO'S", { align: "center" });
    doc.fontSize(10).font("Helvetica").text(
      "Fleet Owners & Transport Contractors\nOld No 99 New No 47, G.A Road, 2nd Lane, Old Washermenpet, Ch-21\nPh: 044-25945913/25985558, Mob: 9841128061, 9841128064",
      { align: "center" }
    );
    doc.moveDown(1);

    doc.fontSize(11).font("Helvetica-Bold").text("BILL", { align: "center" });
    doc.moveDown(0.5);

    const yStart = doc.y;
    doc.fontSize(10).font("Helvetica-Bold").text("Invoice No:", 40, yStart);
    doc.font("Helvetica").text(bill.invoice_no || "-", 110, yStart);
    doc.font("Helvetica-Bold").text("Invoice Date:", 350, yStart);
    doc.font("Helvetica").text(bill.invoice_date || "-", 430, yStart);

    doc.font("Helvetica-Bold").text("To:", 40, yStart + 18);
    doc.font("Helvetica").text(bill.client?.client_name || "-", 110, yStart + 18);

    doc.moveDown(3);

    const tableTop = doc.y;
    const rowHeight = 20;
    const colWidths = [60, 80, 90, 60, 60, 60, 60];
    const headers = [
      "Date of Dispatch", "Vehicle No", "Particulars", "Actual Qty", "Min Qty", "Rate", "Amount"
    ];

    let x = 40;
    doc.font("Helvetica-Bold").fontSize(9);
    headers.forEach((header, i) => {
      doc.rect(x, tableTop, colWidths[i], rowHeight).stroke();
      doc.text(header, x + 2, tableTop + 6, { width: colWidths[i] - 4, align: "center" });
      x += colWidths[i];
    });

    let y = tableTop + rowHeight;
    x = 40;
    doc.font("Helvetica").fontSize(9);
    const row = [
      bill.dispatch_date || "-",
      bill.vehicle?.vehicle_number || "-",
      bill.particulars || "-",
      bill.qty || "-",
      bill.min_charge_qty || "-",
      bill.rate || "-",
      bill.total_amount ? `₹${bill.total_amount}` : "-"
    ];
    row.forEach((text, i) => {
      doc.rect(x, y, colWidths[i], rowHeight).stroke();
      doc.text(text?.toString() || "-", x + 2, y + 6, { width: colWidths[i] - 4, align: "center" });
      x += colWidths[i];
    });

    y += rowHeight + 10;
    doc.font("Helvetica-Bold").fontSize(10).text("TOTAL", 400, y);
    doc.font("Helvetica-Bold").fontSize(10).text(
      bill.total_amount ? `₹${bill.total_amount}` : "-",
      500, y, { align: "right" }
    );

    y += 40;
    doc.fontSize(9).font("Helvetica-Bold").text("Terms & Conditions", 40, y);
    doc.font("Helvetica").fontSize(8).text(
      "1. Subject to Chennai Jurisdiction.\n" +
      "2. Interest @ 24% per annum will be charged if not paid within due date from the date bill.\n" +
      "3. Payment should be made by a/c payee Cheque / draft payable at Chennai.",
      40, y + 12
    );

    doc.fontSize(9).font("Helvetica-Oblique").text(
      "This is a Computer Generated Invoice",
      40, 780, { align: "left" }
    );
    doc.fontSize(9).font("Helvetica-Bold").text(
      "For R.K.S. BRO'S\nAuthorized Signatory",
      400, 760, { align: "left" }
    );

    doc.end();
  } catch (err) {
    res.status(500).json({ message: "Error generating Bill PDF", error: err.message });
  }
};
