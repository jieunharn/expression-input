export type KoreanRegister = "formal" | "neutral" | "casual";

export type KoreanOption = {
  translation: string;
  register: KoreanRegister | string;
  note: string;
};

export type SuggestedCategorySlug =
  | "game-dev"
  | "business"
  | "marketing"
  | "technical"
  | "casual"
  | "news";

export type FlashcardRating = "got_it" | "almost" | "missed";

export type QuizMode = "mc_en_to_ko" | "mc_ko_to_en" | "fill" | "speed";

export const SLUG_TO_CATEGORY_NAME: Record<SuggestedCategorySlug, string> = {
  "game-dev": "Game Dev",
  business: "Business/Corporate",
  marketing: "Marketing",
  technical: "Technical",
  casual: "Casual/Slang",
  news: "News/Current Affairs",
};
