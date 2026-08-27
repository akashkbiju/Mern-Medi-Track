import mongoose from 'mongoose';

const medicationLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String, // "HH:mm"
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'taken', 'missed', 'skipped'],
      default: 'pending',
    },
    takenAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Compound unique index guaranteeing idempotency: a single scheduled dose has exactly one log
medicationLogSchema.index(
  { user: 1, medicine: 1, scheduledDate: 1, scheduledTime: 1 },
  { unique: true }
);

// To fetch a user's logs for a specific day efficiently (e.g. for daily tracker & dashboard)
medicationLogSchema.index({ user: 1, scheduledDate: 1 });

// To filter user logs by status (e.g. pending, taken, missed, skipped)
medicationLogSchema.index({ user: 1, status: 1 });

// To fetch adherence per medicine
medicationLogSchema.index({ medicine: 1, status: 1 });

export default mongoose.model('MedicationLog', medicationLogSchema);
