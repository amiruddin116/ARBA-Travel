/**
 * Validates the CRON_SECRET for protected sync API routes.
 *
 * Accepts two forms:
 *   - x-cron-secret: <secret>        (manual / script calls)
 *   - Authorization: Bearer <secret> (Vercel Cron Jobs)
 */
export function validateCronSecret(request: Request): boolean {
  if (!process.env.CRON_SECRET) return false;

  // Manual calls
  const xSecret = request.headers.get('x-cron-secret');
  if (xSecret === process.env.CRON_SECRET) return true;

  // Vercel Cron Jobs
  const auth = request.headers.get('authorization') ?? '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  return bearer === process.env.CRON_SECRET;
}
