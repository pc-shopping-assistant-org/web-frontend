"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  MessageCircle,
  PackageSearch,
  Search,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/format";
import {AiMode} from "@/lib/domain/assistant-enums";

import { useProducts } from "@/features/catalog/queries";
import { CatalogCategoryIcon } from "@/features/catalog/components/catalog-category-icon";
import {
  compare,
  consult,
  evaluate,
  semanticSearch,
  streamChat,
  type ChatData,
  type CompareData,
  type ConsultData,
  type EvaluateData,
  type SearchData,
} from "./api";

type Mode = AiMode;
type Result = ChatData | SearchData | ConsultData | CompareData | EvaluateData;
type ChatTurn = {prompt: string; response: ChatData};

const modes = Object.values(AiMode) as Mode[];

const modeVisuals: Record<Mode, {icon: LucideIcon; tone: string}> = {
  [AiMode.Chat]: {icon: MessageCircle, tone: "bg-blue-500/12 text-blue-700"},
  [AiMode.Search]: {icon: Search, tone: "bg-cyan-500/12 text-cyan-700"},
  [AiMode.Consult]: {icon: Bot, tone: "bg-emerald-500/12 text-emerald-700"},
  [AiMode.Compare]: {icon: Sparkles, tone: "bg-violet-500/12 text-violet-700"},
  [AiMode.Evaluate]: {icon: PackageSearch, tone: "bg-amber-500/12 text-amber-700"},
};

