import mongoose from 'mongoose';

const doctorNoteSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID is required'],
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
      index: true,
    },
    connection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorPatientConnection',
      required: [true, 'Connection ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['note', 'recommendation'],
      default: 'note',
      required: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },
    visibility: {
      type: String,
      enum: ['doctor_private', 'patient_visible'],
      default: 'doctor_private',
      required: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'important', 'urgent'],
      default: 'normal',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for rapid lookups
doctorNoteSchema.index({ doctor: 1, patient: 1, createdAt: -1 });
doctorNoteSchema.index({ patient: 1, visibility: 1, type: 1, createdAt: -1 });
doctorNoteSchema.index({ connection: 1, createdAt: -1 });

export default mongoose.model('DoctorNote', doctorNoteSchema);
