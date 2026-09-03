import mongoose from 'mongoose';

const healthReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportType: {
      type: String,
      enum: ['weekly', 'monthly', 'custom'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['ready', 'generating', 'failed'],
      default: 'ready',
    },
    summary: {
      type: String,
      default: '',
    },
    patientInfo: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      gender: { type: String, default: '' },
      dateOfBirth: { type: Date },
    },
    medicationSummary: {
      totalScheduled: { type: Number, default: 0 },
      taken: { type: Number, default: 0 },
      missed: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      adherenceScore: { type: Number, default: null },
      category: { type: String, default: 'No Data' },
    },
    healthSummary: {
      latestWeight: { type: mongoose.Schema.Types.Mixed, default: null },
      latestBloodPressure: { type: mongoose.Schema.Types.Mixed, default: null },
      latestBloodSugar: { type: mongoose.Schema.Types.Mixed, default: null },
      latestHeartRate: { type: mongoose.Schema.Types.Mixed, default: null },
      latestTemperature: { type: mongoose.Schema.Types.Mixed, default: null },
      recordCount: { type: Number, default: 0 },
    },
    trends: {
      weight: { type: Array, default: [] },
      bloodPressure: { type: Array, default: [] },
      bloodSugar: { type: Array, default: [] },
      heartRate: { type: Array, default: [] },
      temperature: { type: Array, default: [] },
    },
    recommendations: [
      {
        title: { type: String, default: '' },
        content: { type: String, default: '' },
        priority: { type: String, default: 'normal' },
        doctorName: { type: String, default: '' },
        specialization: { type: String, default: '' },
        hospital: { type: String, default: '' },
        date: { type: Date },
      },
    ],
    filePath: {
      type: String,
      default: '',
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Fast user report queries sorted by generation date
healthReportSchema.index({ user: 1, createdAt: -1 });
// Compound index to detect and prevent duplicate reports for the same user, period, and type
healthReportSchema.index(
  { user: 1, reportType: 1, startDate: 1, endDate: 1 },
  { unique: true }
);

export default mongoose.model('HealthReport', healthReportSchema);
