import { z } from "zod";

const EnvSchema = z.object({
  GITHUB_TOKEN: z.string().min(1).optional(),
  GITHUB_USERNAME: z.string().min(1).default("qihongw08"),
  RIOT_API_KEY: z.string().min(1).optional(),
  KUGOU_API_BASE: z.string().url().optional(),
  KUGOU_TOKEN: z.string().min(1).optional(),
  KUGOU_USERID: z.string().min(1).optional(),
  KUGOU_COOKIE: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
});

export const env = EnvSchema.parse({
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_USERNAME: process.env.GITHUB_USERNAME,
  RIOT_API_KEY: process.env.RIOT_API_KEY,
  KUGOU_API_BASE: process.env.KUGOU_API_BASE,
  KUGOU_TOKEN: process.env.KUGOU_TOKEN,
  KUGOU_USERID: process.env.KUGOU_USERID,
  KUGOU_COOKIE: process.env.KUGOU_COOKIE,
  CRON_SECRET: process.env.CRON_SECRET,
});
