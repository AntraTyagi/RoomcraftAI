import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomcraft';
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

export const connectDB = async (retryCount = 0) => {
  try {
    console.log('Attempting MongoDB connection...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully');

    // Log when the connection is established
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    // Log when the connection is disconnected
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
    });

    // Log all MongoDB operations in debug mode
    mongoose.set('debug', true);

  } catch (error) {
    console.error('MongoDB connection error:', error);

    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection in ${RETRY_INTERVAL/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      setTimeout(() => connectDB(retryCount + 1), RETRY_INTERVAL);
    } else {
      console.error('Failed to connect to MongoDB after maximum retries');
      process.exit(1);
    }
  }
};

// Handle connection errors
mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
  if (err.name === 'MongoNetworkError') {
    console.log('Network error detected, attempting to reconnect...');
    connectDB();
  }
});

// Log when the connection is reconnected
mongoose.connection.on('reconnected', () => {
  console.log('Mongoose reconnected to MongoDB');
});