export function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-12 flex items-baseline gap-4">
      <h2
        className="m-0 font-display font-bold leading-[1.1] text-[var(--ink)]"
        style={{ fontSize: "clamp(32px, 5vw, 48px)" }}
      >
        {title}
      </h2>
      <div className="ml-2 h-px flex-1 bg-[var(--glass-border)]" />
    </div>
  );
}
