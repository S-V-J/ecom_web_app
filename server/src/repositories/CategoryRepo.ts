/**
 * @file CategoryRepo.ts
 * @description Data Access Object for the 'categories' table.
 * @systemic_role Manages the hierarchical product taxonomy for the storefront.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  created_at: string;
}

export class CategoryRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public findAll(): Category[] {
    const stmt = this.db.prepare('SELECT * FROM categories ORDER BY name ASC');
    return stmt.all() as Category[];
  }

  public findById(id: string): Category | undefined {
    const stmt = this.db.prepare('SELECT * FROM categories WHERE id = ?');
    return stmt.get(id) as Category | undefined;
  }

  public findBySlug(slug: string): Category | undefined {
    const stmt = this.db.prepare('SELECT * FROM categories WHERE slug = ?');
    return stmt.get(slug) as Category | undefined;
  }

  public create(name: string, slug: string, parentId: string | null, description: string | null): Category {
    const id = uuidv4();
    const stmt = this.db.prepare(`
      INSERT INTO categories (id, name, slug, parent_id, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, slug, parentId, description);
    return { id, name, slug, parent_id: parentId, description, created_at: new Date().toISOString() };
  }

  public update(id: string, name: string, slug: string, parentId: string | null, description: string | null): boolean {
    const stmt = this.db.prepare(`
      UPDATE categories SET name = ?, slug = ?, parent_id = ?, description = ? WHERE id = ?
    `);
    const result = stmt.run(name, slug, parentId, description, id);
    return result.changes > 0;
  }

  public delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM categories WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}