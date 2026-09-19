import mongoose from 'mongoose';

const bloodPressureSubSchema = new mongoose.Schema(
  {
    systolic: {
      type: Number,
      min: [40, 'Systolic blood pressure must be at least 40 mmHg'],
      max: [300, 'Systolic blood pressure cannot exceed 300 mmHg'],
    },
    diastolic: {
      type: Number,
      min: [30, 'Diastolic blood pressure must be at least 30 mmHg'],
      max: [200, 'Diastolic blood pressure cannot exceed 200 mmHg'],
    },
  },
  { _id: false }
);

const healthRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ownership is required'],
      index: true,
    },
    recordDate: {
      type: Date,
      required: [true, 'Record measurement date is required'],
      default: Date.now,
      validate: [
        {
          validator: function (val) {
            if (!val) return true;
            return val.getTime() <= Date.now() + 5 * 60 * 1000;
          },
          message: 'Record date cannot be in the future',
        },
        {
          validator: function () {
            const bp = this.bloodPressure;
            return (
              (this.weight !== undefined && this.weight !== null && !isNaN(this.weight)) ||
              (bp && bp.systolic !== undefined && bp.diastolic !== undefined) ||
              (this.bloodSugar !== undefined && this.bloodSugar !== null && !isNaN(this.bloodSugar)) ||
              (this.heartRate !== undefined && this.heartRate !== null && !isNaN(this.heartRate)) ||
              (this.temperature !== undefined && this.temperature !== null && !isNaN(this.temperature))
            );
          },
          message: 'At least one health measurement (weight, bloodPressure, bloodSugar, heartRate, or temperature) is required',
        },
      ],
    },
    weight: {
      type: Number,
      min: [1, 'Weight must be at least 1 kg'],
      max: [500, 'Weight cannot exceed 500 kg'],
    },
    bloodPressure: {
      type: bloodPressureSubSchema,
      validate: {
        validator: function (bp) {
          if (!bp) return true;
          const hasSys = bp.systolic !== undefined && bp.systolic !== null;
          const hasDia = bp.diastolic !== undefined && bp.diastolic !== null;

          if ((hasSys && !hasDia) || (!hasSys && hasDia)) return false;
          if (hasSys && hasDia && bp.systolic <= bp.diastolic) return false;
          return true;
        },
        message: 'Blood pressure requires both systolic and diastolic, with systolic greater than diastolic',
      },
    },
    bloodSugar: {
      type: Number,
      min: [20, 'Blood sugar must be at least 20 mg/dL'],
      max: [1000, 'Blood sugar cannot exceed 1000 mg/dL'],
    },
    heartRate: {
      type: Number,
      min: [20, 'Heart rate must be at least 20 BPM'],
      max: [300, 'Heart rate cannot exceed 300 BPM'],
    },
    temperature: {
      type: Number,
      min: [25, 'Temperature must be at least 25 °C'],
      max: [45, 'Temperature cannot exceed 45 °C'],
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook for cross-field physiological & data-integrity validation
healthRecordSchema.pre('validate', function (next) {
  // 1. Blood pressure integrity check
  const bp = this.bloodPressure;
  if (bp) {
    const hasSystolic = bp.systolic !== undefined && bp.systolic !== null;
    const hasDiastolic = bp.diastolic !== undefined && bp.diastolic !== null;

    if (hasSystolic && !hasDiastolic) {
      this.invalidate('bloodPressure.diastolic', 'Diastolic blood pressure is required when systolic is provided');
    } else if (!hasSystolic && hasDiastolic) {
      this.invalidate('bloodPressure.systolic', 'Systolic blood pressure is required when diastolic is provided');
    } else if (hasSystolic && hasDiastolic) {
      if (bp.systolic <= bp.diastolic) {
        this.invalidate(
          'bloodPressure.systolic',
          'Systolic blood pressure must be greater than diastolic blood pressure'
        );
      }
    }
  }

  // 2. Require at least one actual health measurement
  const hasMeasurement =
    (this.weight !== undefined && this.weight !== null && !isNaN(this.weight)) ||
    (bp && bp.systolic !== undefined && bp.diastolic !== undefined) ||
    (this.bloodSugar !== undefined && this.bloodSugar !== null && !isNaN(this.bloodSugar)) ||
    (this.heartRate !== undefined && this.heartRate !== null && !isNaN(this.heartRate)) ||
    (this.temperature !== undefined && this.temperature !== null && !isNaN(this.temperature));

  if (!hasMeasurement) {
    this.invalidate(
      'measurements',
      'At least one health measurement (weight, bloodPressure, bloodSugar, heartRate, or temperature) is required'
    );
  }

  // 3. Reject future dates beyond a 5-minute clock-skew tolerance
  if (this.recordDate) {
    const maxAllowedFuture = Date.now() + 5 * 60 * 1000;
    if (new Date(this.recordDate).getTime() > maxAllowedFuture) {
      this.invalidate('recordDate', 'Record date cannot be in the future');
    }
  }

  next();
});

// Indexes for high-performance chronological querying
healthRecordSchema.index({ user: 1, recordDate: -1 });
healthRecordSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('HealthRecord', healthRecordSchema);
