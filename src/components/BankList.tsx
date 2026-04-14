"use client";

import type { Category, Expression, Tag } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteExpression } from "@/app/actions/expressions";
import { ExpressionCard } from "@/components/ExpressionCard";

type Expr = Expression & { category: Category; tags: Tag[] };

export function BankList({ expressions }: { expressions: Expr[] }) {
  const router = useRouter();

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

  if (expressions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        조건에 맞는 표현이 없습니다. 새 표현을 추가해 보세요.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {expressions.map((e) => (
        <ExpressionCard key={e.id} expression={e} onDelete={onDelete} />
      ))}
    </div>
  );
}
