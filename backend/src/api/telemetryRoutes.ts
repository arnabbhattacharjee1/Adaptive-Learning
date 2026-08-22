import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { TelemetryController } from '../controllers/telemetryController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const telemetryRouter = Router();

// Rate limiter: 120 requests per minute per IP
const telemetryRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many telemetry events. Rate limit exceeded.' },
});

telemetryRouter.post('/', telemetryRateLimiter, asyncHandler(TelemetryController.ingest));
