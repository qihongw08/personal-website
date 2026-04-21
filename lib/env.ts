import { z } from "zod";

const EnvSchema = z.object({
  GITHUB_TOKEN: z.string().min(1).optional(),
  GITHUB_USERNAME: z.string().min(1).default("qihongw08"),
  RIOT_API_KEY: z.string().min(1).optional(),
});

export const env = EnvSchema.parse({
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_USERNAME: process.env.GITHUB_USERNAME,
  RIOT_API_KEY: process.env.RIOT_API_KEY,
});
