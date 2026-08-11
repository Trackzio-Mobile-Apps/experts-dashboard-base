"use client";

import { Link, useRouter, usePathname } from "@/lib/router";
import {
  panelListPageClass,
  panelRequestDetailShellClass,
  panelSidebarClass,
  panelSidebarFooterClass,
  panelSidebarInnerClass,
} from "./layout/panelLayout";

import { ExpertNavIcon } from "@/components/expert/ExpertNavIcons";
import { ExpertLogoutConfirmModal } from "@/components/expert/ExpertLogoutConfirmModal";
import { ExpertUnavailabilityConfirmModal } from "@/components/expert/ExpertUnavailabilityConfirmModal";
import { ExpertAvatar } from "@/components/expert/ExpertAvatar";
import { themeConfig } from "@/config";
import type { ExpertNavCounts, ExpertUserSummary } from "@/lib/expert/types";
import { clearExpertSession } from "@/lib/expert/authService";
import {
  ExpertProfileError,
  updateMyAvailability,
} from "@/lib/expert/profileService";
import { useExpertProfile } from "@/lib/expert/expertProfileStore";
import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useState } from "react";

const NAV = [
  {
    href: "/expert/queue",
    label: "Queue",
    key: "queue" as const,
    icon: "queue" as const,
  },
  {
    href: "/expert/drafts",
    label: "Drafts",
    key: "drafts" as const,
    icon: "drafts" as const,
  },
  {
    href: "/expert/history",
    label: "History",
    key: null,
    icon: "history" as const,
  },
  {
    href: "/expert/profile",
    label: "My Profile",
    key: null,
    icon: "profile" as const,
  },
] as const;

type ExpertPanelShellProps = {
  user: ExpertUserSummary;
  navCounts: ExpertNavCounts;
  status?: string;
  children: ReactNode;
};

function SidebarLogo() {
  const { brand } = themeConfig;
  return (
    <div className="flex items-center gap-2.5 xl:gap-3.5 2xl:gap-4">
      <img
        src={brand.logoSrc}
        alt={brand.logoAlt}
        width={48}
        height={48}
        className="h-11 w-11 shrink-0 rounded-[10px] bg-black object-cover shadow-sm ring-1 ring-white/25 xl:h-12 xl:w-12 xl:rounded-xl 2xl:h-14 2xl:w-14"
      />
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-semibold tracking-tight xl:text-base 2xl:text-lg">
          {brand.name}
        </p>
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-expert-sidebar-muted xl:text-[10px] 2xl:text-xs">
          {brand.panelSubtitle}
        </p>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function AvailabilityToggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Availability"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/15 px-3 py-2 text-left transition-colors hover:bg-white/20 disabled:cursor-wait disabled:opacity-70 xl:px-4 xl:py-2.5 2xl:py-3"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-expert-available" : "bg-white/20"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[1.125rem]" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className="text-sm font-medium text-expert-sidebar-foreground xl:text-[15px] 2xl:text-base">
        {checked ? "Available" : "Unavailable"}
      </span>
    </button>
  );
}

type ExpertNavInnerProps = {
  user: ExpertUserSummary;
  navCounts: ExpertNavCounts;
  status?: string;
  onNavigate?: () => void;
  onRequestLogout: () => void;
};

