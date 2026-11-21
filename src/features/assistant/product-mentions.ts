import type {AssistantProduct} from "./models";

type MarkdownNode = {
  type: string;
  value?: string;
  url?: string;
  children?: MarkdownNode[];
  data?: {hProperties?: Record<string, unknown>};
};

const normalized = (text: string) => text.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
const nodeText = (node: MarkdownNode): string => node.value ?? node.children?.map(nodeText).join("") ?? "";
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

/** Annotate top-level paragraphs from canonical cards and link mentioned catalog products inline. */
export function productMentions(products: AssistantProduct[]) {
  return () => (tree: MarkdownNode) => {
    const remaining = new Map(products.map((product, index) => [String(index), product]));
    for (const node of tree.children ?? []) {
      if (node.type === "paragraph") {
        const text = normalized(nodeText(node));
        const ids = [...remaining].filter(([, product]) => text.includes(normalized(product.name))).map(([id]) => id);
        if (ids.length) {
          node.data = {...node.data, hProperties: {...node.data?.hProperties, "data-products": ids.join(",")}};
          ids.forEach((id) => remaining.delete(id));
        }
      }
    }
    const linkables = products
      .filter((product): product is AssistantProduct & {seo_name: string} => Boolean(product.name?.trim() && product.seo_name?.trim()))
      .sort((a, b) => b.name.length - a.name.length)
      .map((product) => ({
        name: product.name.trim(),
        href: `/products/${encodeURIComponent(product.seo_name.trim())}`,
        pattern: new RegExp(escapeRegExp(product.name.trim()), "gi"),
      }));
    if (linkables.length) linkifyMentions(tree, linkables);
    if (remaining.size) tree.children?.push({type: "paragraph", children: [], data: {hProperties: {"data-products": [...remaining.keys()].join(",")}}});
  };
}
