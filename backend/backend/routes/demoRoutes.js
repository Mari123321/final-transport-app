import express from 'express';
import { generateDemoData, clearDemoData } from '../controllers/demoDataController.js';

const router = express.Router();

router.post('/generate', generateDemoData);
router.delete('/clear', clearDemoData);

export default router;