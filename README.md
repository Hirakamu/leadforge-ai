# LeadForge AI ⚡🤖 — Autonomous B2B Sales Intelligence & Outreach SaaS

**LeadForge AI** is a production-ready B2B Micro-SaaS platform designed to turn raw company domains into high-converting, hyper-personalized sales outreach in seconds.

---

## 💎 Monetization & Business Model

| Tier | Price | Included Value | Target Market |
|---|---|---|---|
| **Starter** | **$49 / month** | 250 AI Enrichment Credits, Cold Email & LinkedIn Pitch Studio, Web Crawler | Solo Founders & Freelance Consultants |
| **Growth Scale** | **$149 / month** | 1,000 Credits, Multi-Channel Sequences (Email, DM, 60s Call Script), Industry Discovery Engine | High-Velocity B2B Sales Teams & Startups |
| **Agency Scale** | **$399 / month** | 5,000 Credits, Unlimited Team Seats, Dedicated Webhooks & CSV Reports | Lead Gen Agencies & Outbound SDR Teams |

---

## ✨ Core Features

1. **Autonomous Web Scraper & Intelligence**:
   - Extracts page titles, meta descriptions, OpenGraph tags, tech stack signatures (Next.js, Stripe, HubSpot, Shopify, Intercom, etc.), and contact information directly from company websites.
2. **Deep AI Lead Enrichment (Gemini 1.5 Pro / Flash)**:
   - Evaluates Ideal Customer Profile (ICP) Match Score (1–100%).
   - Identifies business bottlenecks, estimated ARR / revenue tier, and buyer persona targeting.
   - Built-in heuristic fallback engine ensures 100% uptime even without an API key.
3. **1-Click Multi-Channel Outreach Studio**:
   - Generates high-converting Cold Emails, LinkedIn Connection Notes (<280 chars), Day-3 Follow-Up Bumps, and 60-Second Cold Call Scripts.
   - Tone selector (Conversational, Consultative ROI, Problem-Agitate-Solve, Short & Punchy).
   - One-click copy & native `mailto:` email client launcher.
4. **Autonomous Lead Discovery Engine**:
   - 1-click industry prospect discovery (SaaS, FinTech, E-Commerce, HealthTech) pre-loaded with verified contacts.
5. **Full Pipeline CRM & Deal Funnel**:
   - Kanban board and interactive table view (Discovered → Enriched → Pitched → Replied → Closed Won).
6. **Credit System & Export Engine**:
   - Usage-based credit tracking, tier upgrades, and 1-click CSV export for CRMs (HubSpot, Salesforce, Clay, Zapier).

---

## 🚀 Quickstart Guide

### 1. Install & Configure
```bash
cd /home/hira/repo/leadforge-ai
npm install
```

### 2. Environment Variables (`.env`)
```env
PORT=3000
DB_PATH=./data/leadforge.db

# Optional: Add your Gemini API Key for real-time generative intelligence
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Glassmorphism, Lucide Icons, Canvas Confetti
- **Database**: Embedded SQLite (`better-sqlite3`) with WAL journal mode (zero cloud database fees)
- **Scraper**: Cheerio & Axios
- **AI Models**: Google Gemini 1.5 Pro / Flash with Heuristic Engine Fallback
