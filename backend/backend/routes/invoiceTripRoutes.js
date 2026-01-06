// routes/invoiceTripRoutes.js
import { Router } from 'express';
import {
  getAllInvoiceTrips,
  getInvoiceTripById,
  createInvoiceTrip,
  updateInvoiceTrip,
  deleteInvoiceTrip
} from '../controllers/invoiceTripController.js';

const router = Router();

router.get('/', getAllInvoiceTrips);
router.get('/:id', getInvoiceTripById);
router.post('/', createInvoiceTrip);
router.put('/:id', updateInvoiceTrip);
router.delete('/:id', deleteInvoiceTrip);

export default router;
