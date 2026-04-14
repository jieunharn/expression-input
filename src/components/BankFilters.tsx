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

type Cat = { id: string; name: string };

export function BankFilters({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const c = sp.get("c") ?? "all";

  const setCategory = (val: string) => {
    const next = new URLSearchParams(sp.toString());
    if (val === "all") next.delete("c");
    else next.set("c", val);
    router.push(`/bank?${next.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchBar placeholder="영문, 예문, 메모, 태그 검색…" />
      <Select value={c} onValueChange={setCategory}>
        <SelectTrigger className="w-full sm:w-[220px]">
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
    </div>
  );
}
