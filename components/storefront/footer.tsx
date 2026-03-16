'use client'

import Link from 'next/link'
import { ChefHat, Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react'
import { MOCK_SITE_SETTINGS } from '@/lib/mock-data'
import { usePublicSettings } from '@/lib/use-public-settings'

export function Footer() {
  const { settings: publicSettings } = usePublicSettings()
  const settings = {
    ...MOCK_SITE_SETTINGS,
    site_name_ko: publicSettings.site_name_ko || MOCK_SITE_SETTINGS.site_name_ko,
    tagline_ko: publicSettings.tagline_ko || MOCK_SITE_SETTINGS.tagline_ko,
    contact_phone: publicSettings.contact_phone || MOCK_SITE_SETTINGS.contact_phone,
    contact_email: publicSettings.contact_email || MOCK_SITE_SETTINGS.contact_email,
    contact_address: publicSettings.contact_address || MOCK_SITE_SETTINGS.contact_address,
    operating_hours: publicSettings.operating_hours || MOCK_SITE_SETTINGS.operating_hours,
  }

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">{settings.site_name_ko}</p>
                <p className="text-xs text-background/60">{settings.tagline_ko}</p>
              </div>
            </Link>
            <p className="text-sm text-background/70 leading-relaxed">
              베트남 호치민에서 정통 한국 가정식을 배달해 드립니다. 매일 신선한 재료로 정성껏 조리합니다.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm mb-4">연락처</h3>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <a href={`tel:${settings.contact_phone.replace(/\s/g, '')}`} className="hover:text-background transition-colors">
                  {settings.contact_phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <a href={`mailto:${settings.contact_email}`} className="hover:text-background transition-colors">
                  {settings.contact_email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <span>{settings.contact_address}</span>
              </li>
            </ul>

            {/* Social */}
            <div className="flex items-center gap-3 mt-5">
              {settings.social_links.facebook && (
                <a
                  href={settings.social_links.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                  <span className="sr-only">Facebook</span>
                </a>
              )}
              {settings.social_links.instagram && (
                <a
                  href={settings.social_links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span className="sr-only">Instagram</span>
                </a>
              )}
              {settings.social_links.zalo && (
                <a
                  href={settings.social_links.zalo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="sr-only">Zalo</span>
                </a>
              )}
            </div>
          </div>

          {/* Footer Sections */}
          {settings.footer_sections.map((section) => (
            <div key={section.id}>
              <h3 className="font-semibold text-sm mb-4">{section.title_ko}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.url}
                      target={link.open_in_new_tab ? '_blank' : undefined}
                      rel={link.open_in_new_tab ? 'noopener noreferrer' : undefined}
                      className="text-sm text-background/70 hover:text-background transition-colors"
                    >
                      {link.label_ko}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-background/50">
          <p>&copy; {new Date().getFullYear()} {settings.site_name_ko}. All rights reserved.</p>
          <p>영업시간: {settings.operating_hours}</p>
        </div>
      </div>
    </footer>
  )
}
