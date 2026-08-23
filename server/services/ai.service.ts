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

export class AIService {
  private buildArabicPrompt(
    instructions: string,
    sources: SourceResult[]
  ): string {
    let contentBlock = "";

    for (const source of sources) {
      contentBlock += `\n\n### المصدر: ${source.title} (${source.hostname})\n`;
      if (source.error) {
        contentBlock += `[تعذر جلب المصدر: ${source.error}]\n`;
        continue;
      }
      for (const [idx, item] of source.articles.entries()) {
        contentBlock += `\n${idx + 1}. **${item.title}**\n   الرابط: ${item.link}\n   المحتوى: ${item.snippet}\n`;
      }
    }

    return `
أنت المساعد الذكي لنظام Kanto Automator (المُوجّه الفائق للأتمتة الذكية).
مهمتك: صياغة تقرير وموجز ذكي واحترافي وشامل باللغة العربية الفصحى يجمع المعلومات والأخبار المجلوبة من المصادر أدناه.

### تعليمات المستخدم المخصصة:
"${instructions || "قم بتلخيص وتحليل أهم الأخبار والبيانات في موجز صباحي منظم ومرتب حسب الأولوية التقنية."}"

### المتطلبات الصارمة للتنسيق باللغة العربية:
1. **عنوان رئيسي بارز**: باللغة العربية يوضح تاريخ ومجال التقرير.
2. **أهم النقاط والتحليلات الرئيسية (Key Highlights)**: نقاط موجزة ولكن دقيقة وثرية بالمعلومات.
3. **تفاصيل الأخبار والتقنيات (Detailed Analysis)**: تفصيل موجز لكل موضوع مع ذكر المصدر الأصلي والروابط ذات الصلة إن وُجدت.
4. **الخلاصة والتوصيات (Actionable Takeaways)**: خلاصة تنفيذية سريعة.
5. التزم بأسلوب تقني راقٍ ومباشر دون حشو لغوي (أسلوب Kanto Empire المباشر والمنضبط).

---
### البيانات والمصادر المجلوبة:
${contentBlock || "لا توجد بيانات متاحة."}
`;
  }

  async generateArabicSummary(
    sources: SourceResult[],
    promptInstructions?: string,
    customApiKey?: string
  ): Promise<SummarizationResult> {
    const settings = stateService.getSettings();
    const apiKey = customApiKey || settings.apiKey || process.env.GEMINI_API_KEY;
    const instructions = promptInstructions || settings.promptInstructions;
    const modelName = settings.geminiModel || "gemini-1.5-flash";

    const totalArticles = sources.reduce((acc, s) => acc + s.articles.length, 0);

    stateService.appendLog(
      "ai",
      "info",
      `Preparing AI prompt for ${sources.length} sources and ${totalArticles} items...`
    );

    if (!apiKey) {
      stateService.appendLog(
        "ai",
        "warn",
        "No Gemini API key provided. Using built-in high fidelity fallback summarizer for preview."
      );

      // Informative offline fallback summary with actual fetched titles
      const sourceListText = sources
        .map((s) => `- **${s.title}** (${s.articles.length} عناصر)`)
        .join("\n");

      const mockSummary = `
# ⚡ موجز Kanto Automator الذكي (معاينة تجريبية)
*تم الإنشاء في: ${new Date().toLocaleString("ar-SA")}*

> [!NOTE]
> هذا ملخص تم إنشاؤه عبر المحرك التجريبي لعدم توفر مفتاح \`GEMINI_API_KEY\`. لتفعيل الذكاء الكامل، أضف مفتاحك في قسم الإعدادات.

---

### 📌 ملخص المصادر المجلوبة (${sources.length} مصادر):
${sourceListText || "لم يتم توفير مصادر."}

### 🔍 أهم العناوين الملتقطة:
${sources
  .flatMap((s) => s.articles.slice(0, 3))
  .map((a, i) => `${i + 1}. **${a.title}**\n   الرابط: [${a.link}](${a.link})\n   الموجز: ${a.snippet || "لا يوجد وصف."}`)
  .join("\n\n")}

---

### 🎯 التعليمات المطبقة:
"${instructions}"

### 💡 التوصية:
قم بتهيئة مفتاح Google Gemini API في ملف \`.env\` أو واجهة الإعدادات للحصول على التحليل اللغوي المتقدم وتلخيص الذكاء الاصطناعي الكامل.
`.trim();

      return {
        summaryArabic: mockSummary,
        model: "mock-engine",
        sourceCount: sources.length,
        articleCount: totalArticles,
        generatedAt: new Date().toISOString(),
        isMock: true,
      };
    }

    try {
      stateService.appendLog(
        "ai",
        "info",
        `Calling Google Gemini API using model "${modelName}"...`
      );

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = this.buildArabicPrompt(instructions, sources);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      stateService.appendLog(
        "ai",
        "info",
        `Successfully generated Arabic AI summary (${text.length} characters).`
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
        "error",
        `Gemini API call failed: ${err?.message || "Unknown error"}`
      );
      throw new Error(`AI Summarization failed: ${err?.message || "Check API Key and quota"}`);
    }
  }
}

export const aiService = new AIService();
