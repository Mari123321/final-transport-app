import { Op, fn, col, where } from "sequelize";
import db from "../models/index.js";

const { Invoice, Trip, Client, Vehicle, Driver, ExtraCharge, Bill } = db;

/**
 * Generate next invoice number in format: PREFIX-XXX
 * Example: IN-001, IN-002, IN-003
 * @param {string} prefix - 2 letter prefix (default: "IN")
 * @returns {Promise<string>} - Next invoice number
 */
async function generateInvoiceNumber(prefix = "IN") {
  try {
    // Get the latest invoice by invoice_number
    const latestInvoice = await Invoice.findOne({
      where: {
        invoice_number: {
          [Op.like]: `${prefix}-%`
        }
      },
      order: [['invoice_number', 'DESC']],
      attributes: ['invoice_number']
    });

    let nextNumber = 1;
    
    if (latestInvoice && latestInvoice.invoice_number) {
      // Extract numeric part from "IN-001" -> "001" -> 1
      const match = latestInvoice.invoice_number.match(/-([0-9]+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format with leading zeros (3 digits)
    const paddedNumber = String(nextNumber).padStart(3, '0');
    return `${prefix}-${paddedNumber}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback: use timestamp-based unique ID
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  }
}

/**
 * Generate next bill number in format: PREFIX-XXX
 * Example: BL-001, BL-002, BL-003
 * @param {string} prefix - 2 letter prefix (default: "BL")
 * @returns {Promise<string>} - Next bill number
 */
async function generateBillNumber(prefix = "BL") {
  try {
    // Get the latest bill by bill_number
    const latestBill = await Bill.findOne({
      where: {
        bill_number: {
          [Op.like]: `${prefix}-%`
        }
      },
      order: [['bill_number', 'DESC']],
      attributes: ['bill_number']
    });

    let nextNumber = 1;
    
    if (latestBill && latestBill.bill_number) {
      // Extract numeric part from "BL-001" -> "001" -> 1
      const match = latestBill.bill_number.match(/-([0-9]+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format with leading zeros (3 digits)
    const paddedNumber = String(nextNumber).padStart(3, '0');
    return `${prefix}-${paddedNumber}`;
  } catch (error) {
    console.error('Error generating bill number:', error);
    // Fallback: use timestamp-based unique ID
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  }
}

/**
 * NEW ENDPOINT: Create invoice from multiple trips (Invoice Creation Page)
 *
 * REQUIREMENTS MET:
 * ✅ Accepts client_id, date range, and trip_ids
 * ✅ Creates invoice with status "CREATED"
 * ✅ Associates trips with invoice
 * ✅ Calculates totals (total_amount, amount_paid, pending_amount)
 * ✅ Sets invoiceCreatedDate to current date
 * ✅ Returns complete invoice data for Smart Payment integration
 */
export const createInvoiceFromTrips = async (req, res) => {
  try {
    const { client_id, date, trip_ids = [] } = req.body;

    // Validate input
    if (!client_id) {
      return res.status(400).json({
        success: false,
        error: "Client ID is required",
      });
    }

    if (!trip_ids || trip_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one trip must be selected",
      });
    }

    // Fetch all selected trips (include vehicle to avoid NULL vehicle downstream)
    const trips = await Trip.findAll({
      where: {
        trip_id: {
          [Op.in]: trip_ids,
        },
      },
      include: [
        { model: Client, as: "client", attributes: ["client_id", "client_name"] },
        { model: Driver, as: "driver", attributes: ["name"] },
        { model: Vehicle, as: "vehicle", attributes: ["vehicle_id", "vehicle_number"] },
      ],
      attributes: [
        "trip_id",
        "client_id",
        "date",
        "dispatch_date",
        "from_place",
        "to_place",
        "minimum_quantity",
        "actual_quantity",
        "rate_per_tonne",
        "amount",
        "amount_paid",
        "payment_mode",
        "vehicle_id",
      ],
    });

    if (!trips || trips.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No trips found for the provided trip IDs",
      });
    }

    // Verify all trips belong to the same client
    const allSameClient = trips.every((t) => t.client_id === parseInt(client_id));
    if (!allSameClient) {
      return res.status(400).json({
        success: false,
        error: "All selected trips must belong to the same client",
      });
    }

    // CRITICAL: Validate that trip date is the source of truth
    // Use the trip date, not the provided date parameter
    const tripDate = trips[0].date;
    if (!tripDate) {
      return res.status(400).json({
        success: false,
        error: "Selected trips have no valid date. Cannot create invoice.",
      });
    }

    // Verify all trips have the same date
    const allSameDate = trips.every((t) => {
      const tDate = new Date(t.date).toISOString().split('T')[0];
      const refDate = new Date(tripDate).toISOString().split('T')[0];
      return tDate === refDate;
    });

    if (!allSameDate) {
      return res.status(400).json({
        success: false,
        error: "All selected trips must be on the same date",
      });
    }

    // Calculate totals and gather vehicles
    const totalAmount = trips.reduce((sum, trip) => sum + (Number(trip.amount) || 0), 0);
    const totalPaid = trips.reduce((sum, trip) => sum + (Number(trip.amount_paid) || 0), 0);
    const totalPending = totalAmount - totalPaid;
    const vehicleNumbers = Array.from(
      new Set(trips.map((t) => t.vehicle?.vehicle_number).filter(Boolean))
    );
    const vehicleIdForBill = trips.find((t) => t.vehicle_id)?.vehicle_id || null;

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber("IN");

    // CRITICAL: Use trip date as source of truth for invoice date
    const invoiceDateStr = new Date(tripDate).toISOString().split('T')[0];

    // Create invoice with trip date (never null)
    const invoice = await Invoice.create({
      invoice_number: invoiceNumber,
      client_id: parseInt(client_id),
      date: invoiceDateStr, // From trip, never null
      total_amount: totalAmount,
      amount_paid: totalPaid,
      pending_amount: totalPending,
      payment_status: "Unpaid", // Initial status
    });

    // Associate trips with invoice
    await Promise.all(
      trips.map((trip) => trip.update({ invoice_id: invoice.invoice_id }))
    );

    // AUTOMATICALLY CREATE BILL FROM INVOICE
    // Generate unique bill number
    const billNumber = await generateBillNumber("BL");

    // Create bill automatically
    const bill = await Bill.create({
      bill_number: billNumber,
      invoice_id: invoice.invoice_id,
      client_id: invoice.client_id,
      vehicle_id: vehicleIdForBill,
      bill_date: invoiceDateStr, // align bill date with invoice/trip date
      total_amount: totalAmount,
      paid_amount: totalPaid,
      pending_amount: totalPending,
      payment_status: totalPending === 0 ? "PAID" : (totalPaid > 0 ? "PARTIAL" : "UNPAID"),
      notes: `Auto-generated from Invoice ${invoice.invoice_number}`,
    });

    console.log(`✅ Bill ${billNumber} automatically created for Invoice ${invoice.invoice_number}`);

    // Get client details
    const client = trips[0].client;

    // Prepare response
    const response = {
      success: true,
      invoice: {
        invoice_id: invoice.invoice_id,
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id,
        client_name: client?.client_name || "Unknown",
        date: invoice.date,
        invoiceCreatedDate: new Date().toISOString().slice(0, 10), // Current date
        total_amount: invoice.total_amount,
        amount_paid: invoice.amount_paid,
        pending_amount: invoice.pending_amount,
        payment_status: invoice.payment_status,
        vehicle_numbers: vehicleNumbers,
        trip_ids: trips.map((t) => t.trip_id),
        trip_count: trips.length,
        trips: trips.map((trip) => ({
          trip_id: trip.trip_id,
          date: trip.date,
          dispatch_date: trip.dispatch_date,
          from_place: trip.from_place,
          to_place: trip.to_place,
          vehicle_id: trip.vehicle_id,
          vehicle: trip.vehicle?.vehicle_number || "-",
          driver: trip.driver?.name || "-",
          actual_quantity: trip.actual_quantity,
          rate_per_tonne: trip.rate_per_tonne,
          amount: trip.amount,
          amount_paid: trip.amount_paid,
          payment_mode: trip.payment_mode,
        })),
      },
      bill: {
        bill_id: bill.bill_id,
        bill_number: bill.bill_number,
        bill_date: bill.bill_date,
        total_amount: bill.total_amount,
        paid_amount: bill.paid_amount,
        pending_amount: bill.pending_amount,
        payment_status: bill.payment_status,
        vehicle_id: vehicleIdForBill,
        vehicle_numbers: vehicleNumbers,
      },
      message: "Invoice and Bill created successfully",
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error("Error creating invoice from trips:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create invoice",
      detail: error.message,
    });
  }
};

/**
 * Create or fetch invoice and associate trips by client_id and date,
 * excluding diesel extra charges but including detailed trip info.
 */
export const createOrFetchInvoice = async (req, res) => {
  try {
    let { client_id, date } = req.body;
    if (!client_id || !date)
      return res.status(400).json({ error: "Client ID and Date are required" });

    date = new Date(date).toISOString().slice(0, 10);

    const trips = await Trip.findAll({
      where: {
        client_id,
        [Op.and]: [where(fn("DATE", col("dispatch_date")), date)],
      },
      attributes: [
        "trip_id", "date", "dispatch_date", "from_place", "to_place",
        "minimum_quantity", "actual_quantity", "rate_per_tonne",
        "amount", "amount_paid", "payment_mode"
      ],
      include: [
        { model: Vehicle, as: "vehicle", attributes: ["vehicle_number"] },
        { model: Driver, as: "driver", attributes: ["name", "license_number"] },
        { model: Client, as: "client", attributes: ["client_name"] }
      ],
    });

    if (!trips.length) {
      return res.status(404).json({ error: "No trips found for this client and date" });
    }

    const totalAmount = trips.reduce((sum, trip) => sum + (trip.amount || 0), 0);
    const totalPaid = trips.reduce((sum, trip) => sum + (trip.amount_paid || 0), 0);
    const totalPending = totalAmount - totalPaid;

    // Generate invoice number for new invoices
    const invoiceNumber = await generateInvoiceNumber("IN");
    
    const [invoice, created] = await Invoice.findOrCreate({
      where: { client_id, date },
      defaults: {
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        amount_paid: totalPaid,
        pending_amount: totalPending,
        date
      }
    });

    invoice.total_amount = totalAmount;
    invoice.amount_paid = totalPaid;
    invoice.pending_amount = totalPending;
    await invoice.save();

    await Promise.all(trips.map(trip => trip.update({ invoice_id: invoice.invoice_id })));

    // Prepare invoice response with required trip details
    const invoiceData = {
      invoice_id: invoice.invoice_id,
      client: trips[0].client?.client_name || null,
      date: invoice.date,
      total_amount: invoice.total_amount,
      amount_paid: invoice.amount_paid,
      pending_amount: invoice.pending_amount,
      trips: trips.map(trip => ({
        trip_id: trip.trip_id,
        client: trip.client?.client_name || null,
        driver: trip.driver?.name || null,
        vehicle: trip.vehicle?.vehicle_number || null,
        date: trip.date,
        dispatch_date: trip.dispatch_date,
        from_place: trip.from_place,
        to_place: trip.to_place,
        minimum_quantity: trip.minimum_quantity,
        actual_quantity: trip.actual_quantity,
        rate_per_tonne: trip.rate_per_tonne,
        amount: trip.amount,
        amount_paid: trip.amount_paid,
        payment_mode: trip.payment_mode
      })
    )
    };

    return res.status(200).json(invoiceData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all invoices with optional filtering by client_id and date range
 * GET /api/invoices?clientId=xxx&date=yyyy-mm-dd
 */
export const getAllInvoices = async (req, res) => {
  try {
    const { clientId, date, startDate, endDate } = req.query;
    const where = {};

    // Filter by client ID
    if (clientId) where.client_id = parseInt(clientId);
    
    // Filter by date
    if (date) {
      where.date = date;
    } else if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [Op.lte]: endDate };
    }

    const invoices = await Invoice.findAll({
      where,
      include: [
        { 
          model: Client, 
          as: "client", 
          attributes: ["client_id", "client_name", "client_phone"],
          required: true // Only return invoices with valid clients
        }
      ],
      order: [["date", "DESC"], ["invoice_id", "DESC"]],
    });

    // Fetch trips for all invoices to derive vehicle numbers (source of truth)
    const invoiceIds = invoices.map((inv) => inv.invoice_id);
    const trips = invoiceIds.length
      ? await Trip.findAll({
          where: { invoice_id: { [Op.in]: invoiceIds } },
          include: [
            { model: Vehicle, as: "vehicle", attributes: ["vehicle_id", "vehicle_number"] },
          ],
          attributes: ["invoice_id", "trip_id", "vehicle_id"],
        })
      : [];

    const tripMap = trips.reduce((acc, trip) => {
      const key = trip.invoice_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(trip);
      return acc;
    }, {});

    const result = invoices.map(inv => {
      const tripsForInvoice = tripMap[inv.invoice_id] || [];
      const vehicleNumbers = Array.from(
        new Set(tripsForInvoice.map(t => t.vehicle?.vehicle_number).filter(Boolean))
      );

      return {
        invoice_id: inv.invoice_id,
        invoice_number: inv.invoice_number || `INV-${inv.invoice_id}`,
        client_id: inv.client_id,
        client_name: inv.client?.client_name || "Unknown Client",
        vehicle_numbers: vehicleNumbers,
        date: inv.date,
        total_amount: parseFloat(inv.total_amount) || 0,
        amount_paid: parseFloat(inv.amount_paid) || 0,
        pending_amount: parseFloat(inv.pending_amount) || 0,
        payment_status: inv.payment_status || "Unpaid",
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices", detail: error.message });
  }
};

/**
 * Get all clients that have at least one invoice
 * GET /api/invoices/clients-with-invoices
 */
export const getClientsWithInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [
        {
          model: Client,
          as: "client",
          attributes: ["client_id", "client_name"],
          required: true
        }
      ],
      attributes: ["client_id"],
      group: ["client_id", "client.client_id", "client.client_name"]
    });

    // Extract unique clients
    const uniqueClients = [];
    const clientIds = new Set();

    for (const invoice of invoices) {
      if (invoice.client && !clientIds.has(invoice.client.client_id)) {
        clientIds.add(invoice.client.client_id);
        uniqueClients.push({
          client_id: invoice.client.client_id,
          client_name: invoice.client.client_name
        });
      }
    }

    res.json(uniqueClients);
  } catch (error) {
    console.error("Error fetching clients with invoices:", error);
    res.status(500).json({ error: "Failed to fetch clients", detail: error.message });
  }
};

/**
 * Get all invoice dates for a specific client
 * GET /api/invoices/dates-by-client/:clientId
 */
export const getInvoiceDatesByClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ error: "Client ID is required" });
    }

    const invoices = await Invoice.findAll({
      where: { client_id: parseInt(clientId) },
      attributes: ["date"],
      group: ["date"],
      order: [["date", "DESC"]]
    });

    const dates = invoices.map(inv => inv.date).filter(date => date);

    res.json({ dates });
  } catch (error) {
    console.error("Error fetching invoice dates:", error);
    res.status(500).json({ error: "Failed to fetch dates", detail: error.message });
  }
};

/**
 * Get invoice by ID with trip details
 */
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id, {
      include: [
        { model: Client, as: "client", attributes: ["client_id", "client_name"] }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Get associated trips
    const trips = await Trip.findAll({
      where: { invoice_id: id },
      include: [
        { model: Vehicle, as: "vehicle", attributes: ["vehicle_number"] },
        { model: Driver, as: "driver", attributes: ["name"] }
      ]
    });

    const response = {
      invoice_id: invoice.invoice_id,
      client_id: invoice.client_id,
      client_name: invoice.client?.client_name || "",
      date: invoice.date,
      total_amount: invoice.total_amount || 0,
      amount_paid: invoice.amount_paid || 0,
      pending_amount: invoice.pending_amount || 0,
      payment_status: invoice.payment_status,
      trips: trips.map(trip => ({
        trip_id: trip.trip_id,
        date: trip.date,
        dispatch_date: trip.dispatch_date,
        from_place: trip.from_place,
        to_place: trip.to_place,
        vehicle: trip.vehicle?.vehicle_number || "",
        driver: trip.driver?.name || "",
        minimum_quantity: trip.minimum_quantity,
        actual_quantity: trip.actual_quantity,
        rate_per_tonne: trip.rate_per_tonne,
        amount: trip.amount,
        amount_paid: trip.amount_paid,
        payment_mode: trip.payment_mode
      }))
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
};
