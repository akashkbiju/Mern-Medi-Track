import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a medicine name'],
      trim: true,
    },
    genericName: {
      type: String,
      trim: true,
    },
    dosage: {
      type: String,
    },
    dosageUnit: {
      type: String,
    },
    frequency: {
      type: String,
      enum: ['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'custom'],
      required: true,
    },
    times: [
      {
        type: String, // Stored as "HH:mm"
      },
    ],
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    instructions: {
      type: String,
    },
    notes: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// To quickly fetch a specific user's active/inactive medicines
medicineSchema.index({ user: 1, isActive: 1 });

export default mongoose.model('Medicine', medicineSchema);
