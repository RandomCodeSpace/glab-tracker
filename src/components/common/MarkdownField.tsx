// MarkdownField — shared Write/Preview markdown editor used by DrawerProse
// and the new-issue composer. Controlled + presentational: it owns no network
// or store state. "Write" is an auto-growing Sans textarea (borderless until
// focus, --code-bg well on focus); "Preview" renders the current value through
// the existing markdown renderer inside a .tracker-md container.

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Markdown } from "../../utils/markdown";

export interface MarkdownFieldProps {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minRows?: number;
  autoFocus?: boolean;
  ariaLabel?: string;
  /** Hint shown under the field, e.g. a <Kbd> submit hint. */
  submitHint?: ReactNode;
}

type Mode = "write" | "preview";

export function MarkdownField({
  value,
  onChange,
  onBlur,
  placeholder,
  minRows = 3,
  autoFocus = false,
  ariaLabel,
  submitHint,
}: MarkdownFieldProps) {
  const [mode, setMode] = useState<Mode>("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autosize the textarea to its content, never shrinking below minRows.
  // Runs before paint so the field never flickers at the wrong height.
  useLayoutEffect(() => {
    if (mode !== "write") return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, mode, minRows]);

  // Focus the textarea when entering Write mode if requested.
  useEffect(() => {
    if (autoFocus && mode === "write") {
      textareaRef.current?.focus();
    }
  }, [autoFocus, mode]);

  return (
    <div className="tracker-mdfield">
      <div className="tracker-mdfield__toolbar" role="tablist" aria-label="Editor mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "write"}
          className="tracker-mdfield__tab"
          data-active={mode === "write"}
          onClick={() => setMode("write")}
        >
          Write
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "preview"}
          className="tracker-mdfield__tab"
          data-active={mode === "preview"}
          onClick={() => setMode("preview")}
        >
          Preview
        </button>
      </div>

      {mode === "write" ? (
        <textarea
          ref={textareaRef}
          className="tracker-mdfield__textarea"
          value={value}
          rows={minRows}
          placeholder={placeholder}
          aria-label={ariaLabel}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      ) : (
        <div className="tracker-mdfield__preview tracker-md">
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="tracker-mdfield__preview-empty">Nothing to preview.</p>
          )}
        </div>
      )}

      {submitHint && <div className="tracker-mdfield__hint">{submitHint}</div>}
    </div>
  );
}
