import DoctorProfile from '../models/DoctorProfile.js';
import DoctorPatientConnection from '../models/DoctorPatientConnection.js';

/**
 * Doctor & Patient Connection Service Foundation
 */
export const doctorService = {
  getAvailableDoctors: async () => {
    throw new Error('getAvailableDoctors will be implemented in a future step');
  },

  requestConnection: async (patientId, doctorId) => {
    throw new Error('requestConnection will be implemented in a future step');
  },
};

export default doctorService;
