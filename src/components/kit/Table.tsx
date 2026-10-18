import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function TableWrap({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('overflow-x-auto', className)} {...rest} />
}
export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full border-collapse text-left text-sm', className)} {...rest} />
}
export function Th({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn('sticky top-0 whitespace-nowrap border-b border-line bg-surface px-4 py-3 text-xs font-medium uppercase tracking-wider text-subtle first:pl-6 last:pr-6', className)}
      {...rest}
    />
  )
}
export function Tr({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('group border-b border-line/70 transition-colors last:border-0 hover:bg-raised/70', className)} {...rest} />
}
export function Td({ className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3.5 align-middle text-fg first:pl-6 last:pr-6', className)} {...rest} />
}
