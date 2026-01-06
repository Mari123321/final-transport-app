// helpers/generateDriverCode.js
import { Op } from "sequelize";
import Driver from "../models/driverModel.js";

export const generateDriverCode = async (name) => {
  const prefix = name.substring(0, 2).toUpperCase();
  const lastDriver = await Driver.findOne({
    where: { driver_code: { [Op.like]: `${prefix}%` } },
    order: [["driver_id", "DESC"]],
  });

  let counter = 1;
  if (lastDriver) {
    const lastCode = lastDriver.driver_code;
    const lastNum = parseInt(lastCode.slice(2)) || 0;
    counter = lastNum + 1;
  }

  return `${prefix}${String(counter).padStart(2, "0")}`;
};
