/**
 * @file test-repos.ts
 * @description Verification script for Real-time & System repositories.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { UserRepository } from './repositories/UserRepo';
import { ProductRepository } from './repositories/ProductRepo';
import { OrderRepository } from './repositories/OrderRepo';
import { ChatRepository } from './repositories/ChatRepo';
import { DeliveryTrackingRepository } from './repositories/DeliveryTrackingRepo';
import { AuditLogRepository } from './repositories/AuditLogRepo';
import { SettingsRepository } from './repositories/SettingsRepo';

const dbPath = path.resolve(__dirname, '../../db/ecommerce.db');
console.log('🔌 Connecting to database at:', dbPath);
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const userRepo = new UserRepository(db);
const productRepo = new ProductRepository(db);
const orderRepo = new OrderRepository(db);
const chatRepo = new ChatRepository(db);
const deliveryRepo = new DeliveryTrackingRepository(db);
const auditRepo = new AuditLogRepository(db);
const settingsRepo = new SettingsRepository(db);

const adminUser = userRepo.findByEmail('admin@ecom.demo');
if (!adminUser) throw new Error('Admin user not found.');

console.log('\n--- Testing ChatRepository ---');
// FIX: Fetch the actual Support team UUID to satisfy the foreign key constraint
const supportTeam = db.prepare("SELECT id FROM teams WHERE type = 'SUPPORT'").get() as { id: string } | undefined;
const session = chatRepo.createSession({ 
  guest_email: 'guest@test.com', 
  assigned_team_id: supportTeam ? supportTeam.id : undefined 
});
console.log(`✅ Created chat session: ${session.id}`);

const message = chatRepo.addMessage({
  session_id: session.id,
  sender_type: 'CUSTOMER',
  content: 'Hello, I need help with my order!'
});
console.log(`✅ Added message to session: "${message.content}"`);

console.log('\n--- Testing Order & DeliveryTrackingRepository ---');
// FIX: Create a valid order first to satisfy the delivery_tracking foreign key
const products = productRepo.findAll(1, 0);
const newOrder = orderRepo.createWithItems({
  user_id: adminUser.id,
  total_amount_cents: 29999,
  shipping_name: 'John Doe',
  shipping_address: '123 Test St, Demo City',
  shipping_phone: '+1234567890',
  items: [
    {
      product_id: products[0].id,
      product_name: products[0].name,
      quantity: 1,
      unit_price_cents: 29999,
      total_price_cents: 29999
    }
  ]
});
console.log(`✅ Created valid order: ${newOrder.id}`);

const tracking = deliveryRepo.create(newOrder.id, adminUser.id);
console.log(`✅ Created delivery tracking for order: ${tracking.order_id}`);

const locationUpdated = deliveryRepo.updateLocation(newOrder.id, 40.7128, -74.0060);
console.log(`✅ Location updated: ${locationUpdated ? 'YES' : 'NO'}`);

console.log('\n--- Testing AuditLogRepository ---');
const log = auditRepo.create({
  actor_id: adminUser.id,
  action: 'UPDATE',
  entity_type: 'PRODUCT',
  entity_id: products[0].id,
  old_values: JSON.stringify({ price: 1000 }),
  new_values: JSON.stringify({ price: 1500 }),
  ip_address: '192.168.1.1'
});
console.log(`✅ Created audit log entry: ${log.action} on ${log.entity_type}`);

console.log('\n--- Testing SettingsRepository ---');
const setting = settingsRepo.setSetting({
  key: 'maintenance_mode',
  value_type: 'BOOLEAN',
  value_boolean: 1,
  description: 'Enable to take the storefront offline',
  updated_by: adminUser.id
});
console.log(`✅ Set/Updated setting: ${setting.key} = ${setting.value_boolean}`);

console.log('\n🎉 All Real-time & System repository tests passed successfully!');
db.close();