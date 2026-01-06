// backend/routes/driverRoutes.js
import express from "express";
import {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  bulkDeleteDrivers,
} from "../controllers/drivercontroller.js";

const router = express.Router();

// Routes
router.get("/", getAllDrivers);          // GET all drivers (with ?search=)
router.get("/:id", getDriverById);       // GET driver by ID
router.post("/", createDriver);          // CREATE new driver
router.put("/:id", updateDriver);        // UPDATE driver by ID
router.delete("/:id", deleteDriver);     // DELETE driver by ID
router.post("/bulk-delete", bulkDeleteDrivers); // BULK DELETE

export default router;
