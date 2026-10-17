"use client";

import {CircleAlert, CircleCheck, History, RefreshCw} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {ConfirmAction} from "@/components/ui/confirm-action";
import {Skeleton} from "@/components/ui/skeleton";
import {useProfile} from "@/features/auth/queries";
import {isAdminRole} from "@/lib/auth/roles";
import {cn} from "@/lib/utils";

import type {DeadLetterReplayResult, SearchIndexSyncResult} from "./api";
import {PageHeader} from "./list-kit";
import {useDeadLetterStatus, useReplayDeadLetters, useSyncSearchIndex} from "./queries";

/** The admin's way to rebuild the search index by hand; day to day the index follows the catalog by itself. */
export function SearchIndexPage() {
  const t = useTranslations("admin");
  const tl = useTranslations("admin.searchIndex");
  const profile = useProfile();
  const sync = useSyncSearchIndex();

  if (profile.isPending) return <Skeleton className="h-64 rounded-2xl" />;
  if (!isAdminRole(profile.data?.role)) {
    return (
      <div className="space-y-5">
        <PageHeader title={tl("title")} />
        <Card className="p-6 text-sm text-muted-foreground" role="alert">{tl("forbidden")}</Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title={tl("title")} description={tl("description")} />

      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 max-w-2xl">
            <h2 className="text-base font-semibold">{tl("howTitle")}</h2>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-muted-foreground">
              <li>{tl("howAuto")}</li>
              <li>{tl("howManual")}</li>
              <li>{tl("howCost")}</li>
            </ul>
          </div>
          <ConfirmAction
            title={tl("confirmTitle")}
            description={tl("confirmDescription")}
            confirmLabel={tl("confirm")}
            cancelLabel={t("cancel")}
            variant="default"
            confirmVariant="default"
            size="lg"
            disabled={sync.isPending}
            onConfirm={() => sync.mutateAsync()}
          >
            <RefreshCw className={cn("size-4", sync.isPending && "animate-spin")} aria-hidden="true" />
            {sync.isPending ? tl("running") : tl("action")}
          </ConfirmAction>
        </div>
      </Card>

      {sync.data ? <SyncResult result={sync.data} /> : null}

      <DeadLetters />
    </div>
  );
}

/** Changes the index missed are parked, not lost: this shows how many and runs them again once the cause is fixed. */
function DeadLetters() {
  const tl = useTranslations("admin.searchIndex");
  const status = useDeadLetterStatus();
  const replay = useReplayDeadLetters();
  const pending = status.data?.pending ?? 0;

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 max-w-2xl">
          <h2 className="text-base font-semibold">{tl("dltTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{tl("dltDescription")}</p>
          {status.isError ? (
            <p className="mt-3 text-sm text-destructive" role="alert">{tl("dltUnavailable")}</p>
          ) : status.isPending ? null : (
            <p className={cn("mt-3 text-sm font-medium", pending > 0 ? "text-destructive" : "text-emerald-700")}>
              {pending > 0 ? tl("dltPending", {count: pending}) : tl("dltNone")}
            </p>
          )}
        </div>
        <Button size="lg" variant="outline" disabled={replay.isPending || pending === 0} onClick={() => replay.mutate()}>
          <History className={cn("size-4", replay.isPending && "animate-pulse")} aria-hidden="true" />
          {replay.isPending ? tl("dltReplaying") : tl("dltReplay")}
        </Button>
      </div>
      {replay.isError ? <p className="mt-4 text-sm text-destructive" role="alert">{tl("dltReplayFailed")}</p> : null}
      {replay.data ? <ReplayResult result={replay.data} /> : null}
    </Card>
  );
}

function ReplayResult({result}: {result: DeadLetterReplayResult}) {
  const tl = useTranslations("admin.searchIndex");
  return (
    <div className="mt-4 space-y-1 text-sm" role="status" aria-live="polite">
      <p className="text-muted-foreground">{tl("dltReplayed", {count: result.replayed})}</p>
      {result.skipped > 0 ? <p className="text-muted-foreground">{tl("dltSkipped", {count: result.skipped})}</p> : null}
      {result.blocked ? (
        <p className="flex items-start gap-2 text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {tl("dltBlocked", {count: result.pending})}
        </p>
      ) : null}
    </div>
  );
}

function SyncResult({result}: {result: SearchIndexSyncResult}) {
  const tl = useTranslations("admin.searchIndex");
  const clean = result.failed === 0;
  const figures = [
    {key: "indexed", value: result.indexed, tone: ""},
    {key: "removed", value: result.removed, tone: ""},
    {key: "failed", value: result.failed, tone: clean ? "" : "text-destructive"},
  ] as const;

  return (
    <Card className="p-4 sm:p-6" role="status" aria-live="polite">
      <h2 className="text-base font-semibold">{tl("resultTitle")}</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {figures.map((figure) => (
          <div key={figure.key} className="rounded-xl border p-4">
            <dt className="text-sm text-muted-foreground">{tl(figure.key)}</dt>
            <dd className={cn("mt-1 text-2xl font-semibold tabular-nums", figure.tone)}>
              {figure.value}
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">{tl("unitProducts")}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className={cn("mt-4 flex items-start gap-2 text-sm", clean ? "text-emerald-700" : "text-destructive")}>
        {clean ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
        {clean ? tl("successAll") : tl("successPartial", {count: result.failed})}
      </p>
    </Card>
  );
}
