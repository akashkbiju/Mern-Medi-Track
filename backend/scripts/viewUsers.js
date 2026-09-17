import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

const viewUsers = async () => {
  try {
    await connectDB();

    const users = await User.find(
      {},
      'fullName email role isActive isApproved createdAt'
    ).sort({ createdAt: -1 });

    console.log('\n=================== MEDITRACK+ DATABASE USERS ===================\n');
    console.table(
      users.map((u) => ({
        ID: u._id.toString(),
        Name: u.fullName,
        Email: u.email,
        Role: u.role,
        Active: u.isActive,
        Approved: u.isApproved,
        Created: u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A',
      }))
    );
    console.log('\nTotal registered accounts:', users.length);
    console.log('=================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error fetching database users:', error.message);
    process.exit(1);
  }
};

viewUsers();
