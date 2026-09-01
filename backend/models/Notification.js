import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'medication_reminder',
        'missed_medication',
        'health_alert',
        'doctor_request',
        'doctor_approved',
        'doctor_rejected',
        'report_ready',
        'system',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedMedicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
    },
    scheduledFor: {
      type: Date,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'push'],
      default: 'in_app',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Fast unread count and queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
// Type-based queries
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });
// Scheduler and expiration lookup
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $exists: true } } });
// Compound unique index for medication reminders to guarantee idempotency and prevent duplicates
notificationSchema.index(
  { user: 1, relatedMedicine: 1, type: 1, scheduledFor: 1, channel: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: 'medication_reminder',
      relatedMedicine: { $exists: true },
      scheduledFor: { $exists: true },
    },
  }
);

export default mongoose.model('Notification', notificationSchema);

