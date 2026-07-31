# 🗄️ Phase 3: Database Schema Design (ERD)

**Project:** Universal E-Commerce System – Interactive Demo  
**Database Engine:** SQLite (via `better-sqlite3`)  
**Design Principle:** Strict typing, immutable audit trails, financial precision, and scalable relationships.

---

## 1. Core Entities (Sub-Phase 3.1)

### 1.1 Roles (`roles`)
* **Systemic Role:** Defines permission boundaries (Super Admin, Team Lead, Staff, Customer). Decoupled for flexibility.
* **Rationale:** Lookup table ensures role consistency without altering the `users` table schema.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `name` | TEXT | UNIQUE, NOT NULL | e.g., 'SUPER_ADMIN', 'TEAM_LEAD', 'STAFF', 'CUSTOMER'. |
| `description` | TEXT | NOT NULL | Human-readable description of permissions. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |

* **Indexes:** `CREATE INDEX idx_roles_name ON roles(name);`

### 1.2 Teams (`teams`)
* **Systemic Role:** Groups employees into functional units (Inventory, Sales, Support, Finance, Logistics).
* **Rationale:** Allows dynamic team creation and operational responsibility assignment.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `name` | TEXT | NOT NULL | Display name (e.g., "North Delivery"). |
| `type` | TEXT | NOT NULL | 'INVENTORY', 'SALES', 'SUPPORT', 'FINANCE', 'LOGISTICS'. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |

* **Indexes:** `CREATE INDEX idx_teams_type ON teams(type);`

### 1.3 Users (`users`)
* **Systemic Role:** Represents all human actors (admins, employees, customers).
* **Rationale:** Centralized auth. `team_id` is nullable for Customers/Super Admins.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `email` | TEXT | UNIQUE, NOT NULL | Primary login identifier. |
| `password_hash`| TEXT | NULLABLE | Bcrypt hash. Null for OAuth/OTP-only users. |
| `phone` | TEXT | UNIQUE, NULLABLE | For OTP login and delivery contact. |
| `role_id` | TEXT | NOT NULL, FK(`roles.id`) | References `roles` table. |
| `team_id` | TEXT | NULLABLE, FK(`teams.id`) | References `teams` table. |
| `status` | TEXT | NOT NULL, DEFAULT 'ACTIVE' | 'ACTIVE', 'INACTIVE', 'SUSPENDED'. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |
| `updated_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |

* **Indexes:** `idx_users_email`, `idx_users_phone`, `idx_users_role_team`

### 1.4 Categories (`categories`)
* **Systemic Role:** Organizes products into a hierarchical taxonomy.
* **Rationale:** Self-referencing `parent_id` allows unlimited nesting.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `name` | TEXT | NOT NULL | Display name. |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-friendly identifier. |
| `parent_id` | TEXT | NULLABLE, FK(`categories.id`) | References parent category. Null for root. |
| `description` | TEXT | NULLABLE | Optional SEO/descriptive text. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |

* **Indexes:** `CREATE INDEX idx_categories_parent ON categories(parent_id);`

### 1.5 Products (`products`)
* **Systemic Role:** Represents sellable items in the storefront.
* **Rationale:** `price_cents` ensures exact financial calculations. `stock_quantity` is denormalized for fast reads.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `category_id` | TEXT | NOT NULL, FK(`categories.id`) | References `categories` table. |
| `name` | TEXT | NOT NULL | Product display name. |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-friendly identifier. |
| `description` | TEXT | NOT NULL | Rich text/markdown description. |
| `price_cents` | INTEGER | NOT NULL, CHECK(price_cents >= 0) | Price in smallest currency unit. |
| `stock_quantity`| INTEGER | NOT NULL, DEFAULT 0, CHECK(stock_quantity >= 0)| Current available stock. |
| `status` | TEXT | NOT NULL, DEFAULT 'ACTIVE' | 'ACTIVE', 'DRAFT', 'ARCHIVED'. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |
| `updated_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |

* **Indexes:** `idx_products_category`, `idx_products_status`, `idx_products_price`

---

## 2. Commerce Entities (Sub-Phase 3.2)

