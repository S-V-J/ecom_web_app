/**
 * @file UserRepo.ts
 * @description Data Access Object for the 'users' table.
 * @systemic_role Abstracts SQL operations for user management, authentication lookups, 
 * and profile updates. Includes JOINs to fetch human-readable role and team names.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

// ==========================================
// LOCAL TYPES (Encapsulated within the Server DAO layer)
// ==========================================
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface DbUser {
  id: string;
  email: string;
  password_hash: string | null;
  phone: string | null;
  role_id: string;
  team_id: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface UserWithDetails extends DbUser {
  role_name: string;
  team_name: string | null;
}

export class UserRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Retrieves all users with joined role and team names for admin dashboards.
   */
  public findAll(): UserWithDetails[] {
    const stmt = this.db.prepare(`
      SELECT 
        u.*, 
        r.name as role_name, 
        t.name as team_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN teams t ON u.team_id = t.id
      ORDER BY u.created_at DESC
    `);
    return stmt.all() as UserWithDetails[];
  }

  /**
   * Retrieves a single user by UUID with joined details.
   */
  public findById(id: string): UserWithDetails | undefined {
    const stmt = this.db.prepare(`
      SELECT 
        u.*, 
        r.name as role_name, 
        t.name as team_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN teams t ON u.team_id = t.id
      WHERE u.id = ?
    `);
    return stmt.get(id) as UserWithDetails | undefined;
  }

  /**
   * Retrieves a user by email. Used primarily for authentication login.
   * CRITICAL: This query is fast due to the idx_users_email index.
   */
  public findByEmail(email: string): DbUser | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as DbUser | undefined;
  }

  /**
   * Retrieves a user by phone number. Used for OTP authentication.
   * CRITICAL: This query is fast due to the idx_users_phone index.
   */
  public findByPhone(phone: string): DbUser | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE phone = ?');
    return stmt.get(phone) as DbUser | undefined;
  }

  /**
   * Creates a new user. Returns the created DbUser object.
   * Properly handles nullable password_hash for OTP/OAuth users.
   */
  public create(data: {
    email: string;
    password_hash?: string | null;
    phone?: string | null;
    role_id: string;
    team_id?: string | null;
    status?: UserStatus;
  }): DbUser {
    const id = uuidv4();
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, phone, role_id, team_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      data.email,
      data.password_hash || null,
      data.phone || null,
      data.role_id,
      data.team_id || null,
      data.status || 'ACTIVE',
      now,
      now
    );
    return {
      id,
      email: data.email,
      password_hash: data.password_hash || null,
      phone: data.phone || null,
      role_id: data.role_id,
      team_id: data.team_id || null,
      status: data.status || 'ACTIVE',
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Updates a user's password hash. Used for password resets or initial OAuth linking.
   */
  public updatePassword(id: string, passwordHash: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?
    `);
    const result = stmt.run(passwordHash, new Date().toISOString(), id);
    return result.changes > 0;
  }

  /**
   * Updates a user's role. Returns true if successful.
   * ADDED: Required by admin.controller.ts for reassigning user roles.
   */
  public updateRole(id: string, role_id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE users SET role_id = ?, updated_at = ? WHERE id = ?
    `);
    const result = stmt.run(role_id, new Date().toISOString(), id);
    return result.changes > 0;
  }

  /**
   * Updates a user's activation status. Returns true if successful.
   */
  public updateStatus(id: string, status: UserStatus): boolean {
    const stmt = this.db.prepare(`
      UPDATE users SET status = ?, updated_at = ? WHERE id = ?
    `);
    const result = stmt.run(status, new Date().toISOString(), id);
    return result.changes > 0;
  }

  /**
   * Updates a user's team assignment. Returns true if successful.
   */
  public updateTeam(id: string, team_id: string | null): boolean {
    const stmt = this.db.prepare(`
      UPDATE users SET team_id = ?, updated_at = ? WHERE id = ?
    `);
    const result = stmt.run(team_id, new Date().toISOString(), id);
    return result.changes > 0;
  }

  /**
   * Deletes a user by UUID. Returns true if a row was deleted.
   */
  public delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}