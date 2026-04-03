# ClearPath — Admissions Intelligence Platform

An interactive prototype built for the Deerfield Director of Strategy & Product assessment.

**Live demo:** [View on Perplexity Computer](https://www.perplexity.ai/computer/a/clearpath-admissions-platform-5Y2m6CNiQgO8SNgmP3OK7g)

---

## What It Is

ClearPath is an AI-powered admissions acceleration platform with 5 modules, designed to compress time-to-admission for addiction treatment networks:

| Module | Description |
|--------|-------------|
| **1 — Instant Insurance Intelligence** | Real-time eligibility checks during intake call (vs. 24-48hr manual process) |
| **2 & 3 — Automated Patient Communication + Re-engagement Engine** | Automated SMS/email sequences by non-conversion reason; warm lead dashboard |
| **4 — Hybrid Care Gateway** | Standardized virtual/telehealth offering across all 11 centers via Kipu Health |
| **5 — BDO Referral Portal** | Zero-friction digital referral intake with magic-link tracking |

---

## Running Locally

### Prerequisites
- [Node.js](https://nodejs.org) v18 or higher (check with `node -v`)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Set up the database
npx drizzle-kit push

# 3. Build the frontend
npm run build

# 4. Start the server
NODE_ENV=production node dist/index.cjs
```

Then open **http://localhost:5000** in your browser.

---

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Express.js + Drizzle ORM + SQLite (better-sqlite3)
- **Build:** Vite + esbuild

---

## Notes

All patient names, center names, and data are synthetic — generated for demo purposes only.
