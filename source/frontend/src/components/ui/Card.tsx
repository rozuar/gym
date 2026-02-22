import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white/[0.03] backdrop-blur-md border border-accent/20 rounded-2xl p-4 shadow-2xl shadow-accent/5 ${className}`}
      {...props}
    />
  )
}
