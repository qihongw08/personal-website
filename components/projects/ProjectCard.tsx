import { Globe } from "lucide-react";
import { STATUS_COLORS, type Project } from "@/content/projects";
import type { ActivityBuckets } from "@/lib/github";
import { MiniActivityGraph } from "./MiniActivityGraph";

type ProjectCardProps = {
  project: Project;
  stats: { commits: number; activity: ActivityBuckets };
  linkUrl: string;
};

export function ProjectCard({ project, stats, linkUrl }: ProjectCardProps) {
  const statusColor = STATUS_COLORS[project.status];

  return (
    <div className="glass-card flex flex-col rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="m-0 font-display text-xl font-bold text-[var(--ink)]">
            {project.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-1.5">
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: statusColor }}
            />
            <span
              className="font-mono text-[10px] uppercase tracking-[1px]"
              style={{ color: statusColor }}
            >
              {project.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Visit ${project.name} live`}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--glass-border)] px-2.5 text-[11px] font-medium text-[var(--brand)] transition-all hover:border-[var(--glass-border-hover)] hover:bg-[rgba(8,145,178,0.05)]"
              style={{ background: "rgba(8,145,178,0.04)" }}
              aria-label={`Visit ${project.name} live site`}
            >
              <Globe size={12} />
              <span className="font-mono uppercase tracking-[1px]">Live</span>
            </a>
          )}
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${project.name} on GitHub`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--glass-border)] text-[var(--ink-muted)] transition-all hover:border-[var(--glass-border-hover)] hover:text-[var(--brand)]"
            style={{ background: "rgba(0,0,0,0.03)" }}
            aria-label={`Open ${project.name} on GitHub`}
          >
            <GithubMark size={14} />
          </a>
        </div>
      </div>

      <MiniActivityGraph activity={stats.activity} />

      <p className="my-3.5 flex-1 text-[13px] leading-[1.7] text-[var(--ink-muted)]">
        {project.description}
      </p>

      <div>
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {project.tags.map((t) => (
            <span
              key={t}
              className="rounded border border-[var(--glass-border)] font-mono text-[10px] text-[var(--ink-muted)]"
              style={{ padding: "3px 8px", background: "rgba(0,0,0,0.03)" }}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="flex gap-5 border-t border-[var(--glass-border)] pt-2.5">
          <Stat label="COMMITS" value={stats.commits} />
        </div>
      </div>
    </div>
  );
}

function GithubMark({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 .5C5.73.5.67 5.56.67 11.83c0 5.01 3.25 9.26 7.76 10.76.57.1.78-.25.78-.55 0-.27-.01-.99-.02-1.95-3.16.69-3.82-1.52-3.82-1.52-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.66 1.24 3.31.95.1-.73.4-1.24.72-1.52-2.52-.29-5.17-1.26-5.17-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.44.11-3 0 0 .95-.3 3.12 1.16a10.83 10.83 0 0 1 5.68 0c2.17-1.46 3.12-1.16 3.12-1.16.62 1.56.23 2.71.11 3 .73.79 1.17 1.8 1.17 3.04 0 4.35-2.66 5.3-5.19 5.59.41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.11 0 .3.2.66.79.55 4.51-1.5 7.76-5.75 7.76-10.76C23.33 5.56 18.27.5 12 .5z" />
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-0.5 font-mono text-[9px] tracking-[1.5px] text-[var(--ink-faint)]">
        {label}
      </div>
      <div className="font-display text-base font-bold text-[var(--ink)]">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
