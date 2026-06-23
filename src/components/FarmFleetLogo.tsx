export function FarmFleetLogo() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="24" fill="#45B649" />

        <path
          d="M24 30V21"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M24 21C19 21 17 18 17 14C21 14 24 16 24 21Z"
          stroke="white"
          strokeWidth="2.5"
          strokeLinejoin="round"
          fill="none"
        />

        <path
          d="M24 21C29 21 31 18 31 14C27 14 24 16 24 21Z"
          stroke="white"
          strokeWidth="2.5"
          strokeLinejoin="round"
          fill="none"
        />

        <path
          d="M18 33H30"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      <span
        style={{
          fontSize: 24,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.03em",
        }}
      >
        <span style={{ color: "#111827" }}>Farm</span>
        <span style={{ color: "#45B649" }}>Fleet</span>
      </span>
    </div>
  );
}