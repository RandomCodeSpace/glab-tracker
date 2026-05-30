// Key-cap primitive (<Kbd>) — Windows-native by default, platform-detected once.
// Single source of platform key mapping; reused by the command palette and
// shortcuts sheet via the exported `isMac` / `formatKey` helpers.

/** Detect macOS once at module load. Windows is the default presentation;
 *  only macOS swaps in ⌘/⌥/⇧/↵. Guarded for SSR / no-navigator. */
function detectMac(): boolean {
  if (typeof navigator === "undefined") return false;
  const uaPlatform = (
    navigator as Navigator & {
      userAgentData?: { platform?: string };
    }
  ).userAgentData?.platform;
  const platform = uaPlatform ?? navigator.platform ?? "";
  return /mac/i.test(platform);
}

export const isMac: boolean = detectMac();

/** Display label for one key, per the active platform. Single letters and
 *  nav keys are identical on both platforms. */
export function formatKey(token: string): string {
  const key = token.trim().toLowerCase();
  switch (key) {
    case "mod":
      return isMac ? "⌘" : "Ctrl"; // ⌘
    case "alt":
    case "opt":
    case "option":
      return isMac ? "⌥" : "Alt"; // ⌥
    case "shift":
      return isMac ? "⇧" : "Shift"; // ⇧
    case "enter":
    case "return":
      return isMac ? "↵" : "Enter"; // ↵
    case "esc":
    case "escape":
      return "Esc";
    case "up":
    case "arrowup":
      return "↑"; // ↑
    case "down":
    case "arrowdown":
      return "↓"; // ↓
    case "left":
    case "arrowleft":
      return "←"; // ←
    case "right":
    case "arrowright":
      return "→"; // →
    default:
      // Single literal keys ("k", "[", "/", "?") — uppercase letters only.
      return token.length === 1 ? token.toUpperCase() : token;
  }
}

/** Spoken/screen-reader label for one key, per the active platform. */
function ariaKey(token: string): string {
  const key = token.trim().toLowerCase();
  switch (key) {
    case "mod":
      return isMac ? "Command" : "Control";
    case "alt":
    case "opt":
    case "option":
      return isMac ? "Option" : "Alt";
    case "shift":
      return "Shift";
    case "enter":
    case "return":
      return "Enter";
    case "esc":
    case "escape":
      return "Escape";
    case "up":
    case "arrowup":
      return "Up";
    case "down":
    case "arrowdown":
      return "Down";
    case "left":
    case "arrowleft":
      return "Left";
    case "right":
    case "arrowright":
      return "Right";
    default:
      return token.length === 1 ? token.toUpperCase() : token;
  }
}

/** Parse the `keys` prop into a token list. Accepts "mod+k" or ["mod","k"]. */
function parseKeys(keys: string | string[]): string[] {
  const list = Array.isArray(keys) ? keys : keys.split("+");
  return list.map((k) => k.trim()).filter(Boolean);
}

export interface KbdProps {
  /** Logical combo, e.g. "mod+k" or ["mod","k"]. Mutually exclusive with children. */
  keys?: string | string[];
  /** Literal cap content when not using `keys`. */
  children?: string;
  className?: string;
}

export function Kbd({ keys, children, className }: KbdProps) {
  const tokens =
    keys !== undefined ? parseKeys(keys) : children ? [children] : [];
  const label = tokens.map(ariaKey).join(" ");
  const cls = ["tracker-kbd", className].filter(Boolean).join(" ");

  return (
    <span className={cls} role="img" aria-label={label}>
      {tokens.map((token, i) => (
        <span className="tracker-kbd__group" key={`${token}-${i}`}>
          {i > 0 && (
            <span className="tracker-kbd__sep" aria-hidden>
              +
            </span>
          )}
          <kbd className="tracker-kbd__cap" aria-hidden>
            {formatKey(token)}
          </kbd>
        </span>
      ))}
    </span>
  );
}
