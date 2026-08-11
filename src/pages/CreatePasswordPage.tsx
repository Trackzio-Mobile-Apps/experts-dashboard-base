import {
  AuthCard,
  AuthLayout,
  BackToSignInLink,
  InputGroup,
  Logo,
  PrimaryButton,
} from "@/components/auth";

export default function CreatePasswordPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <Logo className="mb-8 self-start" />

        <div className="mb-8 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            Create new password
          </h1>
          <p className="text-sm leading-relaxed text-text-muted">
            Create a strong password with at least 8 characters.
          </p>
        </div>

        <form className="space-y-5" action="#" method="post">
          <InputGroup
            label="New password"
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            required
          />
          <InputGroup
            label="Re-enter new password"
            id="password-confirm"
            name="password_confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            required
          />

          <PrimaryButton type="submit">Submit</PrimaryButton>
        </form>

        <BackToSignInLink className="mt-10" />
      </AuthCard>
    </AuthLayout>
  );
}
