import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  RefreshControl, TouchableOpacity, FlatList, TextInput,
  Modal, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { format } from 'date-fns'
import { Skeleton } from '@/components/Skeleton'
import {
  getVendors, createVendor, updateVendor, deleteVendor,
  getInvoices, createInvoice, updateInvoice, deleteInvoice,
  Vendor, VendorInvoice,
} from '@/lib/api'
import { colors, radius } from '@/theme'
import { useToast } from '@/components/Toast'

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

const INVOICE_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',     color: colors.textMuted,      bg: 'rgba(107,114,128,0.1)' },
  sent:      { label: 'Sent',      color: colors.indigo,         bg: colors.indigoSubtle },
  paid:      { label: 'Paid',      color: colors.success,        bg: colors.successSubtle },
  overdue:   { label: 'Overdue',   color: colors.error,          bg: colors.errorSubtle },
  cancelled: { label: 'Cancelled', color: colors.textMuted,      bg: 'rgba(107,114,128,0.08)' },
  pending:   { label: 'Pending',   color: colors.warning,        bg: colors.warningSubtle },
}

function VendorSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {/* Summary strip skeleton */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
        {[0, 1, 2].map(i => <Skeleton key={i} height={54} style={{ flex: 1, borderRadius: radius.md }} />)}
      </View>
      {/* Card skeletons */}
      {[0, 1, 2].map(i => (
        <View key={i} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
            <Skeleton height={40} width={40} style={{ borderRadius: 20 }} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton height={14} width={130} style={{ borderRadius: 7 }} />
              <Skeleton height={11} width={90} style={{ borderRadius: 5 }} />
            </View>
            <Skeleton height={22} width={60} style={{ borderRadius: 6 }} />
          </View>
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={{ flexDirection: 'row', padding: 10, gap: 8 }}>
            <Skeleton height={30} style={{ flex: 1, borderRadius: radius.sm }} />
            <Skeleton height={30} style={{ flex: 1, borderRadius: radius.sm }} />
            <Skeleton height={30} style={{ flex: 1, borderRadius: radius.sm }} />
          </View>
        </View>
      ))}
    </View>
  )
}

