import { Op, fn, col, where } from "sequelize";
import db from "../models/index.js";

const { Invoice, Trip, Client, Vehicle, Driver, ExtraCharge } = db;

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

    const [invoice] = await Invoice.findOrCreate({
      where: { client_id, date },
      defaults: {
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
 */
export const getAllInvoices = async (req, res) => {
  try {
    const { clientId, date, startDate, endDate } = req.query;
    const where = {};

    if (clientId) where.client_id = clientId;
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
        { model: Client, as: "client", attributes: ["client_id", "client_name"] }
      ],
      order: [["date", "DESC"]],
    });

    const result = invoices.map(inv => ({
      invoice_id: inv.invoice_id,
      client_id: inv.client_id,
      client_name: inv.client?.client_name || "",
      date: inv.date,
      total_amount: inv.total_amount || 0,
      amount_paid: inv.amount_paid || 0,
      pending_amount: inv.pending_amount || 0,
      payment_status: inv.payment_status || "Unpaid",
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
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
