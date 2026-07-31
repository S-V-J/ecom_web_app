# 🚀 Phase 2: Project Scaffolding & Monorepo Structure - Execution Prompts

**Instructions:** Copy and paste each prompt below into the chat **one at a time**. Wait for the AI to provide the complete response and for you to verify the output in your terminal/VS Code before pasting the next prompt.

---

## Sub-Phase 2.1: Design and Create Root Directory Structure
**Prompt:**
> Execute Phase 2, Sub-phase 2.1: Design and create the root directory structure for the monorepo. Create the `/server`, `/client`, `/shared`, `/uploads`, and `/db` folders. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, a line-by-line mechanical breakdown, the purpose of each command, expected output, common edge-case failures with fixes, and precise verification steps to confirm success. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 2.2: Initialize `/server` with Express Boilerplate
**Prompt:**
> Execute Phase 2, Sub-phase 2.2: Initialize the `/server` directory with a `package.json` and create the Express.js boilerplate. The server must respond to `GET /health` on port 3001. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete production-ready code files with detailed inline comments explaining their systemic role, a line-by-line mechanical breakdown, the purpose of each file, expected output, common edge-case failures with fixes, and precise verification steps to confirm success. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 2.3: Initialize `/client` with Vite + React + TypeScript
**Prompt:**
> Execute Phase 2, Sub-phase 2.3: Initialize the `/client` directory using Vite with React and TypeScript. The React SPA must run on port 5173. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete production-ready configuration files with detailed inline comments explaining their systemic role, a line-by-line mechanical breakdown, the purpose of each file, expected output, common edge-case failures with fixes, and precise verification steps to confirm success. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 2.4: Create Root `package.json` with Concurrently Scripts
**Prompt:**
> Execute Phase 2, Sub-phase 2.4: Create the root `package.json` with `concurrently` scripts so that a single `npm run dev` command starts both the server and the client simultaneously. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete production-ready code files with detailed inline comments explaining their systemic role, a line-by-line mechanical breakdown, the purpose of each file, expected output, common edge-case failures with fixes, and precise verification steps to confirm success. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 2.5: Configure ESLint, Prettier, and Shared TypeScript Config
**Prompt:**
> Execute Phase 2, Sub-phase 2.5: Configure ESLint, Prettier, and shared TypeScript configurations for consistent linting and formatting across both the server and client apps. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete production-ready configuration files with detailed inline comments explaining their systemic role, a line-by-line mechanical breakdown, the purpose of each file, expected output, common edge-case failures with fixes, and precise verification steps to confirm success. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 2.6: Create `/shared` Module for Types and Interfaces
**Prompt:**
> Execute Phase 2, Sub-phase 2.6: Create the `/shared` module for shared types and interfaces that are importable by both the server and the client. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete production-ready code files with detailed inline comments explaining their systemic role, a line-by-line mechanical breakdown, the purpose of each file, expected output, common edge-case failures with fixes, and precise verification steps to confirm success. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 2.7: Configure Vite Proxy + CORS for Local Dev
**Prompt:**
> Execute Phase 2, Sub-phase 2.7: Configure the Vite proxy in the client and CORS in the server for local development so that Client → Server API calls work without CORS errors. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, complete production-ready code files with detailed inline comments explaining their systemic role, a line-by-line mechanical breakdown, the purpose of each file, expected output, common edge-case failures with fixes, and precise verification steps to confirm success. Do not proceed to the next sub-phase until I confirm.

---

## Phase 2 Completion Check
**Prompt:**
> Phase 2 is complete. Verify that all sub-phases (2.1 to 2.7) are successfully executed. Summarize the final state of the monorepo structure, confirm that `npm run dev` successfully starts both the Express server and the Vite React client without errors, and state that we are ready to proceed to Phase 3: Database Schema Design & Initialization.