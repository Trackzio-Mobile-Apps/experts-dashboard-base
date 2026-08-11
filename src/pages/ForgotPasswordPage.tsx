import {
  AuthCard,
  AuthLayout,
  BackToSignInLink,
  InputGroup,
  Logo,
  PrimaryButton,
} from "@/components/auth";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <Logo className="mb-8" />

        <div className="mb-8 space-y-1">
          {/* <h1 className="text-2xl font-semibold tracking-tight text-text">
            Forgot password?
          </h1> */}
          <p className="text-sm leading-relaxed text-text-muted">
            No worries, we&apos;ll send you reset instructions to your email.
          </p>
        </div>

        <form className="space-y-6" action="/check-email" method="get">
          <InputGroup
            label="Email"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />

          <PrimaryButton type="submit">Reset password</PrimaryButton>
        </form>

        <BackToSignInLink className="mt-8" />
      </AuthCard>
    </AuthLayout>
  );
}
