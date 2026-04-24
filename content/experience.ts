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
    role: "Quantitative Research Associate Co-op",
    company: "Morgan Stanley – Parametric",
    period: "Jan 2026 – Present",
    status: "Active",
    description:
      "Automating fixed-income client reporting and LLM credit analysis for Parametric's portfolio managers.",
    bullets: [
      "Automated the client Advisor Report, cutting a 2h+ per-client workflow to minutes and unlocking live use in client meetings.",
      "Built a credit analysis agent workflow on bond holdings, iteratively self-refining prompts across ~20 bond sectors from scored feedback.",
    ],
    tags: ["Python", "SQL", "Snowflake", "Streamlit", "LLM"],
  },
  {
    role: "Software Engineer",
    company: "Generate Product Development Studio",
    period: "Sep – Dec 2025",
    status: "Archived",
    description:
      "Built Karp, a gamified volunteer platform connecting non-profits with volunteers in a cross-functional team of 13.",
    bullets: [
      "Shipped end-to-end features across a React Native mobile app and React web dashboard for 3+ user roles.",
      "Built backend systems with FastAPI and MongoDB for event management and role-based access.",
    ],
    tags: ["React Native", "FastAPI", "MongoDB"],
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
];
