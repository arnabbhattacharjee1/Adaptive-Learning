# Adaptive Learning Intelligence System (ALIS)

[![GCP Native](https://img.shields.io/badge/GCP-Cloud%20Run%20%7C%20PubSub%20%7C%20Cloud%20SQL-blue)](https://cloud.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-cyan)](https://reactjs.org/)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1%20AA%20Compliant-green)](https://www.w3.org/WAI/standards-guidelines/wcag/)

> **ALIS** is an enterprise-grade standalone web application designed for self-guided adult learners. It dynamically sequences learning modules based on four telemetry signals: **quiz scores**, **time-on-task**, **skipping behavior**, and **self-reported confidence metrics**.

---

## 🌟 Core Architecture & Capabilities

### 1. The Knowledge Graph (DAG Engine)
- Implements a **Directed Acyclic Graph (DAG)** using a heavily indexed Adjacency List model in SQLite / PostgreSQL.
- Implements **Kahn's Topological Sort** & **DFS Back-Edge Cycle Detection** to guarantee acyclic dependency resolution.
- Features the **Life & Annuities (L&A) Insurance Back-Office Operations** 4-tier curriculum (`LA-101` through `LA-402`).

### 2. Pure Routing Logic Engine
Implements the exact PRD routing rules based on telemetry signals:
- 🚀 **Fast-Tracking**: Auto-mastery & accelerated progression when skipping a module with a passing quiz score ($\ge 80\%$).
- 📈 **Standard Progression**: Sequential path progression upon achieving passing scores ($\ge 70\%$).
- 🛑 **Remediation**: Routes to strict prerequisites if quiz fails ($< 60\%$) or time-on-task exceeds $2.5\times$ estimated duration.
- 🔁 **Infinite Remediation Prevention**: Automatically breaks infinite loop cycles when remediation count reaches $\ge 3$.
- 💡 **Lateral Reinforcement**: Triggers reinforcement topics when quiz score is high ($\ge 85\%$) but self-reported confidence is low ($\le 2/5$).
- 🎯 **Calibration Drop**: Corrects metacognitive overconfidence when low quiz scores ($< 50\%$) are paired with max confidence ($5/5$).

### 3. Non-Blocking Telemetry Pipeline
- Asynchronous `/api/v1/telemetry` ingestion responding in $< 5\text{ms}$ with `202 Accepted`.
- Decoupled `ITelemetryPublisher` interface supporting local memory queue and **GCP Cloud Pub/Sub** (`PubSubTelemetryPublisher`).
- Materialized background worker updating `user_node_state` without blocking main HTTP looper threads.

### 4. Dynamic Content & Unique Quiz Generator
- Generates tailored module learning objectives, takeaways, and **100% unique operational quiz questions** for every module.
- Displays real-time visual choice feedback (🟢 Green correct / 🔴 Red incorrect choices) and statutory compliance rationale boxes.
- Grounded to canonical **Wikipedia** articles with direct links and definition excerpts.

### 5. Google Single Sign-On (SSO) & WCAG 2.1 AA UI
- Google Identity Services integration with server-side `google-auth-library` ID token verification (`POST /api/v1/auth/google`).
- Theme styled with **Google Sans** typography and Google's iconic 4-color brand palette (Blue `#1A73E8`, Red `#EA4335`, Yellow `#FBBC04`, Green `#34A853`).
- Dual-mode UI: Visual SVG Skill Tree + Keyboard-navigable Accessible Tree View (`role="tree"`, ARIA live region announcer).

---

## 📚 Life & Annuities (L&A) Insurance Curriculum

| Code | Tier | Title | Wikipedia Grounded Reference |
| :--- | :--- | :--- | :--- |
| `LA-101` | Tier 1 | Intake & KYC Operations *(Root Node)* | [Know your customer](https://en.wikipedia.org/wiki/Know_your_customer) |
| `LA-102` | Tier 1 | Medical Record (APS) Assembly & Underwriting | [Underwriting](https://en.wikipedia.org/wiki/Underwriting) |
| `LA-103` | Tier 1 | Policy Issuance & Free-Look Management | [Free-look period](https://en.wikipedia.org/wiki/Free-look_period) |
| `LA-201` | Tier 2 | Premium Exceptions, Grace Periods & Lapses | [Grace period](https://en.wikipedia.org/wiki/Grace_period) |
| `LA-202` | Tier 2 | Reinstatement Workflows & Evidence of Insurability | [Reinstatement](https://en.wikipedia.org/wiki/Reinstatement_(insurance)) |
| `LA-203` | Tier 2 | Beneficiary & Servicing Updates | [Beneficiary](https://en.wikipedia.org/wiki/Beneficiary) |
| `LA-204` | Tier 2 | Policy Loans, Collateral & Cash Surrenders | [Cash surrender value](https://en.wikipedia.org/wiki/Cash_surrender_value) |
| `LA-301` | Tier 3 | Annuitization, Income Options & Disbursements | [Annuitization](https://en.wikipedia.org/wiki/Annuitization) |
| `LA-302` | Tier 3 | Death Claims Processing & Contestability | [Contestability period](https://en.wikipedia.org/wiki/Contestability_period) |
| `LA-303` | Tier 3 | Unclaimed Property & Regulatory Escheatment | [Escheat](https://en.wikipedia.org/wiki/Escheat) |
| `LA-401` | Tier 4 | Back-Office SLA Tracking & Turnaround Time | [Service-level agreement](https://en.wikipedia.org/wiki/Service-level_agreement) |
| `LA-402` | Tier 4 | High-Volume Straight-Through Processing (STP) | [Straight-through processing](https://en.wikipedia.org/wiki/Straight-through_processing) |

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js, Express, TypeScript, Zod, Cookie-Parser, Google Auth Library
- **Database**: SQLite (WAL Mode) / PostgreSQL DDL for GCP Cloud SQL
- **Cloud Infrastructure**: GCP Cloud Run, GCP Pub/Sub, GCP Secret Manager
- **Testing**: Vitest (15/15 Passed), Playwright E2E

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+ and npm

### 1. Installation
Clone the repository and install dependencies for both backend and frontend:

```bash
# Clone repository
git clone https://github.com/arnabbhattacharjee1/Adaptive-Learning.git
cd Adaptive-Learning

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Running Locally
Start backend and frontend services:

```bash
# Start backend REST API server (Port 3001)
cd backend
npm run dev

# In a separate terminal, start frontend dev server (Port 5173)
cd frontend
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser!

### 3. Running Automated Tests
Run the 15 unit and integration test suites:

```bash
cd backend
npm run test
```

---

## ☁️ GCP Native Deployment (Cloud Run)

- **GCP Project ID**: `adaptive-learning-506305`
- **Region**: `us-west2`

### 1. Enable GCP APIs (Cloud Shell)
Run the automated script to activate required GCP APIs and create Pub/Sub topics:

```bash
chmod +x gcp-enable-apis.sh
./gcp-enable-apis.sh
```

### 2. Deploy to Cloud Run
Deploy using the provided multi-stage container manifest:

```bash
gcloud run deploy alis-backend \
  --project=adaptive-learning-506305 \
  --region=us-west2 \
  --config=gcp-cloud-run.yaml
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
