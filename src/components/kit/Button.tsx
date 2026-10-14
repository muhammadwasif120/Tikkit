import Link from 'next/link'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-medium select-none ' +
  'transition-[background-color,color,box-shadow,border-color,transform] duration-150 ' +
  'active:translate-y-px disabled:pointer-events-none disabled:opacity-50 cursor-pointer'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-fg hover:bg-accent/90 ' +
    'shadow-[0_0_0_1px_rgb(var(--k-accent)/0.5),0_8px_24px_-10px_rgb(var(--k-accent)/0.55)]',
  secondary: 'bg-raised text-fg border border-line-strong hover:bg-overlay',
  outline: 'border border-line-strong text-fg hover:bg-raised',
  ghost: 'text-muted hover:text-fg hover:bg-raised',
  danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/15',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
  icon: 'h-10 w-10',
  'icon-sm': 'h-8 w-8',
}

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leading?: ReactNode
  trailing?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading, leading, trailing, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={buttonClass(variant, size, className)} {...rest}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leading}
      {children}
      {!loading && trailing}
    </button>
  )
})

type LinkProps = {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  leading?: ReactNode
  trailing?: ReactNode
  className?: string
  children?: ReactNode
  target?: string
  rel?: string
  'aria-label'?: string
}

export function ButtonLink({ href, variant = 'primary', size = 'md', leading, trailing, className, children, ...rest }: LinkProps) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {leading}
      {children}
      {trailing}
    </Link>
  )
}
