import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { refreshKugouAuth } from "@/lib/kugou";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (env.CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  const result = await refreshKugouAuth();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
