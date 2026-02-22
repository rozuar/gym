import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-gradient-to-r from-accent to-accent-2 hover:from-accent-hover hover:to-accent text-white shadow-lg shadow-accent/20 hover:shadow-accent/40',
  secondary: 'bg-white/5 hover:bg-white/10 text-white border border-accent/20 hover:border-accent/40',
  danger: 'bg-danger/90 hover:bg-danger text-white shadow-lg shadow-danger/20',
  ghost: 'hover:bg-white/5 text-muted hover:text-white',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({ variant = 'primary', size = 'md', className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-xl font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    />
  )
}
