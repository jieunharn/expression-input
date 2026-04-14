import { cn } from "@/lib/utils";

type Props = {
  name: string;
  color?: string | null;
  className?: string;
};

export function CategoryBadge({ name, color, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-md border px-2 py-0.5 text-xs font-medium",
        className
      )}
      style={
        color
          ? {
              borderColor: color,
              color,
              backgroundColor: `${color}14`,
            }
          : undefined
      }
    >
      {name}
    </span>
  );
}
