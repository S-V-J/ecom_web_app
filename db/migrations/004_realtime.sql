-- ==========================================
-- 004_REALTIME.SQL
-- Systemic Role: Powers omnichannel chat, VoIP logs, and live delivery tracking.
-- Relies on 'users', 'teams', and 'orders'.
-- ==========================================

PRAGMA foreign_keys = ON;

-- 1. Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    guest_email TEXT,
    assigned_team_id TEXT,
    assigned_agent_id TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'PENDING', 'CLOSED')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer ON chat_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent ON chat_sessions(assigned_agent_id);

-- 2. Messages
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    sender_id TEXT,
    sender_type TEXT NOT NULL CHECK(sender_type IN ('CUSTOMER', 'AGENT', 'SYSTEM')),
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'TEXT' CHECK(message_type IN ('TEXT', 'IMAGE', 'FILE')),
    metadata TEXT,
    is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(session_id, created_at);

-- 3. Call Logs
CREATE TABLE IF NOT EXISTS call_logs (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    agent_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'INITIATED' CHECK(status IN ('INITIATED', 'RINGING', 'CONNECTED', 'ENDED', 'MISSED', 'FAILED')),
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    webrtc_session_id TEXT,
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TEXT,
    notes TEXT,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_call_logs_agent ON call_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_customer ON call_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_started ON call_logs(started_at);

-- 4. Delivery Tracking
CREATE TABLE IF NOT EXISTS delivery_tracking (
    id TEXT PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    partner_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PICKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED')),
    latitude REAL,
    longitude REAL,
    proof_image_path TEXT,
    proof_signature_path TEXT,
    estimated_delivery_at TEXT,
    actual_delivery_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_partner ON delivery_tracking(partner_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status ON delivery_tracking(status);