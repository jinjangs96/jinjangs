'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (user) return

    const nextPath = encodeURIComponent(pathname || '/account')
    router.replace(`/login?next=${nextPath}`)
  }, [isLoading, pathname, router, user])

  if (isLoading || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">로그인 상태를 확인하는 중입니다...</p>
      </div>
    )
  }

  return <>{children}</>
}
