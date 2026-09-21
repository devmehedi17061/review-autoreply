/**
 * iBusinessFormula brand lockup: a magenta tile with a stylised tilted "i",
 * next to the wordmark. `tone` flips the wordmark colour for dark (sidebar,
 * login panel) vs light backgrounds. The name is always one word.
 */
export function BrandMark({
  tone = "dark",
  size = "md",
}: {
  tone?: "dark" | "light";
  size?: "sm" | "md";
}) {
  const tile = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const word = size === "sm" ? "text-sm" : "text-lg";
  const wordColor = tone === "dark" ? "text-white" : "text-brand-navy";

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`relative flex ${tile} flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-pink to-brand-pinkDark shadow-sm`}
        aria-hidden
      >
        <span className="-rotate-6 text-white" style={{ fontWeight: 800, fontSize: size === "sm" ? 15 : 19, lineHeight: 1 }}>
          i
        </span>
      </span>
      <span className={`${word} font-extrabold tracking-tight ${wordColor}`}>
        <span className="text-brand-pink">i</span>BusinessFormula
      </span>
    </div>
  );
}
