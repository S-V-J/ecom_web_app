/**
 * @file ProductRepo.ts
 * @description Data Access Object for the 'products' table.
 * @systemic_role Manages storefront items, including critical stock quantity updates.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  stock_quantity: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  category_name: string;
}

export class ProductRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public findAll(limit: number = 20, offset: number = 0): ProductWithCategory[] {
    const stmt = this.db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.created_at DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as ProductWithCategory[];
  }

  public findById(id: string): ProductWithCategory | undefined {
    const stmt = this.db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `);
    return stmt.get(id) as ProductWithCategory | undefined;
  }

  public findBySlug(slug: string): ProductWithCategory | undefined {
    const stmt = this.db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.slug = ?
    `);
    return stmt.get(slug) as ProductWithCategory | undefined;
  }

  public create(data: {
    category_id: string;
    name: string;
    slug: string;
    description: string;
    price_cents: number;
    stock_quantity: number;
    status?: ProductStatus;
  }): Product {
    const id = uuidv4();
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO products (id, category_id, name, slug, description, price_cents, stock_quantity, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, data.category_id, data.name, data.slug, data.description, data.price_cents, data.stock_quantity, data.status || 'ACTIVE', now, now);
    return { id, ...data, status: data.status || 'ACTIVE', created_at: now, updated_at: now };
  }

  /**
   * Atomically updates product stock. The DB CHECK constraint prevents negative stock,
   * and this method returns false if the update would violate that constraint.
   */
  public updateStock(id: string, quantityChange: number): boolean {
    const stmt = this.db.prepare(`
      UPDATE products 
      SET stock_quantity = stock_quantity + ?, updated_at = ? 
      WHERE id = ? AND (stock_quantity + ?) >= 0
    `);
    const now = new Date().toISOString();
    const result = stmt.run(quantityChange, now, id, quantityChange);
    return result.changes > 0;
  }

  public update(id: string, data: Partial<Product>): boolean {
    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
    if (fields.length === 0) return false;
    
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (data as any)[f]);
    values.push(new Date().toISOString()); // updated_at
    values.push(id);

    const stmt = this.db.prepare(`UPDATE products SET ${setClause}, updated_at = ? WHERE id = ?`);
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  public delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}