import {
  AuthCard,
  AuthLayout,
  ExpertiseChips,
  FormSectionHeading,
  InputGroup,
  Logo,
  PrimaryButton,
  TextLink,
  TextareaGroup,
} from "@/components/auth";

export default function SignUpPage() {
  return (
    <AuthLayout>
      <AuthCard className="max-w-2xl">
        <Logo className="mb-8 self-start" />

        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            Create expert account
          </h1>
          <p className="text-sm leading-relaxed text-text-muted">
            Set up your profile to start receiving evaluation requests.
          </p>
        </div>

        <form className="space-y-10" action="#" method="post">
          <section className="space-y-5">
            <FormSectionHeading>Personal information</FormSectionHeading>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputGroup
                label="First name"
                id="firstName"
                name="first_name"
                type="text"
                autoComplete="given-name"
                placeholder="First name"
                labelUppercase
                inputTone="surface"
                required
              />
              <InputGroup
                label="Last name"
                id="lastName"
                name="last_name"
                type="text"
                autoComplete="family-name"
                placeholder="Last name"
                labelUppercase
                labelHint="(hidden from users)"
                inputTone="surface"
                required
              />
              <InputGroup
                label="Age"
                id="age"
                name="age"
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                placeholder="e.g. 35"
                labelUppercase
                inputTone="surface"
                required
              />
              <InputGroup
                label="Country"
                id="country"
                name="country"
                type="text"
                autoComplete="country-name"
                placeholder="Country"
                labelUppercase
                inputTone="surface"
                required
              />
            </div>

            <InputGroup
              label="Email"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              labelUppercase
              inputTone="surface"
              required
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputGroup
                label="Password"
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={8}
                labelUppercase
                inputTone="surface"
                required
              />
              <InputGroup
                label="Confirm"
                id="passwordConfirm"
                name="password_confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={8}
                labelUppercase
                inputTone="surface"
                required
              />
            </div>
          </section>

          <section className="space-y-5">
            <FormSectionHeading>Expertise &amp; bio</FormSectionHeading>

            <ExpertiseChips />

            <TextareaGroup
              label="PROFESSIONAL BIO (max 50 words)"
              id="bio"
              name="bio"
              rows={5}
              maxLength={400}
              placeholder="Your numismatic background and certifications..."
              labelClassName="text-[11px] font-semibold tracking-[0.14em] text-text-muted"
            />
          </section>

          <PrimaryButton type="submit">Create account</PrimaryButton>
        </form>

        <p className="mt-10 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <TextLink href="/sign-in" variant="accent">
            Sign in
          </TextLink>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
