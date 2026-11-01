"use client";

import {ArrowRight, ArrowUpRight, Bot, Check, ExternalLink, Loader2, MessageCircle, PackageSearch, RotateCcw, Search, Sparkles, WifiOff, X} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import Image from "next/image";
import {useEffect, useRef, useState, type FormEvent} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {ErrorMessage} from "@/components/ui/error-message";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Skeleton} from "@/components/ui/skeleton";
import {Textarea} from "@/components/ui/textarea";
import {Link} from "@/i18n/navigation";
import {formatMoney} from "@/lib/format";
import {useProducts, useProductsByIds} from "@/features/catalog/queries";
import {CatalogCategoryIcon} from "@/features/catalog/components/catalog-category-icon";
import {useProfile} from "@/features/auth/queries";
import {LoginForm} from "@/features/auth/login-form";
import {ApiClientError} from "@/lib/api/envelope";
import {streamChat, type ChatData, type CompareData, type ConsultData, type EvaluateData, type SearchData} from "./api";
import type {Confirmation} from "./contracts/stateful";
import {MAX_PRODUCT_QUESTION_CHARS, MAX_SELECTED_PRODUCTS, MAX_TURN_MESSAGE_CHARS, PRODUCT_PICKER_PAGE_SIZE} from "./constants";
import {AssistantMarkdown} from "./assistant-markdown";
import {loadConversationHistory, setConversationUrl} from "./conversation-history";
import {waitForRunResult} from "./stateful-api";
import type {ChatTurn} from "./models";
import {AssistantProductCard} from "./components/assistant-product-card";
import {PcBuildSummary} from "./components/pc-build-summary";
import {formatSpecLabel, formatSpecValue} from "./mappers";

type Result = ChatData | SearchData | ConsultData | CompareData | EvaluateData;

