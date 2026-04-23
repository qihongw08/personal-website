/**
 * Hobby metadata. Media (images + videos) is scanned at runtime from
 * `public/hobbies/<slug>/` — drop files there and they show up automatically.
 *
 * `captions` and `dates` are optional per hobby and each entry is optional
 * per file. Keys must match the exact filename (e.g. "01-rally.mp4"). Files
 * without a matching key render with no caption / no date.
 *
 * Date format: "YYYY-MM" or "YYYY-MM-DD" (day is optional). Rendered as
 * "Sep 2025" or "Sep 14, 2025" in the lightbox.
 */
type HobbyCaptions = Record<string, string>;
type HobbyDates = Record<string, string>;

export const hobbies = {
  badminton: {
    title: "Badminton",
    mediaDir: "hobbies/badminton",
    captions: {} as HobbyCaptions,
    dates: {} as HobbyDates,
  },
  hiking: {
    title: "Hiking",
    stats: [
      { label: "BEST", value: "Precipice Trail, Acadia National Park" },
    ] as Array<{ label: string; value: string }>,
    mediaDir: "hobbies/hiking",
    captions: {
      "cadillac_mountain_01.jpg": "Cadillac Mountain",
      "cadillac_mountain_02.jpg": "Cadillac Mountain",
      "cadillac_mountain_03.jpg": "Cadillac Mountain",
      "precipice_01.jpg": "Precipice Trail",
      "precipice_02.jpg": "Precipice Trail",
      "precipice_03.mov": "Precipice Trail",
    } as HobbyCaptions,
    dates: {} as HobbyDates,
  },
  edm: {
    title: "EDM",
    mediaDir: "hobbies/edm",
    captions: {
      "alan_walker_01.png": "Alan Walker @ MGM Music Hall at Fenway",
      "alan_walker_02.mov": "Alan Walker @ MGM Music Hall at Fenway",
      "alan_walker_03.mov": "Alan Walker @ MGM Music Hall at Fenway",
    } as HobbyCaptions,
    dates: {} as HobbyDates,
  },
  hackathon: {
    title: "Hackathons",
    mediaDir: "hobbies/hackathon",
    captions: {
      "hackathon_01.jpg": "🏆 HackMIT 2025 Entertainment Track",
      "hackathon_02.jpg": "🏆 HackMIT 2025 Entertainment Track",
      "hackathon_03.jpg": "🏆 YHack 2026 Predication Market Track 3rd",
      "hackathon_04.mov": "Hack@Brown 2025",
      "hackathon_05.jpg": "Hack@Brown 2026",
    } as HobbyCaptions,
    dates: {
      "hackathon_01.jpg": "2025-09",
      "hackathon_02.jpg": "2025-09",
      "hackathon_03.jpg": "2026-03",
      "hackathon_04.mov": "2025-02",
      "hackathon_05.jpg": "2026-01",
    } as HobbyDates,
  },
};
