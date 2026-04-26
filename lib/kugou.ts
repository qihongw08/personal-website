import { head, put } from "@vercel/blob";
import { env } from "./env";

export type TopSong = {
  hash: string;
  title: string;
  artist: string;
  album: string;
  imageUrl: string | null;
  playCount: number | null;
};

type StoredAuth = {
  token: string;
  userid: string;
  cookie: string;
  updatedAt: string;
};

const BLOB_PATHNAME = "kugou/auth.json";

function bootstrapAuth(): StoredAuth | null {
  if (!env.KUGOU_TOKEN || !env.KUGOU_USERID || !env.KUGOU_COOKIE) return null;
  return {
    token: env.KUGOU_TOKEN,
    userid: env.KUGOU_USERID,
    cookie: env.KUGOU_COOKIE,
    updatedAt: "bootstrap",
  };
}

async function readStoredAuth(): Promise<StoredAuth | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return bootstrapAuth();
  try {
    const blob = await head(BLOB_PATHNAME);
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return bootstrapAuth();
    const json = (await res.json()) as Partial<StoredAuth>;
    if (!json.token || !json.userid || !json.cookie) return bootstrapAuth();
    return {
      token: json.token,
      userid: json.userid,
      cookie: json.cookie,
      updatedAt: json.updatedAt ?? "unknown",
    };
  } catch {
    return bootstrapAuth();
  }
}

async function writeStoredAuth(auth: StoredAuth): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  await put(BLOB_PATHNAME, JSON.stringify(auth, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

function buildCookieParam(auth: StoredAuth): string {
  const parts = auth.cookie
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
  const map = new Map<string, string>();
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    map.set(part.slice(0, eq), part.slice(eq + 1));
  }
  map.set("token", auth.token);
  map.set("userid", auth.userid);
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join(";");
}

function mergeSetCookieIntoStored(
  stored: StoredAuth,
  setCookieHeaders: string[],
): StoredAuth {
  const map = new Map<string, string>();
  for (const part of stored.cookie.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    map.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  let nextToken = stored.token;
  let nextUserid = stored.userid;
  for (const header of setCookieHeaders) {
    const firstPair = header.split(";")[0];
    if (!firstPair) continue;
    const eq = firstPair.indexOf("=");
    if (eq <= 0) continue;
    const k = firstPair.slice(0, eq).trim();
    const v = firstPair.slice(eq + 1).trim();
    if (!k) continue;
    map.set(k, v);
    if (k === "token") nextToken = v;
    if (k === "userid") nextUserid = v;
  }
  return {
    token: nextToken,
    userid: nextUserid,
    cookie: Array.from(map.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join(";"),
    updatedAt: new Date().toISOString(),
  };
}

async function callApi(
  path: string,
  auth: StoredAuth,
  extraQuery: Record<string, string> = {},
  init: RequestInit & { next?: { revalidate: number } } = {},
): Promise<{ res: Response; setCookies: string[] } | null> {
  if (!env.KUGOU_API_BASE) return null;
  const url = new URL(path, env.KUGOU_API_BASE);
  url.searchParams.set("token", auth.token);
  url.searchParams.set("userid", auth.userid);
  url.searchParams.set("cookie", buildCookieParam(auth));
  for (const [k, v] of Object.entries(extraQuery)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      cookie: buildCookieParam(auth),
    },
  });
  const setCookies = res.headers.getSetCookie?.() ?? [];
  return { res, setCookies };
}

/**
 * Calls /login/token to extend the KuGou session and persists any rotated
 * token/cookies back to Vercel Blob. Triggered by the daily cron job.
 */
export async function refreshKugouAuth(): Promise<{
  ok: boolean;
  status: number;
  updatedAt: string;
}> {
  const auth = await readStoredAuth();
  if (!auth) return { ok: false, status: 0, updatedAt: "no-auth" };
  const out = await callApi("/login/token", auth, {}, { cache: "no-store" });
  if (!out) return { ok: false, status: 0, updatedAt: "no-base" };
  const json = (await out.res.json().catch(() => null)) as {
    status?: number;
    data?: { token?: string; userid?: number | string };
  } | null;
  if (!out.res.ok || !json || json.status !== 1) {
    return { ok: false, status: out.res.status, updatedAt: auth.updatedAt };
  }
  const merged = mergeSetCookieIntoStored(auth, out.setCookies);
  if (typeof json.data?.token === "string" && json.data.token.length > 0) {
    merged.token = json.data.token;
  }
  if (json.data?.userid != null) merged.userid = String(json.data.userid);
  await writeStoredAuth(merged);
  return { ok: true, status: 200, updatedAt: merged.updatedAt };
}

type RawSong = {
  hash?: string;
  Hash?: string;
  filename?: string;
  name?: string;
  songname?: string;
  singername?: string;
  author_name?: string;
  albumname?: string;
  album_name?: string;
  total_play_count?: number;
  play_count?: number;
  pc?: number;
  img?: string;
  imgurl?: string;
  sizable_cover?: string;
  cover?: string;
  album_img?: string;
};

type UserHistoryResponse = {
  status?: number;
  data?: {
    songs?: RawSong[];
    info?: Array<unknown>;
  };
};

function pickImage(s: RawSong): string | null {
  const candidates = [s.sizable_cover, s.imgurl, s.img, s.cover, s.album_img].filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );
  if (candidates.length === 0) return null;
  // KuGou's image URLs often contain a "{size}" placeholder.
  return candidates[0].replace(/\{size\}/g, "240").replace(/^http:/, "https:");
}

function parseFilename(filename: string): { artist: string; title: string } {
  const idx = filename.indexOf(" - ");
  if (idx === -1) return { artist: "", title: filename };
  return { artist: filename.slice(0, idx).trim(), title: filename.slice(idx + 3).trim() };
}

/**
 * Fetches Qihong's top-played songs from KuGou via /user/history. Fail-open:
 * returns [] when env is unset, blob is missing, or the API errors out.
 */
export async function getTopPlayed(limit = 6): Promise<TopSong[]> {
  const auth = await readStoredAuth();
  if (!auth) return [];
  try {
    const out = await callApi("/user/history", auth, {}, { next: { revalidate: 3600 } });
    if (!out || !out.res.ok) return [];
    const json = (await out.res.json()) as UserHistoryResponse;
    if (json.status !== 1) return [];
    const songs = json.data?.songs ?? [];
    return songs.slice(0, limit).map((s): TopSong => {
      const filename = s.filename ?? "";
      const fromFilename = parseFilename(filename);
      const title = s.songname ?? s.name ?? fromFilename.title ?? "";
      const artist = s.singername ?? s.author_name ?? fromFilename.artist ?? "";
      const album = s.albumname ?? s.album_name ?? "";
      return {
        hash: s.hash ?? s.Hash ?? "",
        title,
        artist,
        album,
        imageUrl: pickImage(s),
        playCount: s.total_play_count ?? s.play_count ?? s.pc ?? null,
      };
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[kugou] getTopPlayed failed:", err);
    }
    return [];
  }
}
