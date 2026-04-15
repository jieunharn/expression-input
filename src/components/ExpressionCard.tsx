import Link from "next/link";
import type { Category, Expression, Tag } from "@prisma/client";
import { Archive, Book, Mic, Newspaper, Radio, Tv } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { KoreanOption, SourceType } from "@/types";
import { SOURCE_TYPE_LABELS } from "@/types";

type Expr = Expression & { category: Category; tags: Tag[] };

type Props = {
  expression: Expr;
  onDelete?: (id: string) => void;
};

const SOURCE_ICONS: Record<SourceType, React.ElementType> = {
  article: Newspaper,
  podcast: Radio,
  interpreting: Mic,
  broadcast: Tv,
  textbook: Book,
  other: Archive,
};

export function ExpressionCard({ expression, onDelete }: Props) {
  const opts = expression.koreanOptions as unknown as KoreanOption[];
  const primary = opts?.[0]?.translation ?? "—";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const src = expression as any;
  const hasSource = src.sourceType || src.source;
  const SourceIcon = src.sourceType ? SOURCE_ICONS[src.sourceType as SourceType] ?? Archive : null;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-base font-semibold leading-snug text-foreground">{expression.english}</p>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{primary}</p>
        {expression.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {expression.tags.map((t) => (
              <Badge key={t.id} variant="secondary" className="font-normal">
                {t.name}
              </Badge>
            ))}
          </div>
        )}
        {hasSource && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {SourceIcon && <SourceIcon className="h-3 w-3 shrink-0" />}
            {src.sourceType && (
              <span className="font-medium">
                {SOURCE_TYPE_LABELS[src.sourceType as SourceType] ?? src.sourceType}
              </span>
            )}
            {src.source && (
              <span className="truncate max-w-[200px]">
                {src.sourceType ? "· " : ""}{src.source}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 border-t border-border/60 bg-muted/30 pt-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/add?id=${expression.id}`}>편집</Link>
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            type="button"
            onClick={() => onDelete(expression.id)}
          >
            삭제
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
