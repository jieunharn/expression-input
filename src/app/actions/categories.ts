"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { expressions: true } } },
  });
}

export async function createCategory(name: string, color?: string) {
  const n = name.trim();
  if (!n) throw new Error("이름을 입력하세요.");
  await prisma.category.create({
    data: { name: n, color: color ?? "#6366f1", isDefault: false },
  });
  revalidatePath("/categories");
  revalidatePath("/bank");
  revalidatePath("/");
}

export async function renameCategory(id: string, name: string) {
  const n = name.trim();
  if (!n) throw new Error("이름을 입력하세요.");
  await prisma.category.update({ where: { id }, data: { name: n } });
  revalidatePath("/categories");
  revalidatePath("/bank");
  revalidatePath("/");
}

export async function updateCategoryColor(id: string, color: string) {
  await prisma.category.update({ where: { id }, data: { color } });
  revalidatePath("/categories");
  revalidatePath("/bank");
}

export async function mergeCategories(fromId: string, intoId: string) {
  if (fromId === intoId) return;
  await prisma.expression.updateMany({
    where: { categoryId: fromId },
    data: { categoryId: intoId },
  });
  await prisma.category.delete({ where: { id: fromId } });
  revalidatePath("/categories");
  revalidatePath("/bank");
  revalidatePath("/");
}

export async function deleteCategory(id: string) {
  const fallback = await prisma.category.findFirst({
    where: { id: { not: id } },
    orderBy: { name: "asc" },
  });
  if (!fallback) throw new Error("마지막 카테고리는 삭제할 수 없습니다.");

  await prisma.expression.updateMany({
    where: { categoryId: id },
    data: { categoryId: fallback.id },
  });
  await prisma.category.delete({ where: { id } });
  revalidatePath("/categories");
  revalidatePath("/bank");
  revalidatePath("/");
}
