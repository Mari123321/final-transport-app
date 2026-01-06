// backend/routes/vehicleRoutes.js
import express from "express";
import {
  createVehicle,
  getVehicles,
  updateVehicle,
  deleteVehicle,
  bulkDeleteVehicles,
} from "../controllers/vehicleController.js";

const router = express.Router();

router.get("/", getVehicles);
router.post("/", createVehicle);
router.put("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);
router.post("/bulk-delete", bulkDeleteVehicles);

export default router;
