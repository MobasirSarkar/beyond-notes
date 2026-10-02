import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import type { ComponentProps } from "react";

function SafeLink({ href, children }: ComponentProps<"a">) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  );
}

const COMPONENTS = { a: SafeLink };

/**
 * Safe Markdown renderer: GFM support, HTML sanitised by rehype-sanitize
 * (GitHub's allow-list), raw HTML never executed, links hardened.
 */
export function Markdown({ source }: { source: string }) {
  return (
    <div className="prose-term">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={COMPONENTS}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
