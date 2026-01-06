// controllers/userController.js
import { User } from '../models/index.js'; // 👈 Make sure this path is correct and uses named import

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username' });
    }

    // Check password (in production, hash comparison should be used)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
