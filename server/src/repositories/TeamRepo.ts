/**
 * @file TeamRepo.ts
 * @description Data Access Object for the 'teams' table.
 * @systemic_role Abstracts SQL operations for employee team management, 
 * supporting CRUD operations required by the Super Admin portal.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export type TeamType = 'INVENTORY' | 'SALES' | 'SUPPORT' | 'FINANCE' | 'LOGISTICS';

export interface Team {
  id: string;
  name: string;
  type: TeamType;
  created_at: string;
}

export class TeamRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Retrieves all teams ordered alphabetically by name.
   */
  public findAll(): Team[] {
    const stmt = this.db.prepare('SELECT * FROM teams ORDER BY name ASC');
    return stmt.all() as Team[];
  }

  /**
   * Retrieves a single team by its UUID.
   */
  public findById(id: string): Team | undefined {
    const stmt = this.db.prepare('SELECT * FROM teams WHERE id = ?');
    return stmt.get(id) as Team | undefined;
  }

  /**
   * Retrieves all teams belonging to a specific functional type.
   */
  public findByType(type: TeamType): Team[] {
    const stmt = this.db.prepare('SELECT * FROM teams WHERE type = ?');
    return stmt.all(type) as Team[];
  }

  /**
   * Creates a new team. Returns the created Team object.
   */
  public create(name: string, type: TeamType): Team {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO teams (id, name, type)
      VALUES (?, ?, ?)
    `);
    stmt.run(id, name, type);
    return { id, name, type, created_at: new Date().toISOString() };
  }

  /**
   * Updates an existing team's name and type. Returns true if successful.
   */
  public update(id: string, name: string, type: TeamType): boolean {
    const stmt = this.db.prepare(`
      UPDATE teams SET name = ?, type = ? WHERE id = ?
    `);
    const result = stmt.run(name, type, id);
    return result.changes > 0;
  }

  /**
   * Deletes a team by UUID. Returns true if a row was deleted.
   * Note: Foreign key ON DELETE SET NULL will handle dependent users.
   */
  public delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM teams WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}