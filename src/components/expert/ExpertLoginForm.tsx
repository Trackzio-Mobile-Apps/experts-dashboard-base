"use client";

import {
  InputGroup,
  PasswordInputGroup,
  PrimaryButton,
} from "@/components/auth";
import {
  clearExpertAccountDisabled,
  isExpertAccountDisabled,
} from "@/lib/expert/apiClient";
import {
  clearExpertSession,
  ExpertLoginError,
  login,
} from "@/lib/expert/authService";
import {
  EVALUATION_DUE_SOON_PROMPT_KEY,
} from "@/lib/expert/constants";
import { useRouter } from "@/lib/router";
import { useEffect, useState, type FormEvent } from "react";

const alertClass =
  "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800";

const invalidFieldClass =
  "ring-2 ring-[#FF9175] bg-[#FFF3F0] focus:ring-[#FF9175]/20";

const labelFieldClass =
  "[&_label]:text-xs [&_label]:font-bold [&_label]:leading-none [&_label]:text-[#555557]";

export function ExpertLoginForm() {
  const router = useRouter();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [accountDisabled, setAccountDisabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void clearExpertSession();

    if (isExpertAccountDisabled()) {
      setAccountDisabled(true);
      clearExpertAccountDisabled();
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError(null);
    setPasswordError(null);
    setAccountDisabled(false);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    let hasFieldError = false;
    if (!email) {
      setEmailError("Email is required");
      hasFieldError = true;
    }
    if (!password) {
      setPasswordError("Password is required");
      hasFieldError = true;
    }
    if (hasFieldError) return;

    setIsSubmitting(true);

    try {
      await login(email, password);
      window.sessionStorage.setItem("coinzy_expert_login_success", "1");
      window.sessionStorage.setItem(EVALUATION_DUE_SOON_PROMPT_KEY, "1");
      router.replace("/expert/queue");
    } catch (err) {
      if (err instanceof ExpertLoginError) {
        if (err.status === 403) {
          setAccountDisabled(true);
        } else {
          // Auth failure — show under password (LinkedIn-style), same API message.
          setPasswordError(err.message);
        }
      } else {
        setPasswordError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className={`space-y-5 ${labelFieldClass}`}
      onSubmit={handleSubmit}
      noValidate
    >
      {accountDisabled ? (
        <p className={alertClass} role="alert">
          Your expert account is not active. Contact support if you need access.
        </p>
      ) : null}

      <InputGroup
        label="Email"
        id="expert-email"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="you@example.com"
        required
        inputTone="muted"
        error={emailError ?? undefined}
        aria-invalid={emailError ? true : undefined}
        inputClassName={emailError ? invalidFieldClass : undefined}
        onChange={() => {
          if (emailError) setEmailError(null);
        }}
      />
      <PasswordInputGroup
        label="Password"
        id="expert-password"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
        inputTone="muted"
        error={passwordError ?? undefined}
        aria-invalid={passwordError ? true : undefined}
        inputClassName={passwordError ? invalidFieldClass : undefined}
        onChange={() => {
          if (passwordError) setPasswordError(null);
        }}
      />

      <PrimaryButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </PrimaryButton>
    </form>
  );
}