function statusLabel(status?: string): string {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function ExpertNavInner({
  user,
  navCounts,
  status,
  onNavigate,
  onRequestLogout,
}: ExpertNavInnerProps) {
  const pathname = usePathname();
  const { profile, hydrateProfile } = useExpertProfile();
  const [isAvailable, setIsAvailable] = useState(
    profile?.isAvailableForRequests ?? true,
  );
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [unavailabilityConfirmOpen, setUnavailabilityConfirmOpen] =
    useState(false);

  useEffect(() => {
    if (profile?.isAvailableForRequests != null) {
      setIsAvailable(profile.isAvailableForRequests);
    }
  }, [profile?.isAvailableForRequests]);

  const handleAvailabilityChange = useCallback(
    async (next: boolean) => {
      if (isSavingAvailability) return;

      const previous = isAvailable;
      setIsAvailable(next);
      setIsSavingAvailability(true);

      try {
        const updated = await updateMyAvailability(next);
        hydrateProfile({
          ...updated,
          isAvailableForRequests:
            typeof updated.isAvailableForRequests === "boolean"
              ? updated.isAvailableForRequests
              : next,
        });
        setIsAvailable(
          typeof updated.isAvailableForRequests === "boolean"
            ? updated.isAvailableForRequests
            : next,
        );
        setUnavailabilityConfirmOpen(false);
      } catch (err) {
        setIsAvailable(previous);
        if (err instanceof ExpertProfileError && err.code === "unauthorized") {
          return;
        }
        window.alert(
          err instanceof Error
            ? err.message
            : "Unable to update availability. Please try again.",
        );
      } finally {
        setIsSavingAvailability(false);
      }
    },
    [hydrateProfile, isAvailable, isSavingAvailability],
  );

  const requestAvailabilityChange = useCallback(
    (next: boolean) => {
      if (isSavingAvailability) return;

      // Turning off requires explicit confirmation before the API call.
      if (!next) {
        setUnavailabilityConfirmOpen(true);
        return;
      }

      void handleAvailabilityChange(true);
    },
    [handleAvailabilityChange, isSavingAvailability],
  );

  const closeUnavailabilityConfirm = useCallback(() => {
    if (isSavingAvailability) return;
    setUnavailabilityConfirmOpen(false);
  }, [isSavingAvailability]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ExpertUnavailabilityConfirmModal
        open={unavailabilityConfirmOpen}
        isSaving={isSavingAvailability}
        onCancel={closeUnavailabilityConfirm}
        onConfirm={() => {
          void handleAvailabilityChange(false);
        }}
      />

      <div className="mb-6 xl:mb-8 2xl:mb-10">
        <SidebarLogo />
      </div>

      <nav className="flex flex-1 flex-col gap-1 xl:gap-1.5" aria-label="Expert panel">
        {NAV.map((item) => {
          const active =
            item.href === "/expert/queue"
              ? pathname === "/expert/queue" ||
                pathname.startsWith("/expert/queue/")
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const count =
            item.key === "queue"
              ? navCounts.queue
              : item.key === "drafts"
                ? navCounts.drafts
                : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors xl:gap-4 xl:rounded-xl xl:px-4 xl:py-3 xl:text-[15px] 2xl:px-5 2xl:py-3.5 2xl:text-base ${
                active
                  ? "bg-white/20 text-expert-sidebar-foreground shadow-sm"
                  : "text-expert-sidebar-muted hover:bg-white/6 hover:text-expert-sidebar-foreground"
              }`}
            >
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center opacity-90 xl:h-5 xl:w-5 2xl:h-[22px] 2xl:w-[22px] [&_img]:h-full [&_img]:w-full [&_svg]:h-full [&_svg]:w-full">
                <ExpertNavIcon kind={item.icon} />
              </span>
              <span className="flex-1">{item.label}</span>
              {count != null && count > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-expert-nav-badge px-1.5 text-[11px] font-bold text-white xl:h-6 xl:min-w-6 xl:px-2 xl:text-xs">
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className={panelSidebarFooterClass}>
        <div className="flex items-center gap-3 px-1 xl:gap-3.5">
          <ExpertAvatar
            profilePicture={user.profilePicture}
            initials={user.initials}
            name={[user.firstName, user.lastName].filter(Boolean).join(" ")}
            size="sm"
            fallbackClassName="bg-white/15 text-expert-sidebar-foreground"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold xl:text-sm 2xl:text-[15px]">
              {user.firstName} {user.lastName}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-expert-sidebar-muted xl:text-[13px]">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  status && status !== "active"
                    ? "bg-expert-status-inactive"
                    : isAvailable
                      ? "bg-expert-status-active"
                      : "bg-expert-status-inactive"
                }`}
                aria-hidden
              />
              {status && status !== "active"
                ? statusLabel(status)
                : isAvailable
                  ? "Available"
                  : "Unavailable"}
            </p>
          </div>
        </div>

        <AvailabilityToggle
          checked={isAvailable}
          disabled={isSavingAvailability}
          onChange={requestAvailabilityChange}
        />

        <button
          type="button"
          onClick={onRequestLogout}
          className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm font-medium text-expert-sidebar-foreground transition-colors hover:border-white/25 hover:bg-black/30 xl:px-4 xl:py-2.5 xl:text-[15px] 2xl:py-3 2xl:text-base"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export function ExpertPanelShell({
  user,
  navCounts,
  status,
  children,
}: ExpertPanelShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuId = useId();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const openLogoutConfirm = useCallback(() => {
    closeMenu();
    setLogoutOpen(true);
  }, [closeMenu]);

  const closeLogoutConfirm = useCallback(() => {
    if (isLoggingOut) return;
    setLogoutOpen(false);
  }, [isLoggingOut]);

  const confirmLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await clearExpertSession();
      router.push("/expert/login");
    } finally {
      setIsLoggingOut(false);
      setLogoutOpen(false);
    }
  }, [router]);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu]);

  const isRequestDetail =
    /^\/expert\/queue\/[^/]+\/?$/.test(pathname);

  if (isRequestDetail) {
    return (
      <main className="flex h-dvh flex-col overflow-hidden bg-expert-dashboard-canvas px-4 py-4 sm:px-6 lg:px-8 lg:py-5 xl:px-10 2xl:px-12">
        <div className={panelRequestDetailShellClass}>
          {children}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-expert-dashboard-canvas">
      <ExpertLogoutConfirmModal
        open={logoutOpen}
        isLoggingOut={isLoggingOut}
        onCancel={closeLogoutConfirm}
        onConfirm={() => {
          void confirmLogout();
        }}
      />

      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-expert-sidebar px-4 text-expert-sidebar-foreground shadow-sm lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src={themeConfig.brand.logoSrc}
            alt={themeConfig.brand.logoAlt}
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-[10px] bg-black object-cover ring-1 ring-white/25"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight">
              {themeConfig.brand.name}
            </p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-expert-sidebar-muted">
              {themeConfig.brand.panelSubtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/20 text-expert-sidebar-foreground transition-colors hover:bg-white/10"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label="Open navigation menu"
          onClick={() => setMenuOpen(true)}
        >
          <MenuIcon />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:items-stretch">
        <aside className={panelSidebarClass}>
          <div className={panelSidebarInnerClass}>
            <ExpertNavInner
              user={user}
              navCounts={navCounts}
              status={status}
              onRequestLogout={openLogoutConfirm}
            />
          </div>
        </aside>

        {menuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] lg:hidden"
              aria-label="Close menu"
              onClick={closeMenu}
            />
            <aside
              id={menuId}
              className="fixed inset-y-0 left-0 z-50 flex w-[min(100%,15rem)] flex-col border-r border-white/10 bg-expert-sidebar text-expert-sidebar-foreground shadow-2xl lg:hidden"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
                <span className="text-sm font-semibold tracking-tight">
                  Menu
                </span>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-sm text-expert-sidebar-muted transition-colors hover:bg-white/10 hover:text-expert-sidebar-foreground"
                  aria-label="Close menu"
                  onClick={closeMenu}
                >
                  ✕
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6 pt-4">
                <ExpertNavInner
                  user={user}
                  navCounts={navCounts}
                  status={status}
                  onNavigate={closeMenu}
                  onRequestLogout={openLogoutConfirm}
                />
              </div>
            </aside>
          </>
        ) : null}

        <div className="min-h-0 min-w-0 flex-1 lg:min-h-screen">
          <div className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pt-8 xl:px-10 2xl:px-12">
            <div className={panelListPageClass}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
