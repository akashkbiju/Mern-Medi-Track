import mongoose from 'mongoose';

const healthRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recordDate: {
      type: Date,
      required: true,
    },
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
    },
    bloodPressure: {
      systolic: {
        type: Number,
        min: [0, 'Systolic blood pressure cannot be negative'],
      },
      diastolic: {
        type: Number,
        min: [0, 'Diastolic blood pressure cannot be negative'],
      },
    },
    bloodSugar: {
      type: Number,
      min: [0, 'Blood sugar cannot be negative'],
    },
    heartRate: {
      type: Number,
      min: [0, 'Heart rate cannot be negative'],
    },
    temperature: {
      type: Number,
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
// To fetch chronological health history for a specific user
healthRecordSchema.index({ user: 1, recordDate: -1 });

export default mongoose.model('HealthRecord', healthRecordSchema);
