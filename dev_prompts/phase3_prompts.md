# 🚀 Phase 3: Database Schema Design & Initialization - Execution Prompts

**Instructions:** Copy and paste each prompt below into the chat **one at a time**. Wait for the AI to provide the complete response and for you to verify the output in your terminal/VS Code before pasting the next prompt. 
*Critical Note: For sub-phases 3.6, 3.7, and 3.8, the AI will generate large amounts of code. If the output cuts off, simply reply "Continue exactly where you left off" until the file is 100% complete.*

---

## Sub-Phase 3.1: Design ERD - Core Entities
**Prompt:**
> Execute Phase 3, Sub-phase 3.1: Design the Entity-Relationship schema for Core Entities: Users, Roles, Teams, Products, and Categories. Strictly follow the engineering protocol: provide a comprehensive but highly structured Markdown design document detailing every table, column, data type, primary/foreign key, constraint, and index. Explain the systemic role of each entity and the rationale behind the relationships. Be concise to preserve token budget for implementation. Do not write implementation code yet. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 3.2: Design ERD - Commerce Entities
**Prompt:**
> Execute Phase 3, Sub-phase 3.2: Design the Entity-Relationship schema for Commerce Entities: Orders, OrderItems, Payments, and Invoices. Strictly follow the engineering protocol: provide a comprehensive Markdown design document detailing every table, column, data type, primary/foreign key, constraint, and index. Ensure proper handling of order statuses, payment states, and financial precision (e.g., storing currency as integers/cents). Explain the systemic role of each entity. Do not write implementation code yet. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 3.3: Design ERD - Inventory Entities
**Prompt:**
> Execute Phase 3, Sub-phase 3.3: Design the Entity-Relationship schema for Inventory Entities: StockEntries, MediaAssets, and InventoryLedger. Strictly follow the engineering protocol: provide a comprehensive Markdown design document detailing every table, column, data type, primary/foreign key, constraint, and index. Ensure the InventoryLedger supports strict transactional tracking (stock-in, stock-out, adjustments). Explain the systemic role of each entity. Do not write implementation code yet. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 3.4: Design ERD - Real-time Entities
**Prompt:**
> Execute Phase 3, Sub-phase 3.4: Design the Entity-Relationship schema for Real-time Subsystem Entities: ChatSessions, Messages, CallLogs, and DeliveryTracking. Strictly follow the engineering protocol: provide a comprehensive Markdown design document detailing every table, column, data type, primary/foreign key, constraint, and index. Ensure DeliveryTracking includes state-machine statuses and geospatial data types (latitude/longitude as REAL). Explain the systemic role of each entity. Do not write implementation code yet. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 3.5: Design ERD - System Entities
**Prompt:**
> Execute Phase 3, Sub-phase 3.5: Design the Entity-Relationship schema for System Management Entities: Settings, AuditLog, FeatureFlags, and Notifications. Strictly follow the engineering protocol: provide a comprehensive Markdown design document detailing every table, column, data type, primary/foreign key, constraint, and index. Ensure AuditLog captures actor, action, entity, and timestamp efficiently. Explain the systemic role of each entity. Do not write implementation code yet. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 3.6: Write SQLite Migration Scripts
**Prompt:**
> Execute Phase 3, Sub-phase 3.6: Translate the designs from 3.1 to 3.5 into executable SQLite migration scripts. Create numbered files (e.g., `001_core.sql`, `002_commerce.sql`, etc.) in the `/db/migrations/` directory. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax to create the files, complete production-ready SQL code with detailed inline comments, a line-by-line mechanical breakdown of complex queries, expected output, common edge-case failures (e.g., foreign key constraint failures, missing idempotency) with fixes, and precise verification steps. Ensure ALL scripts begin with `PRAGMA foreign_keys = ON;` and use `CREATE TABLE IF NOT EXISTS`. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 3.7: Write Database Initialization & Seed Data Module
**Prompt:**
> Execute Phase 3, Sub-phase 3.7: Write the Node.js/TypeScript database initialization module (`/db/init.ts`). It must use `better-sqlite3` to auto-create the SQLite DB file, execute all migration scripts in order, and insert rich, realistic seed data (e.g., Super Admin user, sample teams, 10+ products with categories, sample orders, and system settings) on first boot. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax (including `npm install better-sqlite3`), complete production-ready code files with detailed inline comments explaining their systemic role, a line-by-line mechanical breakdown, expected output, common edge-case failures (e.g., duplicate seed data on re-run) with fixes, and precise verification steps. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 3.8a: Create Repository/DAO Layer - Core & Auth
**Prompt:**
> Execute Phase 3, Sub-phase 3.8a: Create the Repository/DAO layer for Core & Auth entities (`UserRepo.ts`, `RoleRepo.ts`, `TeamRepo.ts`) in `/server/src/repositories/`. Use `better-sqlite3`. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete, unabridged production-ready TypeScript code for THESE THREE repositories with detailed inline comments, a line-by-line mechanical breakdown of complex queries, expected output, common edge-case failures (e.g., SQL injection, unhandled promise rejections) with fixes, and precise verification steps. Do not use placeholders or "// TODO" blocks. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 3.8b: Create Repository/DAO Layer - Commerce & Inventory
**Prompt:**
> Execute Phase 3, Sub-phase 3.8b: Create the Repository/DAO layer for Commerce & Inventory entities (`ProductRepo.ts`, `CategoryRepo.ts`, `OrderRepo.ts`, `InventoryLedgerRepo.ts`) in `/server/src/repositories/`. Use `better-sqlite3`. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete, unabridged production-ready TypeScript code for THESE FOUR repositories with detailed inline comments, a line-by-line mechanical breakdown of complex queries, expected output, common edge-case failures with fixes, and precise verification steps. Do not use placeholders or "// TODO" blocks. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 3.8c: Create Repository/DAO Layer - Real-time & System
**Prompt:**
> Execute Phase 3, Sub-phase 3.8c: Create the Repository/DAO layer for Real-time & System entities (`ChatRepo.ts`, `DeliveryTrackingRepo.ts`, `AuditLogRepo.ts`, `SettingsRepo.ts`) in `/server/src/repositories/`. Use `better-sqlite3`. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete, unabridged production-ready TypeScript code for THESE FOUR repositories with detailed inline comments, a line-by-line mechanical breakdown of complex queries, expected output, common edge-case failures with fixes, and precise verification steps. Do not use placeholders or "// TODO" blocks. Do not proceed to the next sub-phase until I confirm.

---

## Phase 3 Completion Check
**Prompt:**
> Phase 3 is complete. Verify that all sub-phases (3.1 to 3.8c) are successfully executed. Summarize the final state of the database layer, confirm that running the initialization script successfully creates the DB, applies all migrations, seeds the data without errors, and that the DAO layer can successfully query the seeded data. State that we are ready to proceed to Phase 4: Authentication & Authorization System.