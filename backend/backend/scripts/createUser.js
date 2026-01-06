// backend/scripts/createUser.js (for one-time use)
import bcrypt from 'bcrypt';
import { sequelize } from '../config/db.js';
import User from '../models/User.js';

const createUser = async () => {
  await sequelize.sync();

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = await User.create({ username: 'admin', password: hashedPassword });

  console.log('User created:', user.username);
};

createUser();
