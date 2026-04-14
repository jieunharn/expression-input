import { Suspense } from "react";
import { Header } from "@/components/Layout/Header";
import { BankFilters } from "@/components/BankFilters";
import { BankList } from "@/components/BankList";
import { listCategories } from "@/app/actions/categories";
import { searchExpressions } from "@/app/actions/expressions";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function BankPage({ searchParams }: Props) {
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const c = typeof searchParams.c === "string" ? searchParams.c : undefined;
  const [expressions, categories] = await Promise.all([
    searchExpressions(q, c),
    listCategories(),
  ]);

  return (
    <>
      <Header title="표현 뱅크" />
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 pb-16 md:p-8">
        <p className="text-sm text-muted-foreground">
          영문 표현을 저장하고, 검색·태그·카테고리로 정리합니다.
        </p>
        <Suspense
          fallback={<div className="h-10 animate-pulse rounded-md bg-muted" aria-hidden />}
        >
          <BankFilters categories={categories.map(({ id, name }) => ({ id, name }))} />
        </Suspense>
        <p className="text-xs text-muted-foreground">검색어 입력 후 Enter 로 적용합니다.</p>
        <BankList expressions={expressions} />
      </div>
    </>
  );
}
