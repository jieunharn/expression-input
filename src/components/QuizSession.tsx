"use client";

import type { Category, Expression, Tag } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { applyQuizResult, logStudySession } from "@/app/actions/study";
import { QuizFill, QuizMcq } from "@/components/QuizQuestion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { shuffle } from "@/lib/shuffle";
import type { FlashcardRating, KoreanOption, QuizMode } from "@/types";

export type QuizItem = Pick<Expression, "id" | "english" | "exampleEn"> & {
  koreanOptions: KoreanOption[];
  category: Pick<Category, "id" | "name">;
  tags: Pick<Tag, "id" | "name">[];
};

type Props = {
  items: QuizItem[];
  categories: { id: string; name: string }[];
  initialCategoryId?: string;
};

type McqQ =
  | {
      mode: "mc_en_to_ko" | "mc_ko_to_en" | "speed";
      id: string;
      prompt: string;
      choices: string[];
      correctIndex: number;
    }
  | {
      mode: "fill";
      id: string;
      sentence: string;
      answer: string;
    };

function buildMcEnToKo(expr: QuizItem, pool: QuizItem[]): McqQ | null {
  const correct = expr.koreanOptions[0]?.translation?.trim();
  if (!correct) return null;
  const distractors = shuffle(
    pool
      .filter((e) => e.id !== expr.id)
      .map((e) => e.koreanOptions[0]?.translation)
      .filter((t): t is string => Boolean(t && t !== correct))
  ).slice(0, 3);
  while (distractors.length < 3) {
    distractors.push(`(보기 ${distractors.length + 1})`);
  }
  const choices = shuffle([correct, ...distractors.slice(0, 3)]);
  const correctIndex = choices.indexOf(correct);
  return {
    mode: "mc_en_to_ko",
    id: expr.id,
    prompt: `다음 영문에 가장 알맞은 한국어는? — ${expr.english}`,
    choices,
    correctIndex,
  };
}

function buildMcKoToEn(expr: QuizItem, pool: QuizItem[]): McqQ | null {
  const ko = expr.koreanOptions[0]?.translation?.trim();
  if (!ko) return null;
  const correct = expr.english.trim();
  const distractors = shuffle(
    pool
      .filter((e) => e.id !== expr.id)
      .map((e) => e.english.trim())
      .filter((t) => t && t !== correct)
  ).slice(0, 3);
  while (distractors.length < 3) {
    distractors.push(`Option ${distractors.length + 1}`);
  }
  const choices = shuffle([correct, ...distractors.slice(0, 3)]);
  const correctIndex = choices.indexOf(correct);
  return {
    mode: "mc_ko_to_en",
    id: expr.id,
    prompt: `다음 한국어에 맞는 영문은? — ${ko}`,
    choices,
    correctIndex,
  };
}

