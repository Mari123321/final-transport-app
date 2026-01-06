// controllers/notificationController.js
import { Invoice, Driver } from "../models/index.js";
import { Op } from "sequelize";

export const getNotifications = async (req, res) => {
  try {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    // 1. Pending (Unpaid) Invoices
    const pendingInvoices = await Invoice.findAll({
      where: { payment_status: "Unpaid" },
      attributes: ["invoice_id", "total_amount", "client_id"],
    });

    // 2. Driver Licenses Expiring within 30 days
    const expiringLicenses = await Driver.findAll({
      where: {
        license_expiry_date: {
          [Op.between]: [today, next30Days],
        },
      },
      attributes: ["id", "name", "license_number", "license_expiry_date"],
    });

    res.json({
      pendingInvoices,
      expiringLicenses,
    });
  } catch (error) {
    console.error("Notification fetch error:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};
