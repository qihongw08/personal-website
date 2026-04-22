"use client";

import { useEffect, useState } from "react";
import { FriendGraph } from "@/components/friend-graph";
import type { FriendNode, RootNode } from "@/components/friend-graph";
import { tagRegistry, type FriendTag } from "@/content/friends";

type Props = {
  root: RootNode;
  height?: number;
};

type FetchState =
  | { status: "loading" }
  | { status: "loaded"; friends: FriendNode<FriendTag>[] }
  | { status: "error" };

export function FriendsClient({ root, height = 680 }: Props) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/friends", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ friends: FriendNode<FriendTag>[] }>;
      })
      .then((json) => setState({ status: "loaded", friends: json.friends }))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setState({ status: "error" });
      });

    return () => controller.abort();
  }, []);

  return (
    <div style={{ minHeight: height }}>
      {state.status === "loaded" ? (
        <FriendGraph<FriendTag>
          root={root}
          friends={state.friends}
          tags={tagRegistry}
          height={height}
        />
      ) : (
        <LoadingFrame height={height} state={state.status} />
      )}
    </div>
  );
}

function LoadingFrame({
  height,
  state,
}: {
  height: number;
  state: "loading" | "error";
}) {
  const message =
    state === "error"
      ? "Couldn't load connections. Retry later."
      : "Loading connections…";

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3"
      style={{ height }}
    >
      {state !== "error" ? (
        <div className="flex gap-1.5">
          <span
            className="h-2 w-2 rounded-full bg-[var(--brand)] opacity-60"
            style={{
              animation: "pulse 1.4s ease-in-out infinite",
              animationDelay: "0s",
            }}
          />
          <span
            className="h-2 w-2 rounded-full bg-[var(--brand)] opacity-60"
            style={{
              animation: "pulse 1.4s ease-in-out infinite",
              animationDelay: "0.2s",
            }}
          />
          <span
            className="h-2 w-2 rounded-full bg-[var(--brand)] opacity-60"
            style={{
              animation: "pulse 1.4s ease-in-out infinite",
              animationDelay: "0.4s",
            }}
          />
        </div>
      ) : null}
      <span className="font-mono text-[11px] tracking-[1.5px] text-[var(--ink-faint)] uppercase">
        {message}
      </span>
    </div>
  );
}
