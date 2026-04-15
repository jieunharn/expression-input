import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "시사·뉴스", color: "#22c55e" },
  { name: "정치·외교", color: "#6366f1" },
  { name: "경제·금융", color: "#0ea5e9" },
  { name: "사회·문화", color: "#f59e0b" },
  { name: "과학·기술", color: "#8b5cf6" },
  { name: "스포츠", color: "#ef4444" },
  { name: "법률·의학", color: "#64748b" },
  { name: "엔터테인먼트", color: "#ec4899" },
  { name: "비즈니스", color: "#10b981" },
];

async function main() {
  for (const c of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: c.name },
      create: { ...c, isDefault: true },
      update: { color: c.color, isDefault: true },
    });
  }

  await prisma.appStats.upsert({
    where: { id: "app" },
    create: { id: "app" },
    update: {},
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
