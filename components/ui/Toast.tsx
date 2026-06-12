'use client'
import { useEffect } from 'react'
import Icon from './Icon'

export default function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2600)
    return () => clearTimeout(id)
  }, [msg, onDone])
  return (
    <div className="toast">
      <span className="ic"><Icon name="checkCircle" /></span>
      {msg}
    </div>
  )
}
