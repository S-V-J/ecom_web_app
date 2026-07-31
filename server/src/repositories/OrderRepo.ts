/**
 * @file OrderRepo.ts
 * @description Data Access Object for the 'orders' and 'order_items' tables.
 * @systemic_role Manages transactional records with atomic creation to prevent partial data corruption.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
}

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  total_amount_cents: number;
  shipping_name: string;
  shipping_address: string;
  shipping_phone: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  user_email?: string | null;
}

export class OrderRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public findAll(limit: number = 20, offset: number = 0): OrderWithItems[] {
    const orderStmt = this.db.prepare(`
      SELECT o.*, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `);
    const orders = orderStmt.all(limit, offset) as (Order & { user_email?: string | null })[];
    const itemStmt = this.db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    
    return orders.map(order => ({
      ...order,
      items: itemStmt.all(order.id) as OrderItem[]
    }));
  }

  public findById(id: string): OrderWithItems | undefined {
    const orderStmt = this.db.prepare(`
      SELECT o.*, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `);
    const order = orderStmt.get(id) as (Order & { user_email?: string | null }) | undefined;
    if (!order) return undefined;

    const itemStmt = this.db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    return { ...order, items: itemStmt.all(order.id) as OrderItem[] };
  }

  public findByUserId(userId: string): OrderWithItems[] {
    const orderStmt = this.db.prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`);
    const orders = orderStmt.all(userId) as Order[];
    const itemStmt = this.db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    
    return orders.map(order => ({ ...order, items: itemStmt.all(order.id) as OrderItem[] }));
  }

  /**
   * Creates an order and its items atomically using a better-sqlite3 transaction.
   * If any item insertion fails, the entire order creation is rolled back.
   */
  public createWithItems(orderData: {
    user_id: string | null;
    total_amount_cents: number;
    shipping_name: string;
    shipping_address: string;
    shipping_phone: string;
    items: {
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price_cents: number;
      total_price_cents: number;
    }[];
  }): OrderWithItems {
    const createOrderTx = this.db.transaction((data: typeof orderData) => {
      const orderId = uuidv4();
      const now = new Date().toISOString();

      // 1. Insert Order Header
      const orderStmt = this.db.prepare(`
        INSERT INTO orders (id, user_id, status, total_amount_cents, shipping_name, shipping_address, shipping_phone, created_at, updated_at)
        VALUES (?, ?, 'PENDING', ?, ?, ?, ?, ?, ?)
      `);
      orderStmt.run(orderId, data.user_id, data.total_amount_cents, data.shipping_name, data.shipping_address, data.shipping_phone, now, now);

      // 2. Insert Order Items
      const itemStmt = this.db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price_cents, total_price_cents)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const item of data.items) {
        itemStmt.run(uuidv4(), orderId, item.product_id, item.product_name, item.quantity, item.unit_price_cents, item.total_price_cents);
      }

      return this.findById(orderId)!;
    });

    return createOrderTx(orderData);
  }

  public updateStatus(id: string, status: OrderStatus): boolean {
    const stmt = this.db.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`);
    const result = stmt.run(status, new Date().toISOString(), id);
    return result.changes > 0;
  }
}