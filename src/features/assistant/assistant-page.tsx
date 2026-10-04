"use client";

import {ArrowRight, ArrowUpRight, Bot, Check, MessageCircle, PackageSearch, Search, Sparkles, X} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import Image from "next/image";
import {useEffect, useRef, useState, type FormEvent} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Skeleton} from "@/components/ui/skeleton";
import {Textarea} from "@/components/ui/textarea";
import {Link} from "@/i18n/navigation";
import {formatMoney} from "@/lib/format";
import {useProducts} from "@/features/catalog/queries";
import {CatalogCategoryIcon} from "@/features/catalog/components/catalog-category-icon";
import {compare, evaluate, streamChat, type ChatData, type CompareData, type ConsultData, type EvaluateData, type SearchData} from "./api";

type Result = ChatData | SearchData | ConsultData | CompareData | EvaluateData;
type ChatTurn = {prompt: string; response: Result};

export function AssistantPage({initialProductIds = [], initialPrompt = "", invalidBuild = false}: {initialProductIds?: string[]; initialPrompt?: string; invalidBuild?: boolean}) {
  const t = useTranslations("assistant");
  const common = useTranslations("common");
  const locale = useLocale();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [productIds, setProductIds] = useState<string[]>(initialProductIds);
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [streamingPrompt, setStreamingPrompt] = useState("");
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const streamController = useRef<AbortController | null>(null);

  useEffect(() => () => streamController.current?.abort(), []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (streamController.current || (!prompt.trim() && !productIds.length)) return;
    const submittedPrompt = prompt.trim() || t(productIds.length > 1 ? "defaultCompare" : "defaultEvaluate");
    const controller = new AbortController();
    streamController.current = controller;
    setLoading(true);
    setError(null);
    setStreamingPrompt(submittedPrompt);
    setStreamingAnswer("");
    try {
      let data: Result;
      if (productIds.length > 1) {
        data = await compare(productIds, submittedPrompt);
      } else if (productIds.length === 1) {
        data = await evaluate(productIds[0], submittedPrompt);
      } else {
        const chat = await streamChat(submittedPrompt, conversationId, {
          onStart: id => {if (!controller.signal.aborted) setConversationId(id);},
          onDelta: delta => {if (!controller.signal.aborted) setStreamingAnswer(current => current + delta);},
        }, controller.signal);
        data = chat;
        if (!controller.signal.aborted) setConversationId(chat.conversation_id);
      }
      if (controller.signal.aborted) return;
      setChatTurns(current => [...current, {prompt: submittedPrompt, response: data}]);
      setStreamingPrompt("");
      setStreamingAnswer("");
      setPrompt("");
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause);
        setStreamingPrompt("");
        setStreamingAnswer("");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
      if (streamController.current === controller) streamController.current = null;
    }
  }

  function newConversation() {
    setConversationId(undefined);
    setChatTurns([]);
    setProductIds([]);
    setError(null);
    setPrompt("");
  }

  return (
    <section className="storefront-wrap py-7 sm:py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bot className="size-8" /></span>
          <div><h1 className="text-3xl font-semibold tracking-tight">{t("chatTitle")}</h1><p className="mt-1 text-sm text-muted-foreground">{t("unifiedDescription")}</p></div>
        </div>
        <div className="flex gap-3">
          <Link href="/products" className="inline-flex items-center gap-1 text-sm font-medium text-primary">{t("browseCatalog")}<ArrowUpRight className="size-4" /></Link>
          <Button variant="outline" onClick={newConversation} disabled={loading}>{t("newConversation")}</Button>
        </div>
      </header>

      <div className="rounded-2xl border bg-background shadow-sm">
        {invalidBuild && <p role="alert" className="m-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{t("invalidBuild")}</p>}
        <div className="min-h-64 space-y-5 p-4 sm:p-6" aria-live="polite">
          {chatTurns.length ? <ChatTranscript turns={chatTurns} locale={locale} /> : !streamingPrompt ? (
            <div className="flex min-h-60 flex-col items-center justify-center gap-4 text-center">
              <Sparkles className="size-9 text-primary" />
              <h2 className="text-xl font-semibold">{t("chatWelcome")}</h2>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">{t("unifiedDescription")}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["suggestionLaptop", "suggestionBuild", "suggestionCompare"].map(key => <button key={key} className="rounded-xl border bg-muted/30 px-4 py-3 text-sm hover:border-primary/40" onClick={() => setPrompt(t(key))}>{t(key)}</button>)}
              </div>
            </div>
          ) : null}
          {streamingPrompt ? <StreamingChatTurn prompt={streamingPrompt} answer={streamingAnswer} /> : null}
          {error ? <ErrorMessage error={error} /> : null}
        </div>

        <form onSubmit={event => void submit(event)} className="border-t bg-muted/15 p-4 sm:p-6">
          <fieldset disabled={loading}>
            <details className="mb-4 rounded-xl border bg-background p-3" open={productIds.length > 0 || undefined}>
              <summary className="cursor-pointer text-sm font-medium">{t("attachProducts")}{productIds.length ? ` (${productIds.length}/5)` : ""}</summary>
              <p className="mb-3 mt-2 text-xs leading-5 text-muted-foreground">{t("attachmentHint")}</p>
              <ProductPicker value={productIds} onChange={setProductIds} locale={locale} />
            </details>
            <Textarea aria-label={t("promptLabel")} value={prompt} onChange={event => setPrompt(event.target.value)} placeholder={t("unifiedPlaceholder")} rows={3} maxLength={productIds.length ? 1000 : 4000} className="min-h-24 resize-y rounded-xl bg-background p-4 text-base" />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs leading-5 text-muted-foreground">{t("catalogGroundedHint")}</p>
              <Button type="submit" className="h-11 min-w-28" disabled={loading || (!prompt.trim() && !productIds.length)}>{loading ? common("loading") : t("send")}<ArrowRight className="size-4" /></Button>
            </div>
          </fieldset>
        </form>
      </div>
    </section>
  );
}

function ProductPicker({
  value,
  onChange,
  locale,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  locale: string;
}) {
  const t = useTranslations("assistant");
  const [keyword, setKeyword] = useState("");
  const products = useProducts({ limit: 100 });
  const max = 5;
  const allProducts = products.data?.items ?? [];
  const visibleProducts = allProducts.filter((product) =>
    [product.name, product.brandName, product.categoryName]
      .filter(Boolean)
      .some((value) =>
        value!.toLowerCase().includes(keyword.trim().toLowerCase()),
      ),
  );
  const selectedProducts = allProducts.filter(
    (product) => product.id && value.includes(product.id),
  );

  function toggle(productId: string) {
    if (value.includes(productId)) {
      onChange(value.filter((id) => id !== productId));
    } else if (value.length < max) {
      onChange([...value, productId]);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <PackageSearch className="size-4 text-primary" />
            {t("productPickerTitle")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("attachmentHint")}
          </p>
        </div>
        <Badge className="bg-background">
          {t("selectedCount", { count: value.length, max })}
        </Badge>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={t("searchCatalogProducts")}
        />
      </div>
      {products.isPending ? (
        <Skeleton className="h-28 rounded-xl" />
      ) : products.isError ? (
        <ErrorMessage error={products.error} />
      ) : visibleProducts.length === 0 ? (
        <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
          {t("noCatalogProducts")}
        </p>
      ) : (
        <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
          {visibleProducts.map((product, index) => {
            if (!product.id) return null;
            const selected = value.includes(product.id);
            const disabled = !selected && value.length >= max;
            return (
              <button
                key={product.id ?? index}
                type="button"
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : disabled
                      ? "cursor-not-allowed opacity-50"
                      : "hover:border-primary/40 hover:bg-background"
                }`}
                onClick={() => toggle(product.id!)}
                disabled={disabled}
                aria-pressed={selected}
              >
                <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background text-primary">
                  {selected ? (
                    <Check className="size-4" />
                  ) : product.imageUrl ? (
                    <Image src={product.imageUrl} alt="" fill sizes="36px" unoptimized className="object-contain p-1" />
                  ) : (
                    <CatalogCategoryIcon categoryName={product.categoryName ?? product.name} className="size-4.5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {product.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {formatMoney(product.minPrice ?? product.maxPrice, locale)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      {value.length ? (
        <div className="flex flex-wrap gap-2" aria-label={t("selectedProducts")}>
          {value.map((id) => {
            const product = selectedProducts.find((item) => item.id === id);
            return (
              <span
                key={id}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs"
              >
                <span className="max-w-56 truncate">
                  {product?.name ?? id}
                </span>
                <button
                  type="button"
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => onChange(value.filter((item) => item !== id))}
                  aria-label={`${t("removeProduct")}: ${product?.name ?? id}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function AssistantResult({
  result,
  locale,
  hideAnswer = false,
}: {
  result: Result;
  locale: string;
  hideAnswer?: boolean;
}) {
  const t = useTranslations("assistant");
  const answer = "answer" in result ? result.answer : undefined;
  const products =
    "products" in result
      ? result.products ?? []
      : "product" in result && result.product
        ? [result.product]
        : [];
  const isComparison = products.some((product) => "product_id" in product);
  const comparisonKeys = isComparison
    ? Array.from(
        new Set(
          products.flatMap((product) =>
            Object.keys(product.specifications ?? {}),
          ),
        ),
      ).slice(0, 12)
    : [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("response")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!hideAnswer ? (
          <p className="whitespace-pre-wrap leading-7">
            {answer ?? t("noAnswer")}
          </p>
        ) : null}
        {isComparison && comparisonKeys.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">{t("comparisonTable")}</caption>
              <thead className="bg-muted/50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">{t("specification")}</th>
                  {products.map((product, index) => (
                    <th key={"product_id" in product ? product.product_id ?? index : index} className="min-w-44 px-4 py-3 font-semibold">
                      {product.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {comparisonKeys.map((key) => (
                  <tr key={key}>
                    <th className="whitespace-nowrap bg-muted/20 px-4 py-3 font-medium text-muted-foreground">{formatSpecLabel(key)}</th>
                    {products.map((product, index) => (
                      <td key={`${key}-${index}`} className="px-4 py-3 align-top">{formatSpecValue(product.specifications?.[key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {products.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((product, index) => {
              const id =
                "id" in product
                  ? product.id
                  : "product_id" in product
                    ? product.product_id
                    : undefined;
              const slug = "seo_name" in product ? product.seo_name : undefined;
              const specs = Object.entries(product.specifications ?? {}).slice(0, 3);
              return (
                <div key={id ?? index} className="overflow-hidden rounded-xl border bg-background transition hover:border-primary/30 hover:shadow-md">
                  <div className="flex gap-4 border-b bg-muted/20 p-4">
                    <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background text-primary/50">
                      {product.image_url ? <Image src={product.image_url} alt="" fill sizes="64px" unoptimized className="object-contain p-2" /> : <CatalogCategoryIcon categoryName={product.name} className="size-7 text-primary/65" strokeWidth={1.45} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 font-medium">{product.name}</p>
                        <Check className="size-4 shrink-0 text-emerald-600" />
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {product.description ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                  <p className="mt-3 font-semibold">
                    {formatMoney(product.list_price, locale)}
                  </p>
                  {specs.length > 0 ? <dl className="space-y-1.5 text-xs text-muted-foreground">{specs.map(([key, value]) => <div key={key} className="flex justify-between gap-3"><dt>{formatSpecLabel(key)}</dt><dd className="max-w-[60%] truncate text-right font-medium text-foreground">{formatSpecValue(value)}</dd></div>)}</dl> : null}
                  {id && slug ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/products/${slug}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/85"
                      >
                        {t("viewProduct")}
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                      <Link
                        href={`/assistant?productId=${encodeURIComponent(id)}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                      >
                        <Sparkles className="size-3.5" />
                        {t("askAboutProduct")}
                      </Link>
                    </div>
                  ) : id ? (
                    <Link
                      href={`/assistant?productId=${encodeURIComponent(id)}`}
                      className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                    >
                      <Sparkles className="size-3.5" />
                      {t("askAboutProduct")}
                    </Link>
                  ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ChatTranscript({turns, locale}: {turns: ChatTurn[]; locale: string}) {
  const t = useTranslations("assistant");
  return (
    <Card className="overflow-hidden border-primary/15">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="size-5 text-primary" />
          {t("conversation")}
          <Badge className="ml-auto bg-background">
            {turns.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        {turns.map((turn, index) => (
          <div key={index} className="space-y-3">
            <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground sm:max-w-[75%]">
              <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">
                {t("you")}
              </p>
              <p className="whitespace-pre-wrap">{turn.prompt}</p>
            </div>
            <div className="max-w-[95%] rounded-2xl rounded-bl-md border bg-background px-4 py-3 text-sm leading-6 sm:max-w-[85%]">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Bot className="size-3.5 text-primary" />
                {t("assistantLabel")}
                {"intent" in turn.response && turn.response.intent ? (
                  <Badge className="px-1.5 py-0 text-[0.62rem] normal-case tracking-normal">
                    {turn.response.intent}
                  </Badge>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap">{"answer" in turn.response ? turn.response.answer : t("noAnswer")}</p>
            </div>
            {("products" in turn.response && turn.response.products?.length) || ("product" in turn.response && turn.response.product) ? (
              <div className="ml-0 sm:ml-4">
                <AssistantResult result={turn.response} locale={locale} hideAnswer />
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StreamingChatTurn({prompt, answer}: {prompt: string; answer: string}) {
  const t = useTranslations("assistant");
  return (
    <Card className="overflow-hidden border-primary/15">
      <CardContent className="space-y-3 p-4 sm:p-6">
        <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground sm:max-w-[75%]">
          <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">
            {t("you")}
          </p>
          <p className="whitespace-pre-wrap">{prompt}</p>
        </div>
        <div className="max-w-[95%] rounded-2xl rounded-bl-md border bg-background px-4 py-3 text-sm leading-6 sm:max-w-[85%]">
          <div className="mb-1 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Bot className="size-3.5 text-primary" />
            {t("assistantLabel")}
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          </div>
          <p className="whitespace-pre-wrap">
            {answer || t("streaming")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatSpecLabel(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatSpecValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatSpecValue).join(" · ");
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value) ?? "—";
  return String(value);
}