function buildFill(expr: QuizItem): McqQ | null {
  const ex = expr.exampleEn?.trim();
  const ans = expr.english.trim();
  if (!ex || !ex.toLowerCase().includes(ans.toLowerCase())) return null;
  const sentence = ex.replace(new RegExp(ans.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "_____");
  if (sentence === ex) return null;
  return { mode: "fill", id: expr.id, sentence, answer: ans };
}

function buildDeck(mode: QuizMode, pool: QuizItem[]): McqQ[] {
  const sh = shuffle(pool);
  const out: McqQ[] = [];
  for (const e of sh.slice(0, 24)) {
    let q: McqQ | null = null;
    if (mode === "mc_en_to_ko" || mode === "speed") q = buildMcEnToKo(e, pool);
    else if (mode === "mc_ko_to_en") q = buildMcKoToEn(e, pool);
    else {
      q = buildFill(e);
      if (!q) q = buildMcEnToKo(e, pool);
    }
    if (q) {
      if (mode === "speed") out.push({ ...q, mode: "speed" });
      else out.push(q);
    }
  }
  return out;
}

export function QuizSession({ items: rawPool, categories, initialCategoryId }: Props) {
  const router = useRouter();
  const cat = initialCategoryId ?? "all";
  const onFilterChange = (val: string) => {
    if (val === "all") router.push("/study/quiz");
    else router.push(`/study/quiz?c=${encodeURIComponent(val)}`);
  };

  const [tab, setTab] = React.useState<QuizMode>("mc_en_to_ko");
  const deck = React.useMemo(() => buildDeck(tab, rawPool), [tab, rawPool]);
  const [i, setI] = React.useState(0);
  const [correctN, setCorrectN] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(45);
  const answeredForQuestionRef = React.useRef(false);

  React.useEffect(() => {
    setI(0);
    setCorrectN(0);
    setDone(false);
    setSecondsLeft(45);
  }, [tab, rawPool]);

  const q = deck[i];

  const finishSession = React.useCallback(
    async (finalCorrect: number) => {
      await logStudySession({
        mode: "quiz",
        totalItems: deck.length,
        correct: finalCorrect,
        categoryId: cat === "all" ? null : cat,
      });
      setDone(true);
      toast.success("퀴즈 세션을 마쳤습니다.");
    },
    [deck.length, cat]
  );

  const handleAnswer = React.useCallback(
    async (rating: FlashcardRating) => {
      if (busy || done) return;
      const current = deck[i];
      if (!current) return;
      answeredForQuestionRef.current = true;
      setBusy(true);
      try {
        await applyQuizResult(current.id, rating);
        const add = rating === "got_it" ? 1 : 0;
        const nextCorrect = correctN + add;
        if (i + 1 >= deck.length) {
          setCorrectN(nextCorrect);
          await finishSession(nextCorrect);
        } else {
          setCorrectN(nextCorrect);
          setI((x) => x + 1);
        }
      } catch {
        toast.error("저장 실패");
      } finally {
        setBusy(false);
      }
    },
    [busy, done, deck, i, correctN, finishSession]
  );

  const handleAnswerRef = React.useRef(handleAnswer);
  handleAnswerRef.current = handleAnswer;

  React.useEffect(() => {
    if (tab !== "speed" || done || !q) return;
    answeredForQuestionRef.current = false;
    setSecondsLeft(45);
    const tick = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    const timeout = setTimeout(() => {
      if (answeredForQuestionRef.current) return;
      void handleAnswerRef.current("missed");
    }, 45000);
    return () => {
      clearInterval(tick);
      clearTimeout(timeout);
    };
  }, [tab, done, q?.id]);

  if (!rawPool.length) {
    return (
      <p className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
        퀴즈할 표현이 없습니다.
      </p>
    );
  }

  if (!deck.length) {
    return (
      <p className="text-sm text-muted-foreground">
        이 모드로 출제할 수 있는 표현이 부족합니다. 예문이 있는 항목을 더 추가해 보세요.
      </p>
    );
  }

  if (done) {
    const acc = Math.round((correctN / deck.length) * 100);
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-xl border bg-card p-6 text-center shadow-sm">
        <h3 className="text-lg font-semibold">퀴즈 완료</h3>
        <p className="text-sm text-muted-foreground">
          {deck.length}문항 · 정답 {correctN}
        </p>
        <p className="text-2xl font-bold">{acc}%</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={() => router.refresh()}>
            다시
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
          {i + 1} / {deck.length}
          {tab === "speed" ? (
            <span className="ml-3 font-mono text-foreground">⏱ {secondsLeft}s</span>
          ) : null}
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

      <Tabs value={tab} onValueChange={(v) => setTab(v as QuizMode)}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="mc_en_to_ko">영→한 객관식</TabsTrigger>
          <TabsTrigger value="mc_ko_to_en">한→영 객관식</TabsTrigger>
          <TabsTrigger value="fill">빈칸</TabsTrigger>
          <TabsTrigger value="speed">스피드</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="pt-6" forceMount>
          {q.mode === "fill" ? (
            <QuizFill
              key={q.id}
              sentence={q.sentence}
              answer={q.answer}
              disabled={busy}
              onAnswer={(r) => void handleAnswer(r)}
            />
          ) : (
            <QuizMcq
              key={q.id}
              prompt={q.prompt}
              choices={q.choices}
              correctIndex={q.correctIndex}
              disabled={busy}
              onAnswer={(r) => void handleAnswer(r)}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
