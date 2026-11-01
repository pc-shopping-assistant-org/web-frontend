"use client";

import {ArrowRight, ArrowUpRight, Bot, Check, ExternalLink, Loader2, PackageSearch, Plus, RotateCcw, Search, Sparkles, WifiOff, X} from "lucide-react";
import {Popover} from "@base-ui/react/popover";
import {useLocale, useTranslations} from "next-intl";
import Image from "next/image";
import {useEffect, useRef, useState, type FormEvent} from "react";

import {Badge} from "@/components/ui/badge";
import {Button, buttonVariants} from "@/components/ui/button";
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
import {STATIC_MESSAGE_KEYS} from "@/lib/api/contracts/common";
import {AssistantFailureReason} from "@/lib/domain/assistant-enums";
import {streamChat, type ChatData, type CompareData, type ConsultData, type EvaluateData, type SearchData} from "./api";
import type {Confirmation} from "./contracts/stateful";
import {CHAT_FOLLOW_BOTTOM_DISTANCE_PX, MAX_PRODUCT_QUESTION_CHARS, MAX_SELECTED_PRODUCTS, MAX_TURN_MESSAGE_CHARS, PRODUCT_PICKER_PAGE_SIZE} from "./constants";
import {AssistantMarkdown} from "./assistant-markdown";
import {loadConversationHistory, setConversationUrl} from "./conversation-history";
import {waitForRunResult} from "./stateful-api";
import type {ChatTurn} from "./models";
import {PcBuildSummary} from "./components/pc-build-summary";
import {formatSpecLabel, formatSpecValue} from "./mappers";
import {MessageAttachments} from "./components/message-attachments";
import styles from "./assistant-page.module.css";

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [productIds, setProductIds] = useState<string[]>(initialProductIds);
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [streamingPrompt, setStreamingPrompt] = useState("");
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [streamingProductIds, setStreamingProductIds] = useState<string[]>([]);
  const [streamState, setStreamState] = useState<"streaming" | "reconnecting">("streaming");
  const [streamError, setStreamError] = useState<unknown>(null);
  const [pendingDelivery, setPendingDelivery] = useState<{conversationId: string; runId: string} | null>(null);
  const lastConfirmationRef = useRef<Confirmation | undefined>(undefined);
  const [loading, setLoading] = useState(Boolean(initialConversationId));
  const [error, setError] = useState<unknown>(null);
  const streamController = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const followBottom = useRef(true);
  const lastResponse = chatTurns.findLast((turn) => turn.response)?.response;
  const proposal = lastResponse && "stateful" in lastResponse ? lastResponse.stateful?.proposal : null;
  const proposalChanges = proposal?.changes ?? [];
  const clarificationOptions = lastResponse && "stateful" in lastResponse ? (lastResponse.stateful?.clarificationOptions ?? []) : [];

  function handleAskAboutProduct(id: string) {
    setProductIds((prev) => (prev.includes(id) || prev.length >= MAX_SELECTED_PRODUCTS ? prev : [...prev, id]));
    textareaRef.current?.focus();
  }

  useEffect(() => () => streamController.current?.abort(), []);

  useEffect(() => {
    if (followBottom.current && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatTurns, streamingPrompt, streamingAnswer, error]);

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

  function completeTurn(message: string, attachments: string[], data: ChatData) {
    setConversationId(data.conversation_id);
    setChatTurns((current) => [...current, {prompt: message, response: data, selectedProductIds: attachments}]);
    setStreamingPrompt("");
    setStreamingAnswer("");
    setPrompt("");
    setProductIds([]);
    setPendingDelivery(null);
  }

  async function send(submittedPrompt: string, confirmation?: Confirmation, attachments = productIds) {
    if (streamController.current) return;
    if (profile.error instanceof ApiClientError && profile.error.status === 401) {
      setSignInOpen(true);
      return;
    }
    const controller = new AbortController();
    const submittedProductIds = confirmation ? [] : [...attachments];
    followBottom.current = true;
    streamController.current = controller;
    setLoading(true);
    setError(null);
    setStreamingPrompt(submittedPrompt);
    setStreamingAnswer("");
    setStreamingProductIds(submittedProductIds);
    setStreamState("streaming");
    setStreamError(null);
    setPendingDelivery(null);
    lastConfirmationRef.current = confirmation;
    try {
      const data = await streamChat(
        submittedPrompt,
        conversationId,
        {
          onRunAdmitted: (id, runId) => {
            if (!controller.signal.aborted) setPendingDelivery({conversationId: id, runId});
          },
          onStart: (id) => {
            if (!controller.signal.aborted) {
              setConversationId(id);
              setConversationUrl(id);
            }
          },
          onDelta: (delta, replace) => {
            if (!controller.signal.aborted) setStreamingAnswer((current) => replace ? delta : current + delta);
          },
          onReconnecting: () => {
            if (!controller.signal.aborted) setStreamState("reconnecting");
          },
        },
        controller.signal,
        confirmation ? {confirmation} : {selectedProductIds: submittedProductIds},
      );
      if (controller.signal.aborted) return;
      completeTurn(submittedPrompt, submittedProductIds, data);
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
          if (cause instanceof ApiClientError && cause.messageKey === STATIC_MESSAGE_KEYS.AI_RUN_FAILED) {
            setPendingDelivery(null);
            setStreamingAnswer("");
          }
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
    if (pendingDelivery) { await resumeDelivery(); return; }
    await send(streamingPrompt, lastConfirmationRef.current, streamingProductIds);
  }

  async function resumeDelivery() {
    if (!pendingDelivery) return;
    const delivery = pendingDelivery;
    streamController.current?.abort();
    const controller = new AbortController();
    streamController.current = controller;
    setLoading(true);
    setStreamError(null);
    setStreamState("reconnecting");
    try {
      const result = await waitForRunResult(delivery.conversationId, delivery.runId, controller.signal);
      if (!controller.signal.aborted) completeTurn(streamingPrompt, streamingProductIds, result);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setStreamError(cause);
        if (cause instanceof ApiClientError && cause.messageKey === STATIC_MESSAGE_KEYS.AI_RUN_FAILED) {
          setPendingDelivery(null);
          setStreamingAnswer("");
        }
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
      if (streamController.current === controller) streamController.current = null;
    }
  }

  function dismissStreamError() {
    setStreamingPrompt("");
    setStreamingAnswer("");
    setStreamError(null);
    lastConfirmationRef.current = undefined;
    setPendingDelivery(null);
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
    <section className={styles.workspace}>
      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} title={t("attachProducts")} closeLabel={common("close")}
        className={`${styles.palette} max-h-[85dvh] w-full max-w-2xl overflow-y-auto`}
        footer={<Button onClick={() => setPickerOpen(false)}>{common("close")}</Button>}>
        <ProductPicker value={productIds} onChange={setProductIds} locale={locale} />
      </Dialog>
      <Dialog
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        title={t("signInTitle")}
        description={t("signInDescription")}
        closeLabel={t("signInClose")}
      >
        <LoginForm onSuccess={() => setSignInOpen(false)} />
      </Dialog>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/50 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Bot className="size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight">{t("chatTitle")}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/products" className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:inline-flex">
            {t("browseCatalog")}
            <ArrowUpRight className="size-4" />
          </Link>
          <Button size="sm" variant="ghost" onClick={newConversation} disabled={loading} aria-label={t("newConversation")}>
            <Plus className="size-4 sm:hidden" />
            <span className="hidden sm:inline">{t("newConversation")}</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {invalidBuild && (
          <p role="alert" className="m-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {t("invalidBuild")}
          </p>
        )}
        <div ref={scrollRef} className={styles.scroller} role="log" aria-label={t("conversation")}
          onScroll={(event) => {const element = event.currentTarget; followBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < CHAT_FOLLOW_BOTTOM_DISTANCE_PX;}}>
          <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
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
              selectedProductIds={streamingProductIds}
              state={streamState}
              error={streamError}
              onRetry={retryLastSend}
              onDismiss={dismissStreamError}
              onResume={pendingDelivery ? resumeDelivery : undefined}
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
        </div>

        <form onSubmit={(event) => void submit(event)} className="mx-auto w-full max-w-4xl shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-6">
          <fieldset disabled={loading} className="min-w-0 rounded-2xl border border-border/70 bg-muted/25 p-3 shadow-sm">
            {productIds.length ? <MessageAttachments productIds={productIds} onRemove={(id) => setProductIds((current) => current.filter((item) => item !== id))} /> : null}
            <div className="flex min-w-0 items-end gap-2">
              <Popover.Root open={toolsOpen} onOpenChange={setToolsOpen}>
                <Popover.Trigger type="button" disabled={loading} aria-label={t("addToChat")} className={buttonVariants({variant: "ghost", size: "icon", className: "mb-1 rounded-full"})}>
                  <Plus className="size-5" />
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner side="top" align="start" sideOffset={8} className="z-50">
                    <Popover.Popup className={`${styles.palette} min-w-56 rounded-xl border border-border/70 bg-background p-1.5 shadow-lg`}>
                      <button type="button" onClick={() => {setToolsOpen(false); setPickerOpen(true);}} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                        <PackageSearch className="size-4" />{t("attachProducts")}
                      </button>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
            <Textarea
              ref={textareaRef}
              aria-label={t("promptLabel")}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={t("unifiedPlaceholder")}
              rows={2}
              maxLength={productIds.length ? MAX_PRODUCT_QUESTION_CHARS : MAX_TURN_MESSAGE_CHARS}
              className="max-h-40 min-h-16 min-w-0 flex-1 resize-none border-0 bg-transparent px-1 py-1 text-base shadow-none focus-visible:ring-0"
            />
              <Button type="submit" size="icon" aria-label={t("send")} className="mb-1 rounded-xl" disabled={loading || (!prompt.trim() && !productIds.length)}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              </Button>
            </div>
          </fieldset>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">{t("catalogGroundedHint")}</p>
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
    <div className="min-w-0 space-y-3 pt-2">
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
        <div className="grid max-h-[45dvh] min-w-0 grid-cols-1 gap-2 overflow-y-auto overscroll-contain sm:grid-cols-2">
          {visibleProducts.map((product, index) => {
            if (!product.id) return null;
            const selected = value.includes(product.id);
            const disabled = !selected && value.length >= max;
            return (
              <div
                key={product.id ?? index}
                className={`flex min-w-0 items-center gap-2 rounded-xl border p-2 text-left transition ${
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
}: {
  result: Result;
  locale?: string;
  hideAnswer?: boolean;
}) {
  const t = useTranslations("assistant");
  const answer = "answer" in result ? result.answer : undefined;
  const products = "products" in result ? (result.products ?? []) : "product" in result && result.product ? [result.product] : [];
  const build = "stateful" in result ? result.stateful?.build : null;
  const isComparison = products.length > 1;
  const comparisonKeys = isComparison
    ? Array.from(new Set(products.flatMap((product) => Object.keys(product.specifications ?? {})))).slice(0, 12)
    : [];
  return (
    <div className="min-w-0 space-y-4">
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
    </div>
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
    <div className="space-y-8">
        {turns.map((turn, index) => (
          <div key={index} className="space-y-3">
            <div className="ml-auto w-fit max-w-[90%] rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6 sm:max-w-[80%]">
              <p className="mb-1 text-[0.68rem] font-medium text-muted-foreground">{t("you")}</p>
              <p className="whitespace-pre-wrap">{turn.prompt}</p>
              <MessageAttachments productIds={turn.selectedProductIds} />
            </div>
            {turn.response ? <div className="min-w-0 text-sm leading-7">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Bot className="size-3.5 text-primary" />
                {t("assistantLabel")}
                {"intent" in turn.response && turn.response.intent ? (
                  <Badge variant="outline" className="px-1.5 py-0 text-[0.62rem] normal-case tracking-normal">{turn.response.intent}</Badge>
                ) : null}
              </div>
              <AssistantMarkdown products={"products" in turn.response ? turn.response.products : "product" in turn.response ? [turn.response.product] : []} onAskAboutProduct={onAskAboutProduct}>
                {"answer" in turn.response ? turn.response.answer : t("noAnswer")}
              </AssistantMarkdown>
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
                />
              </div>
            ) : null}
          </div>
        ))}
    </div>
  );
}

function StreamingChatTurn({
  prompt,
  answer,
  selectedProductIds,
  state,
  error,
  onRetry,
  onDismiss,
  onResume,
}: {
  prompt: string;
  answer: string;
  selectedProductIds: string[];
  state: "streaming" | "reconnecting";
  error: unknown;
  onRetry: () => void;
  onDismiss: () => void;
  onResume?: () => void;
}) {
  const t = useTranslations("assistant");
  const failed = Boolean(error);
  const terminal = error instanceof ApiClientError && error.messageKey === STATIC_MESSAGE_KEYS.AI_RUN_FAILED;
  const reason = error instanceof ApiClientError ? error.errors.find((entry) => Object.values(AssistantFailureReason).some((value) => value === entry.code))?.code : undefined;
  const description = reason === AssistantFailureReason.ModelTimeout ? "modelTimeout" : reason === AssistantFailureReason.ModelUnavailable ? "modelUnavailable" : terminal ? "processingFailed" : "networkFailed";
  return (
    <div className="space-y-4">
        <div className="ml-auto w-fit max-w-[90%] rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6 sm:max-w-[80%]">
          <p className="mb-1 text-[0.68rem] font-medium text-muted-foreground">{t("you")}</p>
          <p className="whitespace-pre-wrap">{prompt}</p>
          <MessageAttachments productIds={selectedProductIds} />
        </div>
        <div className="min-w-0 text-sm leading-7">
          <div className="mb-1 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Bot className="size-3.5 text-primary" />
            {t("assistantLabel")}
            {!failed ? <span className="size-1.5 animate-pulse rounded-full bg-primary" /> : null}
          </div>
          {answer ? <AssistantMarkdown>{answer}</AssistantMarkdown> : !failed ? <AssistantMarkdown>{t("streaming")}</AssistantMarkdown> : null}
          {!failed && state === "reconnecting" ? (
            <div role="status" className="mt-3 rounded-xl bg-muted/60 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium"><Loader2 className="size-3.5 animate-spin" />{t("reconnecting")}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("recoveringDescription")}</p>
              {onResume ? <Button type="button" size="sm" variant="outline" className="mt-2" onClick={onResume}>{t("checkResult")}</Button> : null}
            </div>
          ) : null}
          {failed ? (
            <div role="alert" className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-destructive">
                {terminal ? <Bot className="size-4" /> : <WifiOff className="size-4" />}
                {t(terminal ? "responseFailed" : "connectionFailed")}
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{t(description)}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={onRetry} className="gap-1.5">
                  <RotateCcw className="size-3.5" />
                  {t(onResume ? "checkResult" : "retry")}
                </Button>
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  {t("dismiss")}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
    </div>
  );
}


