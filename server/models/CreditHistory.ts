import mongoose from 'mongoose';

const creditHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  operationType: {
    type: String,
    enum: ['generate', 'inpaint'],
    required: true
  },
  creditsUsed: {
    type: Number,
    required: true,
    default: 1
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    required: true
  }
});

// Index for faster queries
creditHistorySchema.index({ userId: 1, timestamp: -1 });

export const CreditHistory = mongoose.model('CreditHistory', creditHistorySchema);
