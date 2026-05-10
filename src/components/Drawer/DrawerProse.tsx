import { useState } from "react";
import { Markdown } from "../../utils/markdown";

export interface DrawerProseProps {
  title: string;
  description: string;
  onEditTitle: (title: string) => void;
  onEditDescription: (md: string) => void;
}

export function DrawerProse({ title, description, onEditTitle, onEditDescription }: DrawerProseProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDesc, setDraftDesc] = useState(description);

  return (
    <>
      {editingTitle ? (
        <input
          autoFocus
          className="tracker-drawer__title-input"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={() => { onEditTitle(draftTitle); setEditingTitle(false); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
            if (e.key === "Escape") { setDraftTitle(title); setEditingTitle(false); }
          }}
        />
      ) : (
        <h1 className="tracker-drawer__title" onClick={() => { setDraftTitle(title); setEditingTitle(true); }}>
          {title}
        </h1>
      )}

      {editingDesc ? (
        <textarea
          autoFocus
          className="tracker-drawer__desc-input"
          value={draftDesc}
          onChange={(e) => setDraftDesc(e.target.value)}
          onBlur={() => { onEditDescription(draftDesc); setEditingDesc(false); }}
          onKeyDown={(e) => { if (e.key === "Escape") { setDraftDesc(description); setEditingDesc(false); } }}
        />
      ) : (
        <div className="tracker-drawer__prose" onClick={() => { setDraftDesc(description); setEditingDesc(true); }}>
          {description ? <Markdown>{description}</Markdown> : <em className="tracker-drawer__empty">Add a description…</em>}
        </div>
      )}
    </>
  );
}
