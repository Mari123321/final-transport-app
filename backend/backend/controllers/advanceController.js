const { ClientAdvance } = require('../models');

exports.getAllAdvances = async (req, res) => {
  try {
    const data = await ClientAdvance.findAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch advances' });
  }
};

exports.createAdvance = async (req, res) => {
  try {
    const advance = await ClientAdvance.create(req.body);
    res.status(201).json(advance);
  } catch (err) {
    res.status(400).json({ error: 'Error creating advance' });
  }
};
