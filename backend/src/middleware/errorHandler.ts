import { NextFunction, Request, Response } from 'express';
import { Logger } from '../utils/logger.js';

/**
 * Custom Operational Error Class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

/**
 * Async Error Handler Wrapper
 * Eliminates verbose try/catch blocks in Express controllers.
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Catch-All 404 Handler for Unmatched API Routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new AppError(`Cannot ${req.method} ${req.originalUrl} - Route Not Found`, 404);
  next(error);
}

/**
 * Centralized Operational Error Handler Middleware
 */
export function globalErrorHandler(err: Error | AppError, req: Request, res: Response, next: NextFunction) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const errorMessage = isProduction && statusCode === 500 ? 'An unexpected server error occurred.' : err.message;

  Logger.error(`HTTP Request Error [${req.method} ${req.originalUrl}]`, err, {
    statusCode,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    error: errorMessage,
    message: errorMessage,
    ...(isProduction ? {} : { stack: err.stack }),
  });
}
