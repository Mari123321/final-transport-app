import express from "express";
import { Driver, Client, Vehicle, Trip, Invoice } from "../models/index.js";
import { Sequelize } from "sequelize";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const totalDrivers = await Driver.count();
    const totalClients = await Client.count();
    const totalVehicles = await Vehicle.count();
    const totalTrips = await Trip.count();

    // Pending invoices (adjust the value if your actual pending status is different, e.g., "Unpaid")
    const pendingInvoices = await Invoice.count({
      where: { payment_status: "pending" },
    });

    const pendingAmountData = await Invoice.findAll({
      attributes: [[Sequelize.fn("SUM", Sequelize.col("amount")), "total"]],
      where: { payment_status: "pending" },
      raw: true,
    });
    const pendingAmount = pendingAmountData[0]?.total || 0;

    // Revenue by month (for last 6 months), using `date` column
    const revenueByMonth = await Invoice.findAll({
      attributes: [
        [Sequelize.fn("DATE_FORMAT", Sequelize.col("date"), "%Y-%m"), "month"],
        [Sequelize.fn("SUM", Sequelize.col("amount")), "revenue"],
      ],
      where: { payment_status: "paid" },
      group: [Sequelize.fn("DATE_FORMAT", Sequelize.col("date"), "%Y-%m")],
      order: [[Sequelize.fn("DATE_FORMAT", Sequelize.col("date"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    res.json({
      totalDrivers,
      totalClients,
      totalVehicles,
      totalTrips,
      pendingInvoices,
      pendingAmount,
      revenueByMonth,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});

export default router;
