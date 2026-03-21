'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import {
  Plus, Edit2, Upload,
  ImageIcon, Loader2, XCircle, RefreshCw, GripVertical
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MOCK_BANK_ACCOUNTS } from '@/lib/mock-data'
import type { BankAccount } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_BANK_ACCOUNTS_LABELS, ADMIN_COMMON_LABELS, getAdminLabel } from '@/lib/admin-i18n'

type UploadState = 'idle' | 'requesting_signed_url' | 'uploading' | 'verifying' | 'done' | 'failed'

type BankForm = {
  bank_name: string
  account_name: string
  account_number: string
  is_active: boolean
}

export default function BankAccountsPage() {
  const { locale } = useAdminLocale()
  const [accounts, setAccounts] = useState<BankAccount[]>(MOCK_BANK_ACCOUNTS)

  const bankSchema = useMemo(
    () =>
      z.object({
        bank_name: z.string().min(1, getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'bank_name_error')),
        account_name: z.string().min(1, getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'account_name_error')),
        account_number: z.string().min(6, getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'account_number_error')),
        is_active: z.boolean(),
      }),
    [locale]
  )

  const UPLOAD_STATE_LABELS = useMemo(
    (): Record<UploadState, string> => ({
      idle: getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'upload_idle'),
      requesting_signed_url: getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'upload_requesting'),
      uploading: getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'upload_uploading'),
      verifying: getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'upload_verifying'),
      done: getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'upload_done'),
      failed: getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'upload_failed'),
    }),
    [locale]
  )
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
      toast.error(getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'file_type_error'))
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
      toast.success(getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'upload_success'))
    } else {
      setUploadState('failed')
      setPreviewUrl(null)
      toast.error(getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'upload_failed_msg') + ' ' + getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'retry_hint'))
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

    toast.success(getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'save_success'))
    setDialogOpen(false)
  }

  const toggleActive = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a))
    )
    toast.success(getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'status_changed'))
  }

  const isUploading = ['requesting_signed_url', 'uploading', 'verifying'].includes(uploadState)

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'page_title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'page_subtitle')}</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          {getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'add_account')}
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
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-lg',
                    acc.is_active
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-muted text-muted-foreground border border-border'
                  )}
                >
                  {acc.is_active ? getAdminLabel(locale, ADMIN_COMMON_LABELS, 'status_active') : getAdminLabel(locale, ADMIN_COMMON_LABELS, 'status_inactive')}
                </span>
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
              {editingAccount ? getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'edit_dialog_title') : getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'add_dialog_title')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
            {/* Bank Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'bank_name')} <span className="text-destructive">*</span></Label>
              <Input className="rounded-xl" placeholder={getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'bank_name_placeholder')} {...register('bank_name')} />
              {errors.bank_name && <p className="text-xs text-destructive">{errors.bank_name.message}</p>}
            </div>

            {/* Account Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'account_name')} <span className="text-destructive">*</span></Label>
              <Input className="rounded-xl" placeholder={getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'account_name_placeholder')} {...register('account_name')} />
              {errors.account_name && <p className="text-xs text-destructive">{errors.account_name.message}</p>}
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'account_number')} <span className="text-destructive">*</span></Label>
              <Input className="rounded-xl font-mono" placeholder={getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'account_number_placeholder')} {...register('account_number')} />
              {errors.account_number && <p className="text-xs text-destructive">{errors.account_number.message}</p>}
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between py-1">
              <Label className="text-sm font-medium">{getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'is_active')}</Label>
              <Switch
                checked={isActive}
                onCheckedChange={(v) => setValue('is_active', v)}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {/* QR Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'qr_image')}
                {isActive && <span className="text-destructive ml-1">*</span>}
              </Label>

              {/* Preview */}
              {previewUrl && uploadState === 'done' ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt={getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'qr_preview_alt')}
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
                      {getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'replace_upload')}
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
                      <p className="text-sm text-destructive font-medium">{getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'upload_failed_msg')}</p>
                      <p className="text-xs text-muted-foreground">{getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'retry_hint')}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-7 h-7 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{UPLOAD_STATE_LABELS[uploadState]}</p>
                      <p className="text-xs text-muted-foreground">{getAdminLabel(locale, ADMIN_BANK_ACCOUNTS_LABELS, 'file_types')}</p>
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
                {getAdminLabel(locale, ADMIN_COMMON_LABELS, 'close')}
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isUploading}
              >
                {getAdminLabel(locale, ADMIN_COMMON_LABELS, 'save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
