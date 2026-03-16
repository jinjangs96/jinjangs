'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Plus, Edit2, ToggleLeft, ToggleRight, Upload,
  ImageIcon, Loader2, CheckCircle2, XCircle, RefreshCw, GripVertical, Trash2
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { MOCK_BANK_ACCOUNTS } from '@/lib/mock-data'
import type { BankAccount } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type UploadState = 'idle' | 'requesting_signed_url' | 'uploading' | 'verifying' | 'done' | 'failed'

const bankSchema = z.object({
  bank_name: z.string().min(1, '은행명을 입력해 주세요.'),
  account_name: z.string().min(1, '예금주명을 입력해 주세요.'),
  account_number: z.string().min(6, '계좌번호는 6자리 이상이어야 합니다.'),
  is_active: z.boolean(),
})
type BankForm = z.infer<typeof bankSchema>

const UPLOAD_STATE_LABELS: Record<UploadState, string> = {
  idle: '드래그하거나 클릭하여 업로드',
  requesting_signed_url: 'URL 요청 중...',
  uploading: '업로드 중...',
  verifying: '검증 중...',
  done: '업로드 완료',
  failed: '업로드 실패',
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>(MOCK_BANK_ACCOUNTS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BankForm>({
    resolver: zodResolver(bankSchema),
    defaultValues: { is_active: true },
  })

  const isActive = watch('is_active')

  const openCreate = () => {
    setEditingAccount(null)
    setPreviewUrl(null)
    setUploadState('idle')
    reset({ bank_name: '', account_name: '', account_number: '', is_active: true })
    setDialogOpen(true)
  }

  const openEdit = (acc: BankAccount) => {
    setEditingAccount(acc)
    setPreviewUrl(acc.qr_image_url ?? null)
    setUploadState(acc.qr_image_url ? 'done' : 'idle')
    reset({
      bank_name: acc.bank_name,
      account_name: acc.account_name,
      account_number: acc.account_number,
      is_active: acc.is_active,
    })
    setDialogOpen(true)
  }

  const simulateUpload = async (file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      toast.error('PNG/JPG 파일만 업로드해 주세요.')
      return
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Step 1: Request signed URL
    setUploadState('requesting_signed_url')
    await new Promise((r) => setTimeout(r, 600))

    // Step 2: Upload
    setUploadState('uploading')
    await new Promise((r) => setTimeout(r, 800))

    // Step 3: Verify
    setUploadState('verifying')
    await new Promise((r) => setTimeout(r, 400))

    // Simulate 90% success
    if (Math.random() > 0.1) {
      setUploadState('done')
      toast.success('업로드 완료')
    } else {
      setUploadState('failed')
      setPreviewUrl(null)
      toast.error('업로드에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) simulateUpload(file)
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) simulateUpload(file)
  }, [])

  const onSubmit = async (data: BankForm) => {
    await new Promise((r) => setTimeout(r, 400))

    if (editingAccount) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === editingAccount.id
            ? { ...a, ...data, qr_image_url: previewUrl ?? a.qr_image_url }
            : a
        )
      )
    } else {
      const newAcc: BankAccount = {
        id: `ba-${Date.now()}`,
        ...data,
        qr_image_url: previewUrl ?? undefined,
        sort_order: accounts.length + 1,
        created_at: new Date().toISOString(),
      }
      setAccounts((prev) => [...prev, newAcc])
    }

    toast.success('저장되었습니다.')
    setDialogOpen(false)
  }

  const toggleActive = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a))
    )
    toast.success('상태가 변경되었습니다.')
  }

  const isUploading = ['requesting_signed_url', 'uploading', 'verifying'].includes(uploadState)

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">계좌/QR 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">결제용 은행 계좌와 QR 코드를 관리합니다.</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          계좌 추가
        </Button>
      </div>

      {/* Account List */}
      <div className="space-y-3">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className={cn(
              'bg-card border rounded-2xl shadow-sm p-5 flex items-start gap-4 transition-all',
              acc.is_active ? 'border-border' : 'border-border opacity-60'
            )}
          >
            <div className="hidden sm:flex flex-col items-center pt-1 text-muted-foreground cursor-grab">
              <GripVertical className="w-4 h-4" />
            </div>

            {/* QR Preview */}
            <div className="w-16 h-16 flex-shrink-0 rounded-xl bg-muted/50 border border-border flex items-center justify-center overflow-hidden">
              {acc.qr_image_url ? (
                <img src={acc.qr_image_url} alt="QR" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground">{acc.bank_name}</span>
                <Badge
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-lg',
                    acc.is_active
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-muted text-muted-foreground border border-border'
                  )}
                >
                  {acc.is_active ? '활성' : '비활성'}
                </Badge>
              </div>
              <p className="text-sm text-foreground mt-1">{acc.account_name}</p>
              <p className="text-sm font-mono text-muted-foreground">{acc.account_number}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch
                checked={acc.is_active}
                onCheckedChange={() => toggleActive(acc.id)}
                className="data-[state=checked]:bg-primary"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(acc)}
                className="rounded-xl h-8 w-8 p-0"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-lg font-bold">
              {editingAccount ? '계좌 수정' : '계좌 추가'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
            {/* Bank Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">은행명 <span className="text-destructive">*</span></Label>
              <Input className="rounded-xl" placeholder="예: Vietcombank" {...register('bank_name')} />
              {errors.bank_name && <p className="text-xs text-destructive">{errors.bank_name.message}</p>}
            </div>

            {/* Account Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">예금주 <span className="text-destructive">*</span></Label>
              <Input className="rounded-xl" placeholder="예금주명" {...register('account_name')} />
              {errors.account_name && <p className="text-xs text-destructive">{errors.account_name.message}</p>}
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">계좌번호 <span className="text-destructive">*</span></Label>
              <Input className="rounded-xl font-mono" placeholder="계좌번호 (6자 이상)" {...register('account_number')} />
              {errors.account_number && <p className="text-xs text-destructive">{errors.account_number.message}</p>}
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between py-1">
              <Label className="text-sm font-medium">활성화</Label>
              <Switch
                checked={isActive}
                onCheckedChange={(v) => setValue('is_active', v)}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {/* QR Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                QR 코드 이미지
                {isActive && <span className="text-destructive ml-1">*</span>}
              </Label>

              {/* Preview */}
              {previewUrl && uploadState === 'done' ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="QR 미리보기"
                    className="w-32 h-32 rounded-xl object-cover border border-border"
                  />
                  <div className="absolute inset-0 flex items-end justify-end p-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-7 text-xs bg-card/90 backdrop-blur-sm gap-1"
                      onClick={() => { setUploadState('idle'); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    >
                      <RefreshCw className="w-3 h-3" />
                      교체 업로드
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    'border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer',
                    isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30',
                    uploadState === 'failed' && 'border-destructive/50 bg-destructive/5'
                  )}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-7 h-7 text-primary animate-spin" />
                      <p className="text-sm text-primary font-medium">{UPLOAD_STATE_LABELS[uploadState]}</p>
                    </div>
                  ) : uploadState === 'failed' ? (
                    <div className="flex flex-col items-center gap-2">
                      <XCircle className="w-7 h-7 text-destructive" />
                      <p className="text-sm text-destructive font-medium">업로드에 실패했습니다.</p>
                      <p className="text-xs text-muted-foreground">다시 시도해 주세요.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-7 h-7 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{UPLOAD_STATE_LABELS[uploadState]}</p>
                      <p className="text-xs text-muted-foreground">PNG / JPG</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setDialogOpen(false)}
              >
                닫기
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isUploading}
              >
                저장
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
