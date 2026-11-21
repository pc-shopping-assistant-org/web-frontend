import type {AssistantProduct} from "./models";

type MarkdownNode = {
  type: string;
  value?: string;
  url?: string;
  children?: MarkdownNode[];
  data?: {hProperties?: Record<string, unknown>};
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function linkifyMentions(node: MarkdownNode, linkables: {name: string; href: string; pattern: RegExp}[]) {
  if (!node.children?.length || node.type === "link" || node.type === "code" || node.type === "inlineCode") return;
  const nextChildren: MarkdownNode[] = [];
  for (const child of node.children) {
    if (child.type === "text" && child.value) {
      let segments: MarkdownNode[] = [child];
      for (const item of linkables) {
        const updated: MarkdownNode[] = [];
        for (const segment of segments) {
          if (segment.type !== "text" || !segment.value) {
            updated.push(segment);
            continue;
          }
          let lastIndex = 0;
          let match: RegExpExecArray | null;
          item.pattern.lastIndex = 0;
          while ((match = item.pattern.exec(segment.value)) !== null) {
            if (match.index > lastIndex) {
              updated.push({type: "text", value: segment.value.slice(lastIndex, match.index)});
            }
            updated.push({
              type: "link",
              url: item.href,
              children: [{type: "text", value: match[0]}],
            });
            lastIndex = match.index + match[0].length;
          }
          if (lastIndex === 0) {
            updated.push(segment);
          } else if (lastIndex < segment.value.length) {
            updated.push({type: "text", value: segment.value.slice(lastIndex)});
          }
        }
        segments = updated;
      }
      nextChildren.push(...segments);
    } else {
      linkifyMentions(child, linkables);
      nextChildren.push(child);
    }
  }
  node.children = nextChildren;
}

/** Link mentioned catalog products inline inside markdown text. */
export function productMentions(products: AssistantProduct[]) {
  return () => (tree: MarkdownNode) => {
    const linkables = products
      .filter((product): product is AssistantProduct & {seo_name: string} => Boolean(product.name?.trim() && product.seo_name?.trim()))
      .sort((a, b) => b.name.length - a.name.length)
      .map((product) => ({
        name: product.name.trim(),
        href: `/products/${encodeURIComponent(product.seo_name.trim())}`,
        pattern: new RegExp(escapeRegExp(product.name.trim()), "gi"),
      }));
    if (linkables.length) linkifyMentions(tree, linkables);
  };
}
