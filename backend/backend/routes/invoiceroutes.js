import express from "express";
import {
  createInvoiceFromTrips,
  createOrFetchInvoice,
  getAllInvoices,
  getInvoiceById,
  getClientsWithInvoices,
  getInvoiceDatesByClient,
} from "../controllers/invoiceController.js";
import db from "../models/index.js";
import { Op, where, fn, col } from "sequelize";

const { Trip, Client } = db;
const router = express.Router();

// ============================================================
// INVOICE CREATION & RETRIEVAL
// ============================================================

// Get invoice preview (trips data for creating invoice)
// Query params: clientId, date
// IMPORTANT: This must come BEFORE /:id route to avoid conflicts
router.get("/create-preview", async (req, res) => {
  try {
    const { clientId, date } = req.query;

    if (!clientId || !date) {
      return res.status(400).json({ error: "clientId and date are required" });
    }

    // Fetch trips for the client on the specified date (DATE-only comparison)
    const trips = await Trip.findAll({
      where: {
        client_id: parseInt(clientId),
        [Op.and]: where(fn("DATE", col("date")), Op.eq, date),
      },
      include: [
        { model: Client, as: "client", attributes: ["client_id", "client_name"] },
      ],
      attributes: [
        "trip_id",
        "client_id",
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
        "driver_id",
      ],
      order: [["trip_id", "ASC"]],
    });

    if (!trips || trips.length === 0) {
      return res.status(404).json({
        error: "No trips found for this client and date",
        data: [],
      });
    }

    // Format response
    const formattedTrips = trips.map((trip) => ({
      trip_id: trip.trip_id,
      client_id: trip.client_id,
      client_name: trip.client?.client_name || "",
      date: trip.dispatch_date,
      from_place: trip.from_place,
      to_place: trip.to_place,
      minimum_quantity: trip.minimum_quantity,
      actual_quantity: trip.actual_quantity,
      rate_per_tonne: trip.rate_per_tonne,
      amount: trip.amount || 0,
      amount_paid: trip.amount_paid || 0,
      pending_amount: (trip.amount || 0) - (trip.amount_paid || 0),
      payment_mode: trip.payment_mode,
      vehicle_id: trip.vehicle_id,
      driver_id: trip.driver_id,
    }));

    res.json(formattedTrips);
  } catch (error) {
    console.error("Error fetching invoice preview:", error);
    res.status(500).json({ error: "Failed to fetch invoice preview" });
  }
});

// Get clients that have invoices (MUST BE BEFORE /:id)
router.get("/clients-with-invoices", getClientsWithInvoices);

// Get invoice dates by client (MUST BE BEFORE /:id)
router.get("/dates-by-client/:clientId", getInvoiceDatesByClient);

// Get all invoices (with optional filtering by clientId, startDate, endDate)
router.get("/", getAllInvoices);

// Get invoice by ID with trip details
router.get("/:id", getInvoiceById);

// Get available dates for invoice generation (DISTINCT dates from trips for a client)
router.get("/available-dates/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId || isNaN(clientId)) {
      return res.status(400).json({ error: "Valid clientId is required" });
    }

    // Fetch DISTINCT dates from trips for the client (sorted latest first)
    const trips = await Trip.findAll({
      where: { client_id: clientId },
      attributes: [
        [
          Trip.sequelize.fn("DATE", Trip.sequelize.col("date")),
          "date",
        ],
      ],
      order: [[Trip.sequelize.fn("DATE", Trip.sequelize.col("date")), "DESC"]],
      raw: true,
      subQuery: false,
      group: [Trip.sequelize.fn("DATE", Trip.sequelize.col("date"))],
    });

    if (!trips || trips.length === 0) {
      return res.json({
        dates: [],
        message: "No trips found for this client",
      });
    }

    // Format dates (DD-MM-YYYY) and clean up
    const dates = trips
      .map(t => t.date)
      .filter(d => d) // Remove nulls
      .map(d => {
        const date = new Date(d);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return {
          iso: d, // ISO format for API calls
          display: `${day}-${month}-${year}`, // Display format
        };
      });

    // Remove duplicates (in case there are any)
    const uniqueDates = Array.from(
      new Map(dates.map(d => [d.iso, d])).values()
    );

    res.json({
      dates: uniqueDates,
      message: `Found ${uniqueDates.length} available dates for this client`,
    });
  } catch (error) {
    console.error("Error fetching available dates:", error);
    res.status(500).json({ error: "Failed to fetch available dates" });
  }
});

// ============================================================
// INVOICE CREATION ENDPOINTS
// ============================================================

// Create invoice from multiple selected trips (Invoice Creation Page)
router.post("/", createInvoiceFromTrips);

// Create or fetch invoice (legacy endpoint)
router.post("/legacy", createOrFetchInvoice);

export default router;
