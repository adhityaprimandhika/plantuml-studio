/**
 * Heuristic, regex-based color extractor for PlantUML source.
 *
 * PlantUML lets you attach colors to elements in several ways, e.g.:
 *   class Foo #FF0000
 *   participant "Bob" as B #LightBlue
 *   rectangle "Cache" #Orange
 *   state Idle #palegreen
 *   A -[#red]-> B : message
 *   A -> B #blue : message
 *
 * It also supports inline color markup within text/labels, e.g.:
 *   <color:red>this text is red</color>
 *   <color:#FF0000>this text is red too</color>
 *   note right: <color:orange>warning</color>
 *
 * This parser scans line by line, finds color tokens in both forms,
 * and groups the *whole line* under each color found. It's intentionally
 * simple/heuristic rather than a full PlantUML grammar parser, since PlantUML's
 * grammar varies a lot across diagram types.
 */

const COLOR_TOKEN_RE =
  /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3}|[A-Za-z][A-Za-z0-9]*)\b/g;

// Matches PlantUML's inline <color:NAME> or <color:#RRGGBB> markup.
// The leading # inside the tag is optional and stripped out either way.
const INLINE_COLOR_TAG_RE =
  /<color:\s*#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3}|[A-Za-z][A-Za-z0-9]*)\s*>/gi;

// Words that look like "#something" but aren't colors in PlantUML syntax
// (e.g. anchors, references). Extend this list if you hit false positives.
const IGNORE_WORDS = new Set([
  "startuml",
  "enduml",
  "note",
  "ref",
  "left",
  "right",
  "top",
  "bottom",
  "powderblue",
  "deepskyblue",
  "papayawhip",
  "lightcoral",
  "#00555c",
  "lightsalmon",
  "#47b3b3",
  "oldlace",
]);

function normalizeColorKey(raw) {
  return raw.toLowerCase();
}

function extractColorGroups(plantumlCode) {
  const lines = plantumlCode.split(/\r?\n/);
  const groups = new Map(); // colorKey -> { color, lines: [] }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("'") || /^@(start|end)uml/i.test(line))
      continue;

    let match;
    const foundOnLine = new Set();

    // Pass 1: element-attached colors, e.g. `#FF0000`, `#LightBlue`
    COLOR_TOKEN_RE.lastIndex = 0;
    while ((match = COLOR_TOKEN_RE.exec(line)) !== null) {
      const token = match[1];
      const key = normalizeColorKey(token);
      if (IGNORE_WORDS.has(key)) continue;
      foundOnLine.add(token);
    }

    // Pass 2: inline markup, e.g. `<color:red>`, `<color:#FF0000>`
    INLINE_COLOR_TAG_RE.lastIndex = 0;
    while ((match = INLINE_COLOR_TAG_RE.exec(line)) !== null) {
      const token = match[1];
      const key = normalizeColorKey(token);
      if (IGNORE_WORDS.has(key)) continue;
      foundOnLine.add(token);
    }

    for (const token of foundOnLine) {
      const key = normalizeColorKey(token);
      if (!groups.has(key)) {
        groups.set(key, { color: `#${token}`, lines: [] });
      }
      groups.get(key).lines.push(rawLine.trim());
    }
  }

  return Array.from(groups.values());
}

module.exports = { extractColorGroups };
