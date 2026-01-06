// routes/clientRoutes.js
import express from 'express';
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  bulkDeleteClients
} from '../controllers/clientController.js';

const router = express.Router();

router.post('/', createClient); // Create client
router.get('/', getAllClients); // List all clients
router.get('/:id', getClientById); // Get client by ID
router.put('/:id', updateClient); // Update client
router.delete('/:id', deleteClient); // Delete client
router.post('/bulk-delete', bulkDeleteClients); // Bulk delete

export default router;
