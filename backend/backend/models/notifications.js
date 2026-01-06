// routes/notifications.js
import express from "express";
import { Invoice, Driver } from "./index.js";
import { Op } from "sequelize";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // 1. Pending invoices
    const pendingInvoices = await Invoice.findAll({
      where: { status: "pending" },
      attributes: ["invoice_id", "client_id", "amount"],
      raw: true,
    });

    // 2. Licenses expiring in next 30 days
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);

    const expiringLicenses = await Driver.findAll({
      where: {
        license_expiry: {
          [Op.between]: [today, nextMonth],
        },
      },
      attributes: ["driver_id", "name", "license_number", "license_expiry"],
      raw: true,
    });

    res.json({
      pendingInvoices,
      expiringLicenses,
    });
  } catch (error) {
    console.error("Notifications error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

export default router;
