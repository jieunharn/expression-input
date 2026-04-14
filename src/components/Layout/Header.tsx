"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mobileLinks = [
  { href: "/", label: "대시보드" },
  { href: "/bank", label: "표현 뱅크" },
  { href: "/add", label: "추가" },
  { href: "/study/flashcard", label: "플래시카드" },
  { href: "/study/quiz", label: "퀴즈" },
  { href: "/categories", label: "카테고리" },
];

export function Header({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:pl-4">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="메뉴">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {mobileLinks.map((l) => (
              <DropdownMenuItem key={l.href} asChild>
                <Link href={l.href}>{l.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {title ? (
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        ) : (
          <span className="font-medium md:hidden">Expression Bank</span>
        )}
      </div>
      <ThemeToggle />
    </header>
  );
}
