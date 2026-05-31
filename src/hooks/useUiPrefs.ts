import { useCallback, useEffect, useState } from "react";

// View preferences (theme / CRT texture / activity-rail visibility). These are
// presentational only and live in localStorage — distinct from issue data
// (IndexedDB sidecar). Guarded so private-mode / SSR / no-storage degrade to
// the defaults silently.

export type Theme = "dark" | "light";

export interface UiPrefs {
  theme: Theme;
  crt: boolean;
  railOpen: boolean;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setCrt: (v: boolean) => void;
  toggleCrt: () => void;
  setRailOpen: (v: boolean) => void;
  toggleRail: () => void;
}

const KEY = "lane.ui.prefs";

interface Stored {
  theme?: Theme;
  crt?: boolean;
  railOpen?: boolean;
}

function read(): Stored {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    if (!raw) return {};
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== "object") return {};
    const s = v as Record<string, unknown>;
    const out: Stored = {};
    if (s.theme === "dark" || s.theme === "light") out.theme = s.theme;
    if (typeof s.crt === "boolean") out.crt = s.crt;
    if (typeof s.railOpen === "boolean") out.railOpen = s.railOpen;
    return out;
  } catch {
    return {};
  }
}

function write(v: Stored): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* storage unavailable — prefs are session-only */
  }
}

const DEFAULTS: Required<Stored> = { theme: "dark", crt: true, railOpen: false };

export function useUiPrefs(): UiPrefs {
  const [theme, setThemeState] = useState<Theme>(() => read().theme ?? DEFAULTS.theme);
  const [crt, setCrtState] = useState<boolean>(() => read().crt ?? DEFAULTS.crt);
  const [railOpen, setRailState] = useState<boolean>(() => read().railOpen ?? DEFAULTS.railOpen);

  useEffect(() => {
    write({ theme, crt, railOpen });
  }, [theme, crt, railOpen]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState((t) => (t === "dark" ? "light" : "dark")), []);
  const setCrt = useCallback((v: boolean) => setCrtState(v), []);
  const toggleCrt = useCallback(() => setCrtState((v) => !v), []);
  const setRailOpen = useCallback((v: boolean) => setRailState(v), []);
  const toggleRail = useCallback(() => setRailState((v) => !v), []);

  return { theme, crt, railOpen, setTheme, toggleTheme, setCrt, toggleCrt, setRailOpen, toggleRail };
}
