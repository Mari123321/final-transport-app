// backend/jobs/licenseAlerts.js
import cron from "node-cron";
import { Op } from "sequelize";
import Driver from "../models/driverModel.js";

export function startLicenseAlertJob() {
  // Run every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    try {
      const today = new Date();
      const in30 = new Date();
      in30.setDate(today.getDate() + 30);

      // Find licenses expiring in the next 30 days
      const expiring = await Driver.findAll({
        where: {
          license_expiry_date: {
            [Op.between]: [
              today.toISOString().slice(0, 10),
              in30.toISOString().slice(0, 10),
            ],
          },
        },
        order: [["license_expiry_date", "ASC"]],
      });

      // Find already expired licenses
      const expired = await Driver.findAll({
        where: {
          license_expiry_date: { [Op.lt]: today.toISOString().slice(0, 10) },
        },
        order: [["license_expiry_date", "ASC"]],
      });

      expiring.forEach((d) =>
        console.warn(
          `⚠️ License expiring soon: ${d.name} (${d.driver_no}) on ${d.license_expiry_date}`
        )
      );

      expired.forEach((d) =>
        console.error(
          `⛔ License expired: ${d.name} (${d.driver_no}) on ${d.license_expiry_date}`
        )
      );
    } catch (err) {
      console.error("❌ License alert job failed:", err);
    }
  });
}
