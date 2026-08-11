type SuccessCheckIllustrationProps = {
  className?: string;
};

/**
 * Large success mark: pale mint circle + bold dark green check (e.g. check-email).
 */
export function SuccessCheckIllustration({
  className = "",
}: SuccessCheckIllustrationProps) {
  return (
    <div
      className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-ring ${className}`}
      role="img"
      aria-label="Success"
    >
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M9 18.5 14.5 24 27 11.5"
          stroke="var(--coinzy-success-check)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
