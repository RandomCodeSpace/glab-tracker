import { useState, type KeyboardEvent } from "react";
import { Icon } from "../Icon";

export interface PasteInputProps {
  onSubmit: (url: string) => void;
}

export function PasteInput({ onSubmit }: PasteInputProps) {
  const [value, setValue] = useState("");
  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
  };
  return (
    <label className="tracker-paste">
      <Icon name="link-external" size={14} aria-hidden />
      <input
        value={value}
        placeholder="Paste a GitLab issue URL to fork…"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        type="url"
      />
    </label>
  );
}
