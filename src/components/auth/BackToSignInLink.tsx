import { TextLink } from "./TextLink";

type BackToSignInLinkProps = {
  className?: string;
};

export function BackToSignInLink({ className = "" }: BackToSignInLinkProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <TextLink href="/sign-in" className="inline-flex items-center gap-1.5">
        <span aria-hidden className="text-base leading-none">
          ←
        </span>
        Back to sign in
      </TextLink>
    </div>
  );
}
