'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type Language = 'ko' | 'vi' | 'en' | 'ja' | 'zh'

export interface LanguageSwitcherProps {
  currentLanguage: Language
  onLanguageChange: (lang: Language) => void
}

const LANGUAGES: { code: Language; label: string; short: string }[] = [
  { code: 'ko', label: '한국어', short: 'KO' },
  { code: 'vi', label: 'Tiếng Việt', short: 'VI' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ja', label: '日本語', short: 'JP' },
  { code: 'zh', label: '中文', short: 'ZH' },
]

export function LanguageSwitcher({ currentLanguage, onLanguageChange }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentLabel = LANGUAGES.find(l => l.code === currentLanguage)?.short || 'KO'

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="text-xs font-medium text-muted-foreground hover:text-foreground gap-1 px-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentLabel}
        <ChevronDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-32">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onLanguageChange(lang.code)
                setIsOpen(false)
              }}
              className={cn(
                'w-full px-3 py-2 text-left text-xs font-medium transition-colors first:rounded-t-lg last:rounded-b-lg',
                currentLanguage === lang.code
                  ? 'bg-secondary text-primary'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
