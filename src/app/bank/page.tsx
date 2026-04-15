import { Suspense } from "react";
import { Header } from "@/components/Layout/Header";
import { BankFilters } from "@/components/BankFilters";
import { BankList } from "@/components/BankList";
import { listCategories } from "@/app/actions/categories";
import { searchExpressions } from "@/app/actions/expressions";

const PAGE_SIZE = 12;

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function BankPage({ searchParams }: Props) {
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const c = typeof searchParams.c === "string" ? searchParams.c : undefined;
  const st = typeof searchParams.st === "string" ? searchParams.st : undefined;
  const page = typeof searchParams.page === "string" ? Math.max(1, parseInt(searchParams.page, 10) || 1) : 1;

  const [{ expressions, total }, categories] = await Promise.all([
    searchExpressions(q, c, st, page, PAGE_SIZE),
    listCategories(),
  ]);

  return (
    <>
      <Header title="표현 뱅크" />
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 pb-16 md:p-8">
        <p className="text-sm text-muted-foreground">
          기사·팟캐스트·통역 현장에서 배운 표현을 검색·필터링합니다.
        </p>
        <Suspense
          fallback={<div className="h-10 animate-pulse rounded-md bg-muted" aria-hidden />}
        >
          <BankFilters categories={categories.map(({ id, name }) => ({ id, name }))} />
        </Suspense>
        <p className="text-xs text-muted-foreground">검색어 입력 후 Enter로 적용합니다.</p>
        <BankList expressions={expressions} total={total} page={page} pageSize={PAGE_SIZE} />
      </div>
    </>
  );
}
