"use client";

import type { Category } from "@prisma/client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import {
  createCategory,
  deleteCategory,
  mergeCategories,
  renameCategory,
  updateCategoryColor,
} from "@/app/actions/categories";
import { CategoryBadge } from "@/components/CategoryBadge";
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

type Row = Category & { _count: { expressions: number } };

export function CategoryManager({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#6366f1");
  const [mergeFrom, setMergeFrom] = React.useState<string>("");
  const [mergeInto, setMergeInto] = React.useState<string>("");

  const refresh = () => router.refresh();

  const onCreate = async () => {
    try {
      await createCategory(name, color);
      setName("");
      toast.success("카테고리를 추가했습니다.");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패");
    }
  };

  const onRename = async (id: string, next: string) => {
    try {
      await renameCategory(id, next);
      toast.success("이름을 변경했습니다.");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패");
    }
  };

  const onColor = async (id: string, hex: string) => {
    try {
      await updateCategoryColor(id, hex);
      refresh();
    } catch {
      toast.error("색상 저장 실패");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("표현은 다른 카테고리로 옮겨집니다. 삭제할까요?")) return;
    try {
      await deleteCategory(id);
      toast.success("삭제했습니다.");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패");
    }
  };

  const onMerge = async () => {
    if (!mergeFrom || !mergeInto || mergeFrom === mergeInto) {
      toast.error("병합할 카테고리를 선택하세요.");
      return;
    }
    if (!confirm("병합하면 출발 카테고리가 삭제됩니다. 계속할까요?")) return;
    try {
      await mergeCategories(mergeFrom, mergeInto);
      setMergeFrom("");
      setMergeInto("");
      toast.success("병합했습니다.");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "실패");
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">새 카테고리</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="new-name">이름</Label>
            <Input
              id="new-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: Live Ops"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-color">색</Label>
            <Input
              id="new-color"
              type="color"
              className="h-10 w-20 cursor-pointer p-1"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <Button type="button" onClick={onCreate}>
            추가
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">병합</CardTitle>
          <p className="text-sm text-muted-foreground">
            출발 카테고리의 모든 표현을 도착 카테고리로 옮기고 출발 카테고리를 삭제합니다.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label>출발</Label>
            <Select value={mergeFrom || undefined} onValueChange={setMergeFrom}>
              <SelectTrigger>
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {initial.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-2">
            <Label>도착</Label>
            <Select value={mergeInto || undefined} onValueChange={setMergeInto}>
              <SelectTrigger>
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {initial.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={onMerge}>
            병합 실행
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">목록</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {initial.map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <CategoryBadge name={c.name} color={c.color} />
                  <span className="text-xs text-muted-foreground">{c._count.expressions}개</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">이름</Label>
                  <RenameRow id={c.id} initialName={c.name} onSave={onRename} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">색</Label>
                  <Input
                    type="color"
                    className="h-9 w-14 cursor-pointer p-1"
                    defaultValue={c.color}
                    onBlur={(e) => onColor(c.id, e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(c.id)}
                >
                  삭제
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function RenameRow({
  id,
  initialName,
  onSave,
}: {
  id: string;
  initialName: string;
  onSave: (id: string, name: string) => void;
}) {
  const [v, setV] = React.useState(initialName);
  React.useEffect(() => setV(initialName), [initialName]);
  return (
    <div className="flex gap-2">
      <Input value={v} onChange={(e) => setV(e.target.value)} />
      <Button type="button" size="sm" variant="outline" onClick={() => onSave(id, v)}>
        저장
      </Button>
    </div>
  );
}
