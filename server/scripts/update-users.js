import mongoose from 'mongoose';
import { User } from '../models/User.js';

async function updateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roomcraftai');
    console.log('Connected to MongoDB');

    // Update all users
    const result = await User.updateMany(
      { isEmailVerified: { $ne: true } },
      { $set: { isEmailVerified: true } }
    );

    console.log('Updated users:', result);
    process.exit(0);
  } catch (error) {
    console.error('Error updating users:', error);
    process.exit(1);
  }
}

updateUsers(); 