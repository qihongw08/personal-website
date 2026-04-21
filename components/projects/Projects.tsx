import {
  projects,
  sortByStatus,
  type Project,
} from "@/content/projects";
import {
  type ActivityBuckets,
  aggregateFrom,
  computeActivity,
  getBatchedRepoStats,
  parseActivityRange,
} from "@/lib/github";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeInWhenVisible } from "@/components/shared/FadeInWhenVisible";
import { ProjectCard } from "./ProjectCard";

function activityFor(project: Project, datesISO: string[]): ActivityBuckets {
  const range = project.activityRange
    ? parseActivityRange(project.activityRange) ?? undefined
    : undefined;
  return computeActivity(datesISO, range);
}

export async function Projects() {
  const sorted = sortByStatus(projects);

  // Collect every repo referenced across all project cards into a flat list.
  const allRepos = sorted.flatMap((p) =>
    p.source.kind === "single"
      ? [{ owner: p.source.owner, repo: p.source.repo }]
      : p.source.repos,
  );

  // One GraphQL round-trip for everything. Cached via Next.js fetch cache.
  const stats = await getBatchedRepoStats(allRepos);

  const resolved = sorted.map((project) => {
    if (project.source.kind === "single") {
      const key = `${project.source.owner}/${project.source.repo}`;
      const s = stats.get(key);
      return {
        project,
        stats: {
          commits: s?.commits ?? 0,
          activity: activityFor(project, s?.recentCommitDatesISO ?? []),
        },
        linkUrl:
          s?.htmlUrl ??
          `https://github.com/${project.source.owner}/${project.source.repo}`,
      };
    }
    const agg = aggregateFrom(stats, project.source.repos);
    return {
      project,
      stats: {
        commits: agg.commits,
        activity: activityFor(project, agg.recentCommitDatesISO),
      },
      linkUrl: project.source.linkUrl,
    };
  });

  return (
    <section
      id="projects"
      className="mx-auto max-w-[1100px] px-10 pt-[140px] pb-[100px]"
    >
      <FadeInWhenVisible>
        <SectionHeader title="Projects" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {resolved.map(({ project, stats, linkUrl }) => (
            <ProjectCard
              key={project.name}
              project={project}
              stats={stats}
              linkUrl={linkUrl}
            />
          ))}
        </div>
      </FadeInWhenVisible>
    </section>
  );
}
