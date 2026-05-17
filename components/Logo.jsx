export default function Logo({ size = 28, showWordmark = true }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Wayvo"
      >
        <defs>
          <linearGradient id="wayvo-grad" x1="12" y1="4" x2="32" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#7CF06B" />
            <stop offset="0.5" stopColor="#17C7A6" />
            <stop offset="1" stopColor="#22B8F0" />
          </linearGradient>
        </defs>
        {/* raio estilizado que vira seta para cima */}
        <path
          d="M27 5 L11 26 H20.5"
          stroke="url(#wayvo-grad)"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M30 17 H20 L14.5 39 Q15.5 30 23 30 Q31 30 33 24.5"
          stroke="url(#wayvo-grad)"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M27.5 18 L34.5 21.5 L33 30"
          stroke="url(#wayvo-grad)"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showWordmark && (
        <span className="font-bold text-lg tracking-tight">Wayvo</span>
      )}
    </div>
  );
}
