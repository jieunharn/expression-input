"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Brain,
  FolderTree,
  Layers,
  LayoutDashboard,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/bank", label: "표현 뱅크", icon: BookOpen },
  { href: "/add", label: "추가", icon: PlusCircle },
  { href: "/study/flashcard", label: "플래시카드", icon: Layers },
  { href: "/study/quiz", label: "퀴즈", icon: Brain },
  { href: "/categories", label: "카테고리", icon: FolderTree },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-56 border-r border-border bg-card/80 backdrop-blur-md md:block">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
          Expressions
        </Link>
      </div>
      <nav className="flex flex-col gap-0.5 p-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <p className="absolute bottom-4 left-4 right-4 text-xs text-muted-foreground">
        통역사·번역가 표현 저장소
      </p>
    </aside>
  );
}
