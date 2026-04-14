import { Header } from "@/components/Layout/Header";
import { QuizSession, type QuizItem } from "@/components/QuizSession";
import { listCategories } from "@/app/actions/categories";
import { getExpressionsForQuiz } from "@/app/actions/study";
import type { KoreanOption } from "@/types";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function QuizPage({ searchParams }: Props) {
  const c = typeof searchParams.c === "string" ? searchParams.c : undefined;
  const [pool, categories] = await Promise.all([
    getExpressionsForQuiz(120, c),
    listCategories(),
  ]);

  const items: QuizItem[] = pool.map((e) => ({
    id: e.id,
    english: e.english,
    exampleEn: e.exampleEn,
    koreanOptions: e.koreanOptions as unknown as KoreanOption[],
    category: { id: e.category.id, name: e.category.name },
    tags: e.tags.map((t) => ({ id: t.id, name: t.name })),
  }));

  return (
    <>
      <Header title="퀴즈" />
      <div className="mx-auto w-full max-w-2xl space-y-6 p-4 pb-20 md:p-8">
        <p className="text-sm text-muted-foreground">
          객관식·빈칸·스피드(문항당 45초)로 복습합니다. 오답은 SRS에서 더 자주 나옵니다.
        </p>
        <QuizSession
          items={items}
          categories={categories.map(({ id, name }) => ({ id, name }))}
          initialCategoryId={c}
        />
      </div>
    </>
  );
}
