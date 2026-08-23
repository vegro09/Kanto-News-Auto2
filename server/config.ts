import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export interface AppSettings {
  searchUrls: string[];
  apiKey: string;
  promptInstructions: string;
  scheduledTime: string;
  recipientEmail: string;
  googleConnected: boolean;
  smtpConfig: SmtpConfig;
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
  recipientEmail: process.env.RECIPIENT_EMAIL || "commander@kanto.empire",
  googleConnected: Boolean(process.env.GOOGLE_CONNECTED === "true" || process.env.SMTP_USER),
  smtpConfig: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || '"Kanto Automator" <flow@kanto.empire>',
  },
  geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
};

export const PORT = parseInt(process.env.PORT || "5000", 10);
