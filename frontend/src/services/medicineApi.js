import api from './api';

/**
 * Medicine API Client Module
 * Communicates with /api/medicines REST endpoints
 */

/**
 * Fetch all medicines for the authenticated user with optional status and search filtering
 * @param {Object} params - { status: 'active' | 'inactive' | 'all', search: string, page: number, limit: number }
 */
export const getMedicines = async (params = {}) => {
  const response = await api.get('/medicines', { params });
  return response.data;
};

/**
 * Fetch a single medicine by its ID
 * @param {string} id - Medicine ObjectId
 */
export const getMedicine = async (id) => {
  const response = await api.get(`/medicines/${id}`);
  return response.data;
};

/**
 * Create a new medicine record
 * @param {Object} data - Medicine payload
 */
export const createMedicine = async (data) => {
  const response = await api.post('/medicines', data);
  return response.data;
};

/**
 * Update an existing medicine record
 * @param {string} id - Medicine ObjectId
 * @param {Object} data - Updated medicine fields
 */
export const updateMedicine = async (id, data) => {
  const response = await api.put(`/medicines/${id}`, data);
  return response.data;
};

/**
 * Soft-deactivate a medicine
 * @param {string} id - Medicine ObjectId
 */
export const deactivateMedicine = async (id) => {
  const response = await api.patch(`/medicines/${id}/deactivate`);
  return response.data;
};

/**
 * Reactivate an inactive medicine
 * @param {string} id - Medicine ObjectId
 */
export const activateMedicine = async (id) => {
  const response = await api.patch(`/medicines/${id}/activate`);
  return response.data;
};

export default {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deactivateMedicine,
  activateMedicine,
};
