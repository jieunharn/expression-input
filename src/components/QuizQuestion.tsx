"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FlashcardRating } from "@/types";

type McqProps = {
  prompt: string;
  choices: string[];
  correctIndex: number;
  onAnswer: (rating: FlashcardRating) => void;
  disabled?: boolean;
};

export function QuizMcq({ prompt, choices, correctIndex, onAnswer, disabled }: McqProps) {
  const [picked, setPicked] = React.useState<number | null>(null);
  React.useEffect(() => setPicked(null), [prompt, choices]);

  const submit = (idx: number) => {
    if (disabled || picked !== null) return;
    setPicked(idx);
    const ok = idx === correctIndex;
    onAnswer(ok ? "got_it" : "missed");
  };

  return (
    <div className="space-y-4">
      <p className="text-base font-medium leading-relaxed">{prompt}</p>
      <div className="grid gap-2">
        {choices.map((c, i) => {
          const state =
            picked === null ? "idle" : i === correctIndex ? "correct" : i === picked ? "wrong" : "idle";
          return (
            <Button
              key={i}
              type="button"
              variant={state === "correct" ? "default" : state === "wrong" ? "destructive" : "outline"}
              className="h-auto min-h-11 justify-start whitespace-normal py-2 text-left font-normal"
              disabled={disabled || picked !== null}
              onClick={() => submit(i)}
            >
              {c}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

type FillProps = {
  sentence: string;
  answer: string;
  onAnswer: (rating: FlashcardRating) => void;
  disabled?: boolean;
};

export function QuizFill({ sentence, answer, onAnswer, disabled }: FillProps) {
  const [val, setVal] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  React.useEffect(() => {
    setVal("");
    setSubmitted(false);
  }, [sentence, answer]);

  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const check = () => {
    if (disabled || submitted) return;
    setSubmitted(true);
    const ok = norm(val) === norm(answer);
    onAnswer(ok ? "got_it" : "missed");
  };

  return (
    <div className="space-y-4">
      <p className="text-base font-medium leading-relaxed">{sentence}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="표현 입력"
          disabled={disabled || submitted}
          onKeyDown={(e) => e.key === "Enter" && check()}
        />
        <Button type="button" disabled={disabled || submitted} onClick={check}>
          확인
        </Button>
      </div>
    </div>
  );
}
