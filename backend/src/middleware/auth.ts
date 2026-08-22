import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'alis-jwt-super-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Generates a signed JWT session token for an authenticated user.
 * @param userId - Unique user ID
 * @param email - User email address
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, getJwtSecret(), { expiresIn: '7d' });
}

/**
 * Middleware enforcing JWT authentication on protected API endpoints.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new AppError('Authentication required. Missing access token.', 401));
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; email: string };
    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired authentication token.', 401));
  }
}
