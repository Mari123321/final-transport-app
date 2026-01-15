// controllers/notificationController.js
import { Invoice, Driver, Vehicle, sequelize } from "../models/index.js";
import { Op } from "sequelize";

export const getNotifications = async (req, res) => {
  try {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    // 1. HIGH PRIORITY: Pending Amount > 200,000
    const highPendingAmount = await Invoice.findAll({
      where: {
        payment_status: { [Op.in]: ["Unpaid", "Partial"] },
      },
      attributes: [
        "invoice_id",
        "invoice_no",
        "total_amount",
        "paid_amount",
        "client_id",
      ],
    });

    const criticalInvoices = highPendingAmount
      .map((inv) => {
        const pending = parseFloat(inv.total_amount || 0) - parseFloat(inv.paid_amount || 0);
        return {
          id: inv.invoice_id,
          invoice_no: inv.invoice_no || `INV-${inv.invoice_id}`,
          pending_amount: pending,
          total_amount: parseFloat(inv.total_amount || 0),
        };
      })
      .filter((inv) => inv.pending_amount > 200000)
      .slice(0, 5);

    // 2. Driver Licenses Expiring within 30 days
    const expiringLicenses = await Driver.findAll({
      where: {
        license_expiry_date: {
          [Op.between]: [today, next30Days],
        },
      },
      attributes: ["driver_id", "driver_name", "license_number", "license_expiry_date"],
      limit: 5,
    });

    // 3. Vehicle RC Expiring within 30 days
    const expiringRC = await Vehicle.findAll({
      where: {
        rc_expiry_date: {
          [Op.between]: [today, next30Days],
        },
      },
      attributes: ["vehicle_id", "vehicle_number", "rc_expiry_date"],
      limit: 5,
    });

    // Format response
    const formattedCriticalInvoices = criticalInvoices.map((inv) => ({
      id: inv.id,
      invoice_no: inv.invoice_no,
      pending_amount: inv.pending_amount.toFixed(2),
      total_amount: inv.total_amount.toFixed(2),
      type: "critical_payment",
    }));

    const formattedLicenses = expiringLicenses.map((lic) => ({
      driver_id: lic.driver_id,
      driver_name: lic.driver_name,
      license_number: lic.license_number,
      expiry_date: lic.license_expiry_date,
      type: "license_expiry",
    }));

    const formattedRC = expiringRC.map((rc) => ({
      vehicle_id: rc.vehicle_id,
      vehicle_number: rc.vehicle_number,
      expiry_date: rc.rc_expiry_date,
      type: "rc_expiry",
    }));

    res.json({
      criticalPayments: formattedCriticalInvoices,
      expiringLicenses: formattedLicenses,
      expiringRC: formattedRC,
    });
  } catch (error) {
    console.error("Notification fetch error:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};
