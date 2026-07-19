# 🚀 Phase 1: Environment & Toolchain Setup - Execution Prompts

**Instructions:** Copy and paste each prompt below into the chat **one at a time**. Wait for the AI to provide the complete response and for you to verify the output in your terminal before pasting the next prompt.

---

## Sub-Phase 1.1: Verify WSL2 Ubuntu & Update Packages
**Prompt:**
> Execute Phase 1, Sub-phase 1.1: Verify WSL2 Ubuntu installation and update system packages. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, a line-by-line mechanical breakdown, the purpose of each command, expected output, common edge-case failures with fixes, and precise verification steps to confirm success. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 1.2: Install Node.js 20 LTS via nvm
**Prompt:**
> Execute Phase 1, Sub-phase 1.2: Install Node.js 20 LTS using `nvm` (Node Version Manager). Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, a line-by-line mechanical breakdown, the purpose of each command, expected output, common edge-case failures with fixes, and precise verification steps to confirm success. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 1.3: Configure VS Code for WSL Remote Development
**Prompt:**
> Execute Phase 1, Sub-phase 1.3: Guide me through configuring the WSL environment for VS Code Remote-WSL development (including any necessary WSL-side CLI dependencies like build-essential, python3, and pkg-config). Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, a line-by-line mechanical breakdown, the purpose, expected output, common edge-case failures with fixes, and precise verification steps to confirm the VS Code WSL connection is successful. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 1.4: Install Global Tools (git, sqlite3, nodemon)
**Prompt:**
> Execute Phase 1, Sub-phase 1.4: Install global development tools including `git`, `sqlite3`, `libsqlite3-dev`, and `nodemon`. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, a line-by-line mechanical breakdown, the purpose of each command, expected output, common edge-case failures with fixes, and precise verification steps to confirm success. Do not proceed to the next sub-phase until I confirm.

---

## Sub-Phase 1.5: Initialize Git Repository & .gitignore
**Prompt:**
> Execute Phase 1, Sub-phase 1.5: Initialize the project Git repository, configure global Git identity, set the default branch to 'main', and create a comprehensive `.gitignore` file tailored for a Node.js, React, SQLite, and VS Code project. Strictly follow the engineering protocol: provide exact ready-to-run terminal syntax, a line-by-line mechanical breakdown, the purpose of each command and ignore rule, expected output, common edge-case failures with fixes, and precise verification steps to confirm success. Do not proceed to the next sub-phase until I confirm.

---

## Phase 1 Completion Check
**Prompt:**
> Phase 1 is complete. Verify that all sub-phases (1.1 to 1.5) are successfully executed. Summarize the final state of the environment, confirm all tools are in the PATH, verify the Git remote connection, and state that we are ready to proceed to Phase 2: Project Scaffolding & Monorepo Structure.