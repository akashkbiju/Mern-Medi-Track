/**
 * Async handler utility to wrap controllers and eliminate repetitive try/catch blocks
 * Automatically forwards thrown errors or rejected promises to next()
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
