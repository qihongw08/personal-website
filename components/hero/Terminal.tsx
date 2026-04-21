"use client";

import { useEffect, useState } from "react";
import { profile } from "@/content/profile";

const NAMES = [`Hello, I'm ${profile.name.en}`, `你好，我是${profile.name.cn}`];

const INFO_LINES = [
  ...profile.education.map((e) =>
    e.degree
      ? `${e.degree} @ ${e.school}, ${e.year}`
      : `${e.school}, ${e.year}`,
  ),
];

const CMDS = {
  name: "echo $NAME",
  about: "cat education.txt",
  links: "ls ~/connections",
} as const;

const CMD_MS = 45;
const INFO_TYPE_MS = 28;
const LINE_PAUSE = 220;

const NAME_TYPE_MS = 70;
const NAME_ERASE_MS = 35;
const NAME_HOLD_MS = 1600;

const TERM_FONT =
  "'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace";

type Stage = "cmd1" | "name-first" | "cmd2" | "info" | "cmd3" | "done";

export function Terminal() {
  // Sequenced boot
  const [stage, setStage] = useState<Stage>("cmd1");
  const [cmd1, setCmd1] = useState("");
  const [cmd2, setCmd2] = useState("");
  const [cmd3, setCmd3] = useState("");
  const [infoIdx, setInfoIdx] = useState(0);
  const [typedInfo, setTypedInfo] = useState<string[]>([""]);

  // Name loop — starts after cmd1 finishes
  const [nameIdx, setNameIdx] = useState(0);
  const [typedName, setTypedName] = useState("");
  const [namePhase, setNamePhase] = useState<"typing" | "holding" | "erasing">(
    "typing",
  );
  const nameStarted = stage !== "cmd1";

  // Type cmd1
  useEffect(() => {
    if (stage !== "cmd1") return;
    if (cmd1.length < CMDS.name.length) {
      const t = setTimeout(
        () => setCmd1(CMDS.name.slice(0, cmd1.length + 1)),
        CMD_MS,
      );
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage("name-first"), LINE_PAUSE);
    return () => clearTimeout(t);
  }, [stage, cmd1]);

  // Advance to cmd2 once the name has typed out fully once
  useEffect(() => {
    if (stage !== "name-first") return;
    if (namePhase === "holding" && typedName === NAMES[nameIdx]) {
      const t = setTimeout(() => setStage("cmd2"), LINE_PAUSE);
      return () => clearTimeout(t);
    }
  }, [stage, namePhase, typedName, nameIdx]);

  // Type cmd2
  useEffect(() => {
    if (stage !== "cmd2") return;
    if (cmd2.length < CMDS.about.length) {
      const t = setTimeout(
        () => setCmd2(CMDS.about.slice(0, cmd2.length + 1)),
        CMD_MS,
      );
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage("info"), LINE_PAUSE);
    return () => clearTimeout(t);
  }, [stage, cmd2]);

  // Type info lines
  useEffect(() => {
    if (stage !== "info") return;
    if (infoIdx >= INFO_LINES.length) {
      const t = setTimeout(() => setStage("cmd3"), LINE_PAUSE);
      return () => clearTimeout(t);
    }
    const target = INFO_LINES[infoIdx];
    const current = typedInfo[infoIdx] ?? "";
    if (current.length < target.length) {
      const t = setTimeout(() => {
        setTypedInfo((prev) => {
          const next = [...prev];
          next[infoIdx] = target.slice(0, current.length + 1);
          return next;
        });
      }, INFO_TYPE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setInfoIdx((i) => i + 1);
      setTypedInfo((prev) => [...prev, ""]);
    }, LINE_PAUSE);
    return () => clearTimeout(t);
  }, [stage, infoIdx, typedInfo]);

  // Type cmd3
  useEffect(() => {
    if (stage !== "cmd3") return;
    if (cmd3.length < CMDS.links.length) {
      const t = setTimeout(
        () => setCmd3(CMDS.links.slice(0, cmd3.length + 1)),
        CMD_MS,
      );
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage("done"), LINE_PAUSE);
    return () => clearTimeout(t);
  }, [stage, cmd3]);

  // Name loop (EN ↔ CN) — starts when nameStarted is true
  useEffect(() => {
    if (!nameStarted) return;
    const target = NAMES[nameIdx];
    if (namePhase === "typing") {
      if (typedName.length < target.length) {
        const t = setTimeout(
          () => setTypedName(target.slice(0, typedName.length + 1)),
          NAME_TYPE_MS,
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setNamePhase("holding"), 0);
      return () => clearTimeout(t);
    }
    if (namePhase === "holding") {
      const t = setTimeout(() => setNamePhase("erasing"), NAME_HOLD_MS);
      return () => clearTimeout(t);
    }
    if (typedName.length > 0) {
      const t = setTimeout(
        () => setTypedName(typedName.slice(0, -1)),
        NAME_ERASE_MS,
      );
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setNameIdx((i) => (i + 1) % NAMES.length);
      setNamePhase("typing");
    }, 0);
    return () => clearTimeout(t);
  }, [nameStarted, typedName, namePhase, nameIdx]);

  const blinkCursor = (color = "var(--brand)", height = "0.9em") => (
    <span
      aria-hidden
      className="ml-1 inline-block"
      style={{
        width: "2px",
        height,
        verticalAlign: "-0.12em",
        background: color,
        animation: "blink 1s step-end infinite",
      }}
    />
  );

  const cmdLine = (
    text: string,
    full: string,
    active: boolean,
    visible: boolean,
  ) => (
    <div
      style={{
        color: "var(--ink-faint)",
        fontSize: 12,
        minHeight: "1.5em",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s",
      }}
    >
      <span className="text-[var(--brand)]">❯ </span>
      {text}
      {active &&
        text.length < full.length &&
        blinkCursor("var(--ink-faint)", "0.85em")}
    </div>
  );

  return (
    <div className="glass-card mx-auto w-full max-w-[720px] overflow-hidden rounded-xl">
      <div
        className="flex items-center gap-2 border-b border-[var(--glass-border)] px-4 py-2.5"
        style={{ background: "rgba(0,0,0,0.02)" }}
      >
        <div className="flex gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: "#ff5f57" }}
          />
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: "#febc2e" }}
          />
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: "#28c840" }}
          />
        </div>
        <div
          className="flex-1 text-center text-xs text-[var(--ink-faint)]"
          style={{ fontFamily: TERM_FONT }}
        >
          qihong@portfolio ~ %
        </div>
      </div>

      <div
        className="px-6 py-6"
        style={{ fontFamily: TERM_FONT, minHeight: 360 }}
      >
        {/* cmd1 + name result */}
        {cmdLine(cmd1, CMDS.name, stage === "cmd1", true)}
        {nameStarted && (
          <div
            className="mt-3 font-display font-bold text-[var(--ink)]"
            style={{
              fontSize: "clamp(24px, 4vw, 36px)",
              lineHeight: 1.15,
              minHeight: "1.15em",
            }}
          >
            {typedName}
            {blinkCursor("var(--brand)", "0.8em")}
          </div>
        )}

        {/* cmd2 + info result */}
        {(stage === "cmd2" ||
          stage === "info" ||
          stage === "cmd3" ||
          stage === "done") && (
          <div style={{ marginTop: 24 }}>
            {cmdLine(cmd2, CMDS.about, stage === "cmd2", true)}
            <div
              className="mt-2 flex flex-col gap-1 text-[13px] text-[var(--ink-muted)]"
              style={{ minHeight: INFO_LINES.length * 24 }}
            >
              {INFO_LINES.map((_, i) => {
                const shown = typedInfo[i] ?? "";
                const isActive =
                  stage === "info" &&
                  i === infoIdx &&
                  infoIdx < INFO_LINES.length;
                if (shown === "" && !isActive) return <div key={i}>&nbsp;</div>;
                return (
                  <div key={i}>
                    {shown}
                    {isActive && blinkCursor("var(--ink-muted)", "0.9em")}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* cmd3 + links result */}
        {(stage === "cmd3" || stage === "done") && (
          <div style={{ marginTop: 24 }}>
            {cmdLine(cmd3, CMDS.links, stage === "cmd3", true)}
            <div
              className="mt-2 flex flex-wrap gap-5 transition-opacity duration-500"
              style={{ opacity: stage === "done" ? 1 : 0 }}
            >
              {[
                { label: "github", url: profile.socials.github.url },
                { label: "linkedin", url: profile.socials.linkedin.url },
                { label: "email", url: profile.socials.email.url },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-[var(--brand)] pb-0.5"
                  style={{ borderBottom: "1px dashed rgba(8,145,178,0.3)" }}
                >
                  {link.label}/
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
