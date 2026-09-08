import { Link, useRouter } from "@/lib/router";
import type { EvaluationFormState } from "@/lib/expert/types";
import {
  areRequiredFieldsComplete,
  createInitialEvaluationFormState,
  evaluateFormProgress,
  EVALUATION_FORM_SECTIONS,
  normalizeEvaluationFormState,
} from "@/lib/expert/evaluationForm";
import {
  isEvaluationFormValid,
  validateEvaluationField,
  validateEvaluationForm,
} from "@/lib/expert/evaluationFormValidation";
import {
  clearEvaluationDraft,
  loadEvaluationDraft,
  loadEvaluationDraftReportId,
  saveEvaluationDraft,
  saveEvaluationDraftReportId,
} from "@/lib/expert/evaluationDraftStorage";
import {
  formatDeadlineDue,
  formatDeadlineRemaining,
  formatQueueRequestIdLabel,
  formatReceivedOn,
  isDeadlineExceeded,
  normalizeMongoId,
} from "@/lib/expert/format";
import {
  EXPIRED_REQUEST_DETAIL_MESSAGE,
  getExpiredRequestNotificationService,
} from "@/lib/expert/expiredRequestNotifications";
import { shouldOpenDeadlineExceededModal } from "@/lib/expert/deadlineExceededModal";
import { useExpertProfile } from "@/lib/expert/expertProfileStore";
import { useExpertSocket } from "@/lib/expert/expertSocketProvider";
import {
  ensureDraftReport,
  getReportForRequest,
  isDraftReport,
  mediaToReportAttachments,
  reportToFormState,
  saveDraftReport,
  submitReport,
} from "@/lib/expert/reportsService";
import type { EvaluationRequestDetail, RequestMediaItem } from "@/lib/expert/types";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EvaluationFormPanel } from "./EvaluationFormPanel";
import { EvaluationProgressStepper } from "./evaluation-request/EvaluationProgressStepper";
import {
  evaluationFormColumnClass,
  evaluationFormPanelWrapClass,
  evaluationRequestGridClass,
  evaluationRequestScrollGridClass,
} from "./layout/panelLayout";
import { EvaluationMediaLightbox } from "./EvaluationMediaLightbox";
import { ExpertToast } from "./ExpertToast";
import { ExpandMediaGalleryIcon } from "./ExpandMediaGalleryIcon";
import { ExpertDeadlineExceededModal } from "./ExpertDeadlineExceededModal";
import { ExpertLeaveWithoutSavingModal } from "./ExpertLeaveWithoutSavingModal";
import { ExpertSubmitConfirmationModal } from "./ExpertSubmitConfirmationModal";
import { ExpertSubmitSuccessModal } from "./ExpertSubmitSuccessModal";
import { MediaGroupScroller } from "./MediaGroupScroller";

type ExpertEvaluationRequestViewProps = {
  detail: EvaluationRequestDetail;
  accepting?: boolean;
  acceptError?: string | null;
  showAcceptedToast?: boolean;
  onAccept?: () => void | Promise<void>;
  onDismissToast?: () => void;
  onSubmitted?: () => void | Promise<void>;
};

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.1em] text-text";

function groupMedia(media: RequestMediaItem[]) {
  const groups = new Map<string, Array<{ item: RequestMediaItem; index: number }>>();
  media.forEach((item, index) => {
    const key =
      item.group?.trim() ||
      (item.kind === "video" ? "Videos" : "Images");
    const list = groups.get(key) ?? [];
    list.push({ item, index });
    groups.set(key, list);
  });
  return Array.from(groups.entries());
}

