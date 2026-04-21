export type Friend = { name: string; tags: string[] };

export const friends: Friend[] = [
  { name: "Alex", tags: ["College", "Badminton"] },
  { name: "Jordan", tags: ["College", "Hackathon"] },
  { name: "Sam", tags: ["High School"] },
  { name: "Taylor", tags: ["Work", "College"] },
  { name: "Riley", tags: ["Badminton"] },
  { name: "Morgan", tags: ["Hackathon", "College"] },
  { name: "Casey", tags: ["High School", "Hiking"] },
  { name: "Jamie", tags: ["Work"] },
  { name: "Drew", tags: ["EDM", "College"] },
  { name: "Quinn", tags: ["Hiking", "High School"] },
];

export const tagColors: Record<string, { bg: string; border: string; text: string }> = {
  College: { bg: "rgba(8,145,178,0.1)", border: "rgba(8,145,178,0.3)", text: "#0891b2" },
  "High School": {
    bg: "rgba(217,119,6,0.1)",
    border: "rgba(217,119,6,0.3)",
    text: "#d97706",
  },
  Work: { bg: "rgba(22,163,74,0.1)", border: "rgba(22,163,74,0.3)", text: "#16a34a" },
  Badminton: {
    bg: "rgba(124,58,237,0.1)",
    border: "rgba(124,58,237,0.3)",
    text: "#7c3aed",
  },
  Hackathon: {
    bg: "rgba(220,38,38,0.1)",
    border: "rgba(220,38,38,0.3)",
    text: "#dc2626",
  },
  Hiking: { bg: "rgba(22,163,74,0.1)", border: "rgba(22,163,74,0.3)", text: "#16a34a" },
  EDM: { bg: "rgba(219,39,119,0.1)", border: "rgba(219,39,119,0.3)", text: "#db2777" },
};
