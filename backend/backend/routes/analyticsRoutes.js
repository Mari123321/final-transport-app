import express from "express";
import { getMonthlyAnalytics } from "../controllers/analyticsController.js";

const router = express.Router();
router.get("/monthly", getMonthlyAnalytics);

export default router;
