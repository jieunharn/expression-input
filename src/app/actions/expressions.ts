"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  enrichExpression,
  categoryIdFromSuggestion,
  isAnthropicConfigured,
} from "@/lib/ai";
import { parseTagList } from "@/lib/utils";
import type { KoreanOption } from "@/types";

export async function searchExpressions(
  query: string,
  categoryId?: string,
  sourceType?: string,
  page = 1,
  pageSize = 12
) {
  const q = query.trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (categoryId) where.categoryId = categoryId;
  if (sourceType) where.sourceType = sourceType;

  if (q) {
    where.OR = [
      { english: { contains: q } },
      { exampleEn: { contains: q } },
      { exampleKo: { contains: q } },
      { notes: { contains: q } },
      { source: { contains: q } },
      { tags: { some: { name: { contains: q } } } },
    ];
  }

  const skip = (page - 1) * pageSize;

  const [expressions, total] = await Promise.all([
    prisma.expression.findMany({
      where,
      include: { category: true, tags: true },
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.expression.count({ where }),
  ]);

  return { expressions, total };
}

export async function getExpression(id: string) {
  return prisma.expression.findUnique({
    where: { id },
    include: { category: true, tags: true },
  });
}

export type SaveExpressionInput = {
  english: string;
  koreanOptions: KoreanOption[];
  exampleEn?: string;
  exampleKo?: string;
  notes?: string;
  similarExpressions?: string;
  difficulty: number;
  categoryId: string;
  tagNames: string[];
  source?: string;
  sourceType?: string;
};

export async function saveExpression(input: SaveExpressionInput) {
  const tagConnect = await Promise.all(
    input.tagNames.map(async (name) => {
      const t = await prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      return { id: t.id };
    })
  );

  const created = await prisma.expression.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      english: input.english.trim(),
      koreanOptions: input.koreanOptions as object[],
      exampleEn: input.exampleEn?.trim() || null,
      exampleKo: input.exampleKo?.trim() || null,
      notes: input.notes?.trim() || null,
      similarExpressions: input.similarExpressions?.trim() || null,
      difficulty: Math.min(3, Math.max(1, input.difficulty)),
      categoryId: input.categoryId,
      source: input.source?.trim() || null,
      sourceType: input.sourceType || null,
      tags: { connect: tagConnect },
    } as any,
  });

  revalidatePath("/bank");
  revalidatePath("/");
  return created;
}

export async function updateExpression(id: string, input: SaveExpressionInput) {
  const tagConnect = await Promise.all(
    input.tagNames.map(async (name) => {
      const t = await prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      return { id: t.id };
    })
  );

  await prisma.expression.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      english: input.english.trim(),
      koreanOptions: input.koreanOptions as object[],
      exampleEn: input.exampleEn?.trim() || null,
      exampleKo: input.exampleKo?.trim() || null,
      notes: input.notes?.trim() || null,
      similarExpressions: input.similarExpressions?.trim() || null,
      difficulty: Math.min(3, Math.max(1, input.difficulty)),
      categoryId: input.categoryId,
      source: input.source?.trim() || null,
      sourceType: input.sourceType || null,
      tags: { set: tagConnect },
    } as any,
  });

  revalidatePath("/bank");
  revalidatePath("/");
}

export async function deleteExpression(id: string) {
  await prisma.expression.delete({ where: { id } });
  revalidatePath("/bank");
  revalidatePath("/");
}

export async function aiEnrichExpression(english: string) {
  if (!english.trim()) throw new Error("표현을 입력하세요.");
  if (!isAnthropicConfigured()) {
    throw new Error("AI 자동 채우기를 사용할 수 없습니다. .env.local에 ANTHROPIC_API_KEY를 설정하세요.");
  }
  const data = await enrichExpression(english);
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const categoryId = categoryIdFromSuggestion(data.suggested_category, categories);
  return { ...data, resolvedCategoryId: categoryId ?? categories[0]?.id };
}

export async function bulkImportLines(lines: string[]) {
  if (!isAnthropicConfigured()) {
    throw new Error("일괄 가져오기는 ANTHROPIC_API_KEY가 필요합니다.");
  }
  const trimmed = lines.map((l) => l.trim()).filter(Boolean);
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const defaultCatId = categories[0]?.id;
  if (!defaultCatId) throw new Error("카테고리가 없습니다. 시드를 실행하세요.");

  const results: { english: string; ok: boolean; error?: string }[] = [];

  for (const english of trimmed) {
    try {
      const data = await enrichExpression(english);
      const categoryId =
        categoryIdFromSuggestion(data.suggested_category, categories) ?? defaultCatId;

      await prisma.expression.create({
        data: {
          english,
          koreanOptions: data.korean_options as object[],
          exampleEn: data.examples.map((e) => e.en).join("\n"),
          exampleKo: data.examples.map((e) => e.ko).join("\n"),
          difficulty: data.suggested_difficulty,
          categoryId,
        },
      });
      results.push({ english, ok: true });
    } catch (e) {
      results.push({
        english,
        ok: false,
        error: e instanceof Error ? e.message : "실패",
      });
    }
  }

  revalidatePath("/bank");
  revalidatePath("/");
  return results;
}

export async function connectTagsToExpression(expressionId: string, tagString: string) {
  const names = parseTagList(tagString);
  if (!names.length) return;
  const connects = await Promise.all(
    names.map((name) =>
      prisma.tag.upsert({ where: { name }, create: { name }, update: {} })
    )
  );
  await prisma.expression.update({
    where: { id: expressionId },
    data: { tags: { connect: connects.map((t) => ({ id: t.id })) } },
  });
  revalidatePath("/bank");
}
