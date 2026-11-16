/** Shimmer placeholder while content loads. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-bg-active rounded-button ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}