import { GoogleGenerativeAI } from "@google/generative-ai";
import { stateService } from "./state.service";
import { SourceResult } from "./fetcher.service";

export interface SummarizationResult {
  summaryArabic: string;
  model: string;
  sourceCount: number;
  articleCount: number;
  generatedAt: string;
  isMock?: boolean;
}

const CANDIDATE_MODELS = [
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-flash",
  "gemini-1.5-pro-latest",
  "gemini-pro",
];

export class AIService {
  /**
   * Builds the strict prompt enforcing Bilingual output (Arabic + English),
   * absolute prohibition of emojis, and Targeted Priority tagging with direct source links.
   */
  private buildBilingualPrompt(
    instructions: string,
    sources: SourceResult[]
  ): string {
    let contentBlock = "";

    for (const source of sources) {
      contentBlock += `\n\n--- Source: ${source.title} (${source.hostname}) ---\n`;
      if (source.error) {
        contentBlock += `[Failed to fetch: ${source.error}]\n`;
        continue;
      }
      for (const [idx, item] of source.articles.entries()) {
        contentBlock += `\nItem ${idx + 1}:\nTitle: ${item.title}\nURL: ${item.link}\nSummary: ${item.snippet}\n`;
      }
    }

    return `
You are the Chief Intelligence Analyst for Kanto Automator.
Your task is to synthesize, analyze, and summarize the collected news and data into an elite, disciplined, bilingual intelligence brief.

=======================================================
CRITICAL CONSTITUTIONAL RULES (MUST BE STRICTLY FOLLOWED)
=======================================================

1. STRICT BILINGUAL STRUCTURE:
Your entire output MUST be strictly divided into TWO distinct, fully developed sections:
- SECTION 1: ARABIC INTELLIGENCE BRIEF (Complete, professional Modern Standard Arabic)
- SECTION 2: ENGLISH INTELLIGENCE BRIEF (Complete, exact mirror analysis in professional English)
Use clear Markdown headers to separate the two sections.

2. ABSOLUTE PROHIBITION ON EMOJIS:
DO NOT use any emojis, icons, or decorative pictographs anywhere in your response (strictly no emojis like ⚡, 📌, 💡, 🔍, 🚀, 🤖, etc.). Maintain a pure, clean, technical, and sober tone.

3. TARGETED PRIORITY & DIRECT SOURCE URLS:
Analyze every news item against these five Core Strategic Domains:
  (a) UI/UX Prototyping and Dynamic Interface Design
  (b) Automated Development Environments / Autonomous Coding / "Vibe Coding"
  (c) Independent Filmmaking and Cinematic Production Workflows
  (d) Scriptwriting Tools, Screenplay Engines, and Narrative Technology
  (e) Major Groundbreaking AI Foundation Models and Frontier Architectures

- If an item relates directly to any of these five domains:
  - Flag the item prominently as "[أولوية قصوى]" in Section 1 (Arabic) and "[HIGH PRIORITY]" in Section 2 (English).
  - For these priority items ONLY: You MUST explicitly include the direct, clickable source URL immediately beneath its breakdown:
    - Arabic format: الرابط المباشر للمصدر: [قراءة المقال الأصلي](SOURCE_URL)
    - English format: Direct Source Link: [Read Full Article](SOURCE_URL)
- For general items outside these core domains: Summarize concisely without the priority badge or link requirement.

4. USER-CUSTOMIZED INSTRUCTIONS:
"${instructions || "Synthesize the gathered material into a rigorous morning brief, prioritizing architectural software developments, AI infrastructure, and creative technologies."}"

=======================================================
INPUT DATA & SOURCE EXTRACTS
=======================================================
${contentBlock || "No source data available."}
`;
  }

