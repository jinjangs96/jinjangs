'use client'

import { useState } from 'react'
import { Plus, Trash2, Send, Loader2, CheckCircle2, XCircle, Bell, BellOff } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { MOCK_NOTIFICATION_LOGS } from '@/lib/mock-data'
import type { NotificationLog, NotificationRecipient } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const emailSchema = z.string().email()

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const DEFAULT_RECIPIENTS: NotificationRecipient[] = [
  { id: 'r1', email: 'admin@jinjang.vn' },
  { id: 'r2', email: 'ops@jinjang.vn' },
]

export default function NotificationsPage() {
  const [enabled, setEnabled] = useState(true)
  const [recipients, setRecipients] = useState<NotificationRecipient[]>(DEFAULT_RECIPIENTS)
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [logs, setLogs] = useState<NotificationLog[]>(MOCK_NOTIFICATION_LOGS)
  const [sendingTest, setSendingTest] = useState(false)
  const [customerEmailEnabled, setCustomerEmailEnabled] = useState(false)

  const addRecipient = () => {
    const result = emailSchema.safeParse(newEmail)
    if (!result.success) {
      setEmailError('이메일 형식을 확인해 주세요.')
      return
    }
    if (recipients.find((r) => r.email === newEmail)) {
      setEmailError('이미 추가된 이메일입니다.')
      return
    }
    setRecipients((prev) => [...prev, { id: `r-${Date.now()}`, email: newEmail }])
    setNewEmail('')
    setEmailError('')
    toast.success('저장되었습니다.')
  }

  const removeRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id))
    toast.success('저장되었습니다.')
  }

  const handleTestSend = async () => {
    setSendingTest(true)
    await new Promise((r) => setTimeout(r, 1500))
    setSendingTest(false)

    // Simulate 85% success
    if (Math.random() > 0.15) {
      toast.success('테스트 메일을 보냈습니다.')
      setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          type: '테스트 메일',
          status: 'sent',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
    } else {
      toast.error('테스트 메일 발송 실패. 설정을 확인해 주세요.')
      setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          type: '테스트 메일',
          status: 'failed',
          created_at: new Date().toISOString(),
          error: 'SMTP connection failed',
        },
        ...prev,
      ])
    }
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">알림 설정</h1>
        <p className="text-sm text-muted-foreground mt-0.5">운영자 이메일 알림과 발송 기록을 관리합니다.</p>
      </div>

      {/* New Order Notification Card */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              enabled ? 'bg-primary/10' : 'bg-muted'
            )}>
              {enabled
                ? <Bell className="w-5 h-5 text-primary" />
                : <BellOff className="w-5 h-5 text-muted-foreground" />
              }
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">신규 주문 알림</h2>
              <p className="text-sm text-muted-foreground">신규 주문 발생 시 운영자에게 이메일 자동 발송</p>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(v) => { setEnabled(v); toast.success('저장되었습니다.') }}
            className="data-[state=checked]:bg-primary mt-1"
          />
        </div>

        {/* Recipients */}
        <div className={cn('space-y-3', !enabled && 'opacity-50 pointer-events-none')}>
          <Label className="text-sm font-medium">수신자 이메일</Label>
          <div className="space-y-2">
            {recipients.map((r) => (
              <div key={r.id} className="flex items-center gap-2 bg-muted/40 rounded-xl px-4 py-2.5">
                <span className="text-sm text-foreground flex-1 font-mono">{r.email}</span>
                <button
                  onClick={() => removeRecipient(r.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Email */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Input
                type="email"
                className="rounded-xl"
                placeholder="이메일 추가"
                value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); setEmailError('') }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
              />
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-1.5 px-3"
              onClick={addRecipient}
            >
              <Plus className="w-4 h-4" />
              추가
            </Button>
          </div>
        </div>

        {/* Test Send */}
        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">테스트 메일을 발송하여 설정을 확인하세요.</p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2 shrink-0"
            onClick={handleTestSend}
            disabled={sendingTest || !enabled || recipients.length === 0}
          >
            {sendingTest ? (
              <><Loader2 className="w-4 h-4 animate-spin" />발송 중...</>
            ) : (
              <><Send className="w-4 h-4" />테스트 발송</>
            )}
          </Button>
        </div>
      </div>

      {/* Customer Emails (MVP1 optional, default OFF) */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">고객 이메일 알림</h2>
            <p className="text-sm text-muted-foreground mt-0.5">주문 상태 변경/취소 시 고객에게 자동 발송 (기본 OFF)</p>
          </div>
          <Switch
            checked={customerEmailEnabled}
            onCheckedChange={(v) => { setCustomerEmailEnabled(v); toast.success('저장되었습니다.') }}
            className="data-[state=checked]:bg-primary mt-1"
          />
        </div>
        {customerEmailEnabled && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-sm text-amber-700">고객 이메일 발송이 활성화되었습니다. 상태 변경 및 취소 시 고객에게 이메일이 발송됩니다.</p>
          </div>
        )}
      </div>

      {/* Log Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">발송 기록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['유형', '상태', '일시', '오류'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-sm">
                    발송 기록이 없습니다.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-3 text-sm text-foreground">{log.type}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border',
                        log.status === 'sent'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      )}
                    >
                      {log.status === 'sent'
                        ? <CheckCircle2 className="w-3 h-3" />
                        : <XCircle className="w-3 h-3" />
                      }
                      {log.status === 'sent' ? '발송됨' : '실패'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground font-mono">
                    {log.error ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
