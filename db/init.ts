/**
 * @file init.ts
 * @description Database initialization and seeding module.
 * @systemic_role Connects to SQLite, applies migrations in order, and populates 
 * the database with realistic, relational demo data idempotently.
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Resolve paths relative to the project root (where the script is executed)
const DB_PATH = path.resolve(process.cwd(), 'db', 'ecommerce.db');
const MIGRATIONS_DIR = path.resolve(process.cwd(), 'db', 'migrations');

console.log('🔌 Connecting to database at:', DB_PATH);

// 1. Initialize Database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
db.pragma('foreign_keys = ON');  // CRITICAL: Enable foreign key constraints in SQLite

console.log('✅ Database connected and foreign keys enabled.');

// 2. Apply Migrations
const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort(); // Ensures 001, 002, 003... execution order

for (const file of migrationFiles) {
  const filePath = path.join(MIGRATIONS_DIR, file);
  const sql = fs.readFileSync(filePath, 'utf-8');
  console.log(`🔄 Applying migration: ${file}`);
  db.exec(sql);
}
console.log('✅ All migrations applied successfully.');

// 3. Seed Data (Idempotent Check)
const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get() as { count: number };

if (roleCount.count > 0) {
  console.log('⏭️  Database already seeded. Skipping seed process.');
  db.close();
  process.exit(0);
}

console.log('🌱 Seeding database with realistic demo data...');

// Helper function to insert a record and return its ID
const insertRecord = (table: string, data: Record<string, any>) => {
  const columns = Object.keys(data).join(', ');
  const placeholders = Object.keys(data).map(k => `@${k}`).join(', ');
  const stmt = db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`);
  stmt.run(data);
  return data.id; // We manage UUIDs manually, so we return the one we passed in
};

// --- SEED ROLES ---
const roleIds: Record<string, string> = {};
const roles = [
  { id: uuidv4(), name: 'SUPER_ADMIN', description: 'Full system access and configuration' },
  { id: uuidv4(), name: 'TEAM_LEAD', description: 'Team management, task assignment, and reporting' },
  { id: uuidv4(), name: 'STAFF', description: 'Task execution and operational duties' },
  { id: uuidv4(), name: 'CUSTOMER', description: 'Public shopping portal access' }
];
for (const role of roles) {
  insertRecord('roles', role);
  roleIds[role.name] = role.id;
}

// --- SEED TEAMS ---
const teamIds: Record<string, string> = {};
const teams = [
  { id: uuidv4(), name: 'Inventory Management', type: 'INVENTORY' },
  { id: uuidv4(), name: 'Sales & Marketing', type: 'SALES' },
  { id: uuidv4(), name: 'Customer Support', type: 'SUPPORT' },
  { id: uuidv4(), name: 'Finance & Billing', type: 'FINANCE' },
  { id: uuidv4(), name: 'Logistics & Delivery', type: 'LOGISTICS' }
];
for (const team of teams) {
  insertRecord('teams', team);
  teamIds[team.type] = team.id;
}

// --- SEED USERS ---
const users = [
  { id: uuidv4(), email: 'admin@ecom.demo', password_hash: '$2b$10$dummyhashforadmin', role_id: roleIds['SUPER_ADMIN'], team_id: null, status: 'ACTIVE' },
  { id: uuidv4(), email: 'lead.inventory@ecom.demo', password_hash: '$2b$10$dummyhash', role_id: roleIds['TEAM_LEAD'], team_id: teamIds['INVENTORY'], status: 'ACTIVE' },
  { id: uuidv4(), email: 'staff.inventory@ecom.demo', password_hash: '$2b$10$dummyhash', role_id: roleIds['STAFF'], team_id: teamIds['INVENTORY'], status: 'ACTIVE' },
  { id: uuidv4(), email: 'lead.sales@ecom.demo', password_hash: '$2b$10$dummyhash', role_id: roleIds['TEAM_LEAD'], team_id: teamIds['SALES'], status: 'ACTIVE' },
  { id: uuidv4(), email: 'staff.support@ecom.demo', password_hash: '$2b$10$dummyhash', role_id: roleIds['STAFF'], team_id: teamIds['SUPPORT'], status: 'ACTIVE' },
  { id: uuidv4(), email: 'customer@ecom.demo', password_hash: '$2b$10$dummyhash', role_id: roleIds['CUSTOMER'], team_id: null, phone: '+1234567890', status: 'ACTIVE' }
];
for (const user of users) {
  insertRecord('users', user);
}

// --- SEED CATEGORIES ---
const categoryIds: Record<string, string> = {};
const categories = [
  { id: uuidv4(), name: 'Electronics', slug: 'electronics', parent_id: null, description: 'Gadgets, devices, and tech accessories' },
  { id: uuidv4(), name: 'Clothing', slug: 'clothing', parent_id: null, description: 'Apparel and fashion items' },
  { id: uuidv4(), name: 'Home & Garden', slug: 'home-garden', parent_id: null, description: 'Furniture, decor, and outdoor items' }
];
for (const cat of categories) {
  insertRecord('categories', cat);
  categoryIds[cat.slug] = cat.id;
}

// --- SEED PRODUCTS (10 Realistic Items) ---
const products = [
  { id: uuidv4(), category_id: categoryIds['electronics'], name: 'Wireless Noise-Canceling Headphones', slug: 'wireless-headphones', description: 'Premium over-ear headphones with 30h battery life.', price_cents: 29999, stock_quantity: 45 },
  { id: uuidv4(), category_id: categoryIds['electronics'], name: '4K Ultra HD Smart TV 55"', slug: '4k-smart-tv-55', description: 'Stunning picture quality with built-in streaming apps.', price_cents: 49999, stock_quantity: 12 },
  { id: uuidv4(), category_id: categoryIds['home-garden'], name: 'Ergonomic Office Chair', slug: 'ergonomic-office-chair', description: 'Lumbar support and breathable mesh for all-day comfort.', price_cents: 15999, stock_quantity: 30 },
  { id: uuidv4(), category_id: categoryIds['electronics'], name: 'Mechanical Gaming Keyboard', slug: 'mechanical-gaming-keyboard', description: 'RGB backlit with tactile blue switches.', price_cents: 12999, stock_quantity: 8 },
  { id: uuidv4(), category_id: categoryIds['clothing'], name: 'Organic Cotton T-Shirt', slug: 'organic-cotton-tshirt', description: 'Sustainable, soft, and available in multiple colors.', price_cents: 2999, stock_quantity: 150 },
  { id: uuidv4(), category_id: categoryIds['home-garden'], name: 'Stainless Steel Water Bottle', slug: 'stainless-steel-bottle', description: 'Keeps drinks cold for 24h or hot for 12h.', price_cents: 2499, stock_quantity: 200 },
  { id: uuidv4(), category_id: categoryIds['clothing'], name: 'Running Shoes - Pro Series', slug: 'running-shoes-pro', description: 'Lightweight, responsive cushioning for long distances.', price_cents: 8999, stock_quantity: 60 },
  { id: uuidv4(), category_id: categoryIds['electronics'], name: 'Smart Home Hub', slug: 'smart-home-hub', description: 'Control all your IoT devices from one central app.', price_cents: 7999, stock_quantity: 25 },
  { id: uuidv4(), category_id: categoryIds['home-garden'], name: 'Yoga Mat - Extra Thick', slug: 'yoga-mat-thick', description: 'Non-slip surface with 8mm cushioning.', price_cents: 3499, stock_quantity: 90 },
  { id: uuidv4(), category_id: categoryIds['clothing'], name: 'Denim Jacket - Classic Fit', slug: 'denim-jacket-classic', description: 'Timeless style with durable, washed denim.', price_cents: 5999, stock_quantity: 40 }
];
for (const prod of products) {
  insertRecord('products', prod);
}

// --- SEED SETTINGS ---
const settings = [
  { id: uuidv4(), key: 'store_name', value_type: 'STRING', value_string: 'Universal Demo Store' },
  { id: uuidv4(), key: 'default_currency', value_type: 'STRING', value_string: 'USD' },
  { id: uuidv4(), key: 'tax_rate_percent', value_type: 'NUMBER', value_number: 8.5 },
  { id: uuidv4(), key: 'free_shipping_threshold_cents', value_type: 'NUMBER', value_number: 5000 }
];
for (const setting of settings) {
  insertRecord('settings', setting);
}

// --- SEED FEATURE FLAGS ---
const featureFlags = [
  { id: uuidv4(), name: 'ENABLE_VOIP', is_enabled: 1, description: 'Allow in-browser voice calls between customers and agents' },
  { id: uuidv4(), name: 'ENABLE_LIVE_CHAT', is_enabled: 1, description: 'Show the live chat widget on the public storefront' },
  { id: uuidv4(), name: 'ALLOW_GUEST_CHECKOUT', is_enabled: 1, description: 'Permit purchases without requiring account registration' }
];
for (const flag of featureFlags) {
  insertRecord('feature_flags', flag);
}

console.log('🎉 Database initialization and seeding completed successfully!');
db.close();