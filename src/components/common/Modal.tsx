// Modal — shared scrim + panel shell rendered via portal. The single overlay
// primitive behind the composer, confirm dialogs, command palette, and
// shortcuts sheet: it owns the scrim, focus trap + restore, Esc / scrim-click
// close, body-scroll lock, and enter/exit transitions.
//
// Because it portals to document.body (outside the .tracker root), the portal
// container carries the `tracker` class so design tokens resolve.

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "../../hooks/useFocusTrap";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** id of the element labelling the dialog (e.g. a heading). */
  labelledBy?: string;
  /** Accessible name when there is no visible labelling element. */
  ariaLabel?: string;
  size?: "sm" | "md" | "lg";
  variant?: "center" | "sheet";
  /** Element to focus when the modal opens; falls back to first focusable. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
}

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  ariaLabel,
  size = "md",
  variant = "center",
  initialFocusRef,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // `mounted` keeps the modal in the DOM through its exit transition.
  const [mounted, setMounted] = useState(open);
  // `visible` drives the open/closed data-state used by the CSS transitions.
  const [visible, setVisible] = useState(false);

  useFocusTrap(panelRef, mounted);

  // Mount on open; on close start the exit transition, then unmount.
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), 240);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  // Once mounted, flip to visible on the next frame so the enter transition runs.
  useEffect(() => {
    if (!mounted || !open) return;
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [mounted, open]);

  // Lock body scroll while mounted.
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  // Initial focus once visible.
  useEffect(() => {
    if (!visible) return;
    const target =
      initialFocusRef?.current ??
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      panelRef.current;
    target?.focus();
  }, [visible, initialFocusRef]);

  // Esc closes.
  useEffect(() => {
    if (!mounted) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [mounted, onClose]);

  if (!mounted) return null;

  const state = visible ? "open" : "closed";
  const panelCls = ["tracker-modal__panel", className].filter(Boolean).join(" ");

  return createPortal(
    <div className="tracker" data-modal-portal>
      <div
        className="tracker-modal"
        data-variant={variant}
        data-state={state}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={panelRef}
          className={panelCls}
          data-size={size}
          data-variant={variant}
          data-state={state}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-label={labelledBy ? undefined : ariaLabel}
          tabIndex={-1}
        >
          {variant === "sheet" && (
            <div className="tracker-modal__grab" aria-hidden />
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
