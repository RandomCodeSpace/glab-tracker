// CommandPalette — the hero IDE element (Ctrl+K). A purely props-driven,
// presentational command launcher rendered inside the shared <Modal>, which
// owns the scrim, Esc, focus-trap, body-scroll lock, and portal.
//
// It fuzzy-filters (case-insensitive substring) over two sources:
//   • commands  — matched on label + keywords + group, grouped by `group`
//   • issues    — matched on title + "#"+iid, shown under a "Jump to" group
// Up/Down move the active row (wrapping), Enter runs it, mouse hover/click
// selects/runs. No store access, no network — the host wires `run`/`onJumpToIssue`.

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Modal } from "../common/Modal";
import { Kbd } from "../common/Kbd";
import { Icon, type IconName } from "../Icon";

export interface CommandItem {
  id: string;
  group: string; // e.g. "Card", "Board", "Session"
  label: string; // e.g. "Set state: Done"
  hint?: string; // optional right-aligned mono hint text
  icon?: IconName;
  keywords?: string; // extra fuzzy-match text
  run: () => void; // performs the action; palette closes itself afterward
}

export interface CommandIssue {
  iid: number;
  title: string;
  state: string;
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
  issues: CommandIssue[]; // for the "jump to card" search section
  onJumpToIssue: (iid: number) => void; // open that card's drawer
}

const JUMP_GROUP = "Jump to";

// A flattened, selectable row. Rows are rendered grouped, but kept in one
// ordered array so a single `active` index drives keyboard navigation and
// aria-activedescendant across every group.
type Row =
  | {
      kind: "command";
      key: string;
      group: string;
      command: CommandItem;
      // [start, end) of the matched substring in `label`, or null.
      match: [number, number] | null;
    }
  | {
      kind: "issue";
      key: string;
      group: string;
      issue: CommandIssue;
      // matched substring range within the displayed "#<iid> <title>" string.
      match: [number, number] | null;
    };

const norm = (s: string) => s.toLowerCase();

/** Case-insensitive substring index of `q` in `text`, or -1. */
function indexOfCI(text: string, q: string): number {
  if (!q) return -1;
  return norm(text).indexOf(norm(q));
}

