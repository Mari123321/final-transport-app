// routes/distanceRoutes.js
import express from 'express';
import { getDistance } from '../controllers/distanceController.js';
const router = express.Router();

router.get('/', getDistance);

export default router;
