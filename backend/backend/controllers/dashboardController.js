import { Driver, Client, Vehicle, Trip, Invoice, Expense } from "../models/index.js";
import { Op, fn, col } from "sequelize";

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Basic counts
    const totalDrivers = await Driver.count();
    const totalClients = await Client.count();
    const totalVehicles = await Vehicle.count();
    const totalTrips = await Trip.count();

    // Today's trips
    const todayTrips = await Trip.count({
      where: {
        date: {
          [Op.gte]: startOfToday
        }
      }
    });

    // Trips by status (assuming you have a status field)
    const tripsRunning = await Trip.count({
      where: { 
        status: 'Running',
        date: { [Op.gte]: startOfToday }
      }
    });

    const tripsCompleted = await Trip.count({
      where: { 
        status: 'Completed',
        date: { [Op.gte]: startOfToday }
      }
    });

    const tripsPending = await Trip.count({
      where: { 
        status: 'Pending',
        date: { [Op.gte]: startOfToday }
      }
    });

    // This month's revenue
    const monthlyRevenue = await Trip.sum('amount', {
      where: {
        date: {
          [Op.gte]: startOfMonth
        }
      }
    }) || 0;

    // This month's fuel cost
    const monthlyFuelCost = await Expense.sum('amount', {
      where: {
        expense_type: 'Fuel',
        date: {
          [Op.gte]: startOfMonth
        }
      }
    }) || 0;

    // Pending payments
    const pendingInvoices = await Invoice.findAll({
      where: { 
        payment_status: { [Op.in]: ['Pending', 'Partial'] }
      },
      attributes: ['pending_amount']
    });

    const pendingPayments = pendingInvoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.pending_amount) || 0),
      0
    );

    // Recent trips (last 5)
    const recentTrips = await Trip.findAll({
      include: [
        { model: Client, as: 'client', attributes: ['client_name'] },
        { model: Driver, as: 'driver', attributes: ['name'] },
        { model: Vehicle, as: 'vehicle', attributes: ['vehicle_number'] }
      ],
      order: [['date', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      stats: {
        drivers: totalDrivers,
        clients: totalClients,
        vehicles: totalVehicles,
        trips: totalTrips,
        todayTrips,
        tripsRunning,
        tripsCompleted,
        tripsPending,
        monthlyRevenue: parseFloat(monthlyRevenue).toFixed(2),
        monthlyFuelCost: parseFloat(monthlyFuelCost).toFixed(2),
        pendingPayments: parseFloat(pendingPayments).toFixed(2),
        profit: parseFloat(monthlyRevenue - monthlyFuelCost).toFixed(2)
      },
      recentTrips,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message 
    });
  }
};
