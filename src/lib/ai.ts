import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { SuggestedCategorySlug } from "@/types";
import { SLUG_TO_CATEGORY_NAME } from "@/types";

const enrichSchema = z.object({
  korean_options: z.array(
    z.object({
      translation: z.string(),
      register: z.enum(["formal", "neutral", "casual"]).or(z.string()),
      note: z.string(),
    })
  ),
  examples: z.array(
    z.object({
      en: z.string(),
      ko: z.string(),
    })
  ).min(1).max(3),
  similar_expressions: z.array(z.string()).min(1).max(3),
  suggested_category: z.enum([
    "news",
    "politics",
    "economics",
    "culture",
    "science",
    "sports",
    "legal",
    "entertainment",
    "business",
  ]),
});

export type EnrichResult = z.infer<typeof enrichSchema>;

const SYSTEM = `You are an expert Korean↔English translator assistant specializing in the game development industry.
You help build a personal expression bank for game developers, producers, and localization professionals.
Always respond with valid JSON only, no markdown fences.`;

const USER_TEMPLATE = (expression: string) => `Given the English expression: "${expression}"

Provide JSON with exactly these keys:
1. korean_options: array of 2-3 objects, each with translation (Korean string), register ("formal"|"neutral"|"casual"), note (brief Korean explanation of when to use this variant — e.g. 게임 디자인 문서, 팀 회의, 퍼블리셔 발표)
2. examples: array of exactly 3 objects, each with:
   - en: natural example sentence from game development contexts (e.g. GDC talk, design document, patch notes, developer blog, postmortem, sprint planning, publisher pitch, localization brief)
   - ko: natural Korean translation suitable for game industry professional communication (not literal word-for-word)
   Make each example distinct in context (e.g. game design, engineering, production, QA, business/publishing).
3. similar_expressions: array of 2-3 English expressions that are synonymous or closely related in meaning and usage context
4. suggested_category: one of news, politics, economics, culture, science, sports, legal, entertainment, business

Respond in JSON only.`;

/** True when `ANTHROPIC_API_KEY` is set (non-whitespace). Safe to call on server only. */
export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key });
}

export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
}

export async function enrichExpression(english: string): Promise<EnrichResult> {
  const client = getClient();
  const model = getAnthropicModel();

  const msg = await client.messages.create({
    model,
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{ role: "user", content: USER_TEMPLATE(english.trim()) }],
  });

  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => ("text" in b ? b.text : ""))
    .join("")
    .trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const raw = jsonMatch ? jsonMatch[0] : text;
  const parsed = JSON.parse(raw) as unknown;
  return enrichSchema.parse(parsed);
}

export function categoryIdFromSuggestion(
  slug: SuggestedCategorySlug,
  categories: { id: string; name: string }[]
): string | undefined {
  const name = SLUG_TO_CATEGORY_NAME[slug];
  return categories.find((c) => c.name === name)?.id;
}
