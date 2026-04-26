import { DJ_PLAYLIST_ID, getPlaylistTracks, getTopPlayed } from "@/lib/kugou";
import { TopPlayedTabs } from "./TopPlayedTabs";

export async function TopPlayed() {
  const [enSongs, cnSongs] = await Promise.all([
    getPlaylistTracks(DJ_PLAYLIST_ID, 5),
    getTopPlayed(5),
  ]);
  if (enSongs.length === 0 && cnSongs.length === 0) return null;
  return <TopPlayedTabs enSongs={enSongs} cnSongs={cnSongs} />;
}