export function AssistantPage() {
  const t = useTranslations("assistant");
  const common = useTranslations("common");
  const locale = useLocale();
  const [mode, setMode] = useState<Mode>(AiMode.Chat);
  const [prompt, setPrompt] = useState("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [streamingPrompt, setStreamingPrompt] = useState("");
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const streamController = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => streamController.current?.abort();
  }, []);

  // Product detail pages can hand a customer into the right AI workflow. Read
  // the query only in the browser so the initial server render stays stable.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const requestedMode = params.get("mode");
      const requestedProductId = params.get("productId");
      const requestedProductIds = params.get("productIds");
      if (isMode(requestedMode)) setMode(requestedMode);
      if (requestedProductIds) {
        setProductIds(
          [...new Set(requestedProductIds.split(",").filter(Boolean))].slice(
            0,
            5,
          ),
        );
      } else if (requestedProductId) {
        setProductIds([requestedProductId]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim() && mode !== AiMode.Compare && mode !== AiMode.Evaluate) return;
    const submittedPrompt = prompt.trim();
    setLoading(true);
    setError(null);
    streamController.current?.abort();
    try {
      if (mode === AiMode.Chat) {
        const controller = new AbortController();
        streamController.current = controller;
        setStreamingPrompt(submittedPrompt);
        setStreamingAnswer("");
        const data = await streamChat(
          submittedPrompt,
          conversationId,
          {
            onStart: (id) => setConversationId(id),
            onDelta: (delta) => setStreamingAnswer((current) => current + delta),
          },
          controller.signal,
        );
        setResult(data);
        setConversationId(data.conversation_id);
        setChatTurns((current) => [
          ...current,
          {prompt: submittedPrompt, response: data},
        ]);
        setStreamingPrompt("");
        setStreamingAnswer("");
        setPrompt("");
      } else {
        let data: Result;
        if (mode === AiMode.Search) data = await semanticSearch(submittedPrompt);
        else if (mode === AiMode.Consult) data = await consult(submittedPrompt);
        else if (mode === AiMode.Compare) {
          data = await compare(productIds, submittedPrompt || undefined);
        } else {
          data = await evaluate(
            productIds[0] ?? submittedPrompt,
            submittedPrompt || undefined,
          );
        }
        setResult(data);
      }
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) {
        setError(cause);
      }
    } finally {
      setLoading(false);
      streamController.current = null;
    }
  }

  const isProductMode = mode === AiMode.Compare || mode === AiMode.Evaluate;
  const isCompare = mode === AiMode.Compare;
  const canSubmit =
    !loading &&
    (!isProductMode ||
      (isCompare ? productIds.length >= 2 : productIds.length === 1));

  const ActiveIcon = modeVisuals[mode].icon;

  return (
    <section className="page-wrap py-8 sm:py-12">
      <div className="relative mb-7 overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-950/10 sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 size-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/15 bg-white/10 text-white">
                <Sparkles className="mr-1.5 size-3.5" />
                {t("eyebrow")}
              </Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
                <span className="size-1.5 rounded-full bg-emerald-300" />
                {t("liveCatalog")}
              </span>
            </div>
            <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              {t("title")}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {t("description")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            <WorkspaceStat value="5" label={t("workflowCount")} />
            <WorkspaceStat value="24/7" label={t("assistantAvailable")} />
            <WorkspaceStat value="LIVE" label={t("groundingLabel")} muted />
            <Link
              href="/products"
              className="group flex min-h-20 items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-medium transition hover:bg-white/15"
            >
              <span>{t("browseCatalog")}</span>
              <ArrowUpRight className="size-4 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("modes")}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t("workspaceTitle")}</h2>
        </div>
        <p className="max-w-md text-right text-sm leading-5 text-muted-foreground">{t("workspaceDescription")}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="h-fit rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              {t("chooseWorkflow")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 p-3">
            {modes.map((value) => {
              const Icon = modeVisuals[value].icon;
              const selected = mode === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-primary/25 bg-primary/7 shadow-sm ring-1 ring-primary/10"
                      : "border-transparent hover:border-border hover:bg-muted/60"
                  }`}
                  onClick={() => {
                    streamController.current?.abort();
                    setMode(value);
                    setResult(null);
                    setError(null);
                    setStreamingPrompt("");
                    setStreamingAnswer("");
                  }}
                  aria-pressed={selected}
                >
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-primary text-primary-foreground" : modeVisuals[value].tone}`}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="block text-sm font-semibold">{t(`mode.${value}.title`)}</span>
                      {selected ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{t(`mode.${value}.description`)}</span>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-5">
          <Card className="overflow-hidden rounded-2xl border-primary/15 shadow-lg shadow-primary/5">
            <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500" />
            <CardContent className="p-5 sm:p-7">
              <form className="space-y-5" onSubmit={(event) => void submit(event)}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`flex size-10 items-center justify-center rounded-2xl ${modeVisuals[mode].tone}`}>
                    <ActiveIcon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("promptLabel")}</p>
                    <p className="mt-0.5 truncate font-semibold">{t(`mode.${mode}.title`)}</p>
                  </div>
                  <Badge className="ml-auto border-primary/15 bg-primary/5 text-primary">{t("catalogGrounded")}</Badge>
                  {conversationId ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                      onClick={() => {
                        streamController.current?.abort();
                        setConversationId(undefined);
                        setChatTurns([]);
                        setResult(null);
                        setStreamingPrompt("");
                        setStreamingAnswer("");
                        setPrompt("");
                      }}
                    >
                      {t("newConversation")}
                    </button>
                  ) : null}
                </div>
                {isProductMode ? (
                  <ProductPicker mode={mode} value={productIds} onChange={setProductIds} locale={locale} />
                ) : null}
                <Textarea
                  className="min-h-32 resize-y rounded-2xl border-border/80 bg-muted/20 p-4 text-base leading-7 shadow-inner focus:bg-background"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={t(`mode.${mode}.placeholder`)}
                  rows={4}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-xl text-xs leading-5 text-muted-foreground">
                    {isCompare ? t("compareHint") : mode === AiMode.Evaluate ? t("evaluateHint") : mode === AiMode.Search ? t("searchHint") : t("catalogGroundedHint")}
                  </p>
                  <Button type="submit" className="min-w-28" disabled={!canSubmit}>
                    {loading ? common("loading") : t("send")}
                    {!loading ? <ArrowRight className="size-4" /> : null}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          {error ? <ErrorMessage error={error} /> : null}
          {mode === AiMode.Chat && (chatTurns.length > 0 || streamingPrompt) ? (
            <>
              {chatTurns.length > 0 ? <ChatTranscript turns={chatTurns} locale={locale} /> : null}
              {streamingPrompt ? (
                <StreamingChatTurn
                  prompt={streamingPrompt}
                  answer={streamingAnswer}
                />
              ) : null}
            </>
          ) : result ? (
            <AssistantResult result={result} locale={locale} />
          ) : (
            <Card className="rounded-2xl border-dashed bg-muted/15">
              <CardContent className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bot className="size-7" />
                </span>
                <div>
                  <p className="font-medium">{t("empty")}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["suggestionLaptop", "suggestionBuild", "suggestionCompare"].map((key) => (
                      <button key={key} type="button" className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5" onClick={() => setPrompt(t(key))}>
                        {t(key)}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

function WorkspaceStat({value, label, muted = false}: {value: string; label: string; muted?: boolean}) {
  return (
    <div className="min-h-20 rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className={`text-xl font-semibold tracking-tight ${muted ? "text-slate-300" : "text-white"}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}

function isMode(value: string | null): value is Mode {
  return value !== null && modes.includes(value as Mode);
}

function ProductPicker({
  mode,
  value,
  onChange,
  locale,
}: {
  mode: AiMode.Compare | AiMode.Evaluate;
  value: string[];
  onChange: (value: string[]) => void;
  locale: string;
}) {
  const t = useTranslations("assistant");
  const [keyword, setKeyword] = useState("");
  const products = useProducts({ limit: 100 });
  const max = mode === AiMode.Compare ? 5 : 1;
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
    if (mode === AiMode.Evaluate) {
      onChange([productId]);
      return;
    }
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
            {mode === AiMode.Compare
              ? t("comparePickerHint")
              : t("evaluatePickerHint")}
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
                        href={`/assistant?mode=EVALUATE&productId=${encodeURIComponent(id)}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                      >
                        <Sparkles className="size-3.5" />
                        {t("askAboutProduct")}
                      </Link>
                    </div>
                  ) : id ? (
                    <Link
                      href={`/assistant?mode=EVALUATE&productId=${encodeURIComponent(id)}`}
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
          <div key={`${turn.response.conversation_id}-${index}`} className="space-y-3">
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
                {turn.response.intent ? (
                  <Badge className="px-1.5 py-0 text-[0.62rem] normal-case tracking-normal">
                    {turn.response.intent}
                  </Badge>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap">{turn.response.answer}</p>
            </div>
            {turn.response.products?.length ? (
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
