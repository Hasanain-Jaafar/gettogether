import { Link } from "@/i18n/navigation";

const HASHTAG_RE = /#(\w+)/g;

export function linkifyHashtags(content: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of content.matchAll(HASHTAG_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      nodes.push(content.slice(lastIndex, start));
    }
    const tag = match[1];
    nodes.push(
      <Link
        key={`h-${key++}`}
        href={`/dashboard?hashtag=${encodeURIComponent(tag)}`}
        className="text-primary hover:underline"
      >
        #{tag}
      </Link>,
    );
    lastIndex = start + match[0].length;
  }
  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }
  return nodes;
}
