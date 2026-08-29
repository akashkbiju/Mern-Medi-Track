import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please add a full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      select: false,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
    },
    phone: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    profileImage: {
      type: String,
      default: '',
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true,
        default: '',
      },
      relationship: {
        type: String,
        trim: true,
        default: '',
      },
      phone: {
        type: String,
        trim: true,
        default: '',
      },
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notificationPreferences: {
      medicationReminders: {
        type: Boolean,
        default: true,
      },
      missedMedication: {
        type: Boolean,
        default: true,
      },
      healthAlerts: {
        type: Boolean,
        default: true,
      },
      doctorUpdates: {
        type: Boolean,
        default: true,
      },
      reportReady: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Role index to quickly find doctors or admins
userSchema.index({ role: 1 });

export default mongoose.model('User', userSchema);
