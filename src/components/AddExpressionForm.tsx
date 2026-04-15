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

function initExamples(editing?: Editing | null) {
  if (editing?.exampleEn) {
    const ens = (editing.exampleEn ?? "").split("\n");
    const kos = (editing.exampleKo ?? "").split("\n");
    const pairs = ens.map((en, i) => ({ en, ko: kos[i] ?? "" }));
    while (pairs.length < 3) pairs.push({ en: "", ko: "" });
    return pairs.slice(0, 3);
  }
  return Array.from({ length: 3 }, () => ({ en: "", ko: "" }));
}

export function AddExpressionForm({ categories, editing, aiAutoFillEnabled }: Props) {
  const router = useRouter();
  const [english, setEnglish] = React.useState(editing?.english ?? "");
  const [koreanText, setKoreanText] = React.useState(
    (editing?.koreanOptions as KoreanOption[] | null)?.map((o) => o.translation).join(", ") ?? ""
  );
  const [examples, setExamples] = React.useState(() => initExamples(editing));
  const [similarExpressions, setSimilarExpressions] = React.useState(
    (editing as any)?.similarExpressions ?? ""
  );
  const [notes, setNotes] = React.useState(editing?.notes ?? "");
  const [categoryId, setCategoryId] = React.useState(
    editing?.categoryId ?? categories[0]?.id ?? ""
  );
  const [tags, setTags] = React.useState(editing?.tags?.map((t) => t.name).join(", ") ?? "");
  const [loadingAi, setLoadingAi] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [bulkText, setBulkText] = React.useState("");
  const [bulkRunning, setBulkRunning] = React.useState(false);

  React.useEffect(() => {
    if (!editing) return;
    setEnglish(editing.english);
    setKoreanText(
      (editing.koreanOptions as KoreanOption[])?.map((o) => o.translation).join(", ") ?? ""
    );
    setExamples(initExamples(editing));
    setSimilarExpressions((editing as any)?.similarExpressions ?? "");
    setNotes(editing.notes ?? "");
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
      setKoreanText(data.korean_options.map((o) => o.translation).join(", "));
      if (data.examples?.length) {
        const padded = [...data.examples];
        while (padded.length < 3) padded.push({ en: "", ko: "" });
        setExamples(padded.slice(0, 3));
      }
      if (data.similar_expressions?.length) {
        setSimilarExpressions(data.similar_expressions.join(", "));
      }
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
    const opts: KoreanOption[] = koreanText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => ({ translation: t, register: "neutral" as const, note: "" }));
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
      const nonEmpty = examples.filter((e) => e.en.trim() || e.ko.trim());
      const payload = {
        english,
        koreanOptions: opts,
        exampleEn: nonEmpty.map((e) => e.en).join("\n") || undefined,
        exampleKo: nonEmpty.map((e) => e.ko).join("\n") || undefined,
        notes: notes || undefined,
        similarExpressions: similarExpressions || undefined,
        difficulty: 1,
        categoryId,
        tagNames: parseTagList(tags),
      };
      if (editing) {
        await updateExpression(editing.id, payload);
        toast.success("수정했습니다.");
        router.push("/bank");
        router.refresh();
      } else {
        await saveExpression(payload);
        toast.success("저장했습니다.");
        setEnglish("");
        setKoreanText("");
        setSimilarExpressions("");
        setExamples(Array.from({ length: 3 }, () => ({ en: "", ko: "" })));
        setNotes("");
        setTags("");
        router.refresh();
      }
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

  return (
    <Tabs defaultValue="single" className="w-full">
      {!aiAutoFillEnabled ? (
        <p
          className="mb-4 rounded-md border border-border/70 bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground"
          role="status"
        >
          AI 자동 채우기 비활성 — .env.local에 ANTHROPIC_API_KEY를 추가하면 활성화됩니다
        </p>
      ) : null}

      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="single">단일 추가</TabsTrigger>
        <TabsTrigger value="bulk" disabled={!aiAutoFillEnabled}>
          일괄 가져오기
        </TabsTrigger>
      </TabsList>

      <TabsContent value="single" className="space-y-4 pt-4">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">표현 추가</CardTitle>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!aiAutoFillEnabled || loadingAi}
              onClick={runAi}
            >
              {loadingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI 자동 채우기
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* 영문 표현 */}
            <div className="space-y-1.5">
              <Label htmlFor="en">English</Label>
              <Textarea
                id="en"
                rows={2}
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                placeholder="단어, 구문, 문장 패턴…"
              />
            </div>

            {/* 한국어 옵션 */}
            <div className="space-y-1.5">
              <Label htmlFor="ko">한국어</Label>
              <Input
                id="ko"
                value={koreanText}
                onChange={(e) => setKoreanText(e.target.value)}
                placeholder=""
              />
            </div>

            {/* 비슷한 표현 */}
            <div className="space-y-1.5">
              <Label htmlFor="similar">비슷한 표현</Label>
              <Input
                id="similar"
                value={similarExpressions}
                onChange={(e) => setSimilarExpressions(e.target.value)}
                placeholder=""
              />
            </div>

            {/* 예문 3개 */}
            <div className="space-y-1.5">
              <Label>예문</Label>
              <div className="space-y-2">
                {examples.map((ex, i) => (
                  <div key={i} className="overflow-hidden rounded-lg border border-border">
                    <Textarea
                      rows={2}
                      value={ex.en}
                      onChange={(e) =>
                        setExamples((prev) =>
                          prev.map((item, idx) => idx === i ? { ...item, en: e.target.value } : item)
                        )
                      }
                      placeholder="English example…"
                      className="rounded-none border-0 border-b border-border font-semibold focus-visible:ring-0 resize-none"
                    />
                    <Textarea
                      rows={2}
                      value={ex.ko}
                      onChange={(e) =>
                        setExamples((prev) =>
                          prev.map((item, idx) => idx === i ? { ...item, ko: e.target.value } : item)
                        )
                      }
                      placeholder="한국어 번역…"
                      className="rounded-none border-0 focus-visible:ring-0 resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 메모 & 태그 */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">메모</Label>
              <Textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="혼동하기 쉬운 표현, 사용 빈도, 발음 주의…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">태그</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="게임디자인, 기획, UX, 로컬라이제이션…"
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
                ? "각 줄마다 Claude로 자동 분석 후 저장합니다."
                : "일괄 가져오기는 API 키가 있을 때만 사용할 수 있습니다."}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={12}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              disabled={!aiAutoFillEnabled}
              placeholder={"flash in the pan\ntech debt\ncore loop\nretention rate"}
            />
            <Button type="button" disabled={!aiAutoFillEnabled || bulkRunning} onClick={runBulk}>
              {bulkRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              일괄 처리 시작
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
