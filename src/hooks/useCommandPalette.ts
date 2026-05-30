import { useCallback, useEffect, useState } from "react";
import { isMac } from "../components/common/Kbd";

export interface CommandPaletteController {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

/**
 * Owns the command-palette open state and installs the global primary-modifier+K
 * listener (Ctrl+K on Windows, ⌘K on macOS). The shortcut fires from anywhere,
 * including text inputs, and toggles the palette.
 */
export function useCommandPalette(): CommandPaletteController {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen, toggle };
}
