'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChefHat, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const { envError } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    agreeTerms: false,
    agreeMarketing: false,
  })

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다'
    if (!/[A-Z]/.test(pwd)) return '대문자를 포함해주세요'
    if (!/[a-z]/.test(pwd)) return '소문자를 포함해주세요'
    if (!/[0-9]/.test(pwd)) return '숫자를 포함해주세요'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('필수 정보를 모두 입력해주세요')
      return
    }

    const pwdError = validatePassword(form.password)
    if (pwdError) {
      setError(pwdError)
      return
    }

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }

    if (!form.agreeTerms) {
      setError('이용약관에 동의해주세요')
      return
    }

    setIsLoading(true)
    try {
      if (envError) {
        setError(envError)
        return
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          agreeMarketing: form.agreeMarketing,
        }),
      })

      const result = (await response.json()) as { error?: string; needsEmailConfirm?: boolean }

      if (!response.ok) {
        setError(result.error || '회원가입 중 오류가 발생했습니다')
        return
      }

      if (result.needsEmailConfirm) {
        toast.success('회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.')
        router.push('/login')
      } else {
        const supabase = getSupabaseBrowserClient()
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        })

        if (signInError) {
          toast.success('회원가입이 완료되었습니다. 로그인 후 이용해주세요.')
          router.push('/login')
        } else {
          toast.success('회원가입이 완료되었습니다!')
          router.push('/account')
        }
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-primary flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>
            Jin Jang's Kitchen 멤버가 되어 혜택을 누리세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="홍길동"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">비밀번호 *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="mt-1 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">최소 8자, 대문자, 소문자, 숫자 포함</p>
            </div>

            <div>
              <Label htmlFor="passwordConfirm">비밀번호 확인 *</Label>
              <div className="relative">
                <Input
                  id="passwordConfirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.passwordConfirm}
                  onChange={(e) => setForm(prev => ({ ...prev, passwordConfirm: e.target.value }))}
                  placeholder="••••••••"
                  className="mt-1 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="phone">전화번호 (선택)</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="090-1234-5678"
                className="mt-1"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={form.agreeTerms}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, agreeTerms: !!checked }))}
                />
                <span className="text-sm">
                  <Link href="/terms" className="text-primary hover:underline">[필수] 이용약관</Link> 및{' '}
                  <Link href="/privacy" className="text-primary hover:underline">개인정보처리방침</Link>에 동의합니다.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={form.agreeMarketing}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, agreeMarketing: !!checked }))}
                />
                <span className="text-sm text-muted-foreground">
                  [선택] 마케팅 정보 수신에 동의합니다.
                </span>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                '가입하기'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
