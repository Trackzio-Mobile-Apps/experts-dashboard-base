type ExpertScrollIllustrationProps = {
  className?: string;
};

/** Parchment scroll empty-state illustration (queue, drafts, history). */
export function ExpertScrollIllustration({
  className = "h-11 w-11 object-contain xl:h-16 xl:w-16",
}: ExpertScrollIllustrationProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static empty-state asset from /public
    <img
      src="/expert-empty-scroll.png"
      alt=""
      width={64}
      height={64}
      className={className}
    />
  );
}
