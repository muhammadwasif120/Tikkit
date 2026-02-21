import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import clsx from 'clsx'

const invoiceStatusBadge: Record<string, string> = {
  pending: 'badge-yellow',
  paid: 'badge-green',
  overdue: 'badge-red',
  disputed: 'badge-gray',
}

export default async function VendorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: vendors } = await supabase
    .from('vendors')
    .select('*, vendor_invoices(*)')
    .eq('organizer_id', user!.id)
    .order('created_at', { ascending: false })

  const totalPending = vendors?.reduce((sum, v) => {
    const pending = v.vendor_invoices?.filter((i: { status: string }) => i.status === 'pending')
      .reduce((s: number, i: { amount: number }) => s + i.amount, 0) ?? 0
    return sum + pending
  }, 0) ?? 0

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Vendors
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {vendors?.length ?? 0} vendors · PKR {totalPending.toLocaleString()} pending
          </p>
        </div>
        <Link href="/dashboard/vendors/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Vendor
        </Link>
      </div>

      {!vendors?.length ? (
        <div className="card text-center py-16">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No vendors yet</p>
          <p className="text-gray-600 text-sm mt-1 mb-5">Add vendors to track invoices and payments</p>
          <Link href="/dashboard/vendors/new" className="btn-primary justify-center">
            <Plus className="w-4 h-4" />
            Add Vendor
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {vendors.map((vendor) => {
            const invoices = vendor.vendor_invoices ?? []
            const pendingCount = invoices.filter((i: { status: string }) => i.status === 'pending').length
            const overdueCount = invoices.filter((i: { status: string }) => i.status === 'overdue').length

            return (
              <Link
                key={vendor.id}
                href={`/dashboard/vendors/${vendor.id}`}
                className="card-hover flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-charcoal-light border border-white/5 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{vendor.name}</p>
                    <p className="text-xs text-gray-500">
                      {vendor.category && `${vendor.category} · `}
                      {vendor.contact_name || vendor.contact_email || 'No contact'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pendingCount > 0 && (
                    <span className="badge-yellow">{pendingCount} pending</span>
                  )}
                  {overdueCount > 0 && (
                    <span className="badge-red">{overdueCount} overdue</span>
                  )}
                  {invoices.length === 0 && (
                    <span className="badge-gray">No invoices</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}