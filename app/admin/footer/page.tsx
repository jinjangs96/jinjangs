'use client'

import { useState } from 'react'
import { Edit, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MOCK_SITE_SETTINGS } from '@/lib/mock-data'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_FOOTER_LABELS, ADMIN_COMMON_LABELS, getAdminLabel } from '@/lib/admin-i18n'

export default function FooterPage() {
  const { locale } = useAdminLocale()
  const [footerData, setFooterData] = useState(MOCK_SITE_SETTINGS.footer_sections)
  const [editingSection, setEditingSection] = useState<string | null>(null)

  const handleAddLink = (sectionId: string) => {
    setFooterData(footerData.map(section =>
      section.id === sectionId
        ? {
            ...section,
            links: [
              ...section.links,
              {
                id: `link-${Date.now()}`,
                label_ko: getAdminLabel(locale, ADMIN_FOOTER_LABELS, 'new_link_label'),
                url: '#',
                open_in_new_tab: false,
              },
            ],
          }
        : section
    ))
  }

  const handleDeleteLink = (sectionId: string, linkId: string) => {
    setFooterData(footerData.map(section =>
      section.id === sectionId
        ? {
            ...section,
            links: section.links.filter(link => link.id !== linkId),
          }
        : section
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{getAdminLabel(locale, ADMIN_FOOTER_LABELS, 'page_title')}</h1>
        <p className="text-muted-foreground mt-1">{getAdminLabel(locale, ADMIN_FOOTER_LABELS, 'page_subtitle')}</p>
      </div>

      {/* Footer Sections */}
      <div className="space-y-4">
        {footerData.map((section) => (
          <Card key={section.id}>
            <CardHeader className="bg-secondary/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{section.title_ko}</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {editingSection === section.id ? getAdminLabel(locale, ADMIN_FOOTER_LABELS, 'done') : getAdminLabel(locale, ADMIN_COMMON_LABELS, 'edit')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {editingSection === section.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">{getAdminLabel(locale, ADMIN_FOOTER_LABELS, 'section_title_label')}</label>
                    <Input 
                      value={section.title_ko} 
                      onChange={(e) => {
                        setFooterData(footerData.map(s =>
                          s.id === section.id ? { ...s, title_ko: e.target.value } : s
                        ))
                      }}
                      className="mt-1"
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{getAdminLabel(locale, ADMIN_FOOTER_LABELS, 'links_label')}</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAddLink(section.id)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {getAdminLabel(locale, ADMIN_FOOTER_LABELS, 'add_btn')}
                      </Button>
                    </div>

                    {section.links.map((link, index) => (
                      <div key={link.id} className="flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                          <Input 
                            placeholder={getAdminLabel(locale, ADMIN_FOOTER_LABELS, 'link_text_placeholder')}
                            value={link.label_ko}
                            onChange={(e) => {
                              setFooterData(footerData.map(s =>
                                s.id === section.id
                                  ? {
                                      ...s,
                                      links: s.links.map(l =>
                                        l.id === link.id
                                          ? { ...l, label_ko: e.target.value }
                                          : l
                                      ),
                                    }
                                  : s
                              ))
                            }}
                            className="text-sm"
                          />
                          <Input 
                            placeholder={getAdminLabel(locale, ADMIN_FOOTER_LABELS, 'url_placeholder')}
                            value={link.url}
                            onChange={(e) => {
                              setFooterData(footerData.map(s =>
                                s.id === section.id
                                  ? {
                                      ...s,
                                      links: s.links.map(l =>
                                        l.id === link.id
                                          ? { ...l, url: e.target.value }
                                          : l
                                      ),
                                    }
                                  : s
                              ))
                            }}
                            className="text-sm"
                          />
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDeleteLink(section.id, link.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {section.links.map((link) => (
                    <div key={link.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded">
                      <div>
                        <p className="text-sm font-medium text-foreground">{link.label_ko}</p>
                        <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {link.open_in_new_tab ? getAdminLabel(locale, ADMIN_FOOTER_LABELS, 'new_tab') : getAdminLabel(locale, ADMIN_FOOTER_LABELS, 'current_tab')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview */}
      <Card className="border-primary/30 bg-secondary/10">
        <CardHeader>
          <CardTitle className="text-lg">{getAdminLabel(locale, ADMIN_FOOTER_LABELS, 'preview_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-background p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {footerData.map((section) => (
                <div key={section.id}>
                  <p className="font-semibold text-foreground mb-3 text-sm">{section.title_ko}</p>
                  <div className="space-y-2">
                    {section.links.map((link) => (
                      <a 
                        key={link.id}
                        href={link.url}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors block"
                      >
                        {link.label_ko}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
