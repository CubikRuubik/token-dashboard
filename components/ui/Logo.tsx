export default function Logo({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" fill="none" aria-label="TokenDashboard">
      <rect x="1" y="1" width="40" height="40" rx="12" fill="var(--accent-soft)" stroke="var(--border-accent)" />
      <circle cx="21" cy="21" r="11" stroke="var(--accent)" strokeWidth="2.4" />
      <circle cx="21" cy="21" r="4.2" fill="var(--accent)" />
      <path d="M21 6.5V10M21 32v3.5M6.5 21H10M32 21h3.5" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
