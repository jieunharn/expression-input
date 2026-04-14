import type { FlashcardRating } from "@/types";

/** SM-2 style update. quality 0–5. */
export function sm2QualityFromRating(rating: FlashcardRating): number {
  switch (rating) {
    case "got_it":
      return 5;
    case "almost":
      return 3;
    case "missed":
      return 0;
    default:
      return 3;
  }
}

export type SrsState = {
  easeFactor: number;
  interval: number;
  repetitions: number;
};

export function nextSrsState(
  quality: number,
  prev: SrsState
): SrsState & { nextReview: Date } {
  let { easeFactor, interval, repetitions } = prev;

  if (quality < 3) {
    repetitions = 0;
    interval = 0;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReview = new Date();
  if (interval === 0) {
    if (quality === 0) nextReview.setHours(nextReview.getHours() + 4);
    else nextReview.setDate(nextReview.getDate() + 1);
  } else {
    nextReview.setDate(nextReview.getDate() + interval);
  }

  return { easeFactor, interval, repetitions, nextReview };
}

export function isQuizCorrect(rating: FlashcardRating): boolean {
  return rating === "got_it";
}
