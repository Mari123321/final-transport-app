import express from "express";
import { 
  createOrFetchInvoice, 
  getAllInvoices, 
  getInvoiceById 
} from "../controllers/invoiceController.js";
import db from "../models/index.js";

const { Trip } = db;
const router = express.Router();

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

// Create or fetch invoice
router.post("/", createOrFetchInvoice);

export default router;
