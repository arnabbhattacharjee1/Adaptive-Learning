import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { LearningNode, NodeEdge, TelemetrySignal, UserNodeState } from '../types.js';
import { getValidatedSeedData } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../alis.db');

export const db = new Database(dbPath);

// Enable WAL mode & foreign key constraints for maximum SQLite concurrency & throughput
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Prepared Statement Cache for High Throughput Execution
let stmtGetAllNodes: Database.Statement | null = null;
let stmtGetAllEdges: Database.Statement | null = null;
let stmtGetNodeById: Database.Statement | null = null;
let stmtGetUserNodeState: Database.Statement | null = null;
let stmtGetAllUserNodeStates: Database.Statement | null = null;
let stmtSaveTelemetryEvent: Database.Statement | null = null;
let stmtUpsertUserNodeState: Database.Statement | null = null;

export function initDatabase() {
  // 1. Users table (Supports Google OAuth & password auth)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT,
      google_id TEXT UNIQUE,
      picture TEXT,
      created_at TEXT NOT NULL
    );
  `);

  try { db.exec(`ALTER TABLE users ADD COLUMN google_id TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN picture TEXT;`); } catch (e) {}

  // 2. Nodes table (Knowledge Graph DAG with Wikipedia grounding)
  db.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      estimated_minutes INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      wikipedia_url TEXT,
      wikipedia_summary TEXT
    );
  `);

  try { db.exec(`ALTER TABLE nodes ADD COLUMN wikipedia_url TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE nodes ADD COLUMN wikipedia_summary TEXT;`); } catch (e) {}

  // 3. Node Edges table (Adjacency List model with indexes)
  db.exec(`
    CREATE TABLE IF NOT EXISTS node_edges (
      parent_node_id TEXT NOT NULL,
      child_node_id TEXT NOT NULL,
      PRIMARY KEY (parent_node_id, child_node_id),
      FOREIGN KEY (parent_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
      FOREIGN KEY (child_node_id) REFERENCES nodes(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_node_edges_parent ON node_edges(parent_node_id);
    CREATE INDEX IF NOT EXISTS idx_node_edges_child ON node_edges(child_node_id);
  `);

  // 4. Telemetry Events (Append-Only Firehose)
  db.exec(`
    CREATE TABLE IF NOT EXISTS telemetry_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      quiz_score REAL,
      time_on_task_seconds REAL,
      skips_count INTEGER,
      confidence_level INTEGER,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_telemetry_user_node ON telemetry_events(user_id, node_id);
  `);

  // 5. User Node State (Materialized Real-Time Aggregation)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_node_state (
      user_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      status TEXT NOT NULL,
      highest_quiz_score REAL NOT NULL DEFAULT 0,
      total_time_seconds REAL NOT NULL DEFAULT 0,
      confidence_level INTEGER NOT NULL DEFAULT 0,
      attempts_count INTEGER NOT NULL DEFAULT 0,
      remediation_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, node_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
    );
  `);

  // Seed Knowledge Graph (Cleans out old legacy modules)
  seedKnowledgeGraph();

  // Initialize Prepared Statement Cache
  initStatementCache();
}

function initStatementCache() {
  stmtGetAllNodes = db.prepare(`SELECT * FROM nodes`);
  stmtGetAllEdges = db.prepare(`SELECT parent_node_id, child_node_id FROM node_edges`);
  stmtGetNodeById = db.prepare(`SELECT * FROM nodes WHERE id = ?`);
  stmtGetUserNodeState = db.prepare(`SELECT * FROM user_node_state WHERE user_id = ? AND node_id = ?`);
  stmtGetAllUserNodeStates = db.prepare(`SELECT * FROM user_node_state WHERE user_id = ?`);
  stmtSaveTelemetryEvent = db.prepare(`
    INSERT INTO telemetry_events 
    (id, user_id, node_id, event_type, quiz_score, time_on_task_seconds, skips_count, confidence_level, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmtUpsertUserNodeState = db.prepare(`
    INSERT INTO user_node_state
    (user_id, node_id, status, highest_quiz_score, total_time_seconds, confidence_level, attempts_count, remediation_count, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, node_id) DO UPDATE SET
      status = excluded.status,
      highest_quiz_score = MAX(user_node_state.highest_quiz_score, excluded.highest_quiz_score),
      total_time_seconds = user_node_state.total_time_seconds + excluded.total_time_seconds,
      confidence_level = CASE WHEN excluded.confidence_level > 0 THEN excluded.confidence_level ELSE user_node_state.confidence_level END,
      attempts_count = user_node_state.attempts_count + excluded.attempts_count,
      remediation_count = user_node_state.remediation_count + excluded.remediation_count,
      updated_at = excluded.updated_at
  `);
}

