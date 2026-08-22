import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../db/index.js';
import { generateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { Logger } from '../utils/logger.js';
import { LoginSchema, RegisterSchema } from '../validation/schemas.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * AuthController
 * Manages user authentication, registration, and Google OAuth SSO.
 */
export class AuthController {
  /**
   * Handles Google OAuth Single Sign-On ID Token authentication.
   */
  static async googleAuth(req: Request, res: Response) {
    const { idToken } = req.body;
    if (!idToken) {
      throw new AppError('Google ID Token is required', 400);
    }

    let email: string;
    let name: string | undefined;
    let googleId: string;
    let picture: string | undefined;

    const isProduction = process.env.NODE_ENV === 'production';

    if (idToken.startsWith('mock_google_id_token_')) {
      if (isProduction) {
        throw new AppError('Mock authentication tokens are disabled in production', 401);
      }
      googleId = idToken.replace('mock_google_id_token_', '');
      email = `google_user_${googleId}@example.com`;
      name = `Google Learner ${googleId}`;
      picture = 'https://lh3.googleusercontent.com/a/default-user=s96-c';
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new AppError('Invalid Google ID Token payload', 401);
      }

      email = payload.email;
      name = payload.name;
      googleId = payload.sub;
      picture = payload.picture;
    }

    let user = db.prepare(`SELECT * FROM users WHERE google_id = ? OR email = ?`).get(googleId, email) as any;
    let userId: string;

    if (user) {
      userId = user.id;
      db.prepare(`UPDATE users SET google_id = ?, picture = ?, name = COALESCE(name, ?) WHERE id = ?`)
        .run(googleId, picture || null, name || null, userId);
    } else {
      userId = randomUUID();
      const createdAt = new Date().toISOString();

      db.prepare(`
        INSERT INTO users (id, email, password_hash, name, google_id, picture, created_at)
        VALUES (?, ?, 'GOOGLE_AUTH_SSO', ?, ?, ?, ?)
      `).run(userId, email, name || null, googleId, picture || null, createdAt);

      db.prepare(`
        INSERT OR IGNORE INTO user_node_state 
        (user_id, node_id, status, highest_quiz_score, total_time_seconds, confidence_level, attempts_count, remediation_count, updated_at)
        VALUES (?, 'LA-101', 'available', 0, 0, 0, 0, 0, ?)
      `).run(userId, createdAt);
    }

    const token = generateToken(userId, email);

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    Logger.info('User Google SSO Login Success', { userId, email });

    return res.json({
      message: 'Google Single Sign-On successful',
      user: { id: userId, email, name, picture },
      token,
    });
  }

  /**
   * Registers a new user account with password.
   */
  static async register(req: Request, res: Response) {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError('Validation failed', 400);
    }

    const { email, password, name } = parseResult.data;

    const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
    if (existing) {
      throw new AppError('User with this email already exists', 409);
    }

    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, email, passwordHash, name || null, createdAt);

    db.prepare(`
      INSERT OR IGNORE INTO user_node_state 
      (user_id, node_id, status, highest_quiz_score, total_time_seconds, confidence_level, attempts_count, remediation_count, updated_at)
      VALUES (?, 'LA-101', 'available', 0, 0, 0, 0, 0, ?)
    `).run(userId, createdAt);

    const token = generateToken(userId, email);
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    Logger.info('New User Registration Success', { userId, email });

    return res.status(201).json({
      message: 'Registration successful',
      user: { id: userId, email, name },
      token,
    });
  }

  /**
   * Authenticates user credentials and issues a JWT cookie.
   */
  static async login(req: Request, res: Response) {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError('Validation failed', 400);
    }

    const { email, password } = parseResult.data;

    const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as any;
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.password_hash === 'GOOGLE_AUTH_SSO') {
      throw new AppError('This account uses Google Single Sign-On. Please sign in with Google.', 400);
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken(user.id, user.email);
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    Logger.info('User Login Success', { userId: user.id, email: user.email });

    return res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name, picture: user.picture },
      token,
    });
  }

  /**
   * Logs out user by clearing session cookie.
   */
  static async logout(req: Request, res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
    });
    return res.json({ message: 'Logged out successfully' });
  }
}
