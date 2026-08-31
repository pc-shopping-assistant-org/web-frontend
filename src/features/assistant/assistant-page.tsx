"use client";

import {Bot, Check, MessageCircle, Search, Sparkles} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useState, type FormEvent} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ErrorMessage} from "@/components/ui/error-message";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Link} from "@/i18n/navigation";
import {formatMoney} from "@/lib/format";

import {chat, compare, consult, evaluate, semanticSearch, type ChatData, type CompareData, type ConsultData, type EvaluateData, type SearchData} from "./api";

type Mode = "CHAT" | "SEARCH" | "CONSULT" | "COMPARE" | "EVALUATE";
type Result = ChatData | SearchData | ConsultData | CompareData | EvaluateData;

export function AssistantPage() {
  const t = useTranslations("assistant");
  const common = useTranslations("common");
  const locale = useLocale();
  const [mode, setMode] = useState<Mode>("CHAT");
  const [prompt, setPrompt] = useState("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim() && mode !== "COMPARE" && mode !== "EVALUATE") return;
    setLoading(true); setError(null);
    try {
      let data: Result;
      if (mode === "CHAT") data = await chat(prompt.trim(), conversationId);
      else if (mode === "SEARCH") data = await semanticSearch(prompt.trim());
      else if (mode === "CONSULT") data = await consult(prompt.trim());
      else if (mode === "COMPARE") data = await compare(productIds, prompt.trim() || undefined);
      else data = await evaluate(productIds[0] ?? prompt.trim(), prompt.trim() || undefined);
      setResult(data);
      if (mode === "CHAT" && "conversation_id" in data) setConversationId(data.conversation_id);
    } catch (cause) { setError(cause); } finally { setLoading(false); }
  }

  const isCompare = mode === "COMPARE";
  const isEvaluate = mode === "EVALUATE";
  return <section className="page-wrap py-12 sm:py-16"><div className="mb-10 max-w-3xl space-y-3"><p className="eyebrow">{t("eyebrow")}</p><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("title")}</h1><p className="text-muted-foreground">{t("description")}</p></div><div className="grid gap-6 lg:grid-cols-[18rem_1fr]"><Card className="h-fit"><CardHeader><CardTitle><Sparkles className="mr-2 inline size-5" />{t("modes")}</CardTitle></CardHeader><CardContent className="space-y-2">{(["CHAT", "SEARCH", "CONSULT", "COMPARE", "EVALUATE"] as Mode[]).map((value) => <button key={value} type="button" className={`flex w-full items-start gap-3 rounded-xl p-3 text-left text-sm ${mode === value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => {setMode(value); setResult(null); setError(null);}}>{value === "CHAT" ? <MessageCircle className="mt-0.5 size-4" /> : value === "SEARCH" ? <Search className="mt-0.5 size-4" /> : <Bot className="mt-0.5 size-4" />}<span><span className="block font-medium">{t(`mode.${value}.title`)}</span><span className={`mt-1 block text-xs ${mode === value ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{t(`mode.${value}.description`)}</span></span></button>)}</CardContent></Card><div className="space-y-6"><Card><CardContent className="p-5"><form className="space-y-4" onSubmit={(event) => void submit(event)}><div className="flex items-center gap-2"><Badge>{t(`mode.${mode}.title`)}</Badge>{conversationId ? <button type="button" className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setConversationId(undefined)}>{t("newConversation")}</button> : null}</div>{isCompare || isEvaluate ? <div className="space-y-2"><label className="text-sm font-medium" htmlFor="product-ids">{t("productIds")}</label><Input id="product-ids" placeholder={t("productIdsPlaceholder")} value={productIds.join(", ")} onChange={(event) => setProductIds(event.target.value.split(",").map((value) => value.trim()).filter(Boolean))} /><p className="text-xs text-muted-foreground">{isCompare ? t("compareHint") : t("evaluateHint")}</p></div> : null}<Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={t(`mode.${mode}.placeholder`)} rows={5} /><Button type="submit" disabled={loading || (isCompare && productIds.length < 2) || (isEvaluate && productIds.length < 1)}>{loading ? common("loading") : t("send")}</Button></form></CardContent></Card>{error ? <ErrorMessage error={error} /> : null}{result ? <AssistantResult result={result} locale={locale} /> : <Card><CardContent className="p-12 text-center text-sm text-muted-foreground"><Bot className="mx-auto size-10 opacity-40" /><p className="mt-4">{t("empty")}</p></CardContent></Card>}</div></div></section>;
}

function AssistantResult({result, locale}: {result: Result; locale: string}) {
  const t = useTranslations("assistant");
  const answer = "answer" in result ? result.answer : undefined;
  const products = "products" in result ? result.products ?? [] : "product" in result && result.product ? [result.product] : [];
  return <Card><CardHeader><CardTitle>{t("response")}</CardTitle></CardHeader><CardContent className="space-y-5"><p className="whitespace-pre-wrap leading-7">{answer ?? t("noAnswer")}</p>{products.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">{products.map((product, index) => {const id = "id" in product ? product.id : "product_id" in product ? product.product_id : undefined; const slug = "seo_name" in product ? product.seo_name : undefined; return <div key={id ?? index} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{product.name}</p><p className="mt-1 text-sm text-muted-foreground">{product.description ?? "—"}</p></div><Check className="size-4 text-emerald-600" /></div><p className="mt-3 font-semibold">{formatMoney(product.list_price, locale)}</p>{id && slug ? <Link href={`/products/${slug}`} className="mt-3 inline-block text-sm font-medium hover:underline">{t("viewProduct")}</Link> : null}</div>;})}</div> : null}</CardContent></Card>;
}