### 2.1 Orders (`orders`)
* **Systemic Role:** Central transactional record of a customer's purchase intent.
* **Rationale:** Supports authenticated and guest checkouts. Status acts as the fulfillment state machine.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `user_id` | TEXT | NULLABLE, FK(`users.id`) | NULL for guest checkouts. |
| `status` | TEXT | NOT NULL, DEFAULT 'PENDING' | CHECK(`status` IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')). |
| `total_amount_cents`| INTEGER | NOT NULL, CHECK(`total_amount_cents` >= 0) | Final calculated total in cents. |
| `shipping_name` | TEXT | NOT NULL | Recipient's full name. |
| `shipping_address`| TEXT | NOT NULL | Full formatted shipping address. |
| `shipping_phone` | TEXT | NOT NULL | Contact number for delivery. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |
| `updated_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |

* **Indexes:** `idx_orders_user`, `idx_orders_status`, `idx_orders_created`

### 2.2 Order Items (`order_items`)
* **Systemic Role:** Line items detailing exactly what was purchased.
* **Rationale:** Uses a **data snapshot** pattern. `product_name` and `unit_price_cents` are copied at checkout to ensure historical invoices remain legally accurate if product prices change.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `order_id` | TEXT | NOT NULL, FK(`orders.id`) ON DELETE CASCADE | References parent order. |
| `product_id` | TEXT | NOT NULL, FK(`products.id`) | References original product. |
| `product_name` | TEXT | NOT NULL | Snapshot of product name at purchase. |
| `quantity` | INTEGER | NOT NULL, CHECK(`quantity` > 0) | Number of units purchased. |
| `unit_price_cents`| INTEGER | NOT NULL, CHECK(`unit_price_cents` >= 0) | Snapshot of product price at purchase. |
| `total_price_cents`| INTEGER| NOT NULL, CHECK(`total_price_cents` >= 0) | Computed as `quantity * unit_price_cents`. |

* **Indexes:** `idx_order_items_order`, `idx_order_items_product`

### 2.3 Payments (`payments`)
* **Systemic Role:** Tracks financial settlement attempts and outcomes.
* **Rationale:** Decoupled from `orders` to allow for failed retries, partial authorizations, or multiple payment methods.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `order_id` | TEXT | NOT NULL, FK(`orders.id`) | References the order being paid for. |
| `amount_cents` | INTEGER | NOT NULL, CHECK(`amount_cents` >= 0) | Amount attempted to be charged. |
| `method` | TEXT | NOT NULL | CHECK(`method` IN ('CARD', 'UPI', 'WALLET', 'CASH_ON_DELIVERY')). |
| `status` | TEXT | NOT NULL, DEFAULT 'PENDING' | CHECK(`status` IN ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED')). |
| `transaction_id` | TEXT | UNIQUE, NULLABLE | Mock payment gateway reference ID. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |
| `updated_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |

* **Indexes:** `idx_payments_order`, `idx_payments_status`, `idx_payments_transaction` (partial unique)

### 2.4 Invoices (`invoices`)
* **Systemic Role:** Formal, immutable financial document generated upon order confirmation.
* **Rationale:** Separated from `orders` because an order might be placed but never paid. `invoice_number` provides a sequential accounting ID.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `order_id` | TEXT | UNIQUE, NOT NULL, FK(`orders.id`) | 1:1 relationship with confirmed order. |
| `invoice_number` | TEXT | UNIQUE, NOT NULL | Human-readable ID (e.g., 'INV-2026-00001'). |
| `subtotal_cents` | INTEGER | NOT NULL, CHECK(`subtotal_cents` >= 0) | Sum of all `order_items.total_price_cents`. |
| `tax_cents` | INTEGER | NOT NULL, DEFAULT 0, CHECK(`tax_cents` >= 0) | Calculated tax amount. |
| `total_cents` | INTEGER | NOT NULL, CHECK(`total_cents` >= 0) | `subtotal_cents + tax_cents`. |
| `issued_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When the invoice was generated. |
| `status` | TEXT | NOT NULL, DEFAULT 'DRAFT' | CHECK(`status` IN ('DRAFT', 'ISSUED', 'PAID', 'VOID')). |

* **Indexes:** `idx_invoices_number`, `idx_invoices_order`

---

## 3. Inventory Entities (Sub-Phase 3.3)

### 3.1 Inventory Ledger (`inventory_ledger`)
* **Systemic Role:** Immutable, append-only source of truth for every stock movement.
* **Rationale:** Recording every change as a signed integer (`quantity_change`) allows exact reconstruction of stock history. Polymorphic `reference_id`/`reference_type` links to the business event.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `product_id` | TEXT | NOT NULL, FK(`products.id`) | References affected product. |
| `change_type` | TEXT | NOT NULL | CHECK(`change_type` IN ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'RESERVED', 'RELEASED')). |
| `quantity_change`| INTEGER | NOT NULL | Signed integer. Positive for additions, negative for deductions. |
| `reference_id` | TEXT | NULLABLE | UUID of triggering entity (e.g., `order_id`). |
| `reference_type` | TEXT | NULLABLE | CHECK(`reference_type` IN ('ORDER', 'STOCK_ENTRY', 'MANUAL', 'REFUND')). |
| `notes` | TEXT | NULLABLE | Human-readable reason for the change. |
| `created_by` | TEXT | NOT NULL, FK(`users.id`) | User or system account who initiated the change. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |

* **Indexes:** `idx_ledger_product`, `idx_ledger_reference`, `idx_ledger_created_at`

### 3.2 Stock Entries (`stock_entries`)
* **Systemic Role:** Formal, batched intake of inventory managed by the Inventory Team.
* **Rationale:** Separates the *business event* of receiving goods from the *ledger entry*, capturing metadata like supplier info and unit cost.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `product_id` | TEXT | NOT NULL, FK(`products.id`) | References product being stocked. |
| `quantity` | INTEGER | NOT NULL, CHECK(`quantity` > 0) | Number of units received in this batch. |
| `unit_cost_cents`| INTEGER | NOT NULL, CHECK(`unit_cost_cents` >= 0) | Cost per unit from supplier. |
| `supplier_info` | TEXT | NULLABLE | Name or reference of the supplier/vendor. |
| `received_by` | TEXT | NOT NULL, FK(`users.id`) | Staff member who processed this entry. |
| `status` | TEXT | NOT NULL, DEFAULT 'PENDING' | CHECK(`status` IN ('PENDING', 'RECEIVED', 'CANCELLED')). |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |

* **Indexes:** `idx_stock_entries_product`, `idx_stock_entries_status`

### 3.3 Media Assets (`media_assets`)
* **Systemic Role:** Manages rich media files (images, videos) associated with products.
* **Rationale:** 1-to-many relationship allows multiple files per product. `is_primary` enables efficient hero image loading.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `product_id` | TEXT | NOT NULL, FK(`products.id`) ON DELETE CASCADE | References parent product. |
| `file_name` | TEXT | NOT NULL | Original uploaded file name. |
| `file_path` | TEXT | NOT NULL | Relative path in `/uploads/` directory. |
| `file_type` | TEXT | NOT NULL | CHECK(`file_type` IN ('IMAGE', 'VIDEO')). |
| `mime_type` | TEXT | NOT NULL | e.g., 'image/jpeg', 'video/mp4'. |
| `file_size_bytes`| INTEGER | NOT NULL, CHECK(`file_size_bytes` > 0) | File size for validation and UI display. |
| `is_primary` | INTEGER | NOT NULL, DEFAULT 0 | CHECK(`is_primary` IN (0, 1)). Boolean. |
| `uploaded_by` | TEXT | NOT NULL, FK(`users.id`) | Staff member who uploaded the asset. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |

* **Indexes:** `idx_media_product`, `idx_media_primary`

---

## 4. Real-time Entities (Sub-Phase 3.4)

### 4.1 Chat Sessions (`chat_sessions`)
* **Systemic Role:** Container for continuous conversation threads between customers and support/sales.
* **Rationale:** Tracks routing logic and lifecycle, decoupled from messages for efficient active/closed querying.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `customer_id` | TEXT | NULLABLE, FK(`users.id`) | NULL for guest chat users. |
| `guest_email` | TEXT | NULLABLE | Captured email if user is a guest. |
| `assigned_team_id`| TEXT | NULLABLE, FK(`teams.id`) | Team currently handling the chat. |
| `assigned_agent_id`| TEXT | NULLABLE, FK(`users.id`) | Specific staff member currently chatting. |
| `status` | TEXT | NOT NULL, DEFAULT 'OPEN' | CHECK(`status` IN ('OPEN', 'PENDING', 'CLOSED')). |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |
| `updated_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp of last activity. |

* **Indexes:** `idx_chat_sessions_customer`, `idx_chat_sessions_status`, `idx_chat_sessions_agent`

### 4.2 Messages (`messages`)
* **Systemic Role:** Individual text, image, or file payloads sent within a `chat_session`.
* **Rationale:** Designed for high-volume inserts. `sender_type` distinguishes customer, agent, and system messages.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `session_id` | TEXT | NOT NULL, FK(`chat_sessions.id`) ON DELETE CASCADE | References parent chat session. |
| `sender_id` | TEXT | NULLABLE, FK(`users.id`) | User who sent the message. NULL for system. |
| `sender_type` | TEXT | NOT NULL | CHECK(`sender_type` IN ('CUSTOMER', 'AGENT', 'SYSTEM')). |
| `content` | TEXT | NOT NULL | Actual text payload. |
| `message_type` | TEXT | NOT NULL, DEFAULT 'TEXT' | CHECK(`message_type` IN ('TEXT', 'IMAGE', 'FILE')). |
| `metadata` | TEXT | NULLABLE | JSON string for extra data (e.g., file URLs). |
| `is_read` | INTEGER | NOT NULL, DEFAULT 0 | CHECK(`is_read` IN (0, 1)). Boolean for read receipts. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |

* **Indexes:** `idx_messages_session`, `idx_messages_created`

### 4.3 Call Logs (`call_logs`)
* **Systemic Role:** Records metadata and outcomes of VoIP (WebRTC) calls.
* **Rationale:** Provides data for "Call History" viewer and team performance reports.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `customer_id` | TEXT | NULLABLE, FK(`users.id`) | Customer who initiated/received the call. |
| `agent_id` | TEXT | NOT NULL, FK(`users.id`) | Staff member who handled the call. |
| `team_id` | TEXT | NOT NULL, FK(`teams.id`) | Team the agent belongs to. |
| `status` | TEXT | NOT NULL, DEFAULT 'INITIATED' | CHECK(`status` IN ('INITIATED', 'RINGING', 'CONNECTED', 'ENDED', 'MISSED', 'FAILED')). |
| `duration_seconds`| INTEGER | NOT NULL, DEFAULT 0 | Total connected time in seconds. |
| `webrtc_session_id`| TEXT | NULLABLE | Unique identifier for WebRTC peer connection. |
| `started_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When call was initiated. |
| `ended_at` | TEXT | NULLABLE | When call was disconnected. |
| `notes` | TEXT | NULLABLE | Post-call notes added by agent. |

* **Indexes:** `idx_call_logs_agent`, `idx_call_logs_customer`, `idx_call_logs_started`

### 4.4 Delivery Tracking (`delivery_tracking`)
* **Systemic Role:** Real-time logistics record for an order, tracking physical movement and proof of delivery.
* **Rationale:** Enforces strict state machine. Stores latest geospatial coordinates (`REAL`) for live map, and file paths for delivery proof.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `order_id` | TEXT | UNIQUE, NOT NULL, FK(`orders.id`) | 1:1 relationship with order being delivered. |
| `partner_id` | TEXT | NULLABLE, FK(`users.id`) | Delivery staff member assigned to this order. |
| `status` | TEXT | NOT NULL, DEFAULT 'PENDING' | CHECK(`status` IN ('PENDING', 'PICKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED')). |
| `latitude` | REAL | NULLABLE | Current latitude of delivery partner. |
| `longitude` | REAL | NULLABLE | Current longitude of delivery partner. |
| `proof_image_path`| TEXT | NULLABLE | Relative path to delivery proof photo. |
| `proof_signature_path`| TEXT | NULLABLE | Relative path to digital signature image. |
| `estimated_delivery_at`| TEXT | NULLABLE | Expected delivery timestamp. |
| `actual_delivery_at`| TEXT | NULLABLE | Actual timestamp when marked 'DELIVERED'. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |
| `updated_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp of last update. |

* **Indexes:** `idx_delivery_tracking_order`, `idx_delivery_tracking_partner`, `idx_delivery_tracking_status`

---

## 5. System Entities (Sub-Phase 3.5)

### 5.1 Settings (`settings`)
* **Systemic Role:** Centralized key-value store for global system configuration.
* **Rationale:** Flexible schema allows adding settings without migrations. `value_type` provides application-layer type safety.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `key` | TEXT | UNIQUE, NOT NULL | Setting identifier (e.g., 'store_name', 'tax_rate_percent'). |
| `value_type` | TEXT | NOT NULL | CHECK(`value_type` IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON')). |
| `value_string` | TEXT | NULLABLE | Stores string values. |
| `value_number` | REAL | NULLABLE | Stores numeric values. |
| `value_boolean` | INTEGER | NULLABLE | CHECK(`value_boolean` IN (0, 1)). Stores boolean values. |
| `value_json` | TEXT | NULLABLE | Stores JSON-serialized complex objects. |
| `description` | TEXT | NULLABLE | Human-readable explanation. |
| `updated_by` | TEXT | NULLABLE, FK(`users.id`) | User who last modified this setting. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |
| `updated_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |

* **Indexes:** `idx_settings_key`

### 5.2 Audit Log (`audit_log`)
* **Systemic Role:** Immutable, append-only security and compliance trail.
* **Rationale:** Captures complete context: who (`actor_id`), what (`action`), to which entity (`entity_type`, `entity_id`), from where (`ip_address`), and what changed (`old_values`, `new_values`).

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `actor_id` | TEXT | NULLABLE, FK(`users.id`) | User who performed action. NULL for system events. |
| `action` | TEXT | NOT NULL | Operation performed (e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'). |
| `entity_type` | TEXT | NOT NULL | Type of entity affected (e.g., 'USER', 'PRODUCT', 'ORDER'). |
| `entity_id` | TEXT | NULLABLE | UUID of specific entity affected. |
| `old_values` | TEXT | NULLABLE | JSON snapshot of entity state *before* change. |
| `new_values` | TEXT | NULLABLE | JSON snapshot of entity state *after* change. |
| `ip_address` | TEXT | NULLABLE | IP address from which action was initiated. |
| `user_agent` | TEXT | NULLABLE | Browser/device user agent string. |
| `metadata` | TEXT | NULLABLE | Additional JSON context. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |

* **Indexes:** `idx_audit_log_actor`, `idx_audit_log_entity`, `idx_audit_log_action`, `idx_audit_log_created`

### 5.3 Feature Flags (`feature_flags`)
* **Systemic Role:** Runtime toggles for enabling/disabling major subsystems without code deployment.
* **Rationale:** Allows instant disabling of VoIP, Live Chat, or Guest Checkout if issues arise.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `name` | TEXT | UNIQUE, NOT NULL | Flag identifier (e.g., 'ENABLE_VOIP', 'ALLOW_GUEST_CHECKOUT'). |
| `is_enabled` | INTEGER | NOT NULL, DEFAULT 0 | CHECK(`is_enabled` IN (0, 1)). 1 = enabled, 0 = disabled. |
| `description` | TEXT | NULLABLE | Human-readable explanation. |
| `updated_by` | TEXT | NULLABLE, FK(`users.id`) | User who last toggled this flag. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |
| `updated_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |

* **Indexes:** `idx_feature_flags_name`, `idx_feature_flags_enabled`

### 5.4 Notifications (`notifications`)
* **Systemic Role:** In-app alerts delivered to users or teams (e.g., "Low stock alert", "New order received").
* **Rationale:** Supports individual (`user_id`) and team-wide (`team_id`) broadcasts. `action_url` provides deep-linking.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | UUID v4 identifier. |
| `user_id` | TEXT | NULLABLE, FK(`users.id`) | Target individual user. NULL if team-wide. |
| `team_id` | TEXT | NULLABLE, FK(`teams.id`) | Target team. NULL if individual. |
| `type` | TEXT | NOT NULL | CHECK(`type` IN ('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'SYSTEM')). |
| `title` | TEXT | NOT NULL | Short notification headline. |
| `message` | TEXT | NOT NULL | Detailed notification body. |
| `action_url` | TEXT | NULLABLE | Relative URL for deep-linking. |
| `is_read` | INTEGER | NOT NULL, DEFAULT 0 | CHECK(`is_read` IN (0, 1)). Boolean for read tracking. |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | ISO 8601 timestamp. |
| `read_at` | TEXT | NULLABLE | ISO 8601 timestamp when marked as read. |

* **Indexes:** `idx_notifications_user`, `idx_notifications_team`, `idx_notifications_created`