/**
 * @file ChatRepo.ts
 * @description Data Access Object for 'chat_sessions' and 'messages' tables.
 * @systemic_role Manages omnichannel customer support interactions and message history.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export type ChatStatus = 'OPEN' | 'PENDING' | 'CLOSED';
export type SenderType = 'CUSTOMER' | 'AGENT' | 'SYSTEM';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE';

export interface ChatSession {
  id: string;
  customer_id: string | null;
  guest_email: string | null;
  assigned_team_id: string | null;
  assigned_agent_id: string | null;
  status: ChatStatus;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  sender_id: string | null;
  sender_type: SenderType;
  content: string;
  message_type: MessageType;
  metadata: string | null;
  is_read: number;
  created_at: string;
}

export class ChatRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public createSession(data: { customer_id?: string; guest_email?: string; assigned_team_id?: string }): ChatSession {
    const id = uuidv4();
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO chat_sessions (id, customer_id, guest_email, assigned_team_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'OPEN', ?, ?)
    `);
    stmt.run(id, data.customer_id || null, data.guest_email || null, data.assigned_team_id || null, now, now);
    return { id, customer_id: data.customer_id || null, guest_email: data.guest_email || null, assigned_team_id: data.assigned_team_id || null, assigned_agent_id: null, status: 'OPEN', created_at: now, updated_at: now };
  }

  public addMessage(data: { session_id: string; sender_id?: string; sender_type: SenderType; content: string; message_type?: MessageType; metadata?: string }): Message {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO messages (id, session_id, sender_id, sender_type, content, message_type, metadata, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `);
    stmt.run(id, data.session_id, data.sender_id || null, data.sender_type, data.content, data.message_type || 'TEXT', data.metadata || null);
    
    // Update session updated_at timestamp
    this.db.prepare('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(data.session_id);
    
    return { id, session_id: data.session_id, sender_id: data.sender_id || null, sender_type: data.sender_type, content: data.content, message_type: data.message_type || 'TEXT', metadata: data.metadata || null, is_read: 0, created_at: new Date().toISOString() };
  }

  public getMessagesBySessionId(sessionId: string, limit: number = 50): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ?
    `);
    return stmt.all(sessionId, limit) as Message[];
  }

  public markMessagesAsRead(sessionId: string, agentId: string): number {
    const stmt = this.db.prepare(`
      UPDATE messages SET is_read = 1 WHERE session_id = ? AND sender_type = 'CUSTOMER' AND is_read = 0
    `);
    const result = stmt.run(sessionId);
    return result.changes;
  }
}