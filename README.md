# ClearPath — Admissions Intelligence Platform

An interactive prototype built for the Deerfield Director of Strategy & Product assessment.

> All patient names, center names, and data are synthetic — generated for demo purposes only.

---

## Running It Locally

### Step 1 — Install Node.js (one-time setup)

Check if you already have it:
```bash
node -v
```

If you see `v18` or higher, skip to Step 2. Otherwise, download it from **[nodejs.org](https://nodejs.org)** and install it.

### Step 2 — Set up and run

Open your terminal, navigate to this folder, and run these four commands:

```bash
npm install
npx drizzle-kit push
npm run build
npm run start:local
```

Then open **[http://localhost:5000](http://localhost:5000)** in your browser.

> **Tip:** You only need to run `npm install`, `npx drizzle-kit push`, and `npm run build` once. After that, just use `npm run start:local` to start the app.

---

## What's Inside

| Module | What it does |
|--------|-------------|
| **1 — Insurance Intelligence** | Real-time eligibility checks during intake (vs. 24–48hr manual process) |
| **2 & 3 — Re-engagement Engine** | Automated follow-up sequences by non-conversion reason; warm lead dashboard |
| **4 — Hybrid Care Gateway** | Standardized virtual/telehealth offering across all 11 centers via Kipu Health |
| **5 — BDO Referral Portal** | Zero-friction digital referral intake with magic-link tracking |

## Case Study

The full case study document is located in the [`/docs`](./docs) folder.
