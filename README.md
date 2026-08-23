# ⚡ Kanto News Auto

> **Autonomous News Aggregator, Gemini AI Arabic Summarizer & Gmail API Delivery System**  
> Designed under the strict **Kanto Empire Constitution** (Dynamic Flat UI, 8px radius, Kanto Black `#000000`, Kanto Cream `#F5F5DC`, `#333333` hairlines, zero glows/shadows).

---

## 🚀 Overview

**Kanto News Auto** is a production-grade full-stack automation system that fetches RSS feeds, summarizes them into structured Arabic technical digests using Google Gemini AI, and automatically dispatches the brief to the user's Gmail account at a scheduled time (e.g. `07:00 AM`) via the Google Gmail API using offline OAuth2 refresh tokens.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Timer Node  │────▶│ Search Nodes │────▶│  AI Engine   │────▶│  Gmail Node  │
│ (node-cron)  │     │(axios/parser)│     │ (@google/ai) │     │ (OAuth2/API) │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## 🛠️ Architecture & Features

### 1. Google OAuth2 & Gmail API (SaaS Architecture)
- **Offline Consent Flow**: Enforces `access_type: 'offline'` and `prompt: 'consent'` to securely capture and store long-lived `refresh_tokens`.
- **Dynamic Self-Delivery**: Automatically resolves sender and recipient to the exact Google account authenticated (`From: User -> To: User`).
- **RFC 2822 & Base64URL Encoding**: Standard MIME structure with UTF-8 encoding and responsive Arabic RTL HTML typography (`Tajawal` font).

### 2. Task Scheduling & Dynamic Recalibration
- Powered by `node-cron`.
- Configured in 24-hr `HH:mm` format (e.g. `07:00` $\rightarrow$ `0 7 * * *`).
- Dynamically reschedules the cron job whenever settings are altered in the UI.

### 3. Multi-Source Data Fetching Engine
- Built with `axios` and `rss-parser`.
- Queries RSS, Atom, and web sources in parallel.
- Strips raw HTML and extracts clean titles, links, and content snippets.

### 4. Gemini AI Arabic Summarization
- Integrates `@google/generative-ai` (`gemini-1.5-flash` / `gemini-2.0-flash`).
- Formats structured Arabic briefs (Key Highlights, Deep Analysis, Actionable Insights).

### 5. Dynamic Flat Flow Canvas (Frontend)
- Custom interactive SVG graph visualization.
- Pure Flat UI: 8px border radius, Kanto Cream borders, solid Kanto Black fill, no drop shadows, no glassmorphism, no glows.
- Displays live pipeline execution states (`TRIGGER`, `FETCHING`, `SUMMARIZING`, `DISPATCHING`, `SENT`).

---

## 📦 Quick Start & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/vegro09/Kanto-News-Auto1.git
cd Kanto-News-Auto1
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables (`.env`)
Create a `.env` file in the root folder:

```env
# Server Port
PORT=5000

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Daily Schedule (24-hour HH:mm format)
SCHEDULED_TIME=07:00

# Comma-separated Feed Sources
SEARCH_URLS=https://news.ycombinator.com/rss,https://www.theverge.com/rss/index.xml

# Custom Arabic Prompt Instructions
PROMPT_INSTRUCTIONS="قم بتلخيص أهم الأخبار والبيانات في موجز صباحي تقني موجز ومركّز. رتّب النقاط حسب الأهمية في مجالات الذكاء الاصطناعي، البنية التحتية، وتطوير البرمجيات."

# Google Cloud OAuth2 Credentials
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Automatically populated after Google Login:
GOOGLE_REFRESH_TOKEN=
GOOGLE_USER_EMAIL=
```

### 4. Run Full-Stack Development
```bash
npm run dev
```
- **Backend Core Engine**: `http://localhost:5000`
- **Vite React Frontend**: `http://localhost:3000`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/google` | Initiates Google OAuth2 offline consent flow |
| `GET` | `/api/auth/google/callback` | OAuth redirect callback exchanging code for `refresh_token` |
| `POST` | `/api/auth/google/disconnect` | Revokes stored Google OAuth tokens |
| `GET` | `/api/auth/status` | Returns OAuth identity and token state |
| `GET` | `/api/settings` | Returns active settings (search URLs, schedule, prompt) |
| `POST` | `/api/settings` | Updates in-memory settings and dynamically recalibrates scheduler |
| `POST` | `/api/trigger-test` | Manually triggers full pipeline (Fetch $\rightarrow$ AI $\rightarrow$ Gmail API) |
| `GET` | `/api/status` | Returns scheduler status and latest execution brief |
| `GET` | `/api/history` | Returns execution history logs |
| `GET` | `/api/health` | Service health check |

---

## 🏛️ Kanto Empire Design System

- **Master Canvas**: Solid Kanto Black (`#000000`)
- **Primary Tone**: Kanto Cream (`#F5F5DC`)
- **Hairlines**: 1px Solid (`#333333`)
- **Corner Radius**: `8px`
- **Typography**: Playfair Display Italic (Brand), Inter & Tajawal (Body / Arabic)
- **Prohibition**: Zero drop shadows, zero glassmorphism, zero 3D effects, zero glowing filters.

---

## 📜 License

MIT © Kanto Empire
