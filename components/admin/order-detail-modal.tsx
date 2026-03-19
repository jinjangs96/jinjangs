'use client'

import { useState, useMemo } from 'react'
import { Phone, MapPin, Clock, MessageSquare, CreditCard, ChevronRight, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StatusBadge } from './status-badge'
import type { Order, OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_COMMON_LABELS, ADMIN_ORDER_DETAIL_LABELS, ADMIN_ORDER_STATUS_LABELS, getAdminLabel } from '@/lib/admin-i18n'

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + '₫'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface OrderDetailModalProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (orderId: string, newStatus: OrderStatus, cancelReason?: string) => Promise<void>
}

export function OrderDetailModal({ order, open, onOpenChange, onStatusChange }: OrderDetailModalProps) {
  const { locale } = useAdminLocale()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonError, setCancelReasonError] = useState('')
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const PAYMENT_LABELS = useMemo(
    () => ({
      bank_transfer: getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'payment_bank_transfer'),
      qr_transfer: getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'payment_qr_transfer'),
      bank: getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'payment_bank'),
      cod: getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'payment_cod'),
      megapay: getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'payment_megapay'),
    }),
    [locale]
  )

  const NEXT_STATUS = useMemo(
    (): Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> => ({
      new: { status: 'accepted', label: getAdminLabel(locale, ADMIN_ORDER_STATUS_LABELS, 'accepted') },
      accepted: { status: 'preparing', label: getAdminLabel(locale, ADMIN_ORDER_STATUS_LABELS, 'preparing') },
      preparing: { status: 'out_for_delivery', label: getAdminLabel(locale, ADMIN_ORDER_STATUS_LABELS, 'out_for_delivery') },
      out_for_delivery: { status: 'completed', label: getAdminLabel(locale, ADMIN_ORDER_STATUS_LABELS, 'completed') },
    }),
    [locale]
  )

  if (!order) return null

  const nextStep = NEXT_STATUS[order.status]

  const handleAdvance = () => {
    if (!nextStep) return
    if (nextStep.status === 'completed') {
      setConfirmOpen(true)
    } else {
      setPendingStatus(nextStep.status)
      handleStatusUpdate(nextStep.status)
    }
  }

  const handleStatusUpdate = async (status: OrderStatus, reason?: string) => {
    setLoading(true)
    try {
      await onStatusChange(order.id, status, reason)
      toast.success(getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'status_changed'))
      setConfirmOpen(false)
      setCancelOpen(false)
      setCancelReason('')
      setPendingStatus(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('version')) {
        toast.error(getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'version_conflict'))
      } else {
        toast.error(getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'update_failed'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubmit = () => {
    if (cancelReason.trim().length < 3) {
      setCancelReasonError(getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'cancel_reason_min'))
      return
    }
    setCancelReasonError('')
    handleStatusUpdate('canceled', cancelReason.trim())
  }

  const canCancel = !['completed', 'canceled'].includes(order.status)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold">
                {getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'title')} — {order.short_id}
              </DialogTitle>
              <StatusBadge status={order.status} />
            </div>
          </DialogHeader>

          <div className="px-6 py-5 space-y-6">
            {/* Customer Info */}
            <Section title={getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'customer_info')}>
              <InfoRow icon={<span className="w-4 h-4 text-muted-foreground font-medium text-xs">{getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'name')}</span>} value={order.customer_name} />
              <InfoRow icon={<Phone className="w-4 h-4 text-muted-foreground" />} value={order.customer_phone} />
            </Section>

            {/* Address */}
            <Section title={getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'delivery_address')}>
              <InfoRow icon={<MapPin className="w-4 h-4 text-muted-foreground" />} value={`${order.address} (${order.district})`} />
              <InfoRow icon={<Clock className="w-4 h-4 text-muted-foreground" />} value={order.slot_text} />
            </Section>

            {/* Special requests */}
            {order.special_requests && (
              <Section title={getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'special_requests')}>
                <InfoRow icon={<MessageSquare className="w-4 h-4 text-muted-foreground" />} value={order.special_requests} />
              </Section>
            )}

            {/* Payment */}
            <Section title={getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'payment_info')}>
              <InfoRow
                icon={<CreditCard className="w-4 h-4 text-muted-foreground" />}
                value={(PAYMENT_LABELS as Record<string, string>)[order.payment_method] ?? order.payment_method}
              />
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">{getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'total')}</span>
                <span className="font-bold text-foreground text-base">{formatVND(order.total_vnd)}</span>
              </div>
            </Section>

            {/* Items */}
            <Section title={getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'order_items')}>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.name} × {item.qty}</p>
                      {item.options && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.options}</p>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground shrink-0">{formatVND(item.price_vnd * item.qty)}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Status History */}
            <Section title={getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'status_history')}>
              <div className="space-y-2">
                {order.status_history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      i === order.status_history.length - 1 ? 'bg-primary' : 'bg-border'
                    )} />
                    <StatusBadge status={h.status} className="text-xs" />
                    <span className="text-xs text-muted-foreground flex-1">{h.changed_by}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(h.changed_at)}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Cancel reason */}
            {order.cancel_reason && (
              <Section title={getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'cancel_reason')}>
                <p className="text-sm text-foreground">{order.cancel_reason}</p>
              </Section>
            )}
          </div>

          {/* Actions */}
          {(nextStep || canCancel) && (
            <div className="px-6 pb-6 flex flex-wrap gap-3 justify-end border-t border-border pt-4">
              {canCancel && (
                <Button
                  variant="outline"
                  onClick={() => { setCancelOpen(true); setCancelReason(''); setCancelReasonError('') }}
                  className="rounded-xl border-destructive text-destructive hover:bg-destructive/10"
                  disabled={loading}
                >
                  {getAdminLabel(locale, ADMIN_COMMON_LABELS, 'cancel')}
                </Button>
              )}
              {nextStep && (
                <Button
                  onClick={handleAdvance}
                  disabled={loading}
                  className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                  {nextStep.label}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Complete Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'confirm_complete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'confirm_complete_desc').replace('{id}', order.short_id)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={loading}>
              {getAdminLabel(locale, ADMIN_COMMON_LABELS, 'cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-ok text-ok-foreground hover:bg-ok/90"
              onClick={() => handleStatusUpdate('completed')}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {getAdminLabel(locale, ADMIN_COMMON_LABELS, 'confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'cancel_order_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'cancel_order_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2">
            <Label className="text-sm font-medium">{getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'cancel_reason_label')} <span className="text-destructive">*</span></Label>
            <Textarea
              className="mt-2 rounded-xl resize-none"
              rows={3}
              placeholder={getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'cancel_reason_placeholder')}
              value={cancelReason}
              onChange={(e) => { setCancelReason(e.target.value); setCancelReasonError('') }}
            />
            {cancelReasonError && (
              <p className="text-xs text-destructive mt-1">{cancelReasonError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={loading}>
              {getAdminLabel(locale, ADMIN_COMMON_LABELS, 'close')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancelSubmit}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {getAdminLabel(locale, ADMIN_ORDER_DETAIL_LABELS, 'cancel_submit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{title}</h3>
      <div className="bg-muted/40 rounded-xl p-4 space-y-2">{children}</div>
    </div>
  )
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <span className="text-sm text-foreground leading-relaxed">{value}</span>
    </div>
  )
}
