export function PlatformBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -left-32 top-1/4 -z-10 size-80 rounded-full bg-violet-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -right-32 bottom-1/4 -z-10 size-80 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden
      />
    </>
  );
}