  /**
   * High-fidelity deterministic fallback complying with the exact bilingual and priority rules.
   */
  private generateMockBilingualSummary(
    instructions: string,
    sources: SourceResult[]
  ): string {
    const totalArticles = sources.reduce((acc, s) => acc + s.articles.length, 0);
    const dateFormattedAr = new Date().toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const dateFormattedEn = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const targetKeywords = [
      "llm", "ai", "model", "code", "dev", "ui", "ux", "film", "script",
      "robot", "gpt", "tool", "software", "agent", "prompt", "design", "video"
    ];

    const allArticles = sources.flatMap((s) => s.articles);

    // Identify priority items matching the 5 core domains
    const priorityArticles = allArticles.filter((a) =>
      targetKeywords.some((k) => (a.title + " " + a.snippet).toLowerCase().includes(k))
    );
    const generalArticles = allArticles.filter((a) => !priorityArticles.includes(a));

    const selectedPriority = priorityArticles.slice(0, 3);
    const selectedGeneral = (generalArticles.length > 0 ? generalArticles : allArticles).slice(0, 2);

    return `
# القسم الأول: الموجز الاستخباراتي باللغة العربية
تاريخ التقرير: ${dateFormattedAr}
نطاق التحليل: ${sources.length} مصادر | ${totalArticles} مواد تم فحصها

---

## 1. التطورات ذات الأولوية القصوى

${selectedPriority
  .map(
    (a, i) => `### ${i + 1}. ${a.title} [أولوية قصوى]
- التحليل: تم تصنيف هذا التطور ضمن النطاقات الحيوية (أدوات التطوير المؤتمت، الذكاء الاصطناعي التوليدي، وتصميم الواجهات).
- التفاصيل: ${a.snippet ? a.snippet.slice(0, 240) + "..." : "تم رصد التحديث مباشرة من المصدر الإخباري."}
- الرابط المباشر للمصدر: [قراءة التقرير الكامل في المصدر](${a.link})`
  )
  .join("\n\n")}

## 2. المستجدات التقنية العامة

${selectedGeneral
  .map(
    (a, i) => `### ${i + 1}. ${a.title}
- الملخص: ${a.snippet ? a.snippet.slice(0, 180) + "..." : "متابعة روتينية لتطورات القطاع التقني والبنية التحتية."}`
  )
  .join("\n\n")}

## 3. التوجيهات والتوصيات
- تعزيز أتمتة تدفقات العمل وربط النماذج اللغوية بالأدوات البرمجية المحلية.
- الاستفادة من بيئات التطوير السريعة (Vibe Coding) لرفع كفاءة الإنتاج البرمجي والإبداعي.

=======================================================

# SECTION 2: ENGLISH INTELLIGENCE BRIEF
Report Date: ${dateFormattedEn}
Analytical Scope: ${sources.length} Sources | ${totalArticles} Items Ingested

---

## 1. High-Priority Strategic Developments

${selectedPriority
  .map(
    (a, i) => `### ${i + 1}. ${a.title} [HIGH PRIORITY]
- Strategic Assessment: Critical intelligence intersecting frontier AI systems, autonomous developer environments, and design automation.
- Details: ${a.snippet ? a.snippet.slice(0, 240) + "..." : "Monitored directly from technical feed dispatch."}
- Direct Source Link: [Read Full Source Article](${a.link})`
  )
  .join("\n\n")}

## 2. General Industry Intelligence

${selectedGeneral
  .map(
    (a, i) => `### ${i + 1}. ${a.title}
- Summary: ${a.snippet ? a.snippet.slice(0, 180) + "..." : "Routine monitoring across technical sectors and infrastructure."}`
  )
  .join("\n\n")}

## 3. Actionable Takeaways
- Accelerate integration of autonomous agent workflows within local execution sandboxes.
- Capitalize on modern vibe coding environments and scriptwriting toolchains for rapid prototyping.
`.trim();
  }

  async generateArabicSummary(
    sources: SourceResult[],
    promptInstructions?: string,
    customApiKey?: string
  ): Promise<SummarizationResult> {
    const settings = stateService.getSettings();
    const apiKey = customApiKey || settings.apiKey || process.env.GEMINI_API_KEY;
    const instructions = promptInstructions || settings.promptInstructions;
    const preferredModel = settings.geminiModel || "gemini-1.5-flash-latest";

    const totalArticles = sources.reduce((acc, s) => acc + s.articles.length, 0);

    stateService.appendLog(
      "ai",
      "info",
      `Preparing bilingual AI prompt for ${sources.length} sources and ${totalArticles} items...`
    );

    // Fallback simulation when API key is not present
    if (!apiKey) {
      stateService.appendLog(
        "ai",
        "warn",
        "No Gemini API key provided. Using constitutional zero-emoji bilingual fallback generator."
      );

      const mockSummary = this.generateMockBilingualSummary(instructions, sources);

      return {
        summaryArabic: mockSummary,
        model: "mock-constitutional-engine",
        sourceCount: sources.length,
        articleCount: totalArticles,
        generatedAt: new Date().toISOString(),
        isMock: true,
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = this.buildBilingualPrompt(instructions, sources);
    const modelsToTry = [preferredModel, ...CANDIDATE_MODELS.filter((m) => m !== preferredModel)];

    for (const modelName of modelsToTry) {
      try {
        stateService.appendLog(
          "ai",
          "info",
          `Executing Gemini AI synthesis with model "${modelName}" (Bilingual + Zero Emojis + Targeted Priority URLs)...`
        );

        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
          },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        stateService.appendLog(
          "ai",
          "info",
          `Successfully generated Bilingual digest (${text.length} characters) via model "${modelName}".`
        );

        return {
          summaryArabic: text,
          model: modelName,
          sourceCount: sources.length,
          articleCount: totalArticles,
          generatedAt: new Date().toISOString(),
          isMock: false,
        };
      } catch (err: any) {
        stateService.appendLog(
          "ai",
          "warn",
          `Model "${modelName}" attempt failed (${err?.message || "Error"}). Trying next candidate...`
        );
      }
    }

    // If all online models fail (e.g. quota/invalid key), gracefully fall back to local high-fidelity generator
    stateService.appendLog(
      "ai",
      "warn",
      "All online model calls failed. Falling back to local constitutional bilingual generator."
    );

    const fallbackSummary = this.generateMockBilingualSummary(instructions, sources);
    return {
      summaryArabic: fallbackSummary,
      model: "fallback-constitutional-engine",
      sourceCount: sources.length,
      articleCount: totalArticles,
      generatedAt: new Date().toISOString(),
      isMock: true,
    };
  }
}

export const aiService = new AIService();
