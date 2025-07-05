import mongoose from 'mongoose';

<<<<<<< HEAD
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

=======
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
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
    });

<<<<<<< HEAD
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
=======
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
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff
});