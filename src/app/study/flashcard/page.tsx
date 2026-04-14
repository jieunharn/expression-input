import { Header } from "@/components/Layout/Header";
import { FlashcardSession, type FlashItem } from "@/components/FlashcardSession";
import { listCategories } from "@/app/actions/categories";
import { getStudyPool } from "@/app/actions/study";
import type { KoreanOption } from "@/types";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function FlashcardPage({ searchParams }: Props) {
  const c = typeof searchParams.c === "string" ? searchParams.c : undefined;
  const [pool, categories] = await Promise.all([
    getStudyPool(80, c),
    listCategories(),
  ]);

  const items: FlashItem[] = pool.map((e) => ({
    id: e.id,
    english: e.english,
    exampleEn: e.exampleEn,
    exampleKo: e.exampleKo,
    koreanOptions: e.koreanOptions as unknown as KoreanOption[],
    category: { id: e.category.id, name: e.category.name },
    tags: e.tags.map((t) => ({ id: t.id, name: t.name })),
  }));

  return (
    <>
      <Header title="플래시카드" />
      <div className="mx-auto w-full max-w-2xl space-y-6 p-4 pb-20 md:p-8">
        <p className="text-sm text-muted-foreground">
          영어 ↔ 한국어를 머릿속으로 말한 뒤 뒤집고, 난이도를 기록하면 SRS가 조정됩니다.
        </p>
        <FlashcardSession
          items={items}
          categories={categories.map(({ id, name }) => ({ id, name }))}
          initialCategoryId={c}
        />
      </div>
    </>
  );
}
