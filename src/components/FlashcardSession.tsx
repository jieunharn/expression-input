"use client";

import type { Category, Expression, Tag } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { applyFlashcardRating, logStudySession } from "@/app/actions/study";
import { FlashCard } from "@/components/FlashCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shuffle } from "@/lib/shuffle";
import type { FlashcardRating, KoreanOption } from "@/types";

export type FlashItem = Pick<
  Expression,
  "id" | "english" | "exampleEn" | "exampleKo"
> & {
  koreanOptions: KoreanOption[];
  category: Pick<Category, "id" | "name">;
  tags: Pick<Tag, "id" | "name">[];
};

type Props = {
  items: FlashItem[];
  categories: { id: string; name: string }[];
  initialCategoryId?: string;
};

export function FlashcardSession({ items: rawItems, categories, initialCategoryId }: Props) {
  const router = useRouter();
  const cat = initialCategoryId ?? "all";

  const onFilterChange = (val: string) => {
    if (val === "all") router.push("/study/flashcard");
    else router.push(`/study/flashcard?c=${encodeURIComponent(val)}`);
  };

  const items = React.useMemo(() => shuffle(rawItems), [rawItems]);
  const [i, setI] = React.useState(0);
  const [gotIt, setGotIt] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const current = items[i];

  React.useEffect(() => {
    setI(0);
    setGotIt(0);
    setDone(false);
  }, [rawItems]);

  const startSide: "en" | "ko" = React.useMemo(() => {
    if (!current) return "en";
    return Math.random() < 0.5 ? "en" : "ko";
  }, [current?.id]);

  const onRate = async (r: FlashcardRating) => {
    if (!current || busy) return;
    setBusy(true);
    try {
      await applyFlashcardRating(current.id, r);
      const added = r === "got_it" ? 1 : 0;
      const nextGot = gotIt + added;

      if (i + 1 >= items.length) {
        await logStudySession({
          mode: "flashcard",
          totalItems: items.length,
          correct: nextGot,
          categoryId: cat === "all" ? null : cat,
        });
        setGotIt(nextGot);
        setDone(true);
        toast.success("세션을 완료했습니다.");
      } else {
        setGotIt(nextGot);
        setI((x) => x + 1);
      }
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  if (!items.length) {
    return (
      <p className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
        학습할 표현이 없습니다. 뱅크에 표현을 추가하세요.
      </p>
    );
  }

  if (done) {
    const accPct = items.length ? Math.round((gotIt / items.length) * 100) : 0;
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-xl border bg-card p-6 text-center shadow-sm">
        <h3 className="text-lg font-semibold">세션 완료</h3>
        <p className="text-sm text-muted-foreground">
          카드 {items.length}장 · 완벽 {gotIt}회
        </p>
        <p className="text-2xl font-bold">{accPct}%</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={() => router.refresh()}>
            다시 시작
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/">대시보드</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {i + 1} / {items.length}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">필터</span>
          <Select value={cat} onValueChange={onFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <FlashCard
        key={current.id}
        english={current.english}
        koreanOptions={current.koreanOptions}
        exampleEn={current.exampleEn}
        exampleKo={current.exampleKo}
        startSide={startSide}
        onRate={onRate}
        disabled={busy}
      />
    </div>
  );
}