function MediaAndNotes({
  detail,
  onOpen,
}: {
  detail: EvaluationRequestDetail;
  onOpen: (index: number) => void;
}) {
  const grouped = useMemo(() => groupMedia(detail.media), [detail.media]);

  return (
    <aside className="flex w-full min-w-0 max-w-full flex-col gap-4 lg:min-h-0 lg:h-full lg:overflow-y-auto lg:overscroll-contain">
      <section className="w-full min-w-0 shrink-0 rounded-xl border border-border/70 bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className={`${labelClass} min-w-0 flex-1 leading-snug`}>
            Coin images & videos
          </h2>
          {detail.media.length > 0 ? (
            <button
              type="button"
              onClick={() => onOpen(0)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-input-bg hover:text-text"
              aria-label="Expand media gallery"
              title="Open gallery"
            >
              <ExpandMediaGalleryIcon className="h-[1.125rem] w-[1.125rem]" />
            </button>
          ) : null}
        </div>

        {detail.media.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-input-bg/40 px-4 py-8 text-center text-sm text-text-muted">
            No media attached to this request.
          </p>
        ) : (
          <div className="space-y-4">
            {grouped.map(([group, items]) => (
              <div key={group}>
                <p className="mb-2 text-xs font-medium text-text-muted">
                  {group}{" "}
                  <span className="text-text-muted/80">({items.length})</span>
                </p>
                <MediaGroupScroller items={items} onOpen={onOpen} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="shrink-0 rounded-xl border border-border/70 bg-surface px-4 py-3.5 shadow-sm">
        <h2 className={labelClass}>User&apos;s notes</h2>
        <p className="mt-2 text-sm leading-relaxed text-text">
          {detail.userNotes}
        </p>
      </section>
    </aside>
  );
}

function RequestBreadcrumb({ displayId }: { displayId: string }) {
  const requestLabel = formatQueueRequestIdLabel(displayId);
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-sm text-text-muted"
    >
      <Link
        href="/expert/queue"
        className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-text"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Queue
      </Link>
      <span aria-hidden className="text-border">
        &gt;
      </span>
      <span className="font-mono font-semibold text-text">{requestLabel}</span>
    </nav>
  );
}

function DeadlineBadge({
  days,
  deadlineAt,
}: {
  days: number;
  deadlineAt: string | null;
}) {
  const remaining = formatDeadlineRemaining(deadlineAt);
  const overdue =
    remaining === "Overdue" || isDeadlineExceeded(deadlineAt);

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 ${
        overdue
          ? "border-expert-status-expired-text/25 bg-expert-status-expired-bg/50"
          : "border-border/70 bg-input-bg/40"
      }`}
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        aria-hidden
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2 2" />
          <path d="M9 2h6" />
        </svg>
      </span>
      <div className="min-w-0 leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
          Deadline
        </p>
        <p
          className={`mt-0.5 text-base font-semibold tabular-nums ${
            overdue ? "text-expert-status-expired-text" : "text-text"
          }`}
        >
          {overdue
            ? "Overdue"
            : remaining === "—"
              ? `${days} ${days === 1 ? "day" : "days"}`
              : remaining}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">
          {formatDeadlineDue(deadlineAt)}
        </p>
      </div>
    </div>
  );
}

function RequestHeader({
  detail,
  formId,
  showSubmit,
  showSubmitButton,
  submitDisabled,
  showDeadlineCard = true,
}: {
  detail: EvaluationRequestDetail;
  formId: string;
  showSubmit: boolean;
  showSubmitButton: boolean;
  submitDisabled: boolean;
  showDeadlineCard?: boolean;
}) {
  return (
    <header className="mb-4 shrink-0">
      <div className="mb-4 flex min-h-10 flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <RequestBreadcrumb displayId={detail.displayId} />
        {showSubmit ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="text-xs font-medium text-text-muted">
              ✓ Auto save on
            </span>
            {showSubmitButton ? (
              <button
                type="submit"
                form={formId}
                disabled={submitDisabled}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit report →
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-surface px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 font-mono text-xs text-text-muted">
            {formatQueueRequestIdLabel(detail.displayId)}
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-text sm:text-[1.35rem]">
            Coin identification & evaluation request
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {formatReceivedOn(detail.receivedAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {showDeadlineCard ? (
            <DeadlineBadge
              days={detail.deadlineDays}
              deadlineAt={detail.deadlineAt}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}

function AcceptPanel({
  accepting,
  acceptDisabled,
  acceptError,
  onAccept,
}: {
  accepting: boolean;
  acceptDisabled: boolean;
  acceptError?: string | null;
  onAccept?: () => void | Promise<void>;
}) {
  const disabled = acceptDisabled || accepting || !onAccept;

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border/70 bg-surface px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-text">
          Ready to evaluate?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          Begin the evaluation to access the form, review the images, and
          complete the report.
        </p>
        {acceptError ? (
          <p className="mt-3 max-w-xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {acceptError}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void onAccept?.()}
          disabled={disabled}
          className="inline-flex items-center justify-center rounded-lg border border-primary bg-transparent px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:border-border disabled:text-text-muted disabled:opacity-60"
        >
          {accepting
            ? "Accepting…"
            : acceptDisabled
              ? "Accepted"
              : "Accept request"}
        </button>
      </div>
    </div>
  );
}

function RequestPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">{children}</div>
  );
}

export function ExpertEvaluationRequestView({
  detail,
  accepting = false,
  acceptError = null,
  showAcceptedToast = false,
  onAccept,
  onDismissToast,
  onSubmitted,
}: ExpertEvaluationRequestViewProps) {
  const router = useRouter();
  const { profile } = useExpertProfile();
  const { subscribeDeadlineMissed } = useExpertSocket();
  const formId = "expert-evaluation-form";
  const [form, setForm] = useState<EvaluationFormState>(() => {
    const local = loadEvaluationDraft(detail.requestId);
    return normalizeEvaluationFormState(
      local ?? createInitialEvaluationFormState(),
    );
  });
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftReportId, setDraftReportId] = useState<string | null>(() => {
    const fromDetail = detail.reportId
      ? normalizeMongoId(detail.reportId)
      : "";
    if (fromDetail) return fromDetail;
    return (
      normalizeMongoId(loadEvaluationDraftReportId(detail.requestId) ?? "") ||
      null
    );
  });
  const [draftSaveState, setDraftSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [hydrated, setHydrated] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showAllFieldErrors, setShowAllFieldErrors] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [submitSuccessOpen, setSubmitSuccessOpen] = useState(false);
  const [leavingAfterSubmit, setLeavingAfterSubmit] = useState(false);
  const [lastSavedFormJson, setLastSavedFormJson] = useState(() =>
    JSON.stringify(form),
  );
  const [deadlineMissedFromSocket, setDeadlineMissedFromSocket] =
    useState(false);
  const [deadlineModalOpen, setDeadlineModalOpen] = useState(false);
  const draftReportIdRef = useRef(draftReportId);
  const saveGenerationRef = useRef(0);
  const formRef = useRef(form);
  const submittedRef = useRef(false);
  const allowNavigationRef = useRef(false);
  const pendingHrefRef = useRef<string | null>(null);
  const hasUnsavedChangesRef = useRef(false);

  // Recompute against a ticking clock so the modal appears while the page stays open.
  const deadlineExceededByTime = useMemo(
    () => isDeadlineExceeded(detail.deadlineAt),
    // nowMs intentionally invalidates this when the scheduled timer fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detail.deadlineAt, nowMs],
  );
  const deadlineExceeded =
    detail.deadlineExceeded ||
    deadlineExceededByTime ||
    deadlineMissedFromSocket;

  // Show modal whenever the request is expired — including already-expired
  // History opens and live transitions. Remount (reopen/refresh) shows it again.
  useEffect(() => {
    if (shouldOpenDeadlineExceededModal(deadlineExceeded)) {
      setDeadlineModalOpen(true);
    }
  }, [deadlineExceeded]);

  // Persist expiry notification once (deduped by requestId in the store).
  useEffect(() => {
    if (!deadlineExceeded || !profile?.id) return;
    void getExpiredRequestNotificationService().recordExpiredRequest(
      profile.id,
      {
        requestId: detail.requestId,
        displayId: detail.displayId,
        expiredAt: new Date().toISOString(),
      },
    );
  }, [
    deadlineExceeded,
    detail.displayId,
    detail.requestId,
    profile?.id,
  ]);

  // Schedule a wake-up when the deadline elapses (and poll near the end).
  useEffect(() => {
    if (!detail.deadlineAt || deadlineExceeded) return;
    const target = new Date(detail.deadlineAt).getTime();
    if (Number.isNaN(target)) return;

    const tick = () => setNowMs(Date.now());
    const remaining = target - Date.now();
    const delay = Math.max(0, Math.min(remaining + 250, 2_147_483_647));
    const timer = window.setTimeout(tick, delay);

    // Fallback poll so a missed/clamped timer still surfaces the modal.
    const intervalMs = remaining <= 60_000 ? 1_000 : 15_000;
    const interval = window.setInterval(tick, intervalMs);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [detail.deadlineAt, deadlineExceeded, nowMs]);

  useEffect(() => {
    return subscribeDeadlineMissed((payload) => {
      const missedId = payload.requestId
        ? normalizeMongoId(payload.requestId)
        : "";
      if (!missedId || missedId !== detail.requestId) return;
      setDeadlineMissedFromSocket(true);
      setNowMs(Date.now());
    });
  }, [detail.requestId, subscribeDeadlineMissed]);

  const requiredFieldsComplete = areRequiredFieldsComplete(form);
  const formIsValid = useMemo(() => isEvaluationFormValid(form), [form]);
  const submitBlocked =
    !detail.canSubmit ||
    submitting ||
    deadlineExceeded ||
    !requiredFieldsComplete ||
    !formIsValid;
  const showSubmitButton = detail.canSubmit && !deadlineExceeded;

  const adoptReportId = (rawId: string | null | undefined) => {
    const id = rawId ? normalizeMongoId(rawId) : "";
    if (!id) return;
    draftReportIdRef.current = id;
    setDraftReportId(id);
    saveEvaluationDraftReportId(detail.requestId, id);
  };

  useEffect(() => {
    draftReportIdRef.current = draftReportId;
  }, [draftReportId]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  // Keep draft id in sync when accept/list finally provides reportId.
  useEffect(() => {
    if (detail.reportId) adoptReportId(detail.reportId);
    // adoptReportId closes over requestId; only re-run when report id arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.reportId, detail.requestId]);

  // Hydrate once when the form becomes editable for this request.
  // Do not re-run when reportId arrives later — that only syncs the id (effect above).
  useEffect(() => {
    if (!detail.canSubmit) {
      setHydrated(true);
      return;
    }

    let cancelled = false;
    setHydrated(false);

    void (async () => {
      try {
        const report = await getReportForRequest(detail.requestId, {
          reportId: detail.reportId || draftReportIdRef.current,
        });
        if (cancelled) return;
        if (report && isDraftReport(report)) {
          const serverForm = reportToFormState(report);
          const localForm = loadEvaluationDraft(detail.requestId);
          const serverFilled = evaluateFormProgress(serverForm).filled;
          const localFilled = localForm
            ? evaluateFormProgress(localForm).filled
            : 0;
          const preferUnsavedLocal =
            localFilled > serverFilled && Boolean(localForm);
          const nextForm = normalizeEvaluationFormState(
            preferUnsavedLocal && localForm ? localForm : serverForm,
          );
          setForm(nextForm);
          // Server snapshot is the persisted baseline; extra local fields stay unsaved.
          setLastSavedFormJson(JSON.stringify(serverForm));
          saveEvaluationDraft(detail.requestId, nextForm);
          adoptReportId(report._id);
          setDraftSaveState(preferUnsavedLocal ? "idle" : "saved");
        } else if (report) {
          // Already submitted — keep id so later writes use PUT, not POST.
          adoptReportId(report._id);
          setLastSavedFormJson(JSON.stringify(formRef.current));
        } else {
          setLastSavedFormJson(JSON.stringify(formRef.current));
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[expert] draft hydrate failed", err);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // reportId intentionally omitted — late id sync uses adoptReportId only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.canSubmit, detail.requestId]);

  // Local autosave always; server draft when at least one field is filled.
  useEffect(() => {
    if (
      !detail.canSubmit ||
      deadlineExceeded ||
      !hydrated ||
      submittedRef.current
    ) {
      return;
    }

    saveEvaluationDraft(detail.requestId, form);

    const { filled } = evaluateFormProgress(form);
    if (filled === 0) return;

    const generation = ++saveGenerationRef.current;
    setDraftSaveState("saving");

    const timer = window.setTimeout(() => {
      void (async () => {
        if (submittedRef.current) return;
        try {
          const report = await saveDraftReport({
            requestId: detail.requestId,
            reportId: draftReportIdRef.current,
            form,
            coinName: detail.coinName,
            attachments: mediaToReportAttachments(detail.media),
          });
          if (generation !== saveGenerationRef.current || submittedRef.current) {
            return;
          }
          adoptReportId(report._id);
          setLastSavedFormJson(JSON.stringify(form));
          setDraftSaveState("saved");
        } catch (err) {
          if (generation !== saveGenerationRef.current) return;
          setDraftSaveState("error");
          if (process.env.NODE_ENV !== "production") {
            console.warn("[expert] draft autosave failed", err);
          }
        }
      })();
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    detail.requestId,
    detail.canSubmit,
    deadlineExceeded,
    detail.coinName,
    detail.media,
    form,
    hydrated,
  ]);

  // Flush draft on leave / tab hide so closing without submit still marks draft.
  useEffect(() => {
    if (!detail.canSubmit || deadlineExceeded) return;

    const flushDraft = () => {
      if (submittedRef.current) return;
      const current = formRef.current;
      saveEvaluationDraft(detail.requestId, current);

      const reportId = draftReportIdRef.current;
      const hasContent = evaluateFormProgress(current).filled > 0;
      // Avoid Strict Mode / empty unmount POSTs that 400 or create duplicate reports.
      // Only hit the server when we already have a report id, or there is form content.
      if (!reportId && !hasContent) return;

      void ensureDraftReport({
        requestId: detail.requestId,
        reportId,
        form: current,
        coinName: detail.coinName,
        attachments: mediaToReportAttachments(detail.media),
      })
        .then((report) => {
          if (submittedRef.current) return;
          adoptReportId(report._id);
        })
        .catch(() => {
          // best-effort flush
        });
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushDraft();
    };

    window.addEventListener("pagehide", flushDraft);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flushDraft);
      document.removeEventListener("visibilitychange", onVisibility);
      flushDraft();
    };
  }, [detail.canSubmit, deadlineExceeded, detail.requestId, detail.coinName, detail.media]);

  const formJson = useMemo(() => JSON.stringify(form), [form]);
  const hasUnsavedChanges =
    detail.canSubmit &&
    hydrated &&
    !submittedRef.current &&
    !deadlineExceeded &&
    (draftSaveState === "error" ||
      draftSaveState === "saving" ||
      formJson !== lastSavedFormJson);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  const requestLeaveNavigation = useCallback((href: string) => {
    pendingHrefRef.current = href;
    setLeaveModalOpen(true);
  }, []);

  const stayOnPage = useCallback(() => {
    pendingHrefRef.current = null;
    setLeaveModalOpen(false);
  }, []);

  const proceedWithLeave = useCallback(() => {
    const href = pendingHrefRef.current;
    pendingHrefRef.current = null;
    setLeaveModalOpen(false);
    allowNavigationRef.current = true;
    if (href) {
      router.push(href);
    }
  }, [router]);

  const saveDraftAndLeave = useCallback(async () => {
    if (leaveSaving) return;
    setLeaveSaving(true);
    try {
      const current = formRef.current;
      saveEvaluationDraft(detail.requestId, current);
      const report = await saveDraftReport({
        requestId: detail.requestId,
        reportId: draftReportIdRef.current,
        form: current,
        coinName: detail.coinName,
        attachments: mediaToReportAttachments(detail.media),
      });
      adoptReportId(report._id);
      setLastSavedFormJson(JSON.stringify(current));
      setDraftSaveState("saved");
      proceedWithLeave();
    } catch (err) {
      setDraftSaveState("error");
      if (process.env.NODE_ENV !== "production") {
        console.warn("[expert] leave save-as-draft failed", err);
      }
    } finally {
      setLeaveSaving(false);
    }
  }, [
    detail.coinName,
    detail.media,
    detail.requestId,
    leaveSaving,
    proceedWithLeave,
  ]);

  // Block in-app navigation and tab close when the evaluation form has unsaved work.
  useEffect(() => {
    if (!detail.canSubmit || !hydrated) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChangesRef.current || allowNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (!hasUnsavedChangesRef.current || allowNavigationRef.current) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const hrefAttr = anchor.getAttribute("href");
      if (!hrefAttr || hrefAttr.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const next = `${url.pathname}${url.search}${url.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next === current) return;

      event.preventDefault();
      event.stopPropagation();
      requestLeaveNavigation(next);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [detail.canSubmit, hydrated, requestLeaveNavigation]);

  const setField = (key: string, value: string) => {
    if (deadlineExceeded) return;
    setForm((prev) => {
      const nextForm = { ...prev, [key]: value };
      // Keep ref in sync before any same-tick blur validation (e.g. <select>).
      formRef.current = nextForm;
      setFieldErrors((current) => {
        if (!showAllFieldErrors && !current[key]) return current;
        const next = { ...current };
        const error = validateEvaluationField(
          key,
          nextForm[key] ?? "",
          nextForm,
        );
        if (error) next[key] = error;
        else delete next[key];
        return next;
      });
      return nextForm;
    });
  };

  const handleFieldBlur = (key: string) => {
    if (deadlineExceeded) return;
    const currentForm = formRef.current;
    setFieldErrors((current) => {
      const next = { ...current };
      const error = validateEvaluationField(
        key,
        currentForm[key] ?? "",
        currentForm,
      );
      if (error) next[key] = error;
      else delete next[key];
      return next;
    });
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail.canSubmit || submitting) return;
    if (deadlineExceeded) {
      setSubmitError(EXPIRED_REQUEST_DETAIL_MESSAGE);
      return;
    }

    const errors = validateEvaluationForm(form);
    if (Object.keys(errors).length > 0) {
      setShowAllFieldErrors(true);
      setFieldErrors(errors);
      setSubmitError("Please fix the highlighted fields before submitting.");
      const firstInvalidKey = EVALUATION_FORM_SECTIONS.flatMap((section) =>
        section.fields.map((field) => field.key),
      ).find((key) => errors[key]);
      if (firstInvalidKey) {
        document
          .getElementById(
            `${EVALUATION_FORM_SECTIONS.find((section) =>
              section.fields.some((field) => field.key === firstInvalidKey),
            )?.id}-${firstInvalidKey}`,
          )
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setShowAllFieldErrors(false);
    setFieldErrors({});
    setSubmitError(null);
    setSubmitConfirmOpen(true);
  }

  async function confirmSubmitReport() {
    if (!detail.canSubmit || submitting || deadlineExceeded) return;

    setSubmitting(true);
    setSubmitError(null);
    // Prevent a stale autosave from racing the final submit.
    saveGenerationRef.current += 1;
    submittedRef.current = true;
    hasUnsavedChangesRef.current = false;
    allowNavigationRef.current = true;
    try {
      await submitReport(detail.requestId, {
        form,
        attachments: mediaToReportAttachments(detail.media),
        reportId: draftReportIdRef.current,
      });
      clearEvaluationDraft(detail.requestId);
      setSubmitConfirmOpen(false);
      setSubmitSuccessOpen(true);
    } catch (err) {
      submittedRef.current = false;
      allowNavigationRef.current = false;
      setSubmitError(
        err instanceof Error ? err.message : "Unable to submit report.",
      );
      setSubmitConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (detail.unavailable) {
    return (
      <RequestPageFrame>
        <RequestHeader
          detail={detail}
          formId={formId}
          showSubmit={false}
          showSubmitButton={false}
          submitDisabled
        />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className={`${evaluationRequestScrollGridClass} min-h-0 flex-1 overflow-y-auto overscroll-contain`}>
            <MediaAndNotes detail={detail} onOpen={setLightbox} />
            <div className="rounded-xl border border-border/70 bg-surface p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-text">
                    Ready to evaluate?
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    Begin the evaluation to access the form, review the images,
                    and complete the report.
                  </p>
                </div>
                <Link
                  href="/expert/queue"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-primary px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                >
                  Back to Queue
                </Link>
              </div>

              <div
                role="status"
                className="mt-4 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950"
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-800 text-xs font-bold"
                  aria-hidden
                >
                  i
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Request unavailable</p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                    Another expert has already accepted this request. Please
                    return to the queue to pick a different one.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {lightbox != null ? (
          <EvaluationMediaLightbox
            items={detail.media}
            index={lightbox}
            onClose={() => setLightbox(null)}
            onIndexChange={setLightbox}
          />
        ) : null}
      </RequestPageFrame>
    );
  }

  // Pre-accept: review media first, then accept.
  if (detail.needsAccept) {
    return (
      <RequestPageFrame>
        <RequestHeader
          detail={detail}
          formId={formId}
          showSubmit={false}
          showSubmitButton={false}
          submitDisabled
        />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className={`${evaluationRequestScrollGridClass} min-h-0 flex-1 overflow-y-auto overscroll-contain`}>
            <MediaAndNotes detail={detail} onOpen={setLightbox} />
            <AcceptPanel
              accepting={accepting}
              acceptDisabled={false}
              acceptError={acceptError}
              onAccept={onAccept}
            />
          </div>
        </div>

        {lightbox != null ? (
          <EvaluationMediaLightbox
            items={detail.media}
            index={lightbox}
            onClose={() => setLightbox(null)}
            onIndexChange={setLightbox}
          />
        ) : null}
      </RequestPageFrame>
    );
  }

  // Accepted / in progress — evaluation form.
  return (
    <>
      <RequestPageFrame>
        <RequestHeader
          detail={detail}
          formId={formId}
          showSubmit
          showSubmitButton={showSubmitButton}
          submitDisabled={submitBlocked}
        />

        <div className={evaluationRequestGridClass}>
          <MediaAndNotes detail={detail} onOpen={setLightbox} />

          <div className={evaluationFormColumnClass}>
            <div className={`${evaluationFormPanelWrapClass} shrink-0`}>
              <EvaluationProgressStepper form={form} />
            </div>

            {submitError ? (
              <p className={`${evaluationFormPanelWrapClass} shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800`}>
                {submitError}
              </p>
            ) : null}

            {deadlineExceeded ? (
              <p
                role="status"
                className={`${evaluationFormPanelWrapClass} shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950`}
              >
                {EXPIRED_REQUEST_DETAIL_MESSAGE}
              </p>
            ) : null}

            <div className="min-w-0 flex-1 rounded-xl bg-surface">
              <form
                id={formId}
                className="flex flex-col"
                onSubmit={handleSubmit}
              >
                <div className="shrink-0 px-4 py-4 sm:px-5">
                  <h2 className="text-xl font-semibold tracking-tight text-text">
                    Evaluation form
                  </h2>
                </div>

                <div className={`${evaluationFormPanelWrapClass} px-4 py-5 sm:px-5`}>
                  <EvaluationFormPanel
                    form={form}
                    fieldErrors={fieldErrors}
                    onFieldChange={setField}
                    onFieldBlur={handleFieldBlur}
                    readOnly={deadlineExceeded}
                  />
                </div>

                <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between gap-4 bg-surface/95 px-4 py-3 backdrop-blur-sm sm:px-5">
                  <span className="text-xs font-medium text-text-muted">
                    {deadlineExceeded
                      ? "View only — this request has expired"
                      : draftSaveState === "saving"
                        ? "Saving draft…"
                        : draftSaveState === "error"
                          ? "Draft save failed — will retry"
                          : draftSaveState === "saved" ||
                              evaluateFormProgress(form).filled > 0
                            ? "✓ Draft saved"
                            : "✓ Auto save on"}
                  </span>
                  {showSubmitButton ? (
                    <button
                      type="submit"
                      disabled={submitBlocked}
                      className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? "Submitting…" : "Submit report →"}
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
          </div>
        </div>
      </RequestPageFrame>

      <ExpertDeadlineExceededModal
        open={deadlineModalOpen}
        onGoBack={() => {
          // Notification already recorded on expiry; toast flushes after leave.
          if (profile?.id) {
            void getExpiredRequestNotificationService().recordExpiredRequest(
              profile.id,
              {
                requestId: detail.requestId,
                displayId: detail.displayId,
                expiredAt: new Date().toISOString(),
              },
            );
          }
          setDeadlineModalOpen(false);
          allowNavigationRef.current = true;
          hasUnsavedChangesRef.current = false;
          router.push("/expert/history");
        }}
      />

      <ExpertLeaveWithoutSavingModal
        open={leaveModalOpen}
        saving={leaveSaving}
        onStay={stayOnPage}
        onLeave={proceedWithLeave}
        onSaveAsDraft={saveDraftAndLeave}
      />

      <ExpertSubmitConfirmationModal
        open={submitConfirmOpen}
        submitting={submitting}
        onCancel={() => {
          if (!submitting) setSubmitConfirmOpen(false);
        }}
        onConfirm={confirmSubmitReport}
      />

      <ExpertSubmitSuccessModal
        open={submitSuccessOpen}
        leaving={leavingAfterSubmit}
        onContinue={async () => {
          if (leavingAfterSubmit) return;
          setLeavingAfterSubmit(true);
          try {
            await onSubmitted?.();
          } catch {
            setLeavingAfterSubmit(false);
          }
        }}
      />

      <ExpertToast
        open={showAcceptedToast}
        message="Evaluation request accepted successfully"
        onClose={onDismissToast ?? (() => {})}
      />

      {lightbox != null ? (
        <EvaluationMediaLightbox
          items={detail.media}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndexChange={setLightbox}
        />
      ) : null}
    </>
  );
}
