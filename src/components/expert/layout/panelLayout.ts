/**
 * Shared responsive layout classes for the expert panel.
 * Keeps list pages and evaluation request layouts consistent across breakpoints.
 */

/** Desktop sidebar — scales with viewport on large screens. */
export const panelSidebarClass =
  "hidden shrink-0 flex-col border-white/10 bg-expert-sidebar text-expert-sidebar-foreground lg:sticky lg:top-0 lg:z-30 lg:flex lg:h-screen lg:max-h-screen lg:w-64 lg:overflow-y-auto lg:border-r xl:w-72 2xl:w-80";

export const panelSidebarInnerClass =
  "flex flex-1 flex-col px-5 pb-4 pt-6 xl:px-7 xl:pb-5 xl:pt-8 2xl:px-8 2xl:pb-6 2xl:pt-10";

export const panelSidebarFooterClass =
  "-mx-5 mt-auto space-y-2 border-t border-white/15 px-5 pt-3 xl:-mx-7 xl:space-y-3 xl:px-7 xl:pt-5 2xl:-mx-8 2xl:px-8";

/** Max readable width for queue, drafts, history, profile list pages. */
export const panelListPageClass =
  "mx-auto w-full max-w-7xl 2xl:max-w-[90rem]";

/** Request detail shell — centered column with room on ultrawide. */
export const panelRequestDetailShellClass =
  "mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col xl:max-w-[90rem] 2xl:max-w-[96rem]";

/** Media sidebar + form/content two-column grid (evaluation request pages). */
export const evaluationRequestGridClass =
  "grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:overflow-hidden lg:gap-5 xl:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)] xl:gap-6 2xl:grid-cols-[minmax(20rem,28rem)_minmax(0,52rem)_minmax(0,1fr)] 2xl:gap-8";

/** Pre-accept / unavailable layouts (no sticky overflow split). */
export const evaluationRequestScrollGridClass =
  "grid gap-5 pb-2 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:items-start lg:gap-5 xl:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)] xl:gap-6 2xl:grid-cols-[minmax(20rem,28rem)_minmax(0,52rem)_minmax(0,1fr)] 2xl:gap-8";

/** Right column on evaluation pages — form, stepper, errors. */
export const evaluationFormColumnClass =
  "flex min-h-0 min-w-0 flex-col gap-3 overflow-visible lg:overflow-y-auto lg:overscroll-contain lg:pe-1 2xl:max-w-[52rem]";

/** Inner form panel — cap field width on large screens. */
export const evaluationFormPanelWrapClass =
  "mx-auto w-full min-w-0 max-w-4xl xl:max-w-5xl";

/** Queue / draft row — coin, metadata, actions. */
export const queueRowGridClass =
  "grid grid-cols-1 gap-4 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-x-6 lg:gap-y-4";
