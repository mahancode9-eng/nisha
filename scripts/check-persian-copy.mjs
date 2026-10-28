#!/usr/bin/env node
// Flags Persian UI copy that breaks the rules in .claude/skills/persian-voice/SKILL.md.
// Usage: node scripts/check-persian-copy.mjs [--quiet]   (exit code 1 when issues are found)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const TARGETS = [
  ["frontend/app", /\.(tsx?|mjs)$/],
  ["frontend/components", /\.tsx?$/],
  ["frontend/lib", /\.tsx?$/],
  ["frontend/contexts", /\.tsx?$/],
  ["frontend/hooks", /\.tsx?$/],
  ["backend/app", /\.py$/],
  ["nisha_flutter/assets/l10n", /_fa\.arb$/],
];

const FA = "؀-ۿ";
const END = `(?=[\\s"'\`.!،؟:)<]|$)`;
const RULES = [
  // Informal «تو» is the product voice — do not flag it.
  { id: "officialese", why: "use spoken verbs (است / کن / شد / برای)", re: /(?<![\u0600-\u06FF\u200C])(?:می‌?\s?باشد|می‌?\s?باشند|نمایید|نماید|نمایند|گردید|گردد|جهت\s|به منظور|در صورتی که|قادر به|فرمایید|فرموده)/g },
  { id: "ascii-ellipsis", why: "use «…» not \"...\"", re: new RegExp(`[${FA}]\\s?\\.\\.\\.`, "g") },
  { id: "arabic-letters", why: "use Persian ی / ک", re: /[يك]/g },
  { id: "latin-punctuation", why: "use «،» «؟» «؛» inside Persian", re: /[\u0621-\u06D3](?:\s?)[,?;](?=\s|$|[\u0621-\u06D3])/g },
  { id: "missing-zwnj-mi", why: "write «می‌» with a half-space", re: new RegExp(`(?<![${FA}])(?:ن?می)\\s(?=[${FA}]{2,})`, "g") },
  { id: "missing-zwnj-ha", why: "join «ها» with a half-space", re: new RegExp(`[${FA}]\\s(?:ها|های|هایی|هایم|هایتان)${END}`, "g") },
  { id: "dash-in-persian", why: "no — / – inside Persian sentences", re: new RegExp(`[${FA}]\\s?[—–]\\s?[${FA}]`, "g") },
  { id: "hype", why: "drop hype words", re: /(?:بی‌نظیر|فوق‌العاده|انقلابی|حرفه‌ای‌ترین|بهترین تجربه|هزاران فروشگاه)/g },
];

function* walk(dir, pattern) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p, pattern);
    else if (pattern.test(name)) yield p;
  }
}

const quiet = process.argv.includes("--quiet");
const counts = {};
let total = 0;
for (const [dir, pattern] of TARGETS) {
  for (const file of walk(join(ROOT, dir), pattern)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (!/[؀-ۿ]/.test(line)) return;
      if (/persian-copy-ignore/.test(line)) return;
      for (const rule of RULES) {
        for (const m of line.matchAll(rule.re)) {
          if (rule.filter && !rule.filter(m[0])) continue;
          total += 1;
          counts[rule.id] = (counts[rule.id] ?? 0) + 1;
          if (!quiet) console.log(`${relative(ROOT, file)}:${i + 1}  [${rule.id}] «${m[0].trim()}» — ${rule.why}`);
        }
      }
    });
  }
}
console.log(`\n${total} issue(s)`, counts);
process.exit(total ? 1 : 0);
