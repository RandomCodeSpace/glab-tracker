import { useState } from "react";

export interface ComposerProps {
  onCreate: (input: { title: string; description: string }) => Promise<void>;
  onCancel: () => void;
}

export function NewIssueComposer({ onCreate, onCancel }: ComposerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim() || busy) return;
    setBusy(true);
    try { await onCreate({ title: title.trim(), description }); }
    finally { setBusy(false); }
  }

  return (
    <div className="tracker-composer">
      <div className="tracker-composer__label">New issue · side</div>
      <input
        autoFocus
        className="tracker-composer__title"
        placeholder="What needs doing?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="tracker-composer__desc"
        placeholder="Add a description…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="tracker-composer__row">
        <span className="tracker-composer__state">To do</span>
        <span className="tracker-composer__grow" />
        <button type="button" className="tracker-composer__cancel" onClick={onCancel}>Cancel</button>
        <button type="button" className="tracker-composer__create" disabled={!title.trim() || busy} onClick={submit}>
          {busy ? "Creating…" : "Create"}
        </button>
      </div>
    </div>
  );
}