export default function VendorsScreen() {
  const toast = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [invoices, setInvoices] = useState<VendorInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null)

  // Vendor modal state
  const [vendorModal, setVendorModal] = useState<'add' | 'edit' | null>(null)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [vName, setVName] = useState('')
  const [vCategory, setVCategory] = useState('')
  const [vContactName, setVContactName] = useState('')
  const [vContactEmail, setVContactEmail] = useState('')
  const [vContactPhone, setVContactPhone] = useState('')
  const [vNotes, setVNotes] = useState('')
  const [savingVendor, setSavingVendor] = useState(false)

  // Invoice modal state
  const [invoiceModal, setInvoiceModal] = useState<'add' | 'edit' | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<VendorInvoice | null>(null)
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null)
  const [iDescription, setIDescription] = useState('')
  const [iAmount, setIAmount] = useState('')
  const [iDueDate, setIDueDate] = useState('')
  const [iStatus, setIStatus] = useState<InvoiceStatus>('draft')
  const [savingInvoice, setSavingInvoice] = useState(false)

  const load = useCallback(async () => {
    try {
      const [{ vendors: v }, { invoices: inv }] = await Promise.all([
        getVendors(),
        getInvoices(),
      ])
      setVendors(v)
      setInvoices(inv)
    } catch (e: any) {
      toast.show({ type: 'error', message: e?.message || 'Couldn\'t load vendors. Pull down to retry.' })
    }
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  // Vendor actions
  const openAddVendor = () => {
    setEditingVendor(null)
    setVName(''); setVCategory(''); setVContactName('')
    setVContactEmail(''); setVContactPhone(''); setVNotes('')
    setVendorModal('add')
  }

  const openEditVendor = (v: Vendor) => {
    setEditingVendor(v)
    setVName(v.name)
    setVCategory(v.category ?? '')
    setVContactName(v.contact_name ?? '')
    setVContactEmail(v.contact_email ?? '')
    setVContactPhone(v.contact_phone ?? '')
    setVNotes(v.notes ?? '')
    setVendorModal('edit')
  }

  const handleSaveVendor = async () => {
    if (!vName.trim()) return Alert.alert('Error', 'Vendor name is required')
    setSavingVendor(true)
    try {
      const payload = {
        name: vName.trim(),
        category: vCategory.trim() || 'General',
        contact_name: vContactName.trim() || null,
        contact_email: vContactEmail.trim() || null,
        contact_phone: vContactPhone.trim() || null,
        notes: vNotes.trim() || null,
      }
      if (vendorModal === 'edit' && editingVendor) {
        await updateVendor({ ...payload, id: editingVendor.id })
      } else {
        await createVendor(payload)
      }
      setVendorModal(null)
      await load()
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save vendor')
    } finally {
      setSavingVendor(false)
    }
  }

  const handleDeleteVendor = (v: Vendor) => {
    Alert.alert('Delete Vendor', `Remove "${v.name}"? All associated invoices will also be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteVendor(v.id); await load() }
          catch (err: any) { Alert.alert('Error', err.message ?? 'Failed to delete') }
        }
      },
    ])
  }

  // Invoice actions
  const openAddInvoice = (vendorId: string) => {
    setEditingInvoice(null)
    setActiveVendorId(vendorId)
    setIDescription(''); setIAmount(''); setIDueDate('')
    setIStatus('draft')
    setInvoiceModal('add')
  }

  const openEditInvoice = (inv: VendorInvoice) => {
    setEditingInvoice(inv)
    setActiveVendorId(inv.vendor_id)
    setIDescription(inv.description ?? '')
    setIAmount(String(inv.amount))
    setIDueDate(inv.due_date ? format(new Date(inv.due_date), 'yyyy-MM-dd') : '')
    setIStatus(inv.status as InvoiceStatus)
    setInvoiceModal('edit')
  }

  const handleSaveInvoice = async () => {
    if (!iAmount.trim() || isNaN(Number(iAmount))) return Alert.alert('Error', 'Valid amount is required')
    setSavingInvoice(true)
    try {
      const payload = {
        vendor_id: activeVendorId!,
        amount: Number(iAmount),
        description: iDescription.trim() || null,
        due_date: iDueDate.trim() || null,
        status: iStatus,
        event_id: null,
      }
      if (invoiceModal === 'edit' && editingInvoice) {
        await updateInvoice({ ...payload, id: editingInvoice.id })
      } else {
        await createInvoice(payload)
      }
      setInvoiceModal(null)
      await load()
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save invoice')
    } finally {
      setSavingInvoice(false)
    }
  }

  const handleDeleteInvoice = (inv: VendorInvoice) => {
    const label = inv.description ?? `PKR ${Number(inv.amount).toLocaleString()}`
    Alert.alert('Delete Invoice', `Remove invoice "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteInvoice(inv.id); await load() }
          catch (err: any) { Alert.alert('Error', err.message ?? 'Failed to delete') }
        }
      },
    ])
  }

  const vendorInvoices = (vendorId: string) => invoices.filter(i => i.vendor_id === vendorId)
  const vendorTotal = (vendorId: string) => vendorInvoices(vendorId).reduce((sum, i) => sum + Number(i.amount), 0)

  const totalOutstanding = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + Number(i.amount), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="light" />
        <View style={s.header}>
          <View>
            <Text style={s.heading}>Vendors</Text>
            <Text style={s.subheading}>Loading…</Text>
          </View>
        </View>
        <VendorSkeleton />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      <View style={s.header}>
        <View>
          <Text style={s.heading}>Vendors</Text>
          <Text style={s.subheading}>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openAddVendor} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary strip */}
      {invoices.length > 0 && (
        <View style={s.summaryStrip}>
          {[
            { value: `PKR ${totalOutstanding.toLocaleString()}`, label: 'Outstanding', color: colors.warning },
            { value: `PKR ${totalPaid.toLocaleString()}`,        label: 'Paid',        color: colors.success },
            { value: String(invoices.length),                    label: 'Invoices',    color: colors.blue    },
          ].map(chip => (
            <LinearGradient
              key={chip.label}
              colors={[chip.color + '22', chip.color + '0A', 'transparent']}
              start={[0, 0]} end={[1.2, 1.2]}
              style={[s.summaryChip, { borderColor: chip.color + '44' }]}
            >
              <Text style={[s.summaryChipValue, { color: chip.color }]}>{chip.value}</Text>
              <Text style={s.summaryChipLabel}>{chip.label}</Text>
            </LinearGradient>
          ))}
        </View>
      )}

      <FlatList
        data={vendors}
        keyExtractor={v => v.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <LinearGradient colors={[colors.gold + '25', 'transparent']} style={s.emptyIconCircle}>
              <Ionicons name="business-outline" size={28} color={colors.gold} />
            </LinearGradient>
            <Text style={s.emptyTitle}>No vendors yet</Text>
            <Text style={s.emptyDesc}>Add vendors to track services and manage invoices</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={openAddVendor} activeOpacity={0.8}>
              <Ionicons name="add" size={16} color={colors.white} />
              <Text style={s.emptyBtnText}>Add Vendor</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: vendor }) => {
          const vInvoices = vendorInvoices(vendor.id)
          const expanded = expandedVendorId === vendor.id
          const total = vendorTotal(vendor.id)

          return (
            <View style={s.vendorCard}>
              {/* Vendor header */}
              <TouchableOpacity
                style={s.vendorHeader}
                onPress={() => setExpandedVendorId(expanded ? null : vendor.id)}
                activeOpacity={0.8}
              >
                <View style={s.vendorAvatar}>
                  <Text style={s.vendorAvatarText}>{vendor.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.vendorName}>{vendor.name}</Text>
                  {vendor.category && <Text style={s.vendorCategory}>{vendor.category}</Text>}
                  {vendor.contact_name && (
                    <Text style={s.vendorContact}>{vendor.contact_name}</Text>
                  )}
                </View>
                <View style={s.vendorMeta}>
                  {total > 0 && (
                    <Text style={s.vendorTotal}>PKR {total.toLocaleString()}</Text>
                  )}
                  <Text style={s.vendorInvCount}>{vInvoices.length} invoice{vInvoices.length !== 1 ? 's' : ''}</Text>
                </View>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              {/* Vendor actions */}
              <View style={s.vendorActions}>
                <TouchableOpacity style={s.vendorActionBtn} onPress={() => openAddInvoice(vendor.id)}>
                  <Ionicons name="document-text-outline" size={14} color={colors.blue} />
                  <Text style={[s.vendorActionText, { color: colors.blue }]}>Add Invoice</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.vendorActionBtn} onPress={() => openEditVendor(vendor)}>
                  <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
                  <Text style={s.vendorActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.vendorActionBtn} onPress={() => handleDeleteVendor(vendor)}>
                  <Ionicons name="trash-outline" size={14} color={colors.error} />
                  <Text style={[s.vendorActionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>

              {/* Invoices (expanded) */}
              {expanded && (
                <View style={s.invoiceList}>
                  {vInvoices.length === 0 ? (
                    <Text style={s.noInvoices}>No invoices yet — tap "Add Invoice" above</Text>
                  ) : (
                    vInvoices.map(inv => {
                      const sm = INVOICE_STATUS_META[inv.status] ?? { label: inv.status, color: colors.textMuted, bg: colors.surface2 }
                      return (
                        <View key={inv.id} style={s.invoiceRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={s.invoiceDesc}>{inv.description ?? '—'}</Text>
                            <Text style={s.invoiceAmount}>PKR {Number(inv.amount).toLocaleString()}</Text>
                            {inv.due_date && (
                              <Text style={s.invoiceDue}>Due {format(new Date(inv.due_date), 'd MMM yyyy')}</Text>
                            )}
                          </View>
                          <View style={s.invoiceRight}>
                            <View style={[s.invoiceBadge, { backgroundColor: sm.bg }]}>
                              <Text style={[s.invoiceBadgeText, { color: sm.color }]}>{sm.label}</Text>
                            </View>
                            <View style={s.invoiceActions}>
                              <TouchableOpacity onPress={() => openEditInvoice(inv)}>
                                <Ionicons name="pencil-outline" size={15} color={colors.textSecondary} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteInvoice(inv)}>
                                <Ionicons name="trash-outline" size={15} color={colors.error} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      )
                    })
                  )}
                </View>
              )}
            </View>
          )
        }}
      />

      {/* Vendor Modal */}
      <Modal visible={!!vendorModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setVendorModal(null)}>
        <SafeAreaView style={s.modal}>
          <View style={s.modalNav}>
            <TouchableOpacity style={s.closeBtn} onPress={() => setVendorModal(null)}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>{vendorModal === 'edit' ? 'Edit Vendor' : 'Add Vendor'}</Text>
            <TouchableOpacity
              style={[s.saveBtn, savingVendor && { opacity: 0.6 }]}
              onPress={handleSaveVendor}
              disabled={savingVendor}
            >
              {savingVendor ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={s.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">
              <MField label="Vendor Name *" value={vName} onChange={setVName} placeholder="e.g. Sound Works" />
              <MField label="Category" value={vCategory} onChange={setVCategory} placeholder="e.g. Audio / Lighting / Catering" />
              <MField label="Contact Person" value={vContactName} onChange={setVContactName} placeholder="Point of contact name" />
              <MField label="Contact Email" value={vContactEmail} onChange={setVContactEmail} placeholder="vendor@email.com" keyboard="email-address" />
              <MField label="Contact Phone" value={vContactPhone} onChange={setVContactPhone} placeholder="+92 300 000 0000" keyboard="phone-pad" />
              <MField label="Notes" value={vNotes} onChange={setVNotes} placeholder="Additional notes…" multiline />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Invoice Modal */}
      <Modal visible={!!invoiceModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setInvoiceModal(null)}>
        <SafeAreaView style={s.modal}>
          <View style={s.modalNav}>
            <TouchableOpacity style={s.closeBtn} onPress={() => setInvoiceModal(null)}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>{invoiceModal === 'edit' ? 'Edit Invoice' : 'Add Invoice'}</Text>
            <TouchableOpacity
              style={[s.saveBtn, savingInvoice && { opacity: 0.6 }]}
              onPress={handleSaveInvoice}
              disabled={savingInvoice}
            >
              {savingInvoice ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={s.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">
              <MField label="Description" value={iDescription} onChange={setIDescription} placeholder="e.g. Sound system rental" />
              <MField label="Amount (PKR) *" value={iAmount} onChange={setIAmount} placeholder="0" keyboard="numeric" />
              <MField label="Due Date (YYYY-MM-DD)" value={iDueDate} onChange={setIDueDate} placeholder="2025-12-31" />
              <Text style={s.fieldLabel}>Status</Text>
              <View style={s.statusPills}>
                {(['draft', 'sent', 'paid', 'overdue', 'cancelled'] as InvoiceStatus[]).map(st => {
                  const sm = INVOICE_STATUS_META[st]
                  const active = iStatus === st
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[s.statusPill, active && { backgroundColor: sm.bg, borderColor: sm.color + '44' }]}
                      onPress={() => setIStatus(st)}
                    >
                      <Text style={[s.statusPillText, active && { color: sm.color }]}>{sm.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

function MField({ label, value, onChange, placeholder, keyboard, multiline }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; keyboard?: any; multiline?: boolean
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.fieldInput, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboard}
        multiline={multiline}
        autoCapitalize="none"
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.pageBg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  heading: { color: colors.textPrimary, fontSize: 26, fontFamily: 'Poppins_700Bold' },
  subheading: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.blue, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  addBtnText: { color: colors.white, fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  summaryStrip: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8,
  },
  summaryChip: {
    flex: 1, borderRadius: radius.md,
    borderWidth: 1,
    padding: 10, alignItems: 'center',
  },
  summaryChipValue: { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  summaryChipLabel: { color: colors.textMuted, fontSize: 10, fontFamily: 'DMSans_400Regular' },

  list: { padding: 16, gap: 12, paddingBottom: 40 },

  vendorCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  vendorHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  vendorAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.blueSubtle, borderWidth: 1, borderColor: colors.blueBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  vendorAvatarText: { color: colors.blue, fontSize: 16, fontFamily: 'Poppins_700Bold' },
  vendorName: { color: colors.textPrimary, fontSize: 15, fontFamily: 'DMSans_500Medium' },
  vendorCategory: { color: colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  vendorContact: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_400Regular' },
  vendorMeta: { alignItems: 'flex-end' },
  vendorTotal: { color: colors.textPrimary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  vendorInvCount: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular' },

  vendorActions: {
    flexDirection: 'row', gap: 0,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface2,
  },
  vendorActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10,
  },
  vendorActionText: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_500Medium' },

  invoiceList: {
    borderTopWidth: 1, borderTopColor: colors.border, padding: 12, gap: 8,
  },
  noInvoices: { color: colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', textAlign: 'center', paddingVertical: 8 },
  invoiceRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.surface2, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: 10,
  },
  invoiceDesc: { color: colors.textPrimary, fontSize: 13, fontFamily: 'DMSans_500Medium' },
  invoiceAmount: { color: colors.blue, fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginTop: 2 },
  invoiceDue: { color: colors.textMuted, fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  invoiceRight: { alignItems: 'flex-end', gap: 6 },
  invoiceBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full },
  invoiceBadgeText: { fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },
  invoiceActions: { flexDirection: 'row', gap: 10 },

  empty:          { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32, gap: 10 },
  emptyIconCircle:{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:     { color: colors.textPrimary, fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  emptyDesc:      { color: colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.blue, borderRadius: radius.md,
    paddingHorizontal: 16, paddingVertical: 10, marginTop: 4,
  },
  emptyBtnText: { color: colors.white, fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },

  // Modal
  modal: { flex: 1, backgroundColor: colors.pageBg },
  modalNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { color: colors.textPrimary, fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  saveBtn: { backgroundColor: colors.blue, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { color: colors.white, fontSize: 14, fontFamily: 'DMSans_500Medium', fontWeight: '700' },
  modalContent: { padding: 16, gap: 12, paddingBottom: 40 },

  fieldWrap: {},
  fieldLabel: { color: colors.textSecondary, fontSize: 12, fontFamily: 'DMSans_500Medium', marginBottom: 6, marginTop: 4 },
  fieldInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.textPrimary, fontSize: 14, fontFamily: 'DMSans_400Regular',
  },

  statusPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  statusPill: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.full,
  },
  statusPillText: { color: colors.textSecondary, fontSize: 13, fontFamily: 'DMSans_400Regular' },
})
