import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
    },
    hospital: {
      type: String,
    },
    experience: {
      type: Number,
    },
    bio: {
      type: String,
    },
    consultationInfo: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// For public doctor search based on specialization
doctorProfileSchema.index({ specialization: 1, isVerified: 1 });

export default mongoose.model('DoctorProfile', doctorProfileSchema);
