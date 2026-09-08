/**
 * NoSQL Injection Sanitizer Middleware
 * Recursively strips dangerous MongoDB operators (keys starting with '$' or containing '.')
 * from request body, query parameters, and route params.
 */
export const mongoSanitize = (req, res, next) => {
  const clean = (target) => {
    if (target && typeof target === 'object') {
      if (Array.isArray(target)) {
        target.forEach(clean);
      } else {
        for (const key of Object.keys(target)) {
          if (key.startsWith('$') || key.includes('.')) {
            delete target[key];
          } else {
            clean(target[key]);
          }
        }
      }
    }
  };

  if (req.body) clean(req.body);
  if (req.query) clean(req.query);
  if (req.params) clean(req.params);

  next();
};

export default mongoSanitize;
