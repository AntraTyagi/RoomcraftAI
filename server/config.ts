import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading environment variables from:', envPath);
const result = config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
  'REPLICATE_API_KEY',
];

// Check for missing environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Export configuration object
export const CONFIG = {
  mongodb: {
    uri: process.env.MONGODB_URI!,
  },
  email: {
    user: process.env.GMAIL_USER!,
    password: process.env.GMAIL_APP_PASSWORD!,
  },
  replicate: {
    apiKey: process.env.REPLICATE_API_KEY!,
  },
  server: {
    port: process.env.PORT || 5000,
    domains: process.env.REPLIT_DOMAINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
    sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',
    isProduction: process.env.NODE_ENV === 'production',
  },
}; 