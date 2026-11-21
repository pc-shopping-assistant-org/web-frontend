import {useTranslations} from "next-intl";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {Link} from "@/i18n/navigation";
import styles from "./assistant-markdown.module.css";
import {AssistantProductCarousel} from "./components/assistant-product-carousel";
import type {AssistantProduct} from "./models";
import {productMentions} from "./product-mentions";

/** Display model text only; product/build cards remain separate typed UI. */
export function AssistantMarkdown({children, products = [], onAskAboutProduct}: {children: string; products?: AssistantProduct[]; onAskAboutProduct?: (id: string) => void}) {
  const t = useTranslations("assistant");
  return (
    <div>
      <div className={styles.content}>
        <Markdown
          remarkPlugins={[remarkGfm, productMentions(products)]}
          skipHtml
          components={{
            a: ({href, children}) => {
              if (!href) return <>{children}</>;
              if (href.startsWith("/products/")) {
                return (
                  <Link
                    href={href}
                    className="font-medium text-primary underline decoration-primary/40 underline-offset-2 transition hover:decoration-primary"
                  >
                    {children}
                  </Link>
                );
              }
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
      <AssistantProductCarousel products={products} onAskAboutProduct={onAskAboutProduct} />
    </div>
  );
}
