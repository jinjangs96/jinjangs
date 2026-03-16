'use client'

import { useState } from 'react'
import { X, Phone, MapPin, Clock, MessageSquare, CreditCard, ChevronRight, Loader2 } from 'lucide-react'
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

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: '계좌이체',
  qr_transfer: 'QR 송금',
  bank: '계좌이체',
  cod: '착불(COD)',
  megapay: 'MegaPay',
}

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  new: { status: 'accepted', label: '수락' },
  accepted: { status: 'preparing', label: '준비중' },
  preparing: { status: 'out_for_delivery', label: '배달중' },
  out_for_delivery: { status: 'completed', label: '완료' },
}

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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonError, setCancelReasonError] = useState('')
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(false)

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
      toast.success('상태가 변경되었습니다.')
      setConfirmOpen(false)
      setCancelOpen(false)
      setCancelReason('')
      setPendingStatus(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('version')) {
        toast.error('다른 운영자가 먼저 변경했습니다. 새로고침 후 다시 시도해 주세요.')
      } else {
        toast.error('실패했습니다. 다시 시도해 주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubmit = () => {
    if (cancelReason.trim().length < 3) {
      setCancelReasonError('취소 사유를 3자 이상 입력해 주세요.')
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
                주문 상세 — {order.short_id}
              </DialogTitle>
              <StatusBadge status={order.status} />
            </div>
          </DialogHeader>

          <div className="px-6 py-5 space-y-6">
            {/* Customer Info */}
            <Section title="고객 정보">
              <InfoRow icon={<span className="w-4 h-4 text-muted-foreground font-medium text-xs">이름</span>} value={order.customer_name} />
              <InfoRow icon={<Phone className="w-4 h-4 text-muted-foreground" />} value={order.customer_phone} />
            </Section>

            {/* Address */}
            <Section title="배송 주소">
              <InfoRow icon={<MapPin className="w-4 h-4 text-muted-foreground" />} value={`${order.address} (${order.district})`} />
              <InfoRow icon={<Clock className="w-4 h-4 text-muted-foreground" />} value={order.slot_text} />
            </Section>

            {/* Special requests */}
            {order.special_requests && (
              <Section title="요청사항">
                <InfoRow icon={<MessageSquare className="w-4 h-4 text-muted-foreground" />} value={order.special_requests} />
              </Section>
            )}

            {/* Payment */}
            <Section title="결제 정보">
              <InfoRow
                icon={<CreditCard className="w-4 h-4 text-muted-foreground" />}
                value={PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
              />
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">합계</span>
                <span className="font-bold text-foreground text-base">{formatVND(order.total_vnd)}</span>
              </div>
            </Section>

            {/* Items */}
            <Section title="주문 상품">
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
            <Section title="상태 이력">
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
              <Section title="취소 사유">
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
                  취소
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
            <AlertDialogTitle>주문 완료 처리</AlertDialogTitle>
            <AlertDialogDescription>
              주문 {order.short_id}을 완료 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={loading}>취소</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-ok text-ok-foreground hover:bg-ok/90"
              onClick={() => handleStatusUpdate('completed')}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              완료 확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>주문 취소</AlertDialogTitle>
            <AlertDialogDescription>
              취소 사유를 입력해 주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2">
            <Label className="text-sm font-medium">취소 사유 <span className="text-destructive">*</span></Label>
            <Textarea
              className="mt-2 rounded-xl resize-none"
              rows={3}
              placeholder="취소 사유를 입력해 주세요(예: 재고 부족, 주소 불가 등)"
              value={cancelReason}
              onChange={(e) => { setCancelReason(e.target.value); setCancelReasonError('') }}
            />
            {cancelReasonError && (
              <p className="text-xs text-destructive mt-1">{cancelReasonError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={loading}>닫기</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancelSubmit}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              취소 처리
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
