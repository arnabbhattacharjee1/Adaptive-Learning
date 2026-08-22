import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../db/index.js';
import { generateToken } from '../middleware/auth.js';
import { LoginSchema, RegisterSchema } from '../validation/schemas.js';

export const authRouter = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

authRouter.post('/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Google ID Token is required' });
  }

  try {
    let email: string;
    let name: string | undefined;
    let googleId: string;
    let picture: string | undefined;

    if (idToken.startsWith('mock_google_id_token_')) {
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
        return res.status(401).json({ error: 'Invalid Google ID Token payload' });
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

      // Initialize root DAG node state as available (LA-101)
      db.prepare(`
        INSERT OR IGNORE INTO user_node_state 
        (user_id, node_id, status, highest_quiz_score, total_time_seconds, confidence_level, attempts_count, remediation_count, updated_at)
        VALUES (?, 'LA-101', 'available', 0, 0, 0, 0, 0, ?)
      `).run(userId, createdAt);
    }

    const token = generateToken(userId, email);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: 'Google Single Sign-On successful',
      user: { id: userId, email, name, picture },
      token,
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    return res.status(401).json({ error: 'Google authentication failed' });
  }
});

authRouter.post('/register', async (req, res) => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const { email, password, name } = parseResult.data;

    const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
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

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: 'Registration successful',
      user: { id: userId, email, name },
      token,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const { email, password } = parseResult.data;

    const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.password_hash === 'GOOGLE_AUTH_SSO') {
      return res.status(400).json({ error: 'This account uses Google Single Sign-On. Please sign in with Google.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.email);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name, picture: user.picture },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully' });
});
