import mongoose from 'mongoose';

const doctorPatientConnectionSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'revoked'],
      default: 'pending',
    },
    permissions: {
      medications: { type: Boolean, default: false },
      healthRecords: { type: Boolean, default: false },
      reports: { type: Boolean, default: false },
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Fast lookups for doctor's patient list and patient's doctor list
doctorPatientConnectionSchema.index({ doctor: 1, status: 1 });
doctorPatientConnectionSchema.index({ patient: 1, status: 1 });

export default mongoose.model('DoctorPatientConnection', doctorPatientConnectionSchema);
