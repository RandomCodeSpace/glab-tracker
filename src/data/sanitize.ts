export interface SanitizeOptions {
  /** Path of the personal project, e.g. "my/tracker", used to detect foreign refs. */
  ownProject: string;
}

const PROTECTED_FENCE_RE = /```[\s\S]*?```|`[^`\n]*`/g;
const TOKEN = "PROTECTED";

const PATTERNS: { re: RegExp; wrap: (s: string) => string }[] = [
  // Full GitLab issue/MR/discussion URLs to ANY project
  {
    re: /\bhttps?:\/\/[\w.-]+\/[\w./-]+\/-\/(?:issues|merge_requests|discussions)\/\d+\S*/g,
    wrap: (s) => "`" + s + "`",
  },
  // Cross-project refs: `group/project#NN` or `group/project!NN`
  {
    re: /\b[a-z0-9][\w./-]+?\/[\w./-]+?[#!]\d+/gi,
    wrap: (s) => "`" + s + "`",
  },
  // @username mentions (avoid email addresses: must be at start, after space, or after punct)
  {
    re: /(^|\s|[(\[{,;:])@[a-z0-9][\w.-]*/gi,
    wrap: (s) => {
      const m = s.match(/^(.*?)(@[a-z0-9][\w.-]*)$/i);
      return m ? m[1] + "`" + m[2] + "`" : "`" + s + "`";
    },
  },
  // ~labelname references (must be preceded by start/space/punct to avoid matching mid-word ~)
  {
    re: /(^|\s|[(\[{,;:])~[a-z0-9][\w-]*/gi,
    wrap: (s) => {
      const m = s.match(/^(.*?)(~[a-z0-9][\w-]*)$/i);
      return m ? m[1] + "`" + m[2] + "`" : "`" + s + "`";
    },
  },
  // %milestonename references
  {
    re: /(^|\s|[(\[{,;:])%[a-z0-9][\w-]*/gi,
    wrap: (s) => {
      const m = s.match(/^(.*?)(%[a-z0-9][\w-]*)$/i);
      return m ? m[1] + "`" + m[2] + "`" : "`" + s + "`";
    },
  },
];

export function sanitizeForGitLab(input: string, _opts: SanitizeOptions): string {
  // 1. Mask already-protected runs (fenced blocks + inline code)
  const masked: string[] = [];
  const stripped = input.replace(PROTECTED_FENCE_RE, (m) => {
    masked.push(m);
    return TOKEN + (masked.length - 1) + TOKEN;
  });

  // 2. Apply patterns in order
  let out = stripped;
  for (const { re, wrap } of PATTERNS) {
    out = out.replace(re, wrap);
  }

  // 3. Restore masked content
  out = out.replace(new RegExp(TOKEN + "(\\d+)" + TOKEN, "g"), (_, idx) => masked[Number(idx)]!);
  return out;
}

export interface SourceSnapshot {
  state: "opened" | "closed";
  title: string;
  labels: string[];
  description: string;
}

export function fenceSourceSnapshot(snap: SourceSnapshot): string {
  // Strip any nested triple-backticks to keep the outer fence intact
  const safe = (s: string) => s.replace(/```/g, "''' ");
  const body = [
    `state: ${snap.state}`,
    `labels: ${snap.labels.join(", ") || "(none)"}`,
    `title: ${safe(snap.title)}`,
    `description:`,
    safe(snap.description).split("\n").map((l) => "  " + l).join("\n"),
  ].join("\n");
  return "```\n" + body + "\n```";
}
