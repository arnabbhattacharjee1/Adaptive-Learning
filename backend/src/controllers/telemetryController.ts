import { Request, Response } from 'express';
import { getTelemetryPublisher } from '../adapters/telemetryPublisher.js';
import { AppError } from '../middleware/errorHandler.js';
import { Logger } from '../utils/logger.js';
import { TelemetrySchema } from '../validation/schemas.js';

const publisher = getTelemetryPublisher();

/**
 * TelemetryController
 * Manages non-blocking telemetry event ingestion (< 5ms response SLA) and payload processing.
 */
export class TelemetryController {
  /**
   * Ingests telemetry event signal and queues non-blocking publish task.
   */
  static async ingest(req: Request, res: Response) {
    const startTime = process.hrtime();

    const parseResult = TelemetrySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError('Invalid telemetry payload', 400);
    }

    const signal = parseResult.data;

    // Non-blocking publish via GCP Pub/Sub or Local Queue adapter
    const eventId = await publisher.publish(signal);

    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

    return res.status(202).json({
      status: 'queued',
      eventId,
      executionTimeMs: Number(durationMs),
    });
  }

  /**
   * Handles generic operational POST payload with structured logging & success response.
   */
  static async handlePostPayload(req: Request, res: Response) {
    const payload = req.body;

    Logger.info('Operational POST payload ingested successfully', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      payload,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Success',
      timestamp: new Date().toISOString(),
    });
  }
}
