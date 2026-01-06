import { Trip, Client, Driver, Vehicle } from "../models/index.js";
import { Op } from "sequelize";

// Helper: Validate trip input data
const validateTripData = (data) => {
  const requiredFields = [
    "client_id",
    "driver_id",
    "vehicle_id",
    "date",
    "dispatch_date",
    "from_place",
    "to_place",
    "minimum_quantity",
    "actual_quantity",
    "rate_per_tonne",
    "payment_mode",
  ];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      return `Missing required field: ${field}`;
    }
  }

  const validPaymentModes = ["Cash", "UPI", "Cheque"];
  if (!validPaymentModes.includes(data.payment_mode)) {
    return `Invalid payment_mode. Must be one of: ${validPaymentModes.join(", ")}`;
  }

  if (parseFloat(data.actual_quantity) < parseFloat(data.minimum_quantity)) {
    return "Actual quantity cannot be less than minimum quantity";
  }

  return null;
};

// Get all trips with related entities included
export const getTrips = async (req, res) => {
  try {
    const trips = await Trip.findAll({
      include: [
        { model: Client, as: "client" },
        { model: Driver, as: "driver" },
        { model: Vehicle, as: "vehicle" },
      ],
      order: [["date", "DESC"]],
    });
    res.json({ trips });
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ error: "Failed to fetch trips" });
  }
};

// Create new trip
export const createTrip = async (req, res) => {
  try {
    // Normalize payment mode capitalization
    if (req.body.payment_mode) {
      req.body.payment_mode =
        req.body.payment_mode.charAt(0).toUpperCase() + req.body.payment_mode.slice(1).toLowerCase();
    }

    // Validate input data
    const validationError = validateTripData(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Check if driver is active
    const driver = await Driver.findByPk(req.body.driver_id);
    if (!driver) {
      return res.status(400).json({ error: "Driver not found" });
    }
    if (driver.status === 'inactive') {
      return res.status(400).json({ error: "Cannot assign inactive driver to trip" });
    }

    // Check if vehicle is active (if status field exists)
    const vehicle = await Vehicle.findByPk(req.body.vehicle_id);
    if (!vehicle) {
      return res.status(400).json({ error: "Vehicle not found" });
    }
    if (vehicle.status === 'Inactive') {
      return res.status(400).json({ error: "Cannot assign inactive vehicle to trip" });
    }

    // Check if client is active (if status field exists)
    const client = await Client.findByPk(req.body.client_id);
    if (!client) {
      return res.status(400).json({ error: "Client not found" });
    }
    if (client.status === 'Inactive') {
      return res.status(400).json({ error: "Cannot create trip for inactive client" });
    }

    // Parse and prepare payload
    const payload = {
      client_id: Number(req.body.client_id),
      driver_id: Number(req.body.driver_id),
      vehicle_id: Number(req.body.vehicle_id),
      date: req.body.date,
      dispatch_date: req.body.dispatch_date,
      from_place: req.body.from_place.trim(),
      to_place: req.body.to_place.trim(),
      minimum_quantity: parseFloat(req.body.minimum_quantity),
      actual_quantity: parseFloat(req.body.actual_quantity),
      rate_per_tonne: parseFloat(req.body.rate_per_tonne),
      diesel_litre: parseFloat(req.body.diesel_litre) || 0,
      diesel_payment: parseFloat(req.body.diesel_payment) || 0,
      amount: parseFloat(req.body.amount) || 0,
      amount_paid: parseFloat(req.body.amount_paid) || 0,
      payment_mode: req.body.payment_mode,
    };

    // Create trip record in database
    const trip = await Trip.create(payload);
    res.status(201).json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ error: "Failed to create trip" });
  }
};

// Delete trip by id - PROTECTED: Cannot delete invoiced trips
export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findByPk(id);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    // Check if trip is invoiced - CANNOT delete
    if (trip.invoice_id || trip.is_invoiced) {
      return res.status(400).json({ 
        error: "Cannot delete trip: Trip is already invoiced. Delete the invoice first." 
      });
    }

    await trip.destroy();
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({ error: "Failed to delete trip" });
  }
};

// Update trip status - PROTECTED: Cannot modify invoiced trips
export const updateTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Running', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const trip = await Trip.findByPk(id);
    if (!trip) {
      return res.status(404).json({ 
        success: false,
        error: "Trip not found" 
      });
    }

    // Check if trip is invoiced - CANNOT modify status
    if (trip.invoice_id || trip.is_invoiced) {
      return res.status(400).json({ 
        success: false,
        error: "Cannot modify trip: Trip is already invoiced and locked." 
      });
    }

    await trip.update({ status });
    
    res.json({ 
      success: true,
      message: "Trip status updated successfully",
      trip 
    });
  } catch (error) {
    console.error("Error updating trip status:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update trip status" 
    });
  }
};

// Bulk delete trips by array of ids
export const bulkDeleteTrips = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "Invalid request. 'ids' array required." });
    }

    await Trip.destroy({
      where: {
        trip_id: {
          [Op.in]: ids,
        },
      },
    });
    res.json({ message: "Trips deleted successfully" });
  } catch (error) {
    console.error("Error bulk deleting trips:", error);
    res.status(500).json({ error: "Failed to bulk delete trips" });
  }
};

// Get trips by client ID with all related data
export const getTripsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ error: "Client ID is required" });
    }

    const trips = await Trip.findAll({
      where: { client_id: clientId },
      include: [
        { model: Client, as: "client", attributes: ["client_id", "client_name"] },
        { model: Driver, as: "driver", attributes: ["id", "name", "license_number"] },
        { model: Vehicle, as: "vehicle", attributes: ["vehicle_id", "vehicle_number"] },
      ],
      order: [["dispatch_date", "DESC"]],
    });

    // Extract unique dates from trips
    const uniqueDates = [...new Set(trips.map(trip => trip.dispatch_date))]
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => ({
        iso: date,
        display: new Date(date).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      }));

    res.json({ 
      trips,
      dates: uniqueDates,
      count: trips.length 
    });
  } catch (error) {
    console.error("Error fetching trips by client:", error);
    res.status(500).json({ error: "Failed to fetch trips by client" });
  }
};

// Filter trips by client ID and date
export const filterTrips = async (req, res) => {
  try {
    const { clientId, date } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: "Client ID is required" });
    }

    const where = { client_id: clientId };

    // Add date filter if provided
    if (date) {
      where.dispatch_date = date;
    }

    const trips = await Trip.findAll({
      where,
      include: [
        { model: Client, as: "client", attributes: ["client_id", "client_name"] },
        { model: Driver, as: "driver", attributes: ["id", "name", "license_number"] },
        { model: Vehicle, as: "vehicle", attributes: ["vehicle_id", "vehicle_number"] },
      ],
      order: [["dispatch_date", "DESC"], ["date", "DESC"]],
    });

    const totalAmount = trips.reduce((sum, trip) => sum + (Number(trip.amount) || 0), 0);
    const totalPaid = trips.reduce((sum, trip) => sum + (Number(trip.amount_paid) || 0), 0);
    const totalPending = totalAmount - totalPaid;

    res.json({ 
      trips,
      count: trips.length,
      summary: {
        totalAmount,
        totalPaid,
        totalPending
      }
    });
  } catch (error) {
    console.error("Error filtering trips:", error);
    res.status(500).json({ error: "Failed to filter trips" });
  }
};
