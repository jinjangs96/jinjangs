'use client'

import { useState } from 'react'
import { Edit, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MOCK_POLICY_PAGES } from '@/lib/mock-data'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_POLICIES_LABELS, getAdminLabel } from '@/lib/admin-i18n'

export default function PoliciesPage() {
  const { locale } = useAdminLocale()
  const [policies, setPolicies] = useState(MOCK_POLICY_PAGES)
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    setPolicies(policies.filter(p => p.id !== id))
    if (selectedPolicy === id) setSelectedPolicy(null)
  }

  const selectedPolicyData = selectedPolicy 
    ? policies.find(p => p.id === selectedPolicy)
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{getAdminLabel(locale, ADMIN_POLICIES_LABELS, 'page_title')}</h1>
          <p className="text-muted-foreground mt-1">{getAdminLabel(locale, ADMIN_POLICIES_LABELS, 'page_subtitle')}</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          {getAdminLabel(locale, ADMIN_POLICIES_LABELS, 'add_btn')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">{getAdminLabel(locale, ADMIN_POLICIES_LABELS, 'list_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {policies.map((policy) => (
                <button
                  key={policy.id}
                  onClick={() => setSelectedPolicy(policy.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedPolicy === policy.id
                      ? 'bg-secondary text-primary font-semibold'
                      : 'bg-muted/50 text-foreground hover:bg-muted'
                  }`}
                >
                  <p className="truncate">{policy.title_ko}</p>
                  <p className="text-xs text-muted-foreground truncate">/{policy.slug}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Policy Editor */}
        <Card className="lg:col-span-2">
          {selectedPolicyData ? (
            <>
              <CardHeader className="bg-secondary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedPolicyData.title_ko}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">/{selectedPolicyData.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(selectedPolicyData.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none">
                  <div 
                    dangerouslySetInnerHTML={{ __html: selectedPolicyData.content_html }}
                    className="text-sm text-foreground space-y-3"
                  />
                </div>
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {getAdminLabel(locale, ADMIN_POLICIES_LABELS, 'last_modified')}: {new Date(selectedPolicyData.updated_at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'ko-KR')}
                  </p>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="pt-12 text-center">
              <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_POLICIES_LABELS, 'select_prompt')}</p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Help Info */}
      <Card className="border-primary/30 bg-secondary/10">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground mb-2">{getAdminLabel(locale, ADMIN_POLICIES_LABELS, 'tips_title')}</h3>
          <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
            <li>{getAdminLabel(locale, ADMIN_POLICIES_LABELS, 'tip_1')}</li>
            <li>{getAdminLabel(locale, ADMIN_POLICIES_LABELS, 'tip_2')}</li>
            <li>{getAdminLabel(locale, ADMIN_POLICIES_LABELS, 'tip_3')}</li>
            <li>{getAdminLabel(locale, ADMIN_POLICIES_LABELS, 'tip_4')}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
