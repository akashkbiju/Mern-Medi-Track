import { medicineService } from '../services/medicineService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Retrieve all medicines for current user with optional filtering
 * GET /api/medicines
 */
export const getMedicines = asyncHandler(async (req, res) => {
  const { status, search, page, limit } = req.query;

  const result = await medicineService.getMedicines(req.user.id, {
    status,
    search,
    page,
    limit,
  });

  return ApiResponse.success(res, 'Medicines retrieved successfully', result, 200);
});

/**
 * Retrieve single medicine by ID
 * GET /api/medicines/:id
 */
export const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await medicineService.getMedicineById(req.user.id, req.params.id);
  return ApiResponse.success(res, 'Medicine retrieved successfully', { medicine }, 200);
});

/**
 * Create a new medicine
 * POST /api/medicines
 */
export const createMedicine = asyncHandler(async (req, res) => {
  const medicine = await medicineService.createMedicine(req.user.id, req.body);
  return ApiResponse.success(res, 'Medicine created successfully', { medicine }, 201);
});

/**
 * Update an existing medicine
 * PUT /api/medicines/:id
 */
export const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await medicineService.updateMedicine(req.user.id, req.params.id, req.body);
  return ApiResponse.success(res, 'Medicine updated successfully', { medicine }, 200);
});

/**
 * Deactivate a medicine
 * PATCH /api/medicines/:id/deactivate
 */
export const deactivateMedicine = asyncHandler(async (req, res) => {
  const medicine = await medicineService.deactivateMedicine(req.user.id, req.params.id);
  return ApiResponse.success(res, 'Medicine deactivated successfully', { medicine }, 200);
});

/**
 * Reactivate an inactive medicine
 * PATCH /api/medicines/:id/activate
 */
export const activateMedicine = asyncHandler(async (req, res) => {
  const medicine = await medicineService.activateMedicine(req.user.id, req.params.id);
  return ApiResponse.success(res, 'Medicine activated successfully', { medicine }, 200);
});

export default {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deactivateMedicine,
  activateMedicine,
};
