export default function Logo({ size = 28, showWordmark = true }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/wayvo-icon.png"
        alt="Wayvo"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain" }}
        className="shrink-0 select-none"
        draggable={false}
      />
      {showWordmark && (
        <span className="font-bold text-lg tracking-tight">Wayvo</span>
      )}
    </div>
  );
}
