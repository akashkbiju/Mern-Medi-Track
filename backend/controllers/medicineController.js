import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Medicine Management Controller Foundation
 */
export const getMedicines = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Medicine API functionality will be implemented in a later development step')
  );
});

export const getMedicineById = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Medicine API functionality will be implemented in a later development step')
  );
});

export const createMedicine = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Medicine API functionality will be implemented in a later development step')
  );
});

export const updateMedicine = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Medicine API functionality will be implemented in a later development step')
  );
});

export const deleteMedicine = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Medicine API functionality will be implemented in a later development step')
  );
});

export default {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
};
