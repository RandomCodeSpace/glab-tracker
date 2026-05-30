import type { SVGProps } from "react";

export type IconName =
  // existing (kept — do not rename/remove)
  | "close"
  | "external"
  | "refresh"
  | "cancel"
  | "trash"
  | "settings"
  | "plus"
  | "message"
  | "search"
  | "logout"
  // added for the redesign
  | "command"
  | "arrow-up"
  | "arrow-down"
  | "arrow-left"
  | "arrow-right"
  | "corner-return"
  | "keyboard"
  | "filter"
  | "flag"
  | "block"
  | "eye"
  | "check"
  | "clock"
  | "gauge"
  | "link-external"
  | "note"
  | "chevron"
  | "dot"
  | "git";

// Every glyph is drawn on a single 16x16 grid, 1.5px stroke, round caps/joins,
// currentColor, fill="none" — optically centered for editor-grade consistency.
const PATHS: Record<IconName, string> = {
  // ---- existing, normalized to the 16-grid ----------------------------------
  close: "M4 4l8 8M12 4l-8 8",
  external: "M4.5 11.5L11 5M6 5h5v5",
  refresh: "M2.5 8a5.5 5.5 0 0 1 9.4-3.9M13.5 2.5V6h-3.5M13.5 8a5.5 5.5 0 0 1-9.4 3.9M2.5 13.5V10H6",
  cancel: "M5 5l6 6M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z",
  trash: "M2.5 4.5h11M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M4 4.5l.6 8.5a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8.5M6.5 7v4M9.5 7v4",
  settings:
    "M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 1.5l1 1.6 1.9-.4.5 1.9 1.6 1-.8 1.7.8 1.7-1.6 1-.5 1.9-1.9-.4-1 1.6-1-1.6-1.9.4-.5-1.9-1.6-1 .8-1.7-.8-1.7 1.6-1 .5-1.9 1.9.4z",
  plus: "M8 3v10M3 8h10",
  message: "M14 8a5 5 0 0 1-5 5H6l-3 2.2V11A5 5 0 0 1 3 8a5 5 0 0 1 5-5 5 5 0 0 1 6 5z",
  search: "M7.25 12a4.75 4.75 0 1 0 0-9.5 4.75 4.75 0 0 0 0 9.5zM13.5 13.5l-2.9-2.9",
  logout: "M6 14H3.5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1H6M10.5 11l3-3-3-3M13.5 8H6",

  // ---- added for the redesign ----------------------------------------------
  command:
    "M6 6h4v4H6zM6 6V4.5A1.5 1.5 0 1 0 4.5 6zM10 6h1.5A1.5 1.5 0 1 0 10 4.5zM10 10v1.5A1.5 1.5 0 1 0 11.5 10zM6 10H4.5A1.5 1.5 0 1 0 6 11.5z",
  "arrow-up": "M8 13V3M4 7l4-4 4 4",
  "arrow-down": "M8 3v10M4 9l4 4 4-4",
  "arrow-left": "M13 8H3M7 4L3 8l4 4",
  "arrow-right": "M3 8h10M9 4l4 4-4 4",
  "corner-return": "M13 4v3.5a1.5 1.5 0 0 1-1.5 1.5H3M6 6L3 9l3 3",
  keyboard:
    "M2.5 4h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 6.5h0M6.5 6.5h0M9 6.5h0M11.5 6.5h0M5 9.5h6",
  filter: "M2.5 4h11l-4.2 4.8v3.4l-2.6 1.3V8.8z",
  flag: "M4 14V2.5M4 3h7l-1.5 2.5L11 8H4",
  block: "M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM3.4 3.4l9.2 9.2",
  eye: "M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  check: "M3 8.5l3.2 3.2L13 4.5",
  clock: "M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM8 4.5V8l2.5 1.5",
  gauge: "M2.5 12a5.5 5.5 0 1 1 11 0M8 12l2.5-3",
  "link-external": "M9 3.5h3.5V7M12 4L7.5 8.5M11 9.5v2.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2.5",
  note: "M3.5 2.5h6L13 6v7.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a.5.5 0 0 1 .5-.5zM9 2.5V6h3.5M5.5 9h5M5.5 11.5h3",
  chevron: "M6 4l4 4-4 4",
  dot: "M8 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  git: "M4.5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4.5 5.5v7M4.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM11.5 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM11.5 7v.5a3 3 0 0 1-3 3h-4",
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 16, strokeWidth = 1.5, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
