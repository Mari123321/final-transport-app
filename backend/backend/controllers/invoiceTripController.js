// backend/controllers/invoiceTripController.js
import { InvoiceTrip } from '../models/index.js';

// Get all invoice-trips
export const getAllInvoiceTrips = async (req, res) => {
  try {
    const trips = await InvoiceTrip.findAll();
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice trips' });
  }
};

// Get invoice-trip by ID
export const getInvoiceTripById = async (req, res) => {
  try {
    const trip = await InvoiceTrip.findByPk(req.params.id);
    if (trip) {
      res.json(trip);
    } else {
      res.status(404).json({ error: 'Invoice trip not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice trip' });
  }
};

// Create a new invoice-trip
export const createInvoiceTrip = async (req, res) => {
  try {
    const { invoiceId, tripDetails, totalAmount } = req.body;

    const newTrip = await InvoiceTrip.create({
      invoiceId,
      tripDetails,
      totalAmount
    });

    res.status(201).json(newTrip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice trip' });
  }
};

// Update an invoice-trip
export const updateInvoiceTrip = async (req, res) => {
  try {
    const trip = await InvoiceTrip.findByPk(req.params.id);
    if (trip) {
      const { invoiceId, tripDetails, totalAmount } = req.body;

      await trip.update({
        invoiceId,
        tripDetails,
        totalAmount
      });

      res.json(trip);
    } else {
      res.status(404).json({ error: 'Invoice trip not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice trip' });
  }
};

// Delete an invoice-trip
export const deleteInvoiceTrip = async (req, res) => {
  try {
    const trip = await InvoiceTrip.findByPk(req.params.id);
    if (trip) {
      await trip.destroy();
      res.json({ message: 'Invoice trip deleted successfully' });
    } else {
      res.status(404).json({ error: 'Invoice trip not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice trip' });
  }
};
