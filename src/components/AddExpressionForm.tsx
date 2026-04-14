"use client";

import type { Category, Expression, Tag } from "@prisma/client";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import {
  aiEnrichExpression,
  bulkImportLines,
  saveExpression,
  updateExpression,
} from "@/app/actions/expressions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { parseTagList } from "@/lib/utils";
import type { KoreanOption } from "@/types";

type Editing = Expression & { tags: Tag[] };

type Props = {
  categories: Category[];
  editing?: Editing | null;
  aiAutoFillEnabled: boolean;
};

export function AddExpressionForm({ categories, editing, aiAutoFillEnabled }: Props) {
  const router = useRouter();
  const [english, setEnglish] = React.useState(editing?.english ?? "");
  const [koreanOptions, setKoreanOptions] = React.useState<KoreanOption[]>(
    (editing?.koreanOptions as KoreanOption[] | null) ?? [
      { translation: "", register: "neutral", note: "" },
    ]
  );
  const [exampleEn, setExampleEn] = React.useState(editing?.exampleEn ?? "");
  const [exampleKo, setExampleKo] = React.useState(editing?.exampleKo ?? "");
  const [notes, setNotes] = React.useState(editing?.notes ?? "");
  const [difficulty, setDifficulty] = React.useState(String(editing?.difficulty ?? 1));
  const [categoryId, setCategoryId] = React.useState(
    editing?.categoryId ?? categories[0]?.id ?? ""
  );
  const [tags, setTags] = React.useState("");
  const [loadingAi, setLoadingAi] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [bulkText, setBulkText] = React.useState("");
  const [bulkRunning, setBulkRunning] = React.useState(false);

  React.useEffect(() => {
    if (!editing) return;
    setEnglish(editing.english);
    setKoreanOptions((editing.koreanOptions as KoreanOption[]) ?? []);
    setExampleEn(editing.exampleEn ?? "");
    setExampleKo(editing.exampleKo ?? "");
    setNotes(editing.notes ?? "");
    setDifficulty(String(editing.difficulty));
    setCategoryId(editing.categoryId);
    setTags(editing.tags.map((t) => t.name).join(", "));
  }, [editing]);

  const runAi = async () => {
    if (!english.trim()) {
      toast.error("영문 표현을 먼저 입력하세요.");
      return;
    }
    setLoadingAi(true);
    try {
      const data = await aiEnrichExpression(english);
      setKoreanOptions(data.korean_options as KoreanOption[]);
      setExampleEn(data.example_en);
      setExampleKo(data.example_ko);
      setDifficulty(String(data.suggested_difficulty));
      if (data.resolvedCategoryId) setCategoryId(data.resolvedCategoryId);
      toast.success("AI가 필드를 채웠습니다. 확인 후 저장하세요.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI 호출 실패");
    } finally {
      setLoadingAi(false);
    }
  };

  const submit = async () => {
    if (!english.trim()) {
      toast.error("영문 표현은 필수입니다.");
      return;
    }
    const opts = koreanOptions.filter((o) => o.translation.trim());
    if (!opts.length) {
      toast.error("한국어 옵션을 1개 이상 입력하세요.");
      return;
    }
    if (!categoryId) {
      toast.error("카테고리를 선택하세요.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        english,
        koreanOptions: opts,
        exampleEn: exampleEn || undefined,
        exampleKo: exampleKo || undefined,
        notes: notes || undefined,
        difficulty: Number(difficulty) || 1,
        categoryId,
        tagNames: parseTagList(tags),
      };
      if (editing) await updateExpression(editing.id, payload);
      else await saveExpression(payload);
      toast.success(editing ? "수정했습니다." : "저장했습니다.");
      router.push("/bank");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const runBulk = async () => {
    const lines = bulkText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) {
      toast.error("한 줄에 하나씩 영문 표현을 붙여 넣으세요.");
      return;
    }
    setBulkRunning(true);
    try {
      const results = await bulkImportLines(lines);
      const ok = results.filter((r) => r.ok).length;
      const fail = results.length - ok;
      toast.message(`완료: 성공 ${ok}, 실패 ${fail}`);
      setBulkText("");
      router.push("/bank");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "일괄 처리 실패");
    } finally {
      setBulkRunning(false);
    }
  };

  const updateOption = (i: number, patch: Partial<KoreanOption>) => {
    setKoreanOptions((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  return (
    <Tabs defaultValue="single" className="w-full">
      {!aiAutoFillEnabled ? (
        <p
          className="mb-4 rounded-md border border-border/70 bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground"
          role="status"
        >
          AI auto-fill disabled — add API key to enable
        </p>
      ) : null}

      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="single">단일 추가</TabsTrigger>
        <TabsTrigger value="bulk" disabled={!aiAutoFillEnabled}>
          일괄 가져오기
        </TabsTrigger>
      </TabsList>

      <TabsContent value="single" className="space-y-6 pt-4">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">영문 표현</CardTitle>
            <Button
              type="button"
              variant="secondary"
              disabled={!aiAutoFillEnabled || loadingAi}
              title={
                aiAutoFillEnabled
                  ? undefined
                  : "ANTHROPIC_API_KEY를 .env.local에 설정하면 사용할 수 있습니다."
              }
              onClick={runAi}
            >
              {loadingAi ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              AI 자동 채우기
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="en">English</Label>
              <Textarea
                id="en"
                rows={2}
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                placeholder="단어, 구문, 문장 패턴…"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>난이도 (1–3)</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 · 인지</SelectItem>
                    <SelectItem value="2">2 · 능동 회상</SelectItem>
                    <SelectItem value="3">3 · 실시간 산출</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>카테고리</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>한국어 옵션 (2–3개 권장)</Label>
              <div className="space-y-3">
                {koreanOptions.map((o, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                    <Input
                      placeholder="번역"
                      value={o.translation}
                      onChange={(e) => updateOption(i, { translation: e.target.value })}
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Select
                        value={o.register}
                        onValueChange={(v) => updateOption(i, { register: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="register" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">formal</SelectItem>
                          <SelectItem value="neutral">neutral</SelectItem>
                          <SelectItem value="casual">casual</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="용법 메모 (한국어)"
                        value={o.note}
                        onChange={(e) => updateOption(i, { note: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setKoreanOptions((p) => [
                    ...p,
                    { translation: "", register: "neutral", note: "" },
                  ])
                }
              >
                옵션 추가
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ex-en">예문 (영문)</Label>
              <Textarea id="ex-en" rows={2} value={exampleEn} onChange={(e) => setExampleEn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-ko">예문 (통역체 한국어)</Label>
              <Textarea id="ex-ko" rows={2} value={exampleKo} onChange={(e) => setExampleKo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">개인 메모</Label>
              <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">태그 (쉼표·공백 구분)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="anti-cheat, monetization …"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" disabled={saving} onClick={submit}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? "변경 저장" : "저장"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/bank")}>
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="bulk" className="space-y-4 pt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">한 줄에 표현 하나</CardTitle>
            <p className="text-sm text-muted-foreground">
              {aiAutoFillEnabled
                ? "각 줄마다 Claude로 자동 분석 후 저장합니다. API 호출이 여러 번 발생합니다."
                : "일괄 가져오기는 API 키가 있을 때만 사용할 수 있습니다. 단일 추가에서 수동으로 입력하세요."}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={12}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              disabled={!aiAutoFillEnabled}
              placeholder={"loot box mechanics\nroadmap alignment\nanti-cheat telemetry"}
            />
            <Button
              type="button"
              disabled={!aiAutoFillEnabled || bulkRunning}
              onClick={runBulk}
            >
              {bulkRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              일괄 처리 시작
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
