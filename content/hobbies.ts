/**
 * Hobby metadata. Media (images + videos) is scanned at runtime from
 * `public/hobbies/<slug>/` — drop files there and they show up automatically.
 *
 * `captions` is optional per hobby and each entry is optional per file.
 * Keys must match the exact filename (e.g. "01-rally.mp4"). Files without
 * a matching key render with no caption.
 */
type HobbyCaptions = Record<string, string>;

export const hobbies = {
  badminton: {
    title: "Badminton",
    mediaDir: "hobbies/badminton",
    captions: {} as HobbyCaptions,
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
  },
  edm: {
    title: "EDM",
    mediaDir: "hobbies/edm",
    captions: {} as HobbyCaptions,
  },
};
