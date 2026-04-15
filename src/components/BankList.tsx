"use client";

import type { Category, Expression, Tag } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { deleteExpression } from "@/app/actions/expressions";
import { ExpressionCard } from "@/components/ExpressionCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Expr = Expression & { category: Category; tags: Tag[] };

type Props = {
  expressions: Expr[];
  total: number;
  page: number;
  pageSize: number;
};

export function BankList({ expressions, total, page, pageSize }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  const goToPage = (p: number) => {
    const next = new URLSearchParams(sp.toString());
    if (p === 1) next.delete("page");
    else next.set("page", String(p));
    router.push(`/bank?${next.toString()}`);
  };

  const onDelete = async (id: string) => {
    if (!confirm("이 표현을 삭제할까요?")) return;
    try {
      await deleteExpression(id);
      toast.success("삭제했습니다.");
      router.refresh();
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  if (total === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        조건에 맞는 표현이 없습니다. 새 표현을 추가해 보세요.
      </p>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {expressions.map((e) => (
          <ExpressionCard key={e.id} expression={e} onDelete={onDelete} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {total}개 중 {start}–{end}번
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              aria-label="이전 페이지"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
            <span className="min-w-[80px] text-center text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              aria-label="다음 페이지"
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
