interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'pr' | 'accent'
  className?: string
}

const variants = {
  default: 'bg-white/10 text-white border border-white/10',
  accent: 'bg-accent/20 text-accent border border-accent/30 shadow-sm shadow-accent/10',
  success: 'bg-success/15 text-success border border-success/25',
  warning: 'bg-warning/15 text-warning border border-warning/25',
  danger: 'bg-danger/15 text-danger border border-danger/25',
  pr: 'bg-pr/15 text-pr border border-pr/25',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
