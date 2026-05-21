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

// User-curated DJ playlist (English-language songs). global_collection_id is
// stable per playlist; if you rename or recreate the playlist in the KuGou app,
// re-fetch /user/playlist and update this.
export const DJ_PLAYLIST_ID = "collection_3_1264709290_18_0";

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

type RawListenTrack = {
  hash?: string;
  name?: string;
  filename?: string;
  singername?: string | null;
  image?: string;
  image_320?: string;
  image_high?: string;
  image_sq?: string;
  cover?: string;
  albumname?: string;
  album_name?: string;
  albuminfo?: { name?: string };
  listen_count?: number;
  pc?: number;
  play_count?: number;
  count?: number;
  trans_param?: { union_cover?: string };
};

type UserListenResponse = {
  status?: number;
  data?: { lists?: RawListenTrack[] };
};

function normalizeKugouImage(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // KuGou cover URLs contain a literal "{size}" placeholder for the edge length.
  return raw.replace(/\{size\}/g, "240").replace(/^http:/, "https:");
}

type RawPlaylistTrack = {
  hash?: string;
  name?: string;
  singername?: string | null;
  cover?: string;
  sort?: number;
  collecttime?: number;
  singerinfo?: Array<{ name?: string }>;
  albuminfo?: { name?: string };
};

type PlaylistTracksResponse = {
  status?: number;
  data?: { songs?: RawPlaylistTrack[] };
};

function parseTitleFromName(name: string): { artist: string; title: string } {
  const idx = name.indexOf(" - ");
  if (idx === -1) return { artist: "", title: name };
  return { artist: name.slice(0, idx).trim(), title: name.slice(idx + 3).trim() };
}

function pickPlaylistImage(s: RawPlaylistTrack): string | null {
  return normalizeKugouImage(s.cover);
}

function pickListenImage(s: RawListenTrack): string | null {
  return normalizeKugouImage(
    s.image_320 ??
      s.image ??
      s.image_high ??
      s.image_sq ??
      s.cover ??
      s.trans_param?.union_cover,
  );
}

function pickListenCount(s: RawListenTrack): number | null {
  return s.listen_count ?? s.play_count ?? s.pc ?? s.count ?? null;
}

function isCnPanelSong(song: TopSong): boolean {
  return /[\u3400-\u9fff]/.test(song.title);
}

/**
 * Fetches the first `limit` tracks of a playlist by global_collection_id, in
 * the playlist's natural sort order. Used for the EN tab (DJ playlist).
 */
export async function getPlaylistTracks(
  globalCollectionId: string,
  limit = 5,
): Promise<TopSong[]> {
  const auth = await readStoredAuth();
  if (!auth) return [];
  try {
    const out = await callApi(
      "/playlist/track/all",
      auth,
      { id: globalCollectionId, pagesize: String(Math.max(limit, 30)) },
      { next: { revalidate: 604800 } },
    );
    if (!out || !out.res.ok) return [];
    const json = (await out.res.json()) as PlaylistTracksResponse;
    if (json.status !== 1) return [];
    const songs = json.data?.songs ?? [];
    return [...songs]
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .slice(0, limit)
      .map((s): TopSong => {
        const fromName = parseTitleFromName(s.name ?? "");
        const artistsFromInfo = (s.singerinfo ?? [])
          .map((x) => x.name)
          .filter((x): x is string => !!x)
          .join(", ");
        return {
          hash: s.hash ?? "",
          title: fromName.title,
          artist: artistsFromInfo || s.singername || fromName.artist,
          album: s.albuminfo?.name ?? "",
          imageUrl: pickPlaylistImage(s),
          playCount: null,
        };
      });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[kugou] getPlaylistTracks failed:", err);
    }
    return [];
  }
}

/**
 * Fetches all-time top-played songs from KuGou via /user/listen. `type=1`
 * selects the historical ranking; `type=0` is the recent weekly ranking.
 */
export async function getTopPlayed(limit = 6): Promise<TopSong[]> {
  const auth = await readStoredAuth();
  if (!auth) return [];
  try {
    const out = await callApi(
      "/user/listen",
      auth,
      { type: "1" },
      { next: { revalidate: 604800 } },
    );
    if (!out || !out.res.ok) return [];
    const json = (await out.res.json()) as UserListenResponse;
    if (json.status !== 1) return [];
    const songs = json.data?.lists ?? [];
    return songs
      .map((s): TopSong => {
        const fromName = parseTitleFromName(s.name ?? s.filename ?? "");
        return {
          hash: s.hash ?? "",
          title: fromName.title,
          artist: s.singername || fromName.artist,
          album: s.albumname ?? s.album_name ?? s.albuminfo?.name ?? "",
          imageUrl: pickListenImage(s),
          playCount: pickListenCount(s),
        };
      })
      .filter(isCnPanelSong)
      .slice(0, limit);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[kugou] getTopPlayed failed:", err);
    }
    return [];
  }
}
