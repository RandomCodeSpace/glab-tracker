// ShortcutsSheet — the "?" overlay. A read-only, two-column reference of the
// full keymap, grouped (Navigation / Card actions / Board / Global), rendered
// inside the shared Modal. Every shortcut renders through the Windows-native
// <Kbd> primitive so caps show Ctrl/Alt/etc. on Windows and ⌘/⌥ on macOS.
//
// Presentational and props-driven only — owns no state, wires to no store.

import { type ReactNode } from "react";
import { Modal } from "../common/Modal";
import { Kbd } from "../common/Kbd";

interface Shortcut {
  /** Human description shown on the left. */
  desc: string;
  /** One or more keycaps shown on the right (e.g. "j" and "↓" for the same row). */
  keys: ReactNode;
}

interface Section {
  title: string;
  rows: Shortcut[];
}

/** Two alternative keycaps for one action, joined by a muted "or". */
function OneOf({ children }: { children: ReactNode }) {
  return <span className="tracker-shortcuts__alts">{children}</span>;
}

function Or() {
  return (
    <span className="tracker-shortcuts__or" aria-hidden>
      or
    </span>
  );
}

const SECTIONS: Section[] = [
  {
    title: "Navigation",
    rows: [
      {
        desc: "Focus next card",
        keys: (
          <OneOf>
            <Kbd>j</Kbd>
            <Or />
            <Kbd keys="down" />
          </OneOf>
        ),
      },
      {
        desc: "Focus previous card",
        keys: (
          <OneOf>
            <Kbd>k</Kbd>
            <Or />
            <Kbd keys="up" />
          </OneOf>
        ),
      },
      {
        desc: "Move focus across columns",
        keys: (
          <OneOf>
            <Kbd>h</Kbd>
            <Or />
            <Kbd keys="left" />
            <Or />
            <Kbd>l</Kbd>
            <Or />
            <Kbd keys="right" />
          </OneOf>
        ),
      },
      { desc: "Open focused card", keys: <Kbd keys="enter" /> },
    ],
  },
  {
    title: "Card actions",
    rows: [
      { desc: "Move card to previous column", keys: <Kbd>[</Kbd> },
      { desc: "Move card to next column", keys: <Kbd>]</Kbd> },
      { desc: "Toggle Blocked", keys: <Kbd>b</Kbd> },
      { desc: "Toggle Reviewing", keys: <Kbd>r</Kbd> },
    ],
  },
  {
    title: "Board",
    rows: [
      { desc: "New issue", keys: <Kbd>n</Kbd> },
      { desc: "Focus filter", keys: <Kbd>/</Kbd> },
      { desc: "Toggle cancelled", keys: <Kbd>c</Kbd> },
      {
        desc: "Sync all",
        keys: (
          <OneOf>
            <Kbd>g</Kbd>
            <span className="tracker-shortcuts__then" aria-hidden>
              then
            </span>
            <Kbd>s</Kbd>
          </OneOf>
        ),
      },
    ],
  },
  {
    title: "Global",
    rows: [
      { desc: "Command palette", keys: <Kbd keys="mod+k" /> },
      { desc: "This sheet", keys: <Kbd>?</Kbd> },
      { desc: "Close", keys: <Kbd keys="esc" /> },
    ],
  },
];

export interface ShortcutsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsSheet({ open, onClose }: ShortcutsSheetProps) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Keyboard shortcuts" size="md">
      <div className="tracker-shortcuts">
        <header className="tracker-shortcuts__head">
          <span className="tracker-shortcuts__eyebrow">Keyboard shortcuts</span>
        </header>

        <div className="tracker-shortcuts__grid">
          {SECTIONS.map((section) => (
            <section className="tracker-shortcuts__section" key={section.title}>
              <h3 className="tracker-shortcuts__title">{section.title}</h3>
              <dl className="tracker-shortcuts__rows">
                {section.rows.map((row, i) => (
                  <div className="tracker-shortcuts__row" key={i}>
                    <dt className="tracker-shortcuts__desc">{row.desc}</dt>
                    <dd className="tracker-shortcuts__keys">{row.keys}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}
