import type { ReactNode } from "react";

type ExpertEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
};

export function ExpertEmptyState({
  icon,
  title,
  description,
}: ExpertEmptyStateProps) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center px-4 py-6 text-center xl:min-h-[14.5rem]">
      {icon ? (
        <span
          className="flex h-11 w-11 items-center justify-center xl:h-16 xl:w-16"
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      <h3
        className={`text-lg font-semibold text-text xl:text-2xl ${
          icon ? "mt-3 xl:mt-4" : ""
        }`}
      >
        {title}
      </h3>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-text-muted xl:text-base">
        {description}
      </p>
    </div>
  );
}
