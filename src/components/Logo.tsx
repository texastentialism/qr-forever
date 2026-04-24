export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="QR Forever logo"
    >
      <rect width="32" height="32" rx="7" fill="#0a0a0a" />
      {/* Top-left finder */}
      <rect x="5" y="5" width="9" height="9" rx="1.5" fill="#fafafa" />
      <rect x="7" y="7" width="5" height="5" rx="0.6" fill="#0a0a0a" />
      <rect x="8.75" y="8.75" width="1.5" height="1.5" rx="0.3" fill="#fafafa" />
      {/* Top-right finder */}
      <rect x="18" y="5" width="9" height="9" rx="1.5" fill="#fafafa" />
      <rect x="20" y="7" width="5" height="5" rx="0.6" fill="#0a0a0a" />
      <rect x="21.75" y="8.75" width="1.5" height="1.5" rx="0.3" fill="#fafafa" />
      {/* Bottom-left finder */}
      <rect x="5" y="18" width="9" height="9" rx="1.5" fill="#fafafa" />
      <rect x="7" y="20" width="5" height="5" rx="0.6" fill="#0a0a0a" />
      <rect x="8.75" y="21.75" width="1.5" height="1.5" rx="0.3" fill="#fafafa" />
      {/* Data dots in bottom-right */}
      <circle cx="19.5" cy="19.5" r="1" fill="#fafafa" />
      <circle cx="23" cy="19.5" r="1" fill="#fafafa" />
      <circle cx="26.5" cy="19.5" r="1" fill="#fafafa" />
      <circle cx="19.5" cy="23" r="1" fill="#fafafa" />
      <circle cx="26.5" cy="23" r="1" fill="#fafafa" />
      <circle cx="19.5" cy="26.5" r="1" fill="#fafafa" />
      <circle cx="23" cy="26.5" r="1" fill="#fafafa" />
    </svg>
  );
}
