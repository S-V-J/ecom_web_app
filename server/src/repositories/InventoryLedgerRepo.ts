/**
 * @file InventoryLedgerRepo.ts
 * @description Data Access Object for the 'inventory_ledger' table.
 * @systemic_role Provides an immutable, append-only audit trail for all stock movements.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export type LedgerChangeType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'RESERVED' | 'RELEASED';
export type LedgerReferenceType = 'ORDER' | 'STOCK_ENTRY' | 'MANUAL' | 'REFUND';

export interface InventoryLedger {
  id: string;
  product_id: string;
  change_type: LedgerChangeType;
  quantity_change: number;
  reference_id: string | null;
  reference_type: LedgerReferenceType | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export class InventoryLedgerRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public findByProductId(productId: string, limit: number = 50, offset: number = 0): InventoryLedger[] {
    const stmt = this.db.prepare(`
      SELECT * FROM inventory_ledger 
      WHERE product_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(productId, limit, offset) as InventoryLedger[];
  }

  public findAll(limit: number = 50, offset: number = 0): (InventoryLedger & { created_by_email: string })[] {
    const stmt = this.db.prepare(`
      SELECT l.*, u.email as created_by_email
      FROM inventory_ledger l
      LEFT JOIN users u ON l.created_by = u.id
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as (InventoryLedger & { created_by_email: string })[];
  }

  /**
   * Records a stock change. 
   * NOTE: In production, this should be wrapped in a transaction alongside 
   * ProductRepository.updateStock() to ensure atomicity.
   */
  public create(data: {
    product_id: string;
    change_type: LedgerChangeType;
    quantity_change: number;
    reference_id?: string | null;
    reference_type?: LedgerReferenceType | null;
    notes?: string | null;
    created_by: string;
  }): InventoryLedger {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO inventory_ledger (id, product_id, change_type, quantity_change, reference_id, reference_type, notes, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.product_id,
      data.change_type,
      data.quantity_change,
      data.reference_id || null,
      data.reference_type || null,
      data.notes || null,
      data.created_by,
      now
    );

    return { 
      id, 
      ...data, 
      reference_id: data.reference_id || null, 
      reference_type: data.reference_type || null, 
      notes: data.notes || null, 
      created_at: now 
    };
  }
}