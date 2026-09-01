import mongoose from 'mongoose';

/**
 * Medicine Schema
 * Production-ready medication tracking data model for MediTrack+
 */
const medicineSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User owner is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      maxlength: [100, 'Medicine name cannot exceed 100 characters'],
    },
    genericName: {
      type: String,
      trim: true,
      maxlength: [100, 'Generic name cannot exceed 100 characters'],
      default: '',
    },
    dosage: {
      type: Number,
      required: [true, 'Dosage amount is required'],
      min: [0.001, 'Dosage must be a positive number'],
      max: [100000, 'Dosage exceeds maximum threshold'],
    },
    dosageUnit: {
      type: String,
      required: [true, 'Dosage unit is required'],
      enum: {
        values: ['mg', 'g', 'mcg', 'ml', 'tablet', 'capsule', 'drop', 'puff', 'unit'],
        message: '{VALUE} is not a supported dosage unit',
      },
      trim: true,
      lowercase: true,
    },
    frequency: {
      type: String,
      required: [true, 'Medication frequency is required'],
      enum: {
        values: ['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'custom'],
        message: '{VALUE} is not a valid frequency option',
      },
    },
    times: {
      type: [String],
      required: [true, 'Medication times are required'],
      validate: {
        validator: function (val) {
          if (!Array.isArray(val) || val.length === 0) return false;
          // Valid 24-hour HH:mm format (00:00 to 23:59)
          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          // Check format and duplicate prevention
          const allValid = val.every((t) => typeof t === 'string' && timeRegex.test(t));
          if (!allValid) return false;
          const uniqueTimes = new Set(val);
          return uniqueTimes.size === val.length;
        },
        message: 'Medication times must follow 24-hour HH:mm format and cannot contain duplicates',
      },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (val) {
          if (!val) return true; // Ongoing medication supported with null endDate
          const start = this.startDate ? new Date(this.startDate).getTime() : Date.now();
          return new Date(val).getTime() >= start;
        },
        message: 'End date cannot be earlier than start date',
      },
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Instructions cannot exceed 500 characters'],
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for user-specific queries
medicineSchema.index({ user: 1, isActive: 1 });
medicineSchema.index({ user: 1, startDate: 1 });
medicineSchema.index({ user: 1, endDate: 1 });
medicineSchema.index({ user: 1, name: 1 });

export default mongoose.model('Medicine', medicineSchema);
