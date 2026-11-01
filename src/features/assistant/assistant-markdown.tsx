import {useTranslations} from "next-intl";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import styles from "./assistant-markdown.module.css";
import {AssistantProductCard} from "./components/assistant-product-card";
import type {AssistantProduct} from "./models";
import {productMentions} from "./product-mentions";

/** Display model text only; product/build cards remain separate typed UI. */
export function AssistantMarkdown({children, products = [], onAskAboutProduct}: {children: string; products?: AssistantProduct[]; onAskAboutProduct?: (id: string) => void}) {
  const t = useTranslations("assistant");
  return (
    <div className={styles.content}>
      <Markdown
        remarkPlugins={[remarkGfm, productMentions(products)]}
        skipHtml
        components={{
          p: ({node, children}) => {
            const indexes = node?.properties["data-products"];
            const selected = typeof indexes === "string" ? indexes.split(",").map((index) => products[Number(index)]).filter(Boolean) : [];
            return <>
              {children ? <p>{children}</p> : null}
              {selected.length ? <div className="my-3 grid min-w-0 gap-3 sm:grid-cols-2" data-product-cards>
                {selected.map((product) => <AssistantProductCard key={product.id ?? product.product_id ?? product.name} product={product} onAskAboutProduct={onAskAboutProduct} />)}
              </div> : null}
            </>;
          },
          a: ({href, children}) => {
            if (!href) return <>{children}</>;
            const external = /^https?:\/\//i.test(href) || href.startsWith("//");
            return (
              <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
                {children}
              </a>
            );
          },
          // Catalog images come from validated product cards, not model URLs.
          img: ({alt}) => alt ? <span>{alt}</span> : null,
          table: ({children}) => (
            <div className={styles.tableScroll} role="region" aria-label={t("answerTable")} tabIndex={0}>
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
