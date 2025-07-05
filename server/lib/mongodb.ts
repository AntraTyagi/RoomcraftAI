import mongoose from 'mongoose';

// Verify environment variables are loaded
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set in environment variables');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;

export const connectDB = async () => {
  try {
    console.log('Attempting MongoDB connection...');
    console.log('Using connection string:', MONGODB_URI.replace(/mongodb\+srv:\/\/[^:]+:[^@]+@/, 'mongodb+srv://[hidden]@'));

    // Clear any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Basic connection options
    const options: mongoose.ConnectOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Add these options for MongoDB Atlas
      ssl: true,
      retryWrites: true,
      w: 'majority' as const
    };

    // Add event listeners before connecting
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
      console.log('Host:', mongoose.connection.host);
      console.log('Database:', mongoose.connection.db?.databaseName);
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        code: (err as any).code,
        codeName: (err as any).codeName
      });
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
    });

    await mongoose.connect(MONGODB_URI, options);
    console.log('MongoDB connected successfully');

  } catch (error) {
    console.error('MongoDB connection error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});