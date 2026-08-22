-- GCP Cloud SQL (PostgreSQL) & Spanner Dialect Schema for ALIS
-- Highly Indexed Adjacency List & Materialized User State with Wikipedia Grounding

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  name VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  picture TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nodes (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(128) NOT NULL,
  estimated_minutes INT NOT NULL,
  difficulty VARCHAR(32) NOT NULL,
  wikipedia_url TEXT,
  wikipedia_summary TEXT
);

-- Adjacency List model for DAG representation
CREATE TABLE IF NOT EXISTS node_edges (
  parent_node_id VARCHAR(64) NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  child_node_id VARCHAR(64) NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_node_id, child_node_id)
);

CREATE INDEX IF NOT EXISTS idx_gcp_node_edges_parent ON node_edges(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_gcp_node_edges_child ON node_edges(child_node_id);

-- Append-Only Telemetry Events Firehose
CREATE TABLE IF NOT EXISTS telemetry_events (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id VARCHAR(64) NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL,
  quiz_score DOUBLE PRECISION,
  time_on_task_seconds DOUBLE PRECISION,
  skips_count INT,
  confidence_level INT,
  timestamp BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gcp_telemetry_user_node ON telemetry_events(user_id, node_id);
CREATE INDEX IF NOT EXISTS idx_gcp_telemetry_timestamp ON telemetry_events(timestamp DESC);

-- Materialized Real-Time State Per User & Node
CREATE TABLE IF NOT EXISTS user_node_state (
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id VARCHAR(64) NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL,
  highest_quiz_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_time_seconds DOUBLE PRECISION NOT NULL DEFAULT 0,
  confidence_level INT NOT NULL DEFAULT 0,
  attemptsCount INT NOT NULL DEFAULT 0,
  remediationCount INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, node_id)
);
