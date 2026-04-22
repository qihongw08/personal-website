import type { TagDefinition } from "@/components/friend-graph";

export const FRIEND_TAGS = [
  "HIGH SCHOOL BUDDY",
  "COLLEGE BUDDY",
  "COLLEGE FRIEND / COWORKER",
  "GENERATE BUDDY",
  "HACKMIT 2025",
  "SENIOR YEAR ROOMATE",
] as const;

export type FriendTag = (typeof FRIEND_TAGS)[number];

export const tagRegistry: Record<FriendTag, TagDefinition> = {
  "COLLEGE BUDDY": { label: "College Buddy", color: "#a00909" },
  "HIGH SCHOOL BUDDY": { label: "High School Buddy", color: "#08177a" },
  "GENERATE BUDDY": { label: "Generate Buddy", color: "#0569d3" },
  "COLLEGE FRIEND / COWORKER": {
    label: "College Friend / Coworker",
    color: "#d38417",
  },
  "HACKMIT 2025": { label: "HackMIT '25", color: "#9333ea" },
  "SENIOR YEAR ROOMATE": { label: "Senior Year Roommate", color: "#21ad2a" },
};

/**
 * Friends list — LinkedIn URL → tags. The Apify scraper fetches live
 * profile data (name, headline, photo) at build/ISR time. URLs without
 * a successful fetch fall back to a synthesized name from the URL handle.
 */
export const friendLinkedins: Record<string, FriendTag[]> = {
  "https://www.linkedin.com/in/quntao-zheng": ["HIGH SCHOOL BUDDY"],
  "https://www.linkedin.com/in/jiaxi-pan-553a742bb": ["HIGH SCHOOL BUDDY"],
  "https://www.linkedin.com/in/yingyi-guan9": ["HIGH SCHOOL BUDDY"],
  "https://www.linkedin.com/in/kelly-chen-a54119204": ["HIGH SCHOOL BUDDY"],
  "https://www.linkedin.com/in/xiaolesu": ["COLLEGE BUDDY", "HACKMIT 2025"],
  "https://www.linkedin.com/in/vivianzou1": ["COLLEGE BUDDY"],
  "https://www.linkedin.com/in/sanjana-singhania": ["COLLEGE BUDDY"],
  "https://www.linkedin.com/in/austin-hwang18/": ["COLLEGE BUDDY"],
  "https://www.linkedin.com/in/lok-ye-young-62ba3b25a": [
    "COLLEGE FRIEND / COWORKER",
  ],
  "https://www.linkedin.com/in/dao-ho": [
    "GENERATE BUDDY",
    "SENIOR YEAR ROOMATE",
  ],
  "https://www.linkedin.com/in/tomasdavola": [
    "HACKMIT 2025",
    "SENIOR YEAR ROOMATE",
  ],
  "https://www.linkedin.com/in/troy-gwdn": ["HACKMIT 2025"],
  "https://www.linkedin.com/in/aahil-nishad": [
    "COLLEGE FRIEND / COWORKER",
    "GENERATE BUDDY",
  ],
  "https://www.linkedin.com/in/afnan-tuffaha": [
    "COLLEGE FRIEND / COWORKER",
    "GENERATE BUDDY",
  ],
};
