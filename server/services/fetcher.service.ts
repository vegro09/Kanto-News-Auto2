import axios from "axios";
import Parser from "rss-parser";
import { stateService } from "./state.service";

export interface FeedArticle {
  title: string;
  link: string;
  pubDate?: string;
  snippet: string;
}

export interface SourceResult {
  url: string;
  hostname: string;
  isRss: boolean;
  title: string;
  articles: FeedArticle[];
  rawTextPreview?: string;
  error?: string;
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) KantoAutomator/1.0",
    Accept: "application/rss+xml, application/atom+xml, text/xml, application/xml, text/html, */*",
  },
});

export class FetcherService {
  private getHostname(urlStr: string): string {
    try {
      return new URL(urlStr).hostname;
    } catch {
      return urlStr;
    }
  }

  private cleanHtml(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  async fetchSingleSource(url: string): Promise<SourceResult> {
    const hostname = this.getHostname(url);
    if (!url || !url.startsWith("http")) {
      return {
        url,
        hostname,
        isRss: false,
        title: "Invalid URL",
        articles: [],
        error: "URL must begin with http:// or https://",
      };
    }

    // Try parsing as RSS / Atom feed first
    try {
      stateService.appendLog("fetch", "info", `Attempting RSS parse for ${hostname}...`);
      const feed = await parser.parseURL(url);
      
      const articles: FeedArticle[] = (feed.items || []).slice(0, 10).map((item) => ({
        title: item.title || "Untitled",
        link: item.link || url,
        pubDate: item.pubDate || item.isoDate || undefined,
        snippet: this.cleanHtml(
          item.contentSnippet || item.content || item.summary || item.title || ""
        ).slice(0, 400),
      }));

      stateService.appendLog(
        "fetch",
        "info",
        `Parsed ${articles.length} items from RSS feed: "${feed.title || hostname}"`
      );

      return {
        url,
        hostname,
        isRss: true,
        title: feed.title || hostname,
        articles,
      };
    } catch (rssErr: any) {
      stateService.appendLog(
        "fetch",
        "warn",
        `Not a standard RSS feed or failed (${rssErr?.message || "format error"}). Trying raw HTTP text extraction...`
      );

      // Fallback: Axios direct GET request
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });

        const rawText = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
        const cleaned = this.cleanHtml(rawText).slice(0, 3000);

        stateService.appendLog(
          "fetch",
          "info",
          `Extracted ${cleaned.length} characters of raw content from ${hostname}`
        );

        return {
          url,
          hostname,
          isRss: false,
          title: hostname,
          articles: [
            {
              title: `Content extract from ${hostname}`,
              link: url,
              snippet: cleaned,
            },
          ],
          rawTextPreview: cleaned.slice(0, 500),
        };
      } catch (httpErr: any) {
        stateService.appendLog(
          "fetch",
          "error",
          `Failed to fetch URL ${url}: ${httpErr?.message || "Unknown network error"}`
        );
        return {
          url,
          hostname,
          isRss: false,
          title: hostname,
          articles: [],
          error: httpErr?.message || "Network request failed",
        };
      }
    }
  }

  async fetchAllSources(urls: string[]): Promise<SourceResult[]> {
    stateService.appendLog("fetch", "info", `Starting fetch for ${urls.length} sources...`);
    const validUrls = urls.filter((u) => u && u.trim().length > 0);

    if (validUrls.length === 0) {
      stateService.appendLog("fetch", "warn", "No URLs configured to fetch.");
      return [];
    }

    const results = await Promise.all(validUrls.map((url) => this.fetchSingleSource(url.trim())));
    const totalArticles = results.reduce((acc, r) => acc + r.articles.length, 0);

    stateService.appendLog(
      "fetch",
      "info",
      `Completed fetching ${results.length} sources with ${totalArticles} total items.`
    );

    return results;
  }
}

export const fetcherService = new FetcherService();
