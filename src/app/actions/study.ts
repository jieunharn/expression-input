"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { nextSrsState, sm2QualityFromRating, isQuizCorrect } from "@/lib/srs";
import type { FlashcardRating } from "@/types";

export async function getDueExpressions(limit = 50, categoryId?: string) {
  const now = new Date();
  const where: Parameters<typeof prisma.expression.findMany>[0]["where"] = {
    nextReview: { lte: now },
  };
  if (categoryId) where.categoryId = categoryId;

  return prisma.expression.findMany({
    where,
    include: { category: true, tags: true },
    orderBy: { nextReview: "asc" },
    take: limit,
  });
}

export async function getStudyPool(limit = 80, categoryId?: string) {
  const where: Parameters<typeof prisma.expression.findMany>[0]["where"] = {};
  if (categoryId) where.categoryId = categoryId;

  const due = await prisma.expression.findMany({
    where: { ...where, nextReview: { lte: new Date() } },
    include: { category: true, tags: true },
    orderBy: { nextReview: "asc" },
    take: limit,
  });

  if (due.length >= 10) return due;

  const extra = await prisma.expression.findMany({
    where,
    include: { category: true, tags: true },
    orderBy: { updatedAt: "desc" },
    take: limit - due.length,
  });

  const seen = new Set(due.map((e) => e.id));
  return [...due, ...extra.filter((e) => !seen.has(e.id))];
}

export async function applyFlashcardRating(expressionId: string, rating: FlashcardRating) {
  const expr = await prisma.expression.findUnique({ where: { id: expressionId } });
  if (!expr) return;

  const quality = sm2QualityFromRating(rating);
  const next = nextSrsState(quality, {
    easeFactor: expr.easeFactor,
    interval: expr.interval,
    repetitions: expr.repetitions,
  });

  const correct = rating === "got_it" ? 1 : 0;

  await prisma.expression.update({
    where: { id: expressionId },
    data: {
      easeFactor: next.easeFactor,
      interval: next.interval,
      repetitions: next.repetitions,
      nextReview: next.nextReview,
      lastReviewed: new Date(),
      timesStudied: { increment: 1 },
      timesCorrect: { increment: correct },
    },
  });

  revalidatePath("/study/flashcard");
  revalidatePath("/");
}

export async function applyQuizResult(expressionId: string, rating: FlashcardRating) {
  const expr = await prisma.expression.findUnique({ where: { id: expressionId } });
  if (!expr) return;

  const quality = sm2QualityFromRating(rating);
  const next = nextSrsState(quality, {
    easeFactor: expr.easeFactor,
    interval: expr.interval,
    repetitions: expr.repetitions,
  });

  const correct = isQuizCorrect(rating) ? 1 : 0;

  await prisma.expression.update({
    where: { id: expressionId },
    data: {
      easeFactor: next.easeFactor,
      interval: next.interval,
      repetitions: next.repetitions,
      nextReview: next.nextReview,
      lastReviewed: new Date(),
      timesStudied: { increment: 1 },
      timesCorrect: { increment: correct },
    },
  });

  revalidatePath("/study/quiz");
  revalidatePath("/");
}

export async function logStudySession(input: {
  mode: string;
  totalItems: number;
  correct: number;
  categoryId?: string | null;
}) {
  const accuracy =
    input.totalItems > 0 ? input.correct / input.totalItems : null;

  await prisma.studySessionLog.create({
    data: {
      mode: input.mode,
      endedAt: new Date(),
      totalItems: input.totalItems,
      correct: input.correct,
      accuracy: accuracy ?? undefined,
      categoryId: input.categoryId ?? undefined,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const stats = await prisma.appStats.findUnique({ where: { id: "app" } });
  let streak = stats?.studyStreak ?? 0;
  const lastRaw = stats?.lastStudyDate ? new Date(stats.lastStudyDate) : null;
  const last = lastRaw
    ? (() => {
        const d = new Date(lastRaw);
        d.setHours(0, 0, 0, 0);
        return d;
      })()
    : null;

  if (!last || last.getTime() < today.getTime()) {
    if (last && last.getTime() === yesterday.getTime()) streak = (stats?.studyStreak ?? 0) + 1;
    else streak = 1;
  }

  await prisma.appStats.upsert({
    where: { id: "app" },
    create: {
      id: "app",
      lastStudyDate: today,
      studyStreak: streak,
      totalStudySessions: 1,
    },
    update: {
      lastStudyDate: today,
      studyStreak: streak,
      totalStudySessions: { increment: 1 },
    },
  });

  revalidatePath("/");
}

export async function getExpressionsForQuiz(limit = 100, categoryId?: string) {
  const where: Parameters<typeof prisma.expression.findMany>[0]["where"] = {};
  if (categoryId) where.categoryId = categoryId;

  return prisma.expression.findMany({
    where,
    include: { category: true, tags: true },
    orderBy: { nextReview: "asc" },
    take: limit,
  });
}
