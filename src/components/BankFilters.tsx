"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOURCE_TYPE_LABELS, type SourceType } from "@/types";

type Cat = { id: string; name: string };

export function BankFilters({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const c = sp.get("c") ?? "all";
  const st = sp.get("st") ?? "all";

  const setCategory = (val: string) => {
    const next = new URLSearchParams(sp.toString());
    if (val === "all") next.delete("c");
    else next.set("c", val);
    next.delete("page");
    router.push(`/bank?${next.toString()}`);
  };

  const setSourceType = (val: string) => {
    const next = new URLSearchParams(sp.toString());
    if (val === "all") next.delete("st");
    else next.set("st", val);
    next.delete("page");
    router.push(`/bank?${next.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchBar placeholder="영문, 예문, 메모, 출처, 태그 검색…" />
      <Select value={c} onValueChange={setCategory}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="카테고리" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 카테고리</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={st} onValueChange={setSourceType}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="출처 유형" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 출처</SelectItem>
          {(Object.entries(SOURCE_TYPE_LABELS) as [SourceType, string][]).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
