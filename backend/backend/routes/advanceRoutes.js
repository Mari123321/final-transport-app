import express from 'express';
const router = express.Router();

// Example route
router.get('/', (req, res) => {
  res.send('Advance Route Working!');
});

export default router;
