export type KoreanRegister = "formal" | "neutral" | "casual";

export type KoreanOption = {
  translation: string;
  register: KoreanRegister | string;
  note: string;
};

export type SuggestedCategorySlug =
  | "news"
  | "politics"
  | "economics"
  | "culture"
  | "science"
  | "sports"
  | "legal"
  | "entertainment"
  | "business";

export type SourceType =
  | "article"
  | "podcast"
  | "interpreting"
  | "broadcast"
  | "textbook"
  | "other";

export type FlashcardRating = "got_it" | "almost" | "missed";

export type QuizMode = "mc_en_to_ko" | "mc_ko_to_en" | "fill" | "speed";

export const SLUG_TO_CATEGORY_NAME: Record<SuggestedCategorySlug, string> = {
  news: "시사·뉴스",
  politics: "정치·외교",
  economics: "경제·금융",
  culture: "사회·문화",
  science: "과학·기술",
  sports: "스포츠",
  legal: "법률·의학",
  entertainment: "엔터테인먼트",
  business: "비즈니스",
};

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  article: "기사",
  podcast: "팟캐스트",
  interpreting: "통역 현장",
  broadcast: "방송",
  textbook: "교재",
  other: "기타",
};
