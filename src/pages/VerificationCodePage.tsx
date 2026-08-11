import {
  AuthCard,
  AuthLayout,
  BackToSignInLink,
  InputGroup,
  Logo,
  PrimaryButton,
  ResendTextButton,
} from "@/components/auth";

export default function VerificationCodePage() {
  return (
    <AuthLayout>
      <AuthCard>
        <Logo className="mb-10 self-start" />

        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            Verification code
          </h1>
          <p className="text-sm leading-relaxed text-text-muted">
            Check your email! We sent you a verification code.
          </p>
        </div>

        <form className="space-y-6" action="#" method="post">
          <InputGroup
            label="Verification code"
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••••"
            maxLength={6}
            pattern="[0-9]*"
            className="text-left"
            inputClassName="py-3 text-center font-mono text-lg tracking-[0.35em] placeholder:tracking-[0.35em]"
          />

          <p className="text-center text-sm text-text-muted">
            Didn&apos;t receive it?{" "}
            <ResendTextButton>Tap to resend</ResendTextButton>
          </p>

          <PrimaryButton type="submit">Verify</PrimaryButton>
        </form>

        <BackToSignInLink className="mt-12" />
      </AuthCard>
    </AuthLayout>
  );
}
