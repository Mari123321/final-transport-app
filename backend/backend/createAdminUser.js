import bcrypt from 'bcrypt';
import { User } from './models/index.js';

async function createTestUser() {
  try {
    // Check if user already exists
    const existing = await User.findOne({ where: { username: 'admin' } });
    
    if (existing) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await User.create({
      username: 'admin',
      email: 'admin@transport.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('✅ Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
}

createTestUser();