// routes/notifications.js
import express from "express";
import { getNotifications } from "../controllers/notificationController.js";

const router = express.Router();

// Single source of truth → use controller
router.get("/", getNotifications);

export default router;