function seedKnowledgeGraph() {
  const { nodes, edges } = getValidatedSeedData();

  const seedTx = db.transaction(() => {
    // Purge any legacy DSA or non-seed nodes and edges
    db.prepare(`DELETE FROM node_edges`).run();
    db.prepare(`DELETE FROM user_node_state WHERE node_id LIKE 'DSA%'`).run();
    db.prepare(`DELETE FROM telemetry_events WHERE node_id LIKE 'DSA%'`).run();
    db.prepare(`DELETE FROM nodes`).run();

    const insertNode = db.prepare(`
      INSERT INTO nodes (id, code, title, description, category, estimated_minutes, difficulty, wikipedia_url, wikipedia_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertEdge = db.prepare(`
      INSERT INTO node_edges (parent_node_id, child_node_id)
      VALUES (?, ?)
    `);

    for (const node of nodes) {
      insertNode.run(
        node.id,
        node.code,
        node.title,
        node.description,
        node.category,
        node.estimatedMinutes,
        node.difficulty,
        node.wikipediaUrl || null,
        node.wikipediaSummary || null
      );
    }
    for (const edge of edges) {
      insertEdge.run(edge.parentNodeId, edge.childNodeId);
    }
  });

  seedTx();
}

/* Optimized High-Performance Data Access Methods */

export function getAllNodes(): LearningNode[] {
  const stmt = stmtGetAllNodes || db.prepare(`SELECT * FROM nodes`);
  const rows = stmt.all() as any[];
  return rows.map(r => ({
    id: r.id,
    code: r.code,
    title: r.title,
    description: r.description,
    category: r.category,
    estimatedMinutes: r.estimated_minutes,
    difficulty: r.difficulty,
    wikipediaUrl: r.wikipedia_url,
    wikipediaSummary: r.wikipedia_summary,
  }));
}

export function getAllEdges(): NodeEdge[] {
  const stmt = stmtGetAllEdges || db.prepare(`SELECT parent_node_id, child_node_id FROM node_edges`);
  const rows = stmt.all() as any[];
  return rows.map(r => ({
    parentNodeId: r.parent_node_id,
    childNodeId: r.child_node_id,
  }));
}

export function getNodeById(nodeId: string): LearningNode | undefined {
  const stmt = stmtGetNodeById || db.prepare(`SELECT * FROM nodes WHERE id = ?`);
  const r = stmt.get(nodeId) as any;
  if (!r) return undefined;
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    description: r.description,
    category: r.category,
    estimatedMinutes: r.estimated_minutes,
    difficulty: r.difficulty,
    wikipediaUrl: r.wikipedia_url,
    wikipediaSummary: r.wikipedia_summary,
  };
}

export function getUserNodeState(userId: string, nodeId: string): UserNodeState | undefined {
  const stmt = stmtGetUserNodeState || db.prepare(`SELECT * FROM user_node_state WHERE user_id = ? AND node_id = ?`);
  const r = stmt.get(userId, nodeId) as any;
  if (!r) return undefined;
  return {
    userId: r.user_id,
    nodeId: r.node_id,
    status: r.status,
    highestQuizScore: r.highest_quiz_score,
    totalTimeSeconds: r.total_time_seconds,
    confidenceLevel: r.confidence_level,
    attemptsCount: r.attempts_count,
    remediationCount: r.remediation_count,
    updatedAt: r.updated_at,
  };
}

export function getAllUserNodeStates(userId: string): UserNodeState[] {
  const stmt = stmtGetAllUserNodeStates || db.prepare(`SELECT * FROM user_node_state WHERE user_id = ?`);
  const rows = stmt.all(userId) as any[];
  return rows.map(r => ({
    userId: r.user_id,
    nodeId: r.node_id,
    status: r.status,
    highestQuizScore: r.highest_quiz_score,
    totalTimeSeconds: r.total_time_seconds,
    confidenceLevel: r.confidence_level,
    attemptsCount: r.attempts_count,
    remediationCount: r.remediation_count,
    updatedAt: r.updated_at,
  }));
}

export function saveTelemetryEvent(eventId: string, signal: TelemetrySignal) {
  const stmt = stmtSaveTelemetryEvent || db.prepare(`
    INSERT INTO telemetry_events 
    (id, user_id, node_id, event_type, quiz_score, time_on_task_seconds, skips_count, confidence_level, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    eventId,
    signal.userId,
    signal.nodeId,
    signal.eventType,
    signal.quizScore ?? null,
    signal.timeOnTaskSeconds ?? null,
    signal.skipsCount ?? null,
    signal.confidenceLevel ?? null,
    signal.timestamp ?? Date.now()
  );
}

export function upsertUserNodeState(state: UserNodeState) {
  const stmt = stmtUpsertUserNodeState || db.prepare(`
    INSERT INTO user_node_state
    (user_id, node_id, status, highest_quiz_score, total_time_seconds, confidence_level, attempts_count, remediation_count, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, node_id) DO UPDATE SET
      status = excluded.status,
      highest_quiz_score = MAX(user_node_state.highest_quiz_score, excluded.highest_quiz_score),
      total_time_seconds = user_node_state.total_time_seconds + excluded.total_time_seconds,
      confidence_level = CASE WHEN excluded.confidence_level > 0 THEN excluded.confidence_level ELSE user_node_state.confidence_level END,
      attempts_count = user_node_state.attempts_count + excluded.attempts_count,
      remediation_count = user_node_state.remediation_count + excluded.remediation_count,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    state.userId,
    state.nodeId,
    state.status,
    state.highestQuizScore,
    state.totalTimeSeconds,
    state.confidenceLevel,
    state.attemptsCount,
    state.remediationCount,
    state.updatedAt
  );
}
