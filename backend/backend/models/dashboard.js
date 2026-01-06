// routes/dashboard.js
import express from "express";
import { Driver, Client, Vehicle, Trip, Invoice } from "../models/index.js";
import { Sequelize } from "sequelize";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const totalDrivers = await Driver.count();
    const totalClients = await Client.count();
    const totalVehicles = await Vehicle.count();

    // Income = SUM of all paid invoices
    const totalIncomeData = await Invoice.findAll({
      attributes: [[Sequelize.fn("SUM", Sequelize.col("amount")), "income"]],
      where: { status: "paid" },
      raw: true,
    });
    const totalIncome = totalIncomeData[0]?.income || 0;

    // Revenue grouped by month
    const revenueByMonth = await Invoice.findAll({
      attributes: [
        [Sequelize.fn("DATE_FORMAT", Sequelize.col("invoice_date"), "%Y-%m"), "month"],
        [Sequelize.fn("SUM", Sequelize.col("amount")), "revenue"],
      ],
      where: { status: "paid" },
      group: ["month"],
      order: [[Sequelize.literal("month"), "ASC"]],
      raw: true,
    });

    res.json({
      totalDrivers,
      totalClients,
      totalVehicles,
      totalIncome,
      revenueByMonth,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});

export default router;
