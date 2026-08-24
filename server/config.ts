import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export interface AppSettings {
  searchUrls: string[];
  apiKey: string;
  promptInstructions: string;
  scheduledTime: string;
  geminiModel: string;
}

export const DEFAULT_SEARCH_URLS = [
  "https://news.ycombinator.com/rss",
  "https://www.theverge.com/rss/index.xml",
];

export const DEFAULT_PROMPT_INSTRUCTIONS =
  "قم بتلخيص أهم الأخبار والبيانات في موجز صباحي تقني موجز ومركّز. رتّب النقاط حسب الأهمية في مجالات الذكاء الاصطناعي، البنية التحتية، وتطوير البرمجيات.";

export const DEFAULT_SCHEDULED_TIME = process.env.SCHEDULED_TIME || "07:00";

export const initialConfig: AppSettings = {
  searchUrls: process.env.SEARCH_URLS
    ? process.env.SEARCH_URLS.split(",").map((u) => u.trim()).filter(Boolean)
    : DEFAULT_SEARCH_URLS,
  apiKey: process.env.GEMINI_API_KEY || "",
  promptInstructions: process.env.PROMPT_INSTRUCTIONS || DEFAULT_PROMPT_INSTRUCTIONS,
  scheduledTime: DEFAULT_SCHEDULED_TIME,
  geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
};

export const PORT = parseInt(process.env.PORT || "5000", 10);
