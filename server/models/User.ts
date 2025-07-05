import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  credits: {
    type: Number,
    default: 10 // Free users get 10 credits
  },
  isEmailVerified: {
    type: Boolean,
    default: true
  },
  verificationToken: {
    type: String,
    required: false
  },
  verificationTokenExpires: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

// Add pre-save middleware to set username from email
userSchema.pre('save', async function(next) {
  if (!this.isModified('email') && !this.isNew) return next();
  
  // Set username to email if not provided
  if (!this.username) {
    this.username = this.email;
  }
  
  next();
});

// Add comparePassword method to the schema
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    throw error;
  }
};

// Add proper TypeScript interface
export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  username: string;
  name: string;
  credits: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export const User = mongoose.model<IUser>('User', userSchema);