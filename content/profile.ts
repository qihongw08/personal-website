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
      "I'm a Computer Science student at Northeastern who likes building things that work well and feel right. I've shipped search infrastructure at Onshape/PTC, automated reporting pipelines at State Street, and won the Entertainment track at HackMIT 2025.",
    offClock:
      "Off the clock — badminton courts, mountain trails, and way too many hours curating playlists. I believe good software is invisible and good music isn't.",
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

  skills: {
    Languages: ["Java", "Python", "TypeScript", "SQL"],
    Frameworks: ["Spring", "React", "FastAPI", "Express"],
    Tools: ["Docker", "K8s", "Elasticsearch", "MongoDB"],
  },

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

  profilePhoto: null as string | null,

  resumePath: asset("resume.pdf"),
} as const;
