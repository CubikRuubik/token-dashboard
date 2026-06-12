import type { CSSProperties } from 'react'
import {
  FaArrowDown, FaCheck, FaCheckCircle, FaChevronDown, FaChevronRight,
  FaCoins, FaCopy, FaExternalLinkAlt, FaHistory, FaMoon, FaPaperPlane,
  FaPlus, FaSignOutAlt, FaSun, FaTh, FaTimes, FaWallet,
} from 'react-icons/fa'
import { TbArrowDownLeft, TbArrowUpRight } from 'react-icons/tb'

const ICONS: Record<string, React.ElementType> = {
  grid:          FaTh,
  history:       FaHistory,
  coins:         FaCoins,
  wallet:        FaWallet,
  logout:        FaSignOutAlt,
  moon:          FaMoon,
  sun:           FaSun,
  plus:          FaPlus,
  send:          FaPaperPlane,
  arrowDown:     FaArrowDown,
  arrowDownLeft: TbArrowDownLeft,
  arrowUpRight:  TbArrowUpRight,
  x:             FaTimes,
  check:         FaCheck,
  checkCircle:   FaCheckCircle,
  copy:          FaCopy,
  external:      FaExternalLinkAlt,
  chevronRight:  FaChevronRight,
  chevron:       FaChevronDown,
}

export default function Icon({ name, style }: { name: string; style?: CSSProperties }) {
  const C = ICONS[name]
  if (!C) return null
  return <C style={style} aria-hidden="true" />
}
