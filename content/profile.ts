import { asset } from "@/lib/assets";

export const profile = {
  name: {
    en: "Qihong Wu",
    cn: "吴其鸿",
  },
  tagline:
    "Computer Science @ Northeastern. Full-stack engineer shipping search infra, reporting pipelines, and hackathon wins.",
  initials: "QW",
  email: "wu.qiho@northeastern.edu",
  location: "Brooklyn, NY",

  bio: {
    intro:
      "Hey, I'm Qihong! I'm a CS + Business student at Northeastern University. I love to build random things. You'll catch me at a hackathon and tinkering on side projects just for my own sake. More seriously, I've shipped search infrastructure at Onshape/PTC, automated reporting pipelines at State Street, and currently doing quant research/dev at Morgan Stanley.",
  },

  education: [
    {
      school: "Northeastern University",
      degree: "B.S. Computer Science & Business",
      year: "2027",
    },
    {
      school: "Brooklyn Technical High School",
      degree: "",
      year: "2023",
    },
  ],

  skills: [
    { name: "Java", icon: "java" },
    { name: "Python", icon: "python" },
    { name: "TypeScript", icon: "typescript" },
    { name: "SQL", icon: "sql" },
    { name: "Spring", icon: "spring" },
    { name: "React", icon: "react" },
    { name: "FastAPI", icon: "fastapi" },
    { name: "Express", icon: "express" },
    { name: "Docker", icon: "docker" },
    { name: "Kubernetes", icon: "kubernetes" },
    { name: "Elasticsearch", icon: "elasticsearch" },
    { name: "MongoDB", icon: "mongodb" },
  ],

  socials: {
    github: {
      handle: "qihongw08",
      url: "https://github.com/qihongw08",
    },
    linkedin: {
      handle: "qihong-wu",
      url: "https://linkedin.com/in/qihong-wu",
    },
    email: {
      handle: "wu.qiho@northeastern.edu",
      url: "mailto:wu.qiho@northeastern.edu",
    },
  },

  profilePhoto: asset("profile_image.jpg"),

  resumePath: asset("resume.pdf"),
} as const;
