import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "Game Dev", color: "#8b5cf6" },
  { name: "Business/Corporate", color: "#6366f1" },
  { name: "Marketing", color: "#ec4899" },
  { name: "Technical", color: "#0ea5e9" },
  { name: "Casual/Slang", color: "#f59e0b" },
  { name: "News/Current Affairs", color: "#22c55e" },
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
