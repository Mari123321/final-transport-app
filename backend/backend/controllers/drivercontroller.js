import { Driver } from "../models/index.js";
import { Op } from "sequelize";

// CREATE
export const createDriver = async (req, res) => {
  try {
    const driverData = req.body;

    // Validate required fields
    if (!driverData.name || !driverData.license_number || !driverData.aadhaar_no) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (driverData.license_number.length !== 15) {
      return res.status(400).json({
        message: "License Number must be 15 characters",
      });
    }
    if (driverData.aadhaar_no.length !== 16) {
      return res.status(400).json({ message: "Aadhaar must be 16 digits" });
    }

    const driver = await Driver.create(driverData);
    return res.status(201).json(driver);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Duplicate value for unique field" });
    }
    return res.status(400).json({ message: error.message });
  }
};

// READ ALL
export const getAllDrivers = async (req, res) => {
  try {
    const { search } = req.query;
    const where = search ? { name: { [Op.like]: `%${search}%` } } : {};
    const drivers = await Driver.findAll({ where, order: [["id", "DESC"]] });
    return res.status(200).json(drivers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// READ BY ID
export const getDriverById = async (req, res) => {
  try {
    const id = req.params.id;
    const driver = await Driver.findByPk(id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    return res.status(200).json(driver);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updateDriver = async (req, res) => {
  try {
    const id = req.params.id;
    const driver = await Driver.findByPk(id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    await driver.update(req.body);
    return res.status(200).json(driver);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Duplicate value for unique field" });
    }
    return res.status(400).json({ message: error.message });
  }
};

// DELETE
export const deleteDriver = async (req, res) => {
  try {
    const id = req.params.id;
    const driver = await Driver.findByPk(id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    await driver.destroy();
    return res.status(200).json({ message: "Driver deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// BULK DELETE
export const bulkDeleteDrivers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "Invalid IDs to delete" });
    await Driver.destroy({ where: { id: ids } });
    return res.status(200).json({ message: "Drivers deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
