import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  link?: boolean;
  className?: string;
  showFrame?: boolean;
}

const sizeMap = {
  sm: { box: "size-9", img: 22, radius: "rounded-xl" },
  md: { box: "size-11", img: 28, radius: "rounded-xl" },
  lg: { box: "size-14", img: 36, radius: "rounded-2xl" },
} as const;

export function BrandMark({
  size = "md",
  href = "/dashboard",
  link = true,
  className,
  showFrame = true,
}: BrandMarkProps) {
  const s = sizeMap[size];

  const mark = (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        showFrame && [
          s.box,
          s.radius,
          "border bg-card/60 shadow-md backdrop-blur",
        ],
        !showFrame && s.box,
        className,
      )}
      aria-hidden={!href}
    >
      <Image
        src="/icon.svg"
        alt=""
        width={s.img}
        height={s.img}
        className="object-contain"
        priority={size === "lg"}
      />
    </span>
  );

  if (!link) return mark;

  return (
    <Link
      href={href}
      className="inline-flex outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      aria-label="Home"
    >
      {mark}
    </Link>
  );
}
