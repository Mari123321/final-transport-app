import { Vehicle, Driver, Client } from "../models/index.js";

// Helper: convert empty strings to null
const cleanPayload = (data) => {
  const payload = { ...data };
  Object.keys(payload).forEach((key) => {
    if (payload[key] === "") payload[key] = null;
  });
  return payload;
};

// ================== CREATE VEHICLE ==================
export const createVehicle = async (req, res) => {
  try {
    const payload = cleanPayload(req.body);

    // Validation: required fields
    if (!payload.vehicle_number) {
      return res.status(400).json({ message: "Vehicle number is required" });
    }
    if (!payload.permit_number) {
      return res.status(400).json({ message: "Permit number is required" });
    }
    if (!payload.rc_book_number) {
      return res.status(400).json({ message: "RC Book Number is required" });
    }

    const vehicle = await Vehicle.create(payload);
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("❌ Error creating vehicle:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Vehicle number already exists" });
    }

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: error.errors.map((e) => e.message).join(", "),
      });
    }

    res
      .status(400)
      .json({ message: error.message || "Failed to create vehicle" });
  }
};

// ================== GET ALL VEHICLES (with optional client filter) ==================
export const getVehicles = async (req, res) => {
  try {
    const { clientId } = req.query;
    const where = {};

    if (clientId) {
      where.client_id = clientId; // filter vehicles for a client
    }

    const vehicles = await Vehicle.findAll({
      where,
      include: [
        { model: Driver, as: "driver" },
        { model: Client, as: "client" }, // include client details
      ],
      order: [["vehicle_id", "DESC"]],
    });

    res.status(200).json(vehicles);
  } catch (error) {
    console.error("❌ Failed to fetch vehicles:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
};

// ================== UPDATE VEHICLE ==================
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = cleanPayload(req.body);

    const [updated] = await Vehicle.update(payload, {
      where: { vehicle_id: id },
    });

    if (!updated) return res.status(404).json({ message: "Vehicle not found" });

    const updatedVehicle = await Vehicle.findByPk(id, {
      include: [
        { model: Driver, as: "driver" },
        { model: Client, as: "client" },
      ],
    });
    res.status(200).json(updatedVehicle);
  } catch (error) {
    console.error("❌ Error updating vehicle:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Vehicle number already exists" });
    }

    res
      .status(400)
      .json({ message: error.message || "Failed to update vehicle" });
  }
};

// ================== DELETE VEHICLE ==================
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Vehicle.destroy({ where: { vehicle_id: id } });
    if (!deleted) return res.status(404).json({ message: "Vehicle not found" });
    res.status(200).json({ message: "Vehicle deleted" });
  } catch (error) {
    console.error("❌ Failed to delete vehicle:", error);
    res.status(500).json({ message: "Failed to delete vehicle" });
  }
};

// ================== BULK DELETE VEHICLES ==================
export const bulkDeleteVehicles = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No vehicle IDs provided" });
    }
    await Vehicle.destroy({ where: { vehicle_id: ids } });
    res.status(200).json({ message: `${ids.length} vehicles deleted` });
  } catch (error) {
    console.error("❌ Bulk delete failed:", error);
    res.status(500).json({ message: "Failed to bulk delete vehicles" });
  }
};
