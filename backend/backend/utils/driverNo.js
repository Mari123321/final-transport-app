// utils/driverNo.js
import Driver from "../models/driverModel.js";

export async function generateDriverNo(name) {
  if (!name || name.length < 2) {
    throw new Error("Driver name must have at least 2 characters");
  }

  // Take first 2 letters (uppercase)
  const prefix = name.substring(0, 2).toUpperCase();

  // Count how many drivers already exist with same prefix
  const count = await Driver.count({
    where: {
      driver_no: { [Driver.sequelize.Op.like]: `${prefix}%` }
    }
  });

  // Next number (padded with 2 digits: 01, 02, 03…)
  const nextNumber = String(count + 1).padStart(2, "0");

  return `${prefix}${nextNumber}`;
}
