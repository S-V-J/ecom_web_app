/**
 * @file RoleRepo.ts
 * @description Data Access Object for the 'roles' table.
 * @systemic_role Abstracts all SQL operations related to system roles, ensuring 
 * type safety and centralized query management for authentication and authorization.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export class RoleRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Retrieves all roles ordered alphabetically by name.
   */
  public findAll(): Role[] {
    const stmt = this.db.prepare('SELECT * FROM roles ORDER BY name ASC');
    return stmt.all() as Role[];
  }

  /**
   * Retrieves a single role by its UUID.
   */
  public findById(id: string): Role | undefined {
    const stmt = this.db.prepare('SELECT * FROM roles WHERE id = ?');
    return stmt.get(id) as Role | undefined;
  }

  /**
   * Retrieves a single role by its unique name (e.g., 'SUPER_ADMIN').
   */
  public findByName(name: string): Role | undefined {
    const stmt = this.db.prepare('SELECT * FROM roles WHERE name = ?');
    return stmt.get(name) as Role | undefined;
  }

  /**
   * Creates a new role. Returns the created Role object.
   */
  public create(name: string, description: string): Role {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO roles (id, name, description)
      VALUES (?, ?, ?)
    `);
    stmt.run(id, name, description);
    return { id, name, description, created_at: new Date().toISOString() };
  }
}