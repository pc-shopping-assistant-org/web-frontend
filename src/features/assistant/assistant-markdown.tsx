import {useTranslations} from "next-intl";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {Link} from "@/i18n/navigation";
import styles from "./assistant-markdown.module.css";
import type {AssistantProduct} from "./models";
import {productMentions} from "./product-mentions";

/** Render model Markdown prose with inline catalog product links; cards live in a separate shelf. */
export function AssistantMarkdown({children, products = []}: {children: string; products?: AssistantProduct[]}) {
  const t = useTranslations("assistant");
  return (
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
                  className="-mx-0.5 inline rounded px-1 py-0.5 font-medium text-primary underline decoration-primary/35 underline-offset-3 transition-colors hover:bg-primary/10 hover:decoration-primary"
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
  );
}
