import type {AssistantProduct} from "./models";

type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  data?: {hProperties?: Record<string, unknown>};
};

const normalized = (text: string) => text.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
const nodeText = (node: MarkdownNode): string => node.value ?? node.children?.map(nodeText).join("") ?? "";

/** Annotate paragraphs from canonical cards; model text never supplies product IDs. */
export function productMentions(products: AssistantProduct[]) {
  return () => (tree: MarkdownNode) => {
    const remaining = new Map(products.map((product, index) => [String(index), product]));
    const visit = (node: MarkdownNode) => {
      if (node.type === "paragraph") {
        const text = normalized(nodeText(node));
        const ids = [...remaining].filter(([, product]) => text.includes(normalized(product.name))).map(([id]) => id);
        if (ids.length) {
          node.data = {...node.data, hProperties: {...node.data?.hProperties, "data-products": ids.join(",")}};
          ids.forEach((id) => remaining.delete(id));
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
    if (remaining.size) tree.children?.push({type: "paragraph", children: [], data: {hProperties: {"data-products": [...remaining.keys()].join(",")}}});
  };
}
