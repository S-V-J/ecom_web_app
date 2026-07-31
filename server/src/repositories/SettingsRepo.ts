/**
 * @file SettingsRepo.ts
 * @description Data Access Object for the 'settings' table.
 * @systemic_role Manages global, dynamic system configuration without requiring code deployments.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export type ValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';

export interface Setting {
  id: string;
  key: string;
  value_type: ValueType;
  value_string: string | null;
  value_number: number | null;
  value_boolean: number | null; // 0 or 1
  value_json: string | null;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export class SettingsRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public getSetting(key: string): Setting | undefined {
    const stmt = this.db.prepare('SELECT * FROM settings WHERE key = ?');
    return stmt.get(key) as Setting | undefined;
  }

  public setSetting(data: {
    key: string;
    value_type: ValueType;
    value_string?: string | null;
    value_number?: number | null;
    value_boolean?: number | null;
    value_json?: string | null;
    description?: string | null;
    updated_by?: string | null;
  }): Setting {
    const now = new Date().toISOString();
    
    // Check if exists
    const existing = this.getSetting(data.key);
    
    if (existing) {
      const stmt = this.db.prepare(`
        UPDATE settings SET 
          value_type = ?, value_string = ?, value_number = ?, value_boolean = ?, value_json = ?, 
          description = COALESCE(?, description), updated_by = ?, updated_at = ?
        WHERE key = ?
      `);
      stmt.run(
        data.value_type, data.value_string || null, data.value_number || null, data.value_boolean || null, data.value_json || null,
        data.description || null, data.updated_by || null, now, data.key
      );
      return this.getSetting(data.key)!;
    } else {
      const id = uuidv4();
      const stmt = this.db.prepare(`
        INSERT INTO settings (id, key, value_type, value_string, value_number, value_boolean, value_json, description, updated_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id, data.key, data.value_type, data.value_string || null, data.value_number || null, data.value_boolean || null, data.value_json || null,
        data.description || null, data.updated_by || null, now, now
      );
      return this.getSetting(data.key)!;
    }
  }
}