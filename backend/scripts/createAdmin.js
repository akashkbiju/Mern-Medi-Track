import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

const createAdmin = async () => {
  try {
    await connectDB();

    const email = 'admin@meditrack.com';
    const password = 'adminpassword123';

    // Check if admin already exists
    let adminUser = await User.findOne({ email });

    if (adminUser) {
      console.log(`Admin user with email ${email} already exists.`);
      // Ensure the role is set to admin just in case
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
        console.log(`Updated existing user's role to admin.`);
      }
    } else {
      // Create new admin
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      adminUser = await User.create({
        fullName: 'System Administrator',
        email,
        password: hashedPassword,
        phone: '1234567890',
        role: 'admin',
        isActive: true,
      });

      console.log(`Successfully created new admin user:`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdmin();
