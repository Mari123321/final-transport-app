// utils/driverNo.js
import { Op } from "sequelize";
import Driver from "../models/driverModel.js";

export async function generateDriverNo(name) {
  const prefix = (name || "")
    .replace(/[^a-z]/gi, "")
    .slice(0, 2)
    .toUpperCase()
    .padEnd(2, "X"); // ensure 2 chars

  // Find the highest existing suffix for this prefix, e.g., JO01..JOnn
  const last = await Driver.findOne({
    where: { driver_no: { [Op.like]: `${prefix}%` } },
    order: [["driver_no", "DESC"]],
    attributes: ["driver_no"],
  });

  let next = 1;
  if (last && last.driver_no) {
    const match = last.driver_no.match(/^([A-Z]{2})(\d{2})$/i);
    if (match) next = parseInt(match[2], 10) + 1;
  }

  const suffix = String(next).padStart(2, "0"); // 01..99 (expand if you want 3 digits)
  return `${prefix}${suffix}`;
}
