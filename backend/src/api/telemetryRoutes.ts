import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getTelemetryPublisher } from '../adapters/telemetryPublisher.js';
import { TelemetrySchema } from '../validation/schemas.js';

export const telemetryRouter = Router();

// Rate limiter: 120 requests per minute per IP (Google Cloud Armor / App level)
const telemetryRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many telemetry events. Rate limit exceeded.' },
});

const publisher = getTelemetryPublisher();

telemetryRouter.post('/', telemetryRateLimiter, async (req, res) => {
  const startTime = process.hrtime();

  // 1. Zod Payload Validation
  const parseResult = TelemetrySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid telemetry payload', details: parseResult.error.flatten() });
  }

  const signal = parseResult.data;

  // 2. Non-blocking publish via GCP Pub/Sub or Local Queue adapter
  const eventId = await publisher.publish(signal);

  const diff = process.hrtime(startTime);
  const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

  // 3. Immediate 202 Accepted Response (< 5ms)
  return res.status(202).json({
    status: 'queued',
    eventId,
    executionTimeMs: Number(durationMs),
  });
});
