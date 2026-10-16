import { qrModules } from "@/lib/payment/qr-placeholder";

export default function QrisPlaceholder({
  payload,
  className = "",
}: {
  payload: string;
  className?: string;
}) {
  const grid = qrModules(payload);
  const size = grid.length;
  const path = grid
    .flatMap((row, rowIndex) =>
      row.map((filled, colIndex) =>
        filled ? `M${colIndex} ${rowIndex}h1v1h-1z` : "",
      ),
    )
    .join("");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect width={size} height={size} fill="#ffffff" />
      <path d={path} fill="#0a0a0a" />
    </svg>
  );
}
