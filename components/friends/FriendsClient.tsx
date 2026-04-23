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
  // SSR renders at the desktop default; client adjusts on mount + resize so
  // the graph fits comfortably within the viewport on phones/tablets.
  const [renderHeight, setRenderHeight] = useState(height);

  useEffect(() => {
    const compute = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      // Phone: cap to ~70% of viewport so users can still scroll past it.
      // Tablet: ~75%. Desktop: use the prop default.
      const cap = vw < 640 ? 0.7 : vw < 1024 ? 0.75 : 1;
      const next = Math.round(Math.min(height, vh * cap));
      // Keep a sensible floor so the canvas doesn't collapse on landscape phones.
      setRenderHeight(Math.max(360, next));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [height]);

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
    <div style={{ minHeight: renderHeight }}>
      {state.status === "loaded" ? (
        <FriendGraph<FriendTag>
          root={root}
          friends={state.friends}
          tags={tagRegistry}
          height={renderHeight}
        />
      ) : (
        <LoadingFrame height={renderHeight} state={state.status} />
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
