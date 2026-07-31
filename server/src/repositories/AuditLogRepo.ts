/**
 * @file AuditLogRepo.ts
 * @description Data Access Object for the 'audit_log' table.
 * @systemic_role Provides an immutable, append-only security and compliance trail.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: string | null;
  new_values: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: string | null;
  created_at: string;
}

export class AuditLogRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Creates a new audit log entry.
   * Explicitly maps optional input fields to null to satisfy strict TypeScript interface requirements.
   */
  public create(data: {
    actor_id?: string | null;
    action: string;
    entity_type: string;
    entity_id?: string | null;
    old_values?: string | null;
    new_values?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
    metadata?: string | null;
  }): AuditLog {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(
      id, 
      data.actor_id || null, 
      data.action, 
      data.entity_type, 
      data.entity_id || null,
      data.old_values || null, 
      data.new_values || null, 
      data.ip_address || null,
      data.user_agent || null, 
      data.metadata || null
    );

    // Explicitly construct the return object to ensure no 'undefined' values leak into the 'string | null' typed interface
    return {
      id,
      actor_id: data.actor_id || null,
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id || null,
      old_values: data.old_values || null,
      new_values: data.new_values || null,
      ip_address: data.ip_address || null,
      user_agent: data.user_agent || null,
      metadata: data.metadata || null,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Retrieves audit logs for a specific entity type and ID.
   */
  public findByEntity(entityType: string, entityId: string, limit: number = 20): AuditLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_log 
      WHERE entity_type = ? AND entity_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(entityType, entityId, limit) as AuditLog[];
  }
}