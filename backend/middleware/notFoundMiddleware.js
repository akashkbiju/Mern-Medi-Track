import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * 404 Not Found Middleware for unmapped API routes
 */
export const notFound = (req, res, next) => {
  res.status(404).json(
    new ApiResponse(false, `API route not found: ${req.method} ${req.originalUrl}`)
  );
};

export default notFound;
