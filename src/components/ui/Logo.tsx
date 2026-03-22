export default function Logo({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="logo-flame" x1="24" y1="12" x2="40" y2="52">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#logo-bg)" />
      <path d="M32 10c0 0-14 16-14 28a14 14 0 0 0 28 0C46 26 32 10 32 10z" fill="url(#logo-flame)" opacity="0.9" />
      <path d="M32 24c0 0-7 8-7 15a7 7 0 0 0 14 0c0-7-7-15-7-15z" fill="white" opacity="0.85" />
    </svg>
  )
}
