export type Experience = {
  role: string;
  company: string;
  period: string;
  status: "Active" | "Archived";
  description: string;
  bullets: string[];
  tags: string[];
};

export const experience: Experience[] = [
  {
    role: "Software Engineering Co-op",
    company: "State Street × NU",
    period: "Jan – Jun 2025",
    status: "Archived",
    description:
      "Engineered automated KPI reporting dashboard saving 150+ hours/month of manual work.",
    bullets: [
      "Modular ETL pipeline in Databricks processing 1M+ rows from 15+ teams.",
      "Improved efficiency 60% via multi-threading mechanism.",
    ],
    tags: ["Databricks", "Python", "ETL"],
  },
  {
    role: "Software Engineering Intern",
    company: "Onshape by PTC",
    period: "Jun – Aug 2025",
    status: "Archived",
    description:
      "Built first advanced search feature using Elasticsearch across 1.2M+ documents with sub-200ms response.",
    bullets: [
      "Architected Elasticsearch document models and indexing strategy.",
      "Developed REST API endpoints with Spring, collaborating with UX engineers.",
    ],
    tags: ["Elasticsearch", "Spring", "Java"],
  },
  {
    role: "Software Engineer",
    company: "Generate Product Development Studio",
    period: "Sep 2025 – Present",
    status: "Active",
    description:
      "Building Karp — a gamified volunteer platform connecting non-profits with volunteers in a cross-functional team of 13.",
    bullets: [
      "End-to-end features across React Native mobile & React web dashboard for 3+ user roles.",
      "Backend systems with FastAPI and MongoDB for event management and role-based access.",
    ],
    tags: ["React Native", "FastAPI", "MongoDB"],
  },
];
