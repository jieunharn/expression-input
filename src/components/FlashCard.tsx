"use client";

import { motion } from "framer-motion";
import * as React from "react";
import { Button } from "@/components/ui/button";
import type { FlashcardRating, KoreanOption } from "@/types";

type Side = "en" | "ko";

type Props = {
  english: string;
  koreanOptions: KoreanOption[];
  exampleEn?: string | null;
  exampleKo?: string | null;
  startSide?: Side;
  onRate: (r: FlashcardRating) => void;
  disabled?: boolean;
};

function EnglishFace({
  english,
  exampleEn,
}: {
  english: string;
  exampleEn?: string | null;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">English</p>
      <p className="text-xl font-semibold leading-snug">{english}</p>
      {exampleEn ? (
        <p className="text-sm text-muted-foreground line-clamp-4">{exampleEn}</p>
      ) : null}
    </div>
  );
}

function KoreanFace({
  koreanOptions,
  exampleKo,
}: {
  koreanOptions: KoreanOption[];
  exampleKo?: string | null;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        한국어 옵션
      </p>
      <ul className="space-y-3 text-left">
        {koreanOptions.map((o, i) => (
          <li key={i} className="rounded-md border border-border/80 bg-muted/40 p-3">
            <p className="font-medium leading-snug">{o.translation}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              [{o.register}] {o.note}
            </p>
          </li>
        ))}
      </ul>
      {exampleKo ? (
        <p className="text-sm text-muted-foreground line-clamp-3">{exampleKo}</p>
      ) : null}
    </div>
  );
}

export function FlashCard({
  english,
  koreanOptions,
  exampleEn,
  exampleKo,
  startSide = "en",
  onRate,
  disabled,
}: Props) {
  const [flipped, setFlipped] = React.useState(false);

  React.useEffect(() => {
    setFlipped(false);
  }, [english, startSide]);

  const frontIsEnglish = startSide === "en";
  const frontContent = frontIsEnglish ? (
    <EnglishFace english={english} exampleEn={exampleEn} />
  ) : (
    <KoreanFace koreanOptions={koreanOptions} exampleKo={exampleKo} />
  );
  const backContent = frontIsEnglish ? (
    <KoreanFace koreanOptions={koreanOptions} exampleKo={exampleKo} />
  ) : (
    <EnglishFace english={english} exampleEn={exampleEn} />
  );

  return (
    <div className="mx-auto w-full max-w-lg" style={{ perspective: 1200 }}>
      <motion.div
        className="relative min-h-[240px]"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <button
          type="button"
          className="absolute inset-0 w-full rounded-xl border border-border bg-card p-6 text-left shadow-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
          onClick={() => setFlipped((f) => !f)}
        >
          {frontContent}
        </button>
        <button
          type="button"
          className="absolute inset-0 w-full rounded-xl border border-border bg-card p-6 text-left shadow-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
          onClick={() => setFlipped((f) => !f)}
        >
          {backContent}
        </button>
      </motion.div>
      <p className="mt-2 text-center text-xs text-muted-foreground">카드를 눌러 뒤집기</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => onRate("missed")}
        >
          놓침
        </Button>
        <Button type="button" variant="outline" disabled={disabled} onClick={() => onRate("almost")}>
          거의
        </Button>
        <Button type="button" disabled={disabled} onClick={() => onRate("got_it")}>
          완벽
        </Button>
      </div>
    </div>
  );
}
