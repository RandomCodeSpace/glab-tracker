import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentProps } from "react";

const MD_COMPONENTS: ComponentProps<typeof ReactMarkdown>["components"] = {
  // Strip generated link click-throughs to defang any URL leaks; render as text.
  a: ({ children, href }) => <span data-md-link={href}>{children}</span>,
};

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
      {children}
    </ReactMarkdown>
  );
}
