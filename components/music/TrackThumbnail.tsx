import { cn } from "@/lib/utils";

interface TrackThumbnailProps {
  src: string;
  alt: string;
  className?: string;
}

export function TrackThumbnail({ src, alt, className }: TrackThumbnailProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("size-full object-cover", className)}
    />
  );
}
