"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Input } from "@/components/ui/input";

type Props = {
  placeholder?: string;
  paramName?: string;
};

export function SearchBar({ placeholder = "검색…", paramName = "q" }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const initial = sp.get(paramName) ?? "";
  const [value, setValue] = React.useState(initial);

  React.useEffect(() => {
    setValue(sp.get(paramName) ?? "");
  }, [sp, paramName]);

  const commit = React.useCallback(() => {
    const next = new URLSearchParams(sp.toString());
    const v = value.trim();
    if (v) next.set(paramName, v);
    else next.delete(paramName);
    router.push(`?${next.toString()}`);
  }, [router, sp, value, paramName]);

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
      />
    </div>
  );
}
