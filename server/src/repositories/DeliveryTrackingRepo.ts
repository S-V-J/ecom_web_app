/**
 * @file DeliveryTrackingRepo.ts
 * @description Data Access Object for the 'delivery_tracking' table.
 * @systemic_role Manages real-time logistics, location updates, and proof of delivery.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export type DeliveryStatus = 'PENDING' | 'PICKED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';

export interface DeliveryTracking {
  id: string;
  order_id: string;
  partner_id: string | null;
  status: DeliveryStatus;
  latitude: number | null;
  longitude: number | null;
  proof_image_path: string | null;
  proof_signature_path: string | null;
  estimated_delivery_at: string | null;
  actual_delivery_at: string | null;
  created_at: string;
  updated_at: string;
}

export class DeliveryTrackingRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public create(orderId: string, partnerId?: string): DeliveryTracking {
    const id = uuidv4();
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO delivery_tracking (id, order_id, partner_id, status, created_at, updated_at)
      VALUES (?, ?, ?, 'PENDING', ?, ?)
    `);
    stmt.run(id, orderId, partnerId || null, now, now);
    return this.findById(orderId)!;
  }

  public findById(orderId: string): DeliveryTracking | undefined {
    const stmt = this.db.prepare('SELECT * FROM delivery_tracking WHERE order_id = ?');
    return stmt.get(orderId) as DeliveryTracking | undefined;
  }

  public updateLocation(orderId: string, latitude: number, longitude: number): boolean {
    const stmt = this.db.prepare(`
      UPDATE delivery_tracking SET latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?
    `);
    const result = stmt.run(latitude, longitude, orderId);
    return result.changes > 0;
  }

  public updateStatus(orderId: string, status: DeliveryStatus, proofImagePath?: string, proofSignaturePath?: string): boolean {
    const now = new Date().toISOString();
    const actualDelivery = status === 'DELIVERED' ? now : null;
    
    const stmt = this.db.prepare(`
      UPDATE delivery_tracking 
      SET status = ?, proof_image_path = COALESCE(?, proof_image_path), proof_signature_path = COALESCE(?, proof_signature_path), actual_delivery_at = COALESCE(?, actual_delivery_at), updated_at = ?
      WHERE order_id = ?
    `);
    const result = stmt.run(status, proofImagePath || null, proofSignaturePath || null, actualDelivery, now, orderId);
    return result.changes > 0;
  }
}