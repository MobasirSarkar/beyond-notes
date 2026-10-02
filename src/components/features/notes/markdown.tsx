import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

function SafeLink({ href, children }: ComponentProps<"a">) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  );
}

const COMPONENTS = { a: SafeLink };
const REMARK = [remarkGfm];
const REHYPE = [rehypeSanitize];

/** Safe Markdown: GFM, HTML sanitised by rehype-sanitize, hardened links. */
export function Markdown({ source }: { source: string }) {
  return (
    <div className="prose-ascii">
      <ReactMarkdown remarkPlugins={REMARK} rehypePlugins={REHYPE} components={COMPONENTS}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
