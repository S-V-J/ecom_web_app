-- ==========================================
-- 003_INVENTORY.SQL
-- Systemic Role: Tracks stock movements, batch intakes, and rich media assets.
-- Relies on 'products' and 'users'.
-- ==========================================

PRAGMA foreign_keys = ON;

-- 1. Inventory Ledger (Append-only audit trail)
CREATE TABLE IF NOT EXISTS inventory_ledger (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    change_type TEXT NOT NULL CHECK(change_type IN ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'RESERVED', 'RELEASED')),
    quantity_change INTEGER NOT NULL,
    reference_id TEXT,
    reference_type TEXT CHECK(reference_type IN ('ORDER', 'STOCK_ENTRY', 'MANUAL', 'REFUND')),
    notes TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_ledger_product ON inventory_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON inventory_ledger(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON inventory_ledger(created_at);

-- 2. Stock Entries
CREATE TABLE IF NOT EXISTS stock_entries (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_cost_cents INTEGER NOT NULL CHECK(unit_cost_cents >= 0),
    supplier_info TEXT,
    received_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'RECEIVED', 'CANCELLED')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_stock_entries_product ON stock_entries(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_status ON stock_entries(status);

-- 3. Media Assets
CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK(file_type IN ('IMAGE', 'VIDEO')),
    mime_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL CHECK(file_size_bytes > 0),
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
    uploaded_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_media_product ON media_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_media_primary ON media_assets(product_id, is_primary);