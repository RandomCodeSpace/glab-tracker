import { useState } from "react";
import { MarkdownField } from "../common/MarkdownField";

export interface DrawerProseProps {
  title: string;
  description: string;
  onEditTitle: (title: string) => void;
  onEditDescription: (md: string) => void;
}

export function DrawerProse({ title, description, onEditTitle, onEditDescription }: DrawerProseProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDesc, setDraftDesc] = useState(description);
  const [savedDesc, setSavedDesc] = useState(false);

  return (
    <div className="tracker-drawer__prose-wrap">
      {editingTitle ? (
        <input
          autoFocus
          className="tracker-drawer__title-input"
          aria-label="Issue title"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={() => { onEditTitle(draftTitle); setEditingTitle(false); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
            if (e.key === "Escape") { e.stopPropagation(); setDraftTitle(title); setEditingTitle(false); }
          }}
        />
      ) : (
        <h1 className="tracker-drawer__title" onClick={() => { setDraftTitle(title); setEditingTitle(true); }}>
          {title}
        </h1>
      )}

      <MarkdownField
        value={draftDesc}
        onChange={(v) => { setDraftDesc(v); setSavedDesc(false); }}
        onBlur={() => {
          if (draftDesc !== description) {
            onEditDescription(draftDesc);
            setSavedDesc(true);
          }
        }}
        placeholder="Describe this issue…"
        ariaLabel="Issue description"
        minRows={4}
        submitHint={savedDesc ? <span className="tracker-drawer__saved">saved</span> : undefined}
      />
    </div>
  );
}
