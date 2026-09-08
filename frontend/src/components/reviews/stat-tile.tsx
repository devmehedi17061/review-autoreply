export function StatTile({
  value,
  label,
  highlight = false,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight ? "border-brand-pink bg-brand-pink text-white" : "border-gray-200 bg-white"
      }`}
    >
      <div className="text-2xl font-semibold">{value}</div>
      <div className={`mt-1 text-xs ${highlight ? "text-white/80" : "text-gray-500"}`}>{label}</div>
    </div>
  );
}
