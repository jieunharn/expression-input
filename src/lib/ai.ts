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
  example_en: z.string(),
  example_ko: z.string(),
  suggested_category: z.enum([
    "game-dev",
    "business",
    "marketing",
    "technical",
    "casual",
    "news",
  ]),
  suggested_difficulty: z.coerce
    .number()
    .refine((n) => n === 1 || n === 2 || n === 3, "1–3")
    .transform((n) => n as 1 | 2 | 3),
});

export type EnrichResult = z.infer<typeof enrichSchema>;

const SYSTEM = `You are an expert Korean↔English interpreter assistant specializing in gaming industry terminology.
Always respond with valid JSON only, no markdown fences.`;

const USER_TEMPLATE = (expression: string) => `Given the English expression: "${expression}"

Provide JSON with exactly these keys:
1. korean_options: array of 2-3 objects, each with translation (Korean string), register ("formal"|"neutral"|"casual"), note (brief Korean explanation of when to use this variant)
2. example_en: natural example sentence in gaming/business context
3. example_ko: natural interpreter rendering in Korean (not literal word-for-word)
4. suggested_category: one of game-dev, business, marketing, technical, casual, news
5. suggested_difficulty: integer 1 (easy/common), 2 (intermediate), 3 (advanced/nuanced)

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
