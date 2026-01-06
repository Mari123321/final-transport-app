import { Trip, Invoice, Payment } from "../models/index.js";
import { Op, fn, col, literal } from "sequelize";

export const getMonthlyAnalytics = async (req, res) => {
  try {
    const result = await Trip.findAll({
      attributes: [
        [fn("MONTH", col("date")), "month"],
        [fn("YEAR", col("date")), "year"],
        [fn("COUNT", col("id")), "tripCount"],
        [fn("SUM", col("totalAmount")), "totalRevenue"],
        [fn("SUM", col("profit")), "totalProfit"],
      ],
      group: [fn("MONTH", col("date")), fn("YEAR", col("date"))],
      order: [[fn("YEAR", col("date")), "ASC"], [fn("MONTH", col("date")), "ASC"]],
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
};
