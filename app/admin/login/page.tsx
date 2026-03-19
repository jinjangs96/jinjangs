'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChefHat, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useStaff } from '@/lib/staff-context'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_LOGIN_LABELS, getAdminLabel } from '@/lib/admin-i18n'

type LoginForm = {
  email: string
  password: string
}

type FormState = 'idle' | 'loading' | 'success' | 'error'

export default function LoginPage() {
  const router = useRouter()
  const { locale } = useAdminLocale()
  const { login } = useStaff()
  const [state, setState] = useState<FormState>('idle')
  const [globalError, setGlobalError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(getAdminLabel(locale, ADMIN_LOGIN_LABELS, 'email_error')),
        password: z.string().min(8, getAdminLabel(locale, ADMIN_LOGIN_LABELS, 'password_error')),
      }),
    [locale]
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setState('loading')
    setGlobalError('')

    const result = await login(data.email, data.password)
    if (!result.ok) {
      setState('error')
      setGlobalError(result.error || getAdminLabel(locale, ADMIN_LOGIN_LABELS, 'login_failed'))
      return
    }

    setState('success')
    const next =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('next')
        : null
    router.push(next || '/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
            <ChefHat className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Jin Jang's Kitchen</h1>
            <p className="text-sm text-muted-foreground mt-1">{getAdminLabel(locale, ADMIN_LOGIN_LABELS, 'page_title')}</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          {globalError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                {getAdminLabel(locale, ADMIN_LOGIN_LABELS, 'email_label')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={getAdminLabel(locale, ADMIN_LOGIN_LABELS, 'email_placeholder')}
                autoComplete="email"
                disabled={state === 'loading'}
                className={cn(
                  'rounded-xl',
                  errors.email && 'border-destructive focus-visible:ring-destructive/30'
                )}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                {getAdminLabel(locale, ADMIN_LOGIN_LABELS, 'password_label')} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={getAdminLabel(locale, ADMIN_LOGIN_LABELS, 'password_placeholder')}
                  autoComplete="current-password"
                  disabled={state === 'loading'}
                  className={cn(
                    'rounded-xl pr-10',
                    errors.password && 'border-destructive focus-visible:ring-destructive/30'
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={state === 'loading'}
              className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-semibold mt-2"
            >
              {state === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {getAdminLabel(locale, ADMIN_LOGIN_LABELS, 'logging_in')}
                </>
              ) : (
                getAdminLabel(locale, ADMIN_LOGIN_LABELS, 'submit')
              )}
            </Button>
          </form>
        </div>

      </div>
    </div>
  )
}