export function AssistantPage({
  initialConversationId,
  initialProductIds = [],
  initialPrompt = "",
  invalidBuild = false,
}: {
  initialConversationId?: string;
  initialProductIds?: string[];
  initialPrompt?: string;
  invalidBuild?: boolean;
}) {
  const t = useTranslations("assistant");
  const common = useTranslations("common");
  const locale = useLocale();
  const profile = useProfile();
  const [signInOpen, setSignInOpen] = useState(false);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [productIds, setProductIds] = useState<string[]>(initialProductIds);
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [streamingPrompt, setStreamingPrompt] = useState("");
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [streamState, setStreamState] = useState<"streaming" | "reconnecting">("streaming");
  const [streamError, setStreamError] = useState<unknown>(null);
  const lastConfirmationRef = useRef<Confirmation | undefined>(undefined);
  const [loading, setLoading] = useState(Boolean(initialConversationId));
  const [error, setError] = useState<unknown>(null);
  const streamController = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastResponse = chatTurns.findLast((turn) => turn.response)?.response;
  const proposal = lastResponse && "stateful" in lastResponse ? lastResponse.stateful?.proposal : null;
  const proposalChanges = proposal?.changes ?? [];
  const clarificationOptions = lastResponse && "stateful" in lastResponse ? (lastResponse.stateful?.clarificationOptions ?? []) : [];

  function handleAskAboutProduct(id: string) {
    setProductIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    textareaRef.current?.focus();
  }

  useEffect(() => () => streamController.current?.abort(), []);

  useEffect(() => {
    if (!initialConversationId) return;
    const controller = new AbortController();
    streamController.current = controller;
    void (async () => {
      try {
        const history = await loadConversationHistory(initialConversationId, controller.signal);
        if (controller.signal.aborted) return;
        setChatTurns(history.turns);
        if (history.pendingRunId) {
          const result = await waitForRunResult(initialConversationId, history.pendingRunId, controller.signal);
          if (!controller.signal.aborted)
            setChatTurns((turns) => turns.map((turn) => turn.runId === history.pendingRunId ? {...turn, response: result} : turn));
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          if (cause instanceof ApiClientError && cause.status === 401) setSignInOpen(true);
          else setError(cause);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
        if (streamController.current === controller) streamController.current = null;
      }
    })();
    return () => controller.abort();
  }, [initialConversationId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (streamController.current || (!prompt.trim() && !productIds.length)) return;
    const submittedPrompt = prompt.trim() || t(productIds.length > 1 ? "defaultCompare" : "defaultEvaluate");
    await send(submittedPrompt);
  }

  async function send(submittedPrompt: string, confirmation?: Confirmation) {
    if (streamController.current) return;
    if (profile.error instanceof ApiClientError && profile.error.status === 401) {
      setSignInOpen(true);
      return;
    }
    const controller = new AbortController();
    streamController.current = controller;
    setLoading(true);
    setError(null);
    setStreamingPrompt(submittedPrompt);
    setStreamingAnswer("");
    setStreamState("streaming");
    setStreamError(null);
    lastConfirmationRef.current = confirmation;
    try {
      const data = await streamChat(
        submittedPrompt,
        conversationId,
        {
          onStart: (id) => {
            if (!controller.signal.aborted) {
              setConversationId(id);
              setConversationUrl(id);
            }
          },
          onDelta: (delta) => {
            if (!controller.signal.aborted) setStreamingAnswer((current) => current + delta);
          },
          onReconnecting: () => {
            if (!controller.signal.aborted) setStreamState("reconnecting");
          },
        },
        controller.signal,
        confirmation ? {confirmation} : {selectedProductIds: productIds},
      );
      if (!controller.signal.aborted) setConversationId(data.conversation_id);
      if (controller.signal.aborted) return;
      setChatTurns((current) => [...current, {prompt: submittedPrompt, response: data}]);
      setStreamingPrompt("");
      setStreamingAnswer("");
      setPrompt("");
      setProductIds([]);
    } catch (cause) {
      if (!controller.signal.aborted) {
        if (cause instanceof ApiClientError && cause.status === 401) {
          setSignInOpen(true);
          setStreamingPrompt("");
          setStreamingAnswer("");
        } else {
          // Keep the streaming bubble visible with the error shown inline so the
          // user can retry without losing the conversation context.
          setStreamError(cause);
          setError(null);
        }
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
      if (streamController.current === controller) streamController.current = null;
    }
  }

  async function retryLastSend() {
    if (!streamingPrompt || streamController.current) return;
    await send(streamingPrompt, lastConfirmationRef.current);
  }

  function dismissStreamError() {
    setStreamingPrompt("");
    setStreamingAnswer("");
    setStreamError(null);
    lastConfirmationRef.current = undefined;
  }

  function newConversation() {
    setConversationUrl();
    setConversationId(undefined);
    setChatTurns([]);
    setProductIds([]);
    setError(null);
    setPrompt("");
    dismissStreamError();
  }

  return (
    <section className="storefront-wrap py-7 sm:py-10">
      <Dialog
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        title={t("signInTitle")}
        description={t("signInDescription")}
        closeLabel={t("signInClose")}
      >
        <LoginForm onSuccess={() => setSignInOpen(false)} />
      </Dialog>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bot className="size-8" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{t("chatTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("unifiedDescription")}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/products" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            {t("browseCatalog")}
            <ArrowUpRight className="size-4" />
          </Link>
          <Button variant="outline" onClick={newConversation} disabled={loading}>
            {t("newConversation")}
          </Button>
        </div>
      </header>

      <div className="rounded-2xl border bg-background shadow-sm">
        {invalidBuild && (
          <p role="alert" className="m-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {t("invalidBuild")}
          </p>
        )}
        <div className="min-h-64 space-y-5 p-4 sm:p-6" aria-live="polite">
          {chatTurns.length ? (
            <ChatTranscript turns={chatTurns} locale={locale} onAskAboutProduct={handleAskAboutProduct} />
          ) : !streamingPrompt ? (
            <div className="flex min-h-60 flex-col items-center justify-center gap-4 text-center">
              <Sparkles className="size-9 text-primary" />
              <h2 className="text-xl font-semibold">{t("chatWelcome")}</h2>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">{t("unifiedDescription")}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["suggestionLaptop", "suggestionBuild", "suggestionCompare"].map((key) => (
                  <button
                    key={key}
                    className="rounded-xl border bg-muted/30 px-4 py-3 text-sm hover:border-primary/40"
                    onClick={() => setPrompt(t(key))}
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {streamingPrompt ? (
            <StreamingChatTurn
              prompt={streamingPrompt}
              answer={streamingAnswer}
              state={streamState}
              error={streamError}
              onRetry={retryLastSend}
              onDismiss={dismissStreamError}
            />
          ) : null}
          {error ? <ErrorMessage error={error} /> : null}
          {proposalChanges.length ? (
            <ul className="space-y-1 rounded-lg border p-3 text-sm">
              {proposalChanges.map((change, index) => (
                <li key={index}>{change}</li>
              ))}
            </ul>
          ) : null}
          {clarificationOptions.length ? (
            <ul className="space-y-1 rounded-lg border p-3 text-sm">
              {clarificationOptions.map((option, index) => (
                <li key={index}>{option}</li>
              ))}
            </ul>
          ) : null}
          {proposal ? (
            <Button
              disabled={loading}
              onClick={() =>
                void send(t("confirmProposal"), {
                  schema_version: 2,
                  proposal_id: proposal.proposalId,
                  proposal_hash: proposal.proposalHash,
                  target_revision: proposal.targetRevision,
                  base_requirements_hash: proposal.baseRequirementsHash,
                })
              }
            >
              {t("confirmProposal")}
            </Button>
          ) : null}
        </div>

        <form onSubmit={(event) => void submit(event)} className="border-t bg-muted/15 p-4 sm:p-6">
          <fieldset disabled={loading}>
            <details className="mb-4 rounded-xl border bg-background p-3" open={productIds.length > 0 || undefined}>
              <summary className="cursor-pointer text-sm font-medium">
                {t("attachProducts")}
                {productIds.length ? ` (${productIds.length}/5)` : ""}
              </summary>
              <p className="mb-3 mt-2 text-xs leading-5 text-muted-foreground">{t("attachmentHint")}</p>
              <ProductPicker value={productIds} onChange={setProductIds} locale={locale} />
            </details>
            <Textarea
              ref={textareaRef}
              aria-label={t("promptLabel")}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={t("unifiedPlaceholder")}
              rows={3}
              maxLength={productIds.length ? MAX_PRODUCT_QUESTION_CHARS : MAX_TURN_MESSAGE_CHARS}
              className="min-h-24 resize-y rounded-xl bg-background p-4 text-base"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs leading-5 text-muted-foreground">{t("catalogGroundedHint")}</p>
              <Button type="submit" className="h-11 min-w-28" disabled={loading || (!prompt.trim() && !productIds.length)}>
                {loading ? common("loading") : t("send")}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </fieldset>
        </form>
      </div>
    </section>
  );
}

function ProductPicker({value, onChange, locale}: {value: string[]; onChange: (value: string[]) => void; locale: string}) {
  const t = useTranslations("assistant");
  const [keyword, setKeyword] = useState("");
  const products = useProducts({limit: PRODUCT_PICKER_PAGE_SIZE, keyword: keyword.trim() || undefined});
  const selectedProductQuery = useProductsByIds(value);
  const max = MAX_SELECTED_PRODUCTS;
  const allProducts = products.data?.items ?? [];
  const visibleProducts = allProducts;
  const selectedProducts = [...(selectedProductQuery.data ?? []), ...allProducts].filter(
    (product, index, items) => value.includes(product.id) && items.findIndex((item) => item.id === product.id) === index,
  );
  const selectedById = new Map(selectedProducts.map((product) => [product.id, product]));

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
          <p className="mt-1 text-xs text-muted-foreground">{t("attachmentHint")}</p>
        </div>
        <Badge variant="outline" className="bg-background">{t("selectedCount", {count: value.length, max})}</Badge>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          aria-label={t("searchCatalogProducts")}
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
        <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">{t("noCatalogProducts")}</p>
      ) : (
        <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
          {visibleProducts.map((product, index) => {
            if (!product.id) return null;
            const selected = value.includes(product.id);
            const disabled = !selected && value.length >= max;
            return (
              <div
                key={product.id ?? index}
                className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : disabled
                      ? "cursor-not-allowed opacity-50"
                      : "hover:border-primary/40 hover:bg-background"
                }`}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left"
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
                    <span className="block truncate text-sm font-medium">{product.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatMoney(product.minPrice ?? product.maxPrice, locale)}
                    </span>
                  </span>
                </button>
                <Link
                  href={`/products/${encodeURIComponent(product.seoName)}`}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-background hover:text-primary"
                  aria-label={`${t("viewProduct")}: ${product.name}`}
                  title={t("viewProduct")}
                >
                  <ExternalLink className="size-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
      {value.length ? (
        <div className="flex flex-wrap gap-2" aria-label={t("selectedProducts")}>
          {value.map((id) => {
            const product = selectedById.get(id);
            return (
              <span key={id} className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs">
                {product ? (
                  <Link
                    href={`/products/${encodeURIComponent(product.seoName)}`}
                    className="max-w-56 truncate font-medium hover:text-primary hover:underline"
                  >
                    {product.name}
                  </Link>
                ) : (
                  <span className="max-w-56 truncate">{t("selectedProductFallback")}</span>
                )}
                <button
                  type="button"
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => onChange(value.filter((item) => item !== id))}
                  aria-label={`${t("removeProduct")}: ${product?.name ?? t("selectedProductFallback")}`}
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
  hideAnswer = false,
  onAskAboutProduct,
}: {
  result: Result;
  locale?: string;
  hideAnswer?: boolean;
  onAskAboutProduct?: (productId: string) => void;
}) {
  const t = useTranslations("assistant");
  const answer = "answer" in result ? result.answer : undefined;
  const products = "products" in result ? (result.products ?? []) : "product" in result && result.product ? [result.product] : [];
  const build = "stateful" in result ? result.stateful?.build : null;
  const isComparison = products.some((product) => "product_id" in product);
  const comparisonKeys = isComparison
    ? Array.from(new Set(products.flatMap((product) => Object.keys(product.specifications ?? {})))).slice(0, 12)
    : [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("response")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!hideAnswer ? <AssistantMarkdown>{answer ?? t("noAnswer")}</AssistantMarkdown> : null}
        {build ? <PcBuildSummary build={build} /> : null}
        {isComparison && comparisonKeys.length > 0 ? (
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <caption className="sr-only">{t("comparisonTable")}</caption>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="whitespace-nowrap px-4 py-3">{t("specification")}</TableHead>
                  {products.map((product, index) => (
                    <TableHead key={"product_id" in product ? (product.product_id ?? index) : index} className="min-w-44 px-4 py-3">
                      {product.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonKeys.map((key) => (
                  <TableRow key={key}>
                    <TableHead className="whitespace-nowrap bg-muted/20 px-4 py-3 font-medium text-muted-foreground">{formatSpecLabel(key)}</TableHead>
                    {products.map((product, index) => (
                      <TableCell key={`${key}-${index}`} className="px-4 py-3 align-top whitespace-normal">
                        {formatSpecValue(product.specifications?.[key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
        {products.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((product, index) => {
              const id = ("id" in product ? product.id : "product_id" in product ? product.product_id : undefined) ?? String(index);
              return (
                <AssistantProductCard
                  key={id}
                  product={product}
                  onAskAboutProduct={onAskAboutProduct}
                />
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ChatTranscript({
  turns,
  locale,
  onAskAboutProduct,
}: {
  turns: ChatTurn[];
  locale: string;
  onAskAboutProduct?: (productId: string) => void;
}) {
  const t = useTranslations("assistant");
  return (
    <Card className="overflow-hidden border-primary/15">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="size-5 text-primary" />
          {t("conversation")}
          <Badge variant="outline" className="ml-auto bg-background">{turns.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6">
        {turns.map((turn, index) => (
          <div key={index} className="space-y-3">
            <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground sm:max-w-[75%]">
              <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">{t("you")}</p>
              <p className="whitespace-pre-wrap">{turn.prompt}</p>
            </div>
            {turn.response ? <div className="min-w-0 max-w-[95%] rounded-2xl rounded-bl-md border bg-background px-4 py-3 text-sm leading-6 sm:max-w-[85%]">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Bot className="size-3.5 text-primary" />
                {t("assistantLabel")}
                {"intent" in turn.response && turn.response.intent ? (
                  <Badge variant="outline" className="px-1.5 py-0 text-[0.62rem] normal-case tracking-normal">{turn.response.intent}</Badge>
                ) : null}
              </div>
              <AssistantMarkdown>{"answer" in turn.response ? turn.response.answer : t("noAnswer")}</AssistantMarkdown>
            </div> : null}
            {turn.response && (
              ("products" in turn.response && turn.response.products?.length) ||
              ("product" in turn.response && turn.response.product) ||
              ("stateful" in turn.response && turn.response.stateful?.build)
            ) ? (
              <div className="ml-0 sm:ml-4">
                <AssistantResult
                  result={turn.response}
                  locale={locale}
                  hideAnswer
                  onAskAboutProduct={onAskAboutProduct}
                />
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StreamingChatTurn({
  prompt,
  answer,
  state,
  error,
  onRetry,
  onDismiss,
}: {
  prompt: string;
  answer: string;
  state: "streaming" | "reconnecting";
  error: unknown;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const t = useTranslations("assistant");
  const failed = Boolean(error);
  return (
    <Card className="overflow-hidden border-primary/15">
      <CardContent className="space-y-3 p-4 sm:p-6">
        <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground sm:max-w-[75%]">
          <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">{t("you")}</p>
          <p className="whitespace-pre-wrap">{prompt}</p>
        </div>
        <div className="min-w-0 max-w-[95%] rounded-2xl rounded-bl-md border bg-background px-4 py-3 text-sm leading-6 sm:max-w-[85%]">
          <div className="mb-1 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Bot className="size-3.5 text-primary" />
            {t("assistantLabel")}
            {!failed ? <span className="size-1.5 animate-pulse rounded-full bg-primary" /> : null}
          </div>
          {answer ? <AssistantMarkdown>{answer}</AssistantMarkdown> : !failed ? <AssistantMarkdown>{t("streaming")}</AssistantMarkdown> : null}
          {!failed && state === "reconnecting" ? (
            <p role="status" className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              {t("reconnecting")}
            </p>
          ) : null}
          {failed ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-destructive">
                <WifiOff className="size-3.5" />
                {t("connectionFailed")}
              </div>
              <ErrorMessage error={error} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={onRetry} className="gap-1.5">
                  <RotateCcw className="size-3.5" />
                  {t("retry")}
                </Button>
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  {t("dismiss")}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}


