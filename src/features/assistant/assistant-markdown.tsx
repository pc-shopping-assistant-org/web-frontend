import {useTranslations} from "next-intl";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import styles from "./assistant-markdown.module.css";

/** Display model text only; product/build cards remain separate typed UI. */
export function AssistantMarkdown({children}: {children: string}) {
  const t = useTranslations("assistant");
  return (
    <div className={styles.content}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
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
