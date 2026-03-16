'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthGuard } from '@/components/storefront/auth-guard'
import { useAuth } from '@/lib/auth-context'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function AccountSettingsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
  })

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token ?? ''

        const response = await fetch('/api/account/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
          credentials: 'include',
        })
        const result = (await response.json()) as {
          ok?: boolean
          error?: string
          profile?: { full_name?: string; phone?: string; email?: string }
        }
        if (!response.ok) {
          toast.error(result.error || '프로필을 불러오지 못했습니다.')
          return
        }

        setForm({
          full_name: result.profile?.full_name ?? '',
          phone: result.profile?.phone ?? '',
          email: result.profile?.email ?? user.email ?? '',
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '프로필을 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile().catch(() => {
      setIsLoading(false)
    })
  }, [user])

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error('이름을 입력해주세요.')
      return
    }
    setIsSaving(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''

      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone,
        }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok) {
        toast.error(result.error || '저장에 실패했습니다.')
        return
      }

      toast.success('계정 정보가 저장되었습니다.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          내 계정
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-6">계정 설정</h1>

        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {isLoading ? (
              <p className="text-muted-foreground">프로필을 불러오는 중...</p>
            ) : (
              <>
                <div className="space-y-1">
                  <Label htmlFor="full_name">이름</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, full_name: event.target.value }))
                    }
                    placeholder="이름을 입력해주세요"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    placeholder="090-1234-5678"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">이메일</Label>
                  <Input id="email" value={form.email || user?.email || ''} disabled />
                </div>

                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? '저장 중...' : '저장'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}
