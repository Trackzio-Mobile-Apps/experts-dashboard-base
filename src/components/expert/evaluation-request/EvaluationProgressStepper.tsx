"use client";

import {
  evaluateFormProgress,
  EVALUATION_FORM_SECTIONS,
  getSectionStepState,
  type SectionStepState,
} from "@/lib/expert/evaluationForm";
import type { EvaluationFormState } from "@/lib/expert/types";
import { useMemo } from "react";

function stepCircleClass(state: SectionStepState): string {
  switch (state) {
    case "complete":
      return "bg-expert-action-green text-white shadow-sm";
    case "in_progress":
      return "bg-expert-action-green text-white shadow-sm";
    default:
      return "border border-border bg-input-bg text-text-muted";
  }
}

type EvaluationProgressStepperProps = {
  form: EvaluationFormState;
};

export function EvaluationProgressStepper({
  form,
}: EvaluationProgressStepperProps) {
  const { percent } = useMemo(() => evaluateFormProgress(form), [form]);

  return (
    <div className="shrink-0 rounded-xl border border-border/70 bg-surface p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text">
          Form progress
        </p>
        <p className="text-sm font-semibold tabular-nums text-text">
          {percent}% complete
        </p>
      </div>
      <div
        className="mx-auto flex max-w-3xl gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3 lg:max-w-none lg:justify-between lg:overflow-visible xl:gap-4 [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {EVALUATION_FORM_SECTIONS.map((sec, i) => {
          const state = getSectionStepState(form, sec.id);
          return (
            <div
              key={sec.id}
              role="listitem"
              className="relative flex w-[5.5rem] shrink-0 flex-col items-center gap-1.5 text-center sm:w-[6.5rem] lg:w-auto lg:min-w-[5.5rem] lg:flex-1 lg:max-w-[7.5rem]"
            >
              {i > 0 ? (
                <span className="absolute right-1/2 top-4 hidden h-px w-full -translate-y-1/2 bg-border lg:block" />
              ) : null}
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200 ${stepCircleClass(state)}`}
                aria-label={
                  state === "complete"
                    ? `${sec.stepLabel} complete`
                    : state === "in_progress"
                      ? `${sec.stepLabel} in progress`
                      : `${sec.stepLabel} pending`
                }
              >
                {state === "complete" ? "✓" : i + 1}
              </span>
              <span
                className={`max-w-[6.5rem] text-[10px] font-semibold uppercase leading-tight tracking-wide sm:text-[11px] ${
                  state === "pending"
                    ? "text-text-muted"
                    : "text-expert-action-green-text"
                }`}
              >
                {sec.stepLabel}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 rounded-lg bg-input-bg/70 px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text">
          Unable to complete this request?
        </p>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">
          After accepting this request, please reassign it within the first 8
          hours if you&apos;re unable to complete it.
        </p>
      </div>
    </div>
  );
}
