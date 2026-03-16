'use client'

import { useState } from 'react'
import { Edit, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MOCK_POLICY_PAGES } from '@/lib/mock-data'

export default function PoliciesPage() {
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
          <h1 className="text-3xl font-bold text-foreground">약관 및 정책</h1>
          <p className="text-muted-foreground mt-1">사이트 약관, 개인정보처리방침 등 관리</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          새 페이지 추가
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">페이지 목록</CardTitle>
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
                    마지막 수정: {new Date(selectedPolicyData.updated_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="pt-12 text-center">
              <p className="text-muted-foreground">페이지를 선택해주세요</p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Help Info */}
      <Card className="border-primary/30 bg-secondary/10">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground mb-2">팁</h3>
          <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
            <li>각 페이지는 고유한 URL 슬러그로 접근 가능합니다</li>
            <li>HTML 형식의 내용을 지원합니다</li>
            <li>수정된 시간이 자동으로 기록됩니다</li>
            <li>공개 설정을 변경하면 고객에게 표시/비표시 됩니다</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
