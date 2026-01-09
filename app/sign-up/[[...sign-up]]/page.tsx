import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <SignUp afterSignUpUrl="/onboarding" signInUrl="/sign-in" />
    </div>
  );
}
