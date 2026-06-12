const PALETTE = ['#627eea','#f0922f','#2775ca','#2a5ada','#ec4899','#9d63d6','#1eb589','#28a0f0','#e84142','#f6851b']

function shade(hex: string, pct: number): string {
  const h = hex.replace('#','')
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
  const f = (c: number) => Math.max(0,Math.min(255,Math.round(c+(pct/100)*255)))
  return `#${[f(r),f(g),f(b)].map(c=>c.toString(16).padStart(2,'0')).join('')}`
}

export function tokenColor(address: string): string {
  let h = 0
  for (let i = 0; i < address.length; i++) h = (h * 31 + address.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export default function TokenBadge({ symbol, address, size = '' }: { symbol: string; address: string; size?: string }) {
  const color = tokenColor(address)
  const label = symbol.length > 4 ? symbol.slice(0, 4) : symbol
  const bg = `radial-gradient(120% 120% at 30% 20%, ${color}, ${shade(color, -28)})`
  return <span className={`tok ${size}`} style={{ background: bg }}>{label}</span>
}
