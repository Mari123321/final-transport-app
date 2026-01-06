// controllers/clientController.js
import { Client, Trip, Invoice } from '../models/index.js';

// CREATE
export const createClient = async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add client', error: error.message });
  }
};

// READ ALL
export const getAllClients = async (_req, res) => {
  try {
    const clients = await Client.findAll({ order: [['client_id', 'DESC']] });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch clients', error: error.message });
  }
};

// READ ONE
export const getClientById = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch client', error: error.message });
  }
};

// UPDATE
export const updateClient = async (req, res) => {
  try {
    const [updated] = await Client.update(req.body, { where: { client_id: req.params.id } });
    if (updated) {
      const updatedClient = await Client.findOne({ where: { client_id: req.params.id } });
      res.status(200).json(updatedClient);
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to update client', error: error.message });
  }
};

// DELETE (single) - PROTECTED: Cannot delete if trips exist
export const deleteClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    
    // Check if client has trips
    const tripCount = await Trip.count({ where: { client_id: clientId } });
    if (tripCount > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot delete client: ${tripCount} trip(s) exist for this client. Please delete or reassign trips first.`
      });
    }
    
    // Check if client has invoices
    const invoiceCount = await Invoice.count({ where: { client_id: clientId } });
    if (invoiceCount > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot delete client: ${invoiceCount} invoice(s) exist for this client. Please delete or reassign invoices first.`
      });
    }
    
    const deleted = await Client.destroy({ where: { client_id: clientId } });
    if (deleted) {
      res.status(200).json({ success: true, message: 'Client deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete client', error: error.message });
  }
};

// BULK DELETE - PROTECTED: Cannot delete if trips exist
export const bulkDeleteClients = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids must be a non-empty array' });
    }
    
    // Check for clients with trips
    const clientsWithTrips = [];
    for (const id of ids) {
      const tripCount = await Trip.count({ where: { client_id: id } });
      if (tripCount > 0) {
        const client = await Client.findByPk(id);
        clientsWithTrips.push({ id, name: client?.client_name || id, trips: tripCount });
      }
    }
    
    if (clientsWithTrips.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot delete clients with existing trips`,
        clientsWithTrips
      });
    }
    
    const deleted = await Client.destroy({ where: { client_id: ids } });
    res.status(200).json({ 
      success: true,
      message: `${deleted} client(s) deleted successfully`,
      count: deleted 
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to bulk delete clients', 
      error: error.message 
    });
  }
};
