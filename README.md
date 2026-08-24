# ⚡ Kanto Automator: Local Intelligence Dashboard

> **Autonomous Multi-Source Aggregator & Gemini AI Arabic Intelligence Archive**  
> Designed under the strict **Kanto Empire Constitution** (Dynamic Flat UI, 8px radius, Kanto Black `#000000`, Kanto Cream `#F5F5DC`, `#333333` hairlines, zero glows/shadows, Tajawal Arabic typography).

---

## 🚀 Overview

**Kanto Automator** is a 100% self-contained local intelligence platform. It runs scheduled tasks (or manual triggers) to collect data across configured RSS/Atom/Web feeds, processes and structures them into concise Arabic technical briefs via Google Gemini AI (`@google/generative-ai`), and archives them in a local JSON storage library (`data/summaries.json`) readable directly through **The Reader** interface.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Timer Node  │────▶│ Source Nodes │────▶│  AI Engine   │────▶│ Local Storage│
│ (node-cron)  │     │(axios/parser)│     │ (@google/ai) │     │ (JSON Archive│
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## 🏛️ Core Features

1. **Local Archive & Persistence**:
   - Stores all generated digests locally in `data/summaries.json`.
   - Complete data sovereignty with zero external email or OAuth requirements.
2. **The Reader (Arabic Digest UI)**:
   - Browse previous intelligence digests by date and trigger type.
   - Beautiful Tajawal typography with RTL layout and Markdown formatting.
   - One-click text copying and local deletion.
3. **Dynamic Flow Visualizer (4-Stage Pipeline)**:
   - Timer Trigger $\rightarrow$ URL Sources $\rightarrow$ Gemini AI Engine $\rightarrow$ Local Storage.
   - Real-time execution indicators on nodes (`FETCHING`, `SUMMARIZING`, `ARCHIVING`, `SAVED`).
4. **Automated Scheduling**:
   - `node-cron` daily execution at your chosen time (e.g. `07:00 AM`).
   - Dynamic rescheduling on the fly when edited in the Settings view.

---

## 📦 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure `.env` (Optional)
```env
PORT=5000
SCHEDULED_TIME=07:00
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
SEARCH_URLS=https://news.ycombinator.com/rss,https://www.theverge.com/rss/index.xml
PROMPT_INSTRUCTIONS="قم بتلخيص أهم الأخبار والبيانات في موجز صباحي تقني موجز ومركّز. رتّب النقاط حسب الأهمية في مجالات الذكاء الاصطناعي، البنية التحتية، وتطوير البرمجيات."
```

### 3. Run Development Server
```bash
npm run dev
```
- **Frontend Dashboard**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000/api`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/summaries` | Returns list of archived Arabic intelligence briefs |
| `GET` | `/api/summaries/:id` | Returns single digest by ID |
| `DELETE` | `/api/summaries/:id` | Deletes a digest from local storage |
| `POST` | `/api/trigger-test` | Triggers the complete pipeline (Fetch $\rightarrow$ AI $\rightarrow$ Archive) |
| `GET` | `/api/settings` | Returns active settings |
| `POST` | `/api/settings` | Updates in-memory settings and recalibrates scheduler |
| `GET` | `/api/status` | Returns scheduler status and archive total |
| `GET` | `/api/health` | Service health check |

---

## 📜 License

MIT © Kanto Empire
