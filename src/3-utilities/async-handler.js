/**
 * Wrap async route handlers so errors flow to Express error middleware.
 *
 * Usage:
 *   router.get('/x', asyncHandler(async (req,res)=>{ ... }))
 */
export default function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
