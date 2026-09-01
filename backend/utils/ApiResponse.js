/**
 * Standardized API Response Envelope
 */
export class ApiResponse {
  constructor(success, message = 'Operation successful', data = null, errors = null) {
    this.success = success;
    this.message = message;
    if (data !== null && data !== undefined) {
      this.data = data;
    }
    if (errors !== null && errors !== undefined) {
      this.errors = errors;
    }
  }

  static success(res, message = 'Operation successful', data = null, statusCode = 200) {
    return res.status(statusCode).json(new ApiResponse(true, message, data));
  }

  static error(res, message = 'Something went wrong', errors = null, statusCode = 500) {
    return res.status(statusCode).json(new ApiResponse(false, message, null, errors));
  }
}

export default ApiResponse;
