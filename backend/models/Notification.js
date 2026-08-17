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
      enum: ['medication_reminder', 'missed_medication', 'health_alert', 'doctor_request', 'report_ready', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
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
  },
  {
    timestamps: true,
  }
);

// Indexes
// To quickly check for unread notifications for a user (for badge counters)
notificationSchema.index({ user: 1, isRead: 1 });
// For scheduling notification dispatch
notificationSchema.index({ scheduledFor: 1 });

export default mongoose.model('Notification', notificationSchema);
