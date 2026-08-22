import { beforeAll, describe, expect, it } from 'vitest';
import { db, initDatabase, getUserNodeState } from '../db/index.js';
import { telemetryQueue } from '../services/telemetryQueue.js';

describe('Telemetry Ingestion & Async State Materialization Integration Test', () => {
  const userId = 'integration-user-1';
  const nodeId = 'LA-101';

  beforeAll(() => {
    initDatabase();
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at)
      VALUES (?, ?, 'hash', 'Test User', ?)
    `).run(userId, 'integration@test.com', new Date().toISOString());
  });

  it('enqueues telemetry signal and async worker materializes user_node_state', async () => {
    const startTime = Date.now();

    const eventId = telemetryQueue.enqueue({
      userId,
      nodeId,
      eventType: 'quiz_submit',
      quizScore: 85,
      confidenceLevel: 4,
      timeOnTaskSeconds: 300,
    });

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(50);
    expect(eventId).toBeDefined();

    await new Promise(resolve => setTimeout(resolve, 250));

    const state = getUserNodeState(userId, nodeId);
    expect(state).toBeDefined();
    expect(state?.userId).toBe(userId);
    expect(state?.nodeId).toBe(nodeId);
    expect(state?.status).toBe('mastered');
    expect(state?.highestQuizScore).toBe(85);
  });
});
