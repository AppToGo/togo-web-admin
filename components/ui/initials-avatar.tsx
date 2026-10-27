import { cn } from "@/lib/utils";

/**
 * Avatar con iniciales para listas de personas (clientes, conversaciones).
 * El tono sale de un `seed` estable (el id) para que la misma persona tenga
 * siempre el mismo color, aunque cambie el orden de la lista.
 */

const TONES = [
  "bg-violet-100 text-violet-800",
  "bg-blue-100 text-blue-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-pink-100 text-pink-800",
];

const SIZES = {
  xs: "h-7 w-7 text-[11px]",
  sm: "h-10 w-10 text-sm",
  md: "h-11 w-11 text-[15px]",
  lg: "h-[52px] w-[52px] text-lg",
} as const;

export function initialsOf(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function toneFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return TONES[Math.abs(hash) % TONES.length];
}

interface InitialsAvatarProps {
  name: string | null | undefined;
  seed: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function InitialsAvatar({
  name,
  seed,
  size = "sm",
  className,
}: InitialsAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        SIZES[size],
        toneFor(seed),
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
