"use server";

import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export async function getDashboardStats() {
  const now = new Date();
  const sod = startOfDay(now);
  const sow = startOfWeek(now);

  const [
    totalExpressions,
    dueSoon,
    studiedToday,
    studiedWeek,
    recent,
    categories,
    appStats,
    sessions,
  ] = await Promise.all([
    prisma.expression.count(),
    prisma.expression.count({ where: { nextReview: { lte: now } } }),
    prisma.expression.count({
      where: { lastReviewed: { gte: sod } },
    }),
    prisma.expression.count({
      where: { lastReviewed: { gte: sow } },
    }),
    prisma.expression.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { category: true },
    }),
    prisma.category.findMany({
      include: {
        _count: { select: { expressions: true } },
        expressions: {
          select: {
            timesStudied: true,
            timesCorrect: true,
          },
        },
      },
    }),
    prisma.appStats.findUnique({ where: { id: "app" } }),
    prisma.studySessionLog.findMany({
      where: { mode: "quiz", accuracy: { not: null } },
      orderBy: { endedAt: "desc" },
      take: 200,
    }),
  ]);

  const weakest = categories
    .map((c) => {
      let studied = 0;
      let correct = 0;
      for (const e of c.expressions) {
        studied += e.timesStudied;
        correct += e.timesCorrect;
      }
      const acc = studied > 0 ? correct / studied : null;
      return {
        id: c.id,
        name: c.name,
        count: c._count.expressions,
        accuracy: acc,
        studied,
      };
    })
    .filter((c) => c.studied >= 3)
    .sort((a, b) => (a.accuracy ?? 1) - (b.accuracy ?? 1))
    .slice(0, 4);

  const recentQuizAcc =
    sessions.length > 0
      ? sessions.reduce((s, x) => s + (x.accuracy ?? 0), 0) / sessions.length
      : null;

  return {
    totalExpressions,
    dueSoon,
    studiedToday,
    studiedWeek,
    recent,
    weakest,
    streak: appStats?.studyStreak ?? 0,
    totalSessions: appStats?.totalStudySessions ?? 0,
    recentQuizAccuracy: recentQuizAcc,
  };
}