/** Split `text` into [before, hit, after] around [start, end), for highlight. */
function splitMatch(
  text: string,
  range: [number, number] | null,
): ReactNode {
  if (!range) return text;
  const [start, end] = range;
  return (
    <>
      {text.slice(0, start)}
      <mark className="tracker-command__hit">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

export function CommandPalette({
  open,
  onClose,
  commands,
  issues,
  onJumpToIssue,
}: CommandPaletteProps): ReactElement | null {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset query + selection each time the palette opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const q = query.trim();

  // Build the flattened, grouped row list for the current query.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];

    // Issues only surface once the user is searching — an empty query shows a
    // clean all-commands list, not the entire backlog.
    if (q) {
      for (const issue of issues) {
        const display = `#${issue.iid} ${issue.title}`;
        const titleIdx = indexOfCI(issue.title, q);
        const idIdx = indexOfCI(`#${issue.iid}`, q);
        if (titleIdx === -1 && idIdx === -1) continue;
        // Prefer highlighting the title hit; offset by the "#<iid> " prefix.
        const prefixLen = `#${issue.iid} `.length;
        const match: [number, number] | null =
          titleIdx !== -1
            ? [prefixLen + titleIdx, prefixLen + titleIdx + q.length]
            : idIdx !== -1
              ? [idIdx, idIdx + q.length]
              : null;
        out.push({
          kind: "issue",
          key: `issue-${issue.iid}`,
          group: JUMP_GROUP,
          issue,
          match: match && match[0] < display.length ? match : null,
        });
      }
    }

    for (const command of commands) {
      let match: [number, number] | null = null;
      if (q) {
        const labelIdx = indexOfCI(command.label, q);
        if (labelIdx !== -1) {
          match = [labelIdx, labelIdx + q.length];
        } else {
          // Match against keywords + group too, but only highlight the label.
          const haystack = `${command.label} ${command.keywords ?? ""} ${command.group}`;
          if (indexOfCI(haystack, q) === -1) continue;
        }
      }
      out.push({
        kind: "command",
        key: `cmd-${command.id}`,
        group: command.group,
        command,
        match,
      });
    }

    return out;
  }, [q, commands, issues]);

  // Group rows in render order while preserving each row's flat index.
  const groups = useMemo(() => {
    const order: string[] = [];
    const byGroup = new Map<string, { row: Row; index: number }[]>();
    rows.forEach((row, index) => {
      if (!byGroup.has(row.group)) {
        byGroup.set(row.group, []);
        order.push(row.group);
      }
      byGroup.get(row.group)!.push({ row, index });
    });
    return order.map((name) => ({ name, items: byGroup.get(name)! }));
  }, [rows]);

  // Clamp the active index whenever the result set changes.
  useEffect(() => {
    setActive((i) => (rows.length === 0 ? 0 : Math.min(i, rows.length - 1)));
  }, [rows.length]);

  // Keep the active row scrolled into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active, rows.length]);

  const activeRow = rows[active];
  const activeId = activeRow ? `tracker-command-row-${activeRow.key}` : undefined;

  const runRow = (row: Row | undefined) => {
    if (!row) return;
    if (row.kind === "command") {
      row.command.run();
    } else {
      onJumpToIssue(row.issue.iid);
    }
    onClose();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (rows.length) setActive((i) => (i + 1) % rows.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rows.length) setActive((i) => (i - 1 + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      runRow(rows[active]);
    }
    // Esc is handled by the shared Modal.
  };

  if (!open) return null;

  const countLabel =
    rows.length === 0
      ? "No results"
      : `${rows.length} result${rows.length === 1 ? "" : "s"}`;

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Command palette" size="md">
      <div className="tracker-command">
        <div className="tracker-command__search">
          <Icon
            name="search"
            size={16}
            className="tracker-command__search-icon"
          />
          <input
            ref={inputRef}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            type="text"
            className="tracker-command__input"
            placeholder="Type a command or search cards…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded
            aria-controls="tracker-command-list"
            aria-activedescendant={activeId}
            aria-label="Command palette search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <Kbd keys="esc" className="tracker-command__esc" />
        </div>

        <div
          ref={listRef}
          id="tracker-command-list"
          className="tracker-command__list"
          role="listbox"
          aria-label="Commands and cards"
        >
          {rows.length === 0 ? (
            <div className="tracker-command__empty">
              No matches for <code>{q}</code>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.name} className="tracker-command__group">
                <div className="tracker-command__group-head" aria-hidden>
                  {group.name}
                </div>
                {group.items.map(({ row, index }) => {
                  const isActive = index === active;
                  const rowCls = `tracker-command__row${isActive ? " is-active" : ""}`;
                  if (row.kind === "issue") {
                    return (
                      <div
                        key={row.key}
                        id={`tracker-command-row-${row.key}`}
                        data-index={index}
                        role="option"
                        aria-selected={isActive}
                        className={rowCls}
                        onMouseMove={() => setActive(index)}
                        onClick={() => runRow(row)}
                      >
                        <span
                          className="tracker-command__iid"
                          aria-hidden
                        >{`#${row.issue.iid}`}</span>
                        <span className="tracker-command__label">
                          {row.match
                            ? splitMatch(
                                `#${row.issue.iid} ${row.issue.title}`,
                                row.match,
                              )
                            : row.issue.title}
                        </span>
                      </div>
                    );
                  }
                  const { command } = row;
                  return (
                    <div
                      key={row.key}
                      id={`tracker-command-row-${row.key}`}
                      data-index={index}
                      role="option"
                      aria-selected={isActive}
                      className={rowCls}
                      onMouseMove={() => setActive(index)}
                      onClick={() => runRow(row)}
                    >
                      <span className="tracker-command__icon" aria-hidden>
                        {command.icon ? (
                          <Icon name={command.icon} size={16} />
                        ) : null}
                      </span>
                      <span className="tracker-command__label">
                        {splitMatch(command.label, row.match)}
                      </span>
                      {command.hint ? (
                        <span className="tracker-command__hint">
                          {command.hint}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div
          className="tracker-command__status"
          role="status"
          aria-live="polite"
        >
          {countLabel}
        </div>
      </div>
    </Modal>
  );
}
