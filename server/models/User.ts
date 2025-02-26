import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface to define User document type
interface IUser extends Document {
  email: string;
  password: string;
  credits: number;
  name: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Interface for User model
interface UserModel extends Model<IUser> {
  findByCredentials(email: string, password: string): Promise<IUser>;
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  credits: {
    type: Number,
    default: 10 // Free users get 10 credits
  },
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  const user = this as IUser;

  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    console.log(`Creating new user with email: ${user.email}`);
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    const user = this as IUser;
    return await bcrypt.compare(candidatePassword, user.password);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

export const User = mongoose.model<IUser, UserModel>('User', userSchema);