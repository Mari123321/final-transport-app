import express from 'express';
import { Op } from 'sequelize';
import { Trip, Client, Driver, Vehicle } from '../models/index.js';

const router = express.Router();

const validateTripData = (data) => {
  const requiredFields = [
    'client_id',
    'driver_id',
    'vehicle_id',
    'date',
    'dispatch_date',
    'from_place',
    'to_place',
    'minimum_quantity',
    'rate_per_tonne',
    'payment_mode',
  ];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      return `Missing field: ${field}`;
    }
  }

  const validPaymentModes = ['Cash', 'UPI', 'Cheque'];
  if (!validPaymentModes.includes(data.payment_mode)) {
    return `Invalid payment_mode. Must be one of ${validPaymentModes.join(', ')}`;
  }

  if (parseFloat(data.minimum_quantity) < 0) {
    return 'Minimum quantity must be non-negative';
  }
  if (parseFloat(data.rate_per_tonne) < 0) {
    return 'Rate per tonne must be non-negative';
  }

  return null;
};

router.get('/', async (req, res) => {
  try {
    const trips = await Trip.findAll({
      include: [
        { model: Client, as: 'client', attributes: ['client_id', 'client_name'] },
        { model: Driver, as: 'driver', attributes: ['id', 'name'] },
        { model: Vehicle, as: 'vehicle', attributes: ['vehicle_id', 'vehicle_number'] },
      ],
      order: [['date', 'DESC']],
    });
    res.json({ trips });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('Received trip create request:', req.body);

    const error = validateTripData(req.body);
    if (error) return res.status(400).json({ error });

    const {
      client_id,
      driver_id,
      vehicle_id,
      date,
      dispatch_date,
      from_place,
      to_place,
      minimum_quantity,
      rate_per_tonne,
      payment_mode,
      diesel_litre,
      diesel_payment,
      amount,
      amount_paid,
    } = req.body;

    const tripData = {
      client_id: Number(client_id),
      driver_id: Number(driver_id),
      vehicle_id: Number(vehicle_id),
      date,
      dispatch_date,
      from_place: from_place.trim(),
      to_place: to_place.trim(),
      minimum_quantity: parseFloat(minimum_quantity),
      actual_quantity: parseFloat(minimum_quantity), // set actual same as minimum by default
      rate_per_tonne: parseFloat(rate_per_tonne),
      diesel_litre: parseFloat(diesel_litre) || 0,
      diesel_payment: parseFloat(diesel_payment) || 0,
      amount: parseFloat(amount) || parseFloat(minimum_quantity) * parseFloat(rate_per_tonne),
      amount_paid: parseFloat(amount_paid) || 0,
      payment_mode,
      pending_amount: (parseFloat(amount) || 0) - (parseFloat(amount_paid) || 0),
    };

    const newTrip = await Trip.create(tripData);
    res.status(201).json({ message: 'Trip created successfully', trip: newTrip });
  } catch (err) {
    console.error('Error creating trip:', err);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const {
      date,
      dispatch_date,
      from_place,
      to_place,
      minimum_quantity,
      rate_per_tonne,
      diesel_litre,
      diesel_payment,
      amount,
      amount_paid,
      payment_mode,
    } = req.body;

    const updatedFields = {
      date,
      dispatch_date,
      from_place,
      to_place,
      minimum_quantity,
      rate_per_tonne,
      diesel_litre,
      diesel_payment,
      amount,
      amount_paid,
      payment_mode,
      pending_amount: (amount || 0) - (amount_paid || 0),
    };

    Object.assign(trip, updatedFields);
    await trip.save();

    res.json({ message: 'Trip updated successfully', trip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    await trip.destroy();
    res.json({ message: 'Trip deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'Invalid ids array' });

    await Trip.destroy({ where: { trip_id: { [Op.in]: ids } } });
    res.json({ message: 'Trips deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to bulk delete trips' });
  }
});

// Update trip status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Running', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const trip = await Trip.findByPk(id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    await trip.update({ status });
    res.json({ success: true, message: 'Status updated', trip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update trip status' });
  }
});

// Get trips by client ID
router.get('/by-client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const trips = await Trip.findAll({
      where: { client_id: clientId },
      include: [
        { model: Client, as: 'client', attributes: ['client_id', 'client_name'] },
        { model: Driver, as: 'driver', attributes: ['id', 'name', 'license_number'] },
        { model: Vehicle, as: 'vehicle', attributes: ['vehicle_id', 'vehicle_number'] },
      ],
      order: [['dispatch_date', 'DESC']],
    });

    // Extract unique dates from trips
    const uniqueDates = [...new Set(trips.map(trip => trip.dispatch_date))]
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => ({
        iso: date,
        display: new Date(date).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      }));

    res.json({ 
      trips,
      dates: uniqueDates,
      count: trips.length 
    });
  } catch (err) {
    console.error('Error fetching trips by client:', err);
    res.status(500).json({ error: 'Failed to fetch trips by client' });
  }
});

// Filter trips by client ID and date
router.get('/filter', async (req, res) => {
  try {
    const { clientId, date } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const where = { client_id: clientId };

    // Add date filter if provided
    if (date) {
      where.dispatch_date = date;
    }

    const trips = await Trip.findAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['client_id', 'client_name'] },
        { model: Driver, as: 'driver', attributes: ['id', 'name', 'license_number'] },
        { model: Vehicle, as: 'vehicle', attributes: ['vehicle_id', 'vehicle_number'] },
      ],
      order: [['dispatch_date', 'DESC'], ['date', 'DESC']],
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
  } catch (err) {
    console.error('Error filtering trips:', err);
    res.status(500).json({ error: 'Failed to filter trips' });
  }
});

export default router;
