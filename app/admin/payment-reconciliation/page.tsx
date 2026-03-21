'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_PAYMENT_RECON_LABELS, getAdminLabel } from '@/lib/admin-i18n'

type PaymentRow = Record<string, unknown>

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

export default function AdminPaymentReconciliationPage() {
  const { locale } = useAdminLocale()
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadRows = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''
      const response = await fetch('/api/admin/payment-reconciliation', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = (await response.json()) as { error?: string; payments?: PaymentRow[] }
      if (!response.ok) {
        toast.error(result.error || getAdminLabel(locale, ADMIN_PAYMENT_RECON_LABELS, 'load_failed'))
        return
      }
      setRows(result.payments ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : getAdminLabel(locale, ADMIN_PAYMENT_RECON_LABELS, 'load_error'))
    }
  }, [])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  const updateStatus = async (paymentId: string, toStatus: string) => {
    setUpdatingId(paymentId)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''
      const response = await fetch('/api/admin/payment-reconciliation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payment_id: paymentId, to_status: toStatus }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        toast.error(result.error || getAdminLabel(locale, ADMIN_PAYMENT_RECON_LABELS, 'update_failed'))
        return
      }
      toast.success(getAdminLabel(locale, ADMIN_PAYMENT_RECON_LABELS, 'update_success'))
      await loadRows()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : getAdminLabel(locale, ADMIN_PAYMENT_RECON_LABELS, 'update_failed'))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>{getAdminLabel(locale, ADMIN_PAYMENT_RECON_LABELS, 'page_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {rows.length === 0 ? (
            <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_PAYMENT_RECON_LABELS, 'empty')}</p>
          ) : (
            rows.map((row) => {
              const id = String(row.id)
              const status = String(row.payment_status ?? '')
              const canConfirm = status === 'pending' || status === 'transfer_waiting'
              const isUpdating = updatingId === id
              return (
                <div key={id} className="rounded-md border p-3">
                  <p>{getAdminLabel(locale, ADMIN_PAYMENT_RECON_LABELS, 'order')}: {String((row.orders as Record<string, unknown> | null)?.order_number ?? '-')}</p>
                  <p>{getAdminLabel(locale, ADMIN_PAYMENT_RECON_LABELS, 'method')}: {String(row.method ?? '-')}</p>
                  <p>{getAdminLabel(locale, ADMIN_PAYMENT_RECON_LABELS, 'status')}: {status}</p>
                  <p>{getAdminLabel(locale, ADMIN_PAYMENT_RECON_LABELS, 'amount')}: {formatVND(Number(row.expected_amount_vnd ?? 0))}</p>
                  {canConfirm && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={isUpdating}
                        onClick={() => updateStatus(id, 'paid')}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                            {getAdminLabel(locale, ADMIN_PAYMENT_RECON_LABELS, 'processing')}
                          </>
                        ) : (
                          getAdminLabel(locale, ADMIN_PAYMENT_RECON_LABELS, 'confirm_paid')
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isUpdating}
                        onClick={() => updateStatus(id, 'failed')}
                      >
                        {getAdminLabel(locale, ADMIN_PAYMENT_RECON_LABELS, 'mark_failed')}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
