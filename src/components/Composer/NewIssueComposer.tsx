import { useState } from "react";
import type { GitLabLabel } from "../../types/gitlab";
import { Chip, AddChip } from "../Chip";
import { hueFromName, classifyLabel } from "../../data/labels";
import { MarkdownField } from "../common/MarkdownField";
import { Kbd } from "../common/Kbd";

export interface ComposerProps {
  allLabels: GitLabLabel[];
  onCreate: (input: { title: string; description: string; labels: string[] }) => Promise<void>;
  onCreateLabel: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function NewIssueComposer({ allLabels, onCreate, onCreateLabel, onCancel }: ComposerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [labels, setLabels] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");

  const userLabels = allLabels.filter((l) => classifyLabel(l.name).kind === "user");

  const toggle = (name: string) => {
    setLabels((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const createInline = async () => {
    const name = draft.trim();
    if (!name) return;
    await onCreateLabel(name);
    setLabels((prev) => new Set(prev).add(name));
    setDraft("");
    setCreating(false);
  };

  const submit = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try { await onCreate({ title: title.trim(), description, labels: Array.from(labels) }); }
    finally { setBusy(false); }
  };

  return (
    <div
      className="tracker-composer"
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void submit(); }
        else if (e.key === "Escape") { e.preventDefault(); onCancel(); }
      }}
    >
      <div className="tracker-composer__label">New issue · side</div>
      <input
        autoFocus
        className="tracker-composer__title"
        placeholder="What needs doing?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <MarkdownField
        value={description}
        onChange={setDescription}
        placeholder="Add a description…"
        ariaLabel="Issue description"
        minRows={4}
      />
      <div className="tracker-composer__labels">
        {userLabels.map((l) => (
          <Chip
            key={l.name}
            name={l.name}
            hue={hueFromName(l.name)}
            selected={labels.has(l.name)}
            onClick={() => toggle(l.name)}
          />
        ))}
        {creating ? (
          <input
            autoFocus
            type="text"
            className="tracker-composer__newlabel"
            placeholder="Label name"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); void createInline(); }
              else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setDraft(""); setCreating(false); }
            }}
            onBlur={() => { if (!draft.trim()) setCreating(false); }}
          />
        ) : (
          <AddChip label="+ Label" onClick={() => setCreating(true)} />
        )}
      </div>
      <div className="tracker-composer__row">
        <span className="tracker-composer__state">To do</span>
        <span className="tracker-composer__grow" />
        <button type="button" className="tracker-btn tracker-btn--ghost" onClick={onCancel}>
          Cancel
          <Kbd keys="esc" />
        </button>
        <button type="button" className="tracker-btn tracker-btn--primary" disabled={!title.trim() || busy} onClick={submit}>
          {busy ? "Creating…" : "Create"}
          <Kbd keys="mod+enter" />
        </button>
      </div>
    </div>
  );
}
