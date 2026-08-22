import { beforeAll, describe, expect, it } from 'vitest';
import { db, initDatabase } from '../db/index.js';
import app from '../index.js';
import request from 'supertest';

describe('Google OAuth 2.0 Single Sign-On Integration Test', () => {
  beforeAll(() => {
    initDatabase();
  });

  it('authenticates user via mock Google ID Token and sets HTTP-only session cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'mock_google_id_token_123456789' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Google Single Sign-On successful');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('google_user_123456789@example.com');
    expect(res.body.user.name).toBe('Google Learner 123456789');

    // Check database user record
    const dbUser = db.prepare(`SELECT * FROM users WHERE google_id = ?`).get('123456789') as any;
    expect(dbUser).toBeDefined();
    expect(dbUser.email).toBe('google_user_123456789@example.com');
  });

  it('rejects missing idToken payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Google ID Token is required');
  });
});
