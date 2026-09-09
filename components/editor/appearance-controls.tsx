'use client'

import React, { useState } from 'react'
import { ArrowDown, ArrowUp, GripVertical, Layers } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'
import {
  accentPresets,
  applyThemePack,
  avatarAnimations,
  colorThemePacks,
  defaultSectionOrder,
  fontClass,
  fontLabelKey,
  fontPreviewFamily,
  fontStyles,
  gradientPresets,
  layoutTemplates,
  patternLabelKey,
  patternPresets,
  patternStyle,
  radiusClass,
  radiusLabelKey,
  spacingConfig,
  type ColorThemePack,
  type Density,
  type LayoutTemplate,
  type Profile,
  type SectionKind,
} from '../types'
import { ImageUploader, Toggle } from '../ui/image-uploader'

export const layoutPreviewBars: Record<LayoutTemplate, { shape: string; count: number }> = {
  classic: { shape: 'bar', count: 3 },
  grid: { shape: 'tile', count: 6 },
  magazine: { shape: 'row', count: 2 },
  card: { shape: 'split', count: 1 },
}

export function LayoutPreview({ layout, accent }: { layout: LayoutTemplate; accent: string }) {
  const cfg = layoutPreviewBars[layout]
  if (cfg.shape === 'tile') {
    return (
      <div className="grid grid-cols-3 gap-1 p-2">
        {Array.from({ length: cfg.count }).map((_, i) => (
          <div key={i} className="aspect-square rounded-[3px]" style={{ backgroundColor: `${accent}33` }} />
        ))}
      </div>
    )
  }
  if (cfg.shape === 'row') {
    return (
      <div className="flex flex-col gap-1.5 p-2">
        {Array.from({ length: cfg.count }).map((_, i) => (
          <div key={i} className="h-4 rounded-[3px]" style={{ backgroundColor: `${accent}33` }} />
        ))}
        <div className="mt-1 h-6 rounded-[3px]" style={{ backgroundColor: `${accent}55` }} />
      </div>
    )
  }
  if (cfg.shape === 'split') {
    return (
      <div className="flex h-full gap-1.5 p-2">
        <div className="w-1/3 rounded-[3px]" style={{ backgroundColor: `${accent}55` }} />
        <div className="flex flex-1 flex-col gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-3 rounded-[3px]" style={{ backgroundColor: `${accent}33` }} />
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-1.5 p-2">
      {Array.from({ length: cfg.count }).map((_, i) => (
        <div key={i} className="h-3.5 w-full rounded-[3px]" style={{ backgroundColor: `${accent}33` }} />
      ))}
    </div>
  )
}

export function AppearanceControls({ draft, onChange, uid }: { draft: Profile; onChange: (next: Profile) => void; uid?: string | null }) {
  const { t } = useI18n()
  const [dragSection, setDragSection] = useState<number | null>(null)
  const sectionOrder = draft.sectionOrder?.length ? draft.sectionOrder : defaultSectionOrder
  const sectionLabel: Record<SectionKind, string> = { links: t('yourLinks'), projects: t('yourProjects') }

  function reorderSections(targetIndex: number) {
    if (dragSection === null || dragSection === targetIndex) return
    const next = [...sectionOrder]
    const [moved] = next.splice(dragSection, 1)
    next.splice(targetIndex, 0, moved)
    onChange({ ...draft, sectionOrder: next })
    setDragSection(null)
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= sectionOrder.length) return
    const next = [...sectionOrder]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    onChange({ ...draft, sectionOrder: next })
  }

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium">
          <Layers className="mr-2 inline size-4 text-muted-foreground" />
          {t('layoutTemplate')}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {layoutTemplates.map((layout) => (
            <button
              key={layout}
              type="button"
              onClick={() => onChange({ ...draft, layoutTemplate: layout })}
              aria-pressed={draft.layoutTemplate === layout}
              className={`overflow-hidden rounded-xl border text-left transition ${
                draft.layoutTemplate === layout ? 'border-foreground ring-2 ring-foreground/20' : 'hover:border-foreground/40'
              }`}
            >
              <div className="h-16 bg-secondary/60">
                <LayoutPreview layout={layout} accent={draft.accentColor} />
              </div>
              <p className="border-t px-2 py-1.5 text-xs font-medium capitalize">{t(`layout${layout.charAt(0).toUpperCase()}${layout.slice(1)}`)}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-medium">
          <GripVertical className="mr-2 inline size-4 text-muted-foreground" />
          {t('sectionOrder')}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{t('sectionOrderHint')}</p>
        <div className="mt-4 space-y-2">
          {sectionOrder.map((key, index) => (
            <div
              key={key}
              draggable
              onDragStart={() => setDragSection(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => reorderSections(index)}
              onDragEnd={() => setDragSection(null)}
              className={`flex items-center justify-between rounded-xl border bg-background px-4 py-3 text-sm font-medium transition ${
                dragSection === index ? 'opacity-50' : ''
              }`}
            >
              <span className="flex items-center gap-3">
                <GripVertical className="hidden size-4 cursor-grab text-muted-foreground active:cursor-grabbing sm:block" />
                {sectionLabel[key]}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveSection(index, -1)}
                  aria-label="Move section up"
                  className="grid size-9 place-items-center rounded-lg border text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={index === sectionOrder.length - 1}
                  onClick={() => moveSection(index, 1)}
                  aria-label="Move section down"
                  className="grid size-9 place-items-center rounded-lg border text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-medium">{t('colorThemePack')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('colorThemePackHint')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {colorThemePacks.map((pack) => (
            <button
              key={pack}
              type="button"
              onClick={() => onChange(applyThemePack(draft, pack))}
              aria-pressed={(draft.colorThemePack || 'custom') === pack}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-xs font-medium capitalize transition ${
                (draft.colorThemePack || 'custom') === pack ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'
              }`}
            >
              {t(`themePack${pack.charAt(0).toUpperCase()}${pack.slice(1)}`)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-medium">{t('accentColor')}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {accentPresets.map((hex) => (
            <button
              key={hex}
              type="button"
              aria-label={hex}
              onClick={() => onChange({ ...draft, accentColor: hex, colorThemePack: 'custom' })}
              className={`size-8 rounded-full border border-border shadow-xs transition hover:scale-110 ${
                draft.accentColor === hex ? 'ring-2 ring-foreground ring-offset-2' : ''
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <input
              type="color"
              value={draft.accentColor}
              onChange={(e) => onChange({ ...draft, accentColor: e.target.value, colorThemePack: 'custom' })}
              className="size-5 cursor-pointer appearance-none rounded-full border border-border p-0"
            />
            <span>{t('customColor')}</span>
          </label>
        </div>
      </section>

      <section>
        <p className="text-sm font-medium">{t('theme')}</p>
        <div className="mt-4 flex gap-2">
          {(['light', 'dark'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ ...draft, theme: mode, colorThemePack: 'custom' })}
              className={`min-h-[44px] flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium capitalize transition ${
                draft.theme === mode ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'
              }`}
            >
              {t(mode)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-medium">{t('buttonStyle')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['solid', 'outline', 'ghost'] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => onChange({ ...draft, buttonStyle: style })}
              className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-medium capitalize transition ${
                draft.buttonStyle === style ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'
              }`}
            >
              {t(style)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-medium">{t('cardRadius')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['lg', 'xl', '2xl', '3xl'] as const).map((rad) => (
            <button
              key={rad}
              type="button"
              onClick={() => onChange({ ...draft, cardRadius: rad })}
              className={`min-h-[44px] border px-4 py-2 text-sm font-medium transition ${radiusClass[rad]} ${
                draft.cardRadius === rad ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'
              }`}
            >
              {t(radiusLabelKey[rad])}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-medium">{t('spacing')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['compact', 'cozy', 'spacious'] as Density[]).map((den) => (
            <button
              key={den}
              type="button"
              onClick={() => onChange({ ...draft, spacing: den })}
              className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-medium transition ${
                (draft.spacing || 'cozy') === den ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'
              }`}
            >
              {t(spacingConfig[den] ? (den === 'compact' ? 'spacingCompact' : den === 'cozy' ? 'spacingCozy' : 'spacingSpacious') : 'spacingCozy')}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Toggle label={t('cardShadow')} checked={draft.cardShadow !== false} onChange={(v) => onChange({ ...draft, cardShadow: v })} />
        </div>
      </section>

      <section>
        <p className="text-sm font-medium">{t('fontStyle')}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {fontStyles.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onChange({ ...draft, fontStyle: f })}
              className={`rounded-xl border p-3 text-left transition ${
                draft.fontStyle === f ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'
              }`}
            >
              <span className={`block text-lg ${fontClass[f]}`} style={{ fontFamily: fontPreviewFamily[f] }}>
                Pexiloq
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{t(fontLabelKey[f])}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-medium">{t('sections')}</p>
        <div className="mt-4 space-y-2">
          <Toggle label={t('showAvatar')} checked={draft.showAvatar} onChange={(v) => onChange({ ...draft, showAvatar: v })} />
          <Toggle label={t('showBadge')} checked={draft.showBadge} onChange={(v) => onChange({ ...draft, showBadge: v })} />
          <Toggle label={t('showLinkIcons')} checked={draft.showLinkIcons !== false} onChange={(v) => onChange({ ...draft, showLinkIcons: v })} />
          <Toggle label={t('showVerifiedBadge')} checked={draft.showVerifiedBadge} onChange={(v) => onChange({ ...draft, showVerifiedBadge: v })} />
        </div>
      </section>

      <section>
        <p className="text-sm font-medium">{t('coverImage')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('coverImageHint')}</p>
        <div className="mt-4 space-y-3">
          <input
            value={draft.coverImageURL || ''}
            onChange={(e) => onChange({ ...draft, coverImageURL: e.target.value.trim() })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-base sm:text-sm"
            placeholder="https://…"
          />
          {uid && (
            <ImageUploader
              uid={uid}
              maxDimension={1920}
              value={draft.coverImageURL}
              shape="rect"
              aspect={3}
              onUploaded={(url) => onChange({ ...draft, coverImageURL: url })}
              onRemove={() => onChange({ ...draft, coverImageURL: '' })}
            />
          )}
          {draft.coverImageURL && (
            <div className="space-y-3 border-t pt-3">
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('coverImageHeight')}</span>
                  <span>{draft.coverImageHeight || 140}px</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={280}
                  step={10}
                  value={draft.coverImageHeight || 140}
                  onChange={(e) => onChange({ ...draft, coverImageHeight: Number(e.target.value) })}
                  className="mt-2 w-full"
                  aria-label={t('coverImageHeight')}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('coverImageFit')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(['cover', 'contain', 'fill'] as const).map((fit) => (
                    <button
                      key={fit}
                      type="button"
                      onClick={() => onChange({ ...draft, coverImageFit: fit })}
                      aria-pressed={(draft.coverImageFit || 'cover') === fit}
                      className={`min-h-[36px] rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        (draft.coverImageFit || 'cover') === fit ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'
                      }`}
                    >
                      {t(`coverFit${fit.charAt(0).toUpperCase()}${fit.slice(1)}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('coverImagePositionX')}</span>
                  <span>{draft.coverImagePositionX ?? 50}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={draft.coverImagePositionX ?? 50}
                  onChange={(e) => onChange({ ...draft, coverImagePositionX: Number(e.target.value) })}
                  className="mt-2 w-full"
                  aria-label={t('coverImagePositionX')}
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('coverImagePositionY')}</span>
                  <span>{draft.coverImagePositionY ?? 50}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={draft.coverImagePositionY ?? 50}
                  onChange={(e) => onChange({ ...draft, coverImagePositionY: Number(e.target.value) })}
                  className="mt-2 w-full"
                  aria-label={t('coverImagePositionY')}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <p className="text-sm font-medium">{t('avatarShape')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['circle', 'rounded', 'square'] as const).map((shape) => (
            <button
              key={shape}
              type="button"
              onClick={() => onChange({ ...draft, avatarShape: shape })}
              className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-medium capitalize transition ${
                draft.avatarShape === shape ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'
              }`}
            >
              {t(shape === 'circle' ? 'avatarCircle' : shape === 'rounded' ? 'avatarRounded' : 'avatarSquare')}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Toggle label={t('avatarRing')} checked={draft.avatarRing} onChange={(v) => onChange({ ...draft, avatarRing: v })} />
        </div>
        <p className="mt-4 text-xs font-medium text-muted-foreground">{t('avatarAnimation')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {avatarAnimations.map((anim) => (
            <button
              key={anim}
              type="button"
              onClick={() => onChange({ ...draft, avatarAnimation: anim })}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium capitalize transition ${
                draft.avatarAnimation === anim ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'
              }`}
            >
              {t(`avatarAnim${anim.charAt(0).toUpperCase()}${anim.slice(1)}`)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-medium">{t('socialStyle')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['outline', 'filled'] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => onChange({ ...draft, socialStyle: style })}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium capitalize transition ${
                draft.socialStyle === style ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'
              }`}
            >
              {t(style === 'outline' ? 'socialOutline' : 'socialFilled')}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-medium">{t('pageBackground')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['default', 'gradient', 'pattern', 'image'] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => onChange({ ...draft, backgroundStyle: style })}
              className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-medium capitalize transition ${
                draft.backgroundStyle === style ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'
              }`}
            >
              {t(`bg${style.charAt(0).toUpperCase() + style.slice(1)}`)}
            </button>
          ))}
        </div>
        {draft.backgroundStyle === 'default' && (
          <label className="mt-3 flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium">
            <input
              type="color"
              value={draft.backgroundColor || '#f6f8fc'}
              onChange={(e) => onChange({ ...draft, backgroundColor: e.target.value })}
              className="size-6 cursor-pointer appearance-none rounded-full border border-border p-0"
              aria-label={t('customColor')}
            />
            <span>{t('customColor')}</span>
            {draft.backgroundColor && (
              <button type="button" onClick={() => onChange({ ...draft, backgroundColor: '' })} className="ml-auto text-xs text-muted-foreground underline underline-offset-4">
                {t('bgDefault')}
              </button>
            )}
          </label>
        )}
        {draft.backgroundStyle === 'gradient' && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {gradientPresets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  title={t(preset.key)}
                  aria-label={t(preset.key)}
                  aria-pressed={draft.backgroundGradient === preset.value}
                  onClick={() => onChange({ ...draft, backgroundGradient: preset.value })}
                  className={`size-11 rounded-xl border transition ${
                    draft.backgroundGradient === preset.value ? 'scale-105 border-foreground ring-2 ring-foreground/20' : 'hover:scale-105'
                  }`}
                  style={{ backgroundImage: preset.value || `linear-gradient(160deg, ${draft.accentColor}66, transparent)` }}
                />
              ))}
            </div>
            <input
              value={draft.backgroundGradient || ''}
              onChange={(e) => onChange({ ...draft, backgroundGradient: e.target.value.trim() })}
              className="mt-3 w-full rounded-lg border bg-background px-3 py-2 text-xs"
              placeholder={t('gradientCustom')}
              aria-label={t('gradientCustom')}
            />
            <div className="mt-3">
              <Toggle label={t('backgroundAnimated')} checked={draft.backgroundAnimated} onChange={(v) => onChange({ ...draft, backgroundAnimated: v })} />
            </div>
          </div>
        )}
        {draft.backgroundStyle === 'pattern' && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {patternPresets.map((pattern) => (
                <button
                  key={pattern}
                  type="button"
                  title={t(patternLabelKey[pattern])}
                  aria-label={t(patternLabelKey[pattern])}
                  aria-pressed={(draft.backgroundPattern || 'dots') === pattern}
                  onClick={() => onChange({ ...draft, backgroundPattern: pattern })}
                  className={`size-11 rounded-xl border bg-background transition ${
                    (draft.backgroundPattern || 'dots') === pattern ? 'scale-105 border-foreground ring-2 ring-foreground/20' : 'hover:scale-105'
                  }`}
                  style={patternStyle(pattern, draft.accentColor, draft.backgroundPatternDensity || 1, draft.backgroundPatternColor)}
                />
              ))}
            </div>
            <label className="mt-3 flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium">
              <input
                type="color"
                value={draft.backgroundPatternColor || draft.accentColor}
                onChange={(e) => onChange({ ...draft, backgroundPatternColor: e.target.value })}
                className="size-6 cursor-pointer appearance-none rounded-full border border-border p-0"
                aria-label={t('patternColor')}
              />
              <span>{t('patternColor')}</span>
              {draft.backgroundPatternColor && (
                <button type="button" onClick={() => onChange({ ...draft, backgroundPatternColor: '' })} className="ml-auto text-xs text-muted-foreground underline underline-offset-4">
                  {t('bgDefault')}
                </button>
              )}
            </label>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('patternDensity')}</span>
                <span>{(draft.backgroundPatternDensity || 1).toFixed(1)}×</span>
              </div>
              <input
                type="range"
                min={0.4}
                max={2.5}
                step={0.1}
                value={draft.backgroundPatternDensity || 1}
                onChange={(e) => onChange({ ...draft, backgroundPatternDensity: Number(e.target.value) })}
                className="mt-2 w-full"
                aria-label={t('patternDensity')}
              />
            </div>
          </div>
        )}
        {draft.backgroundStyle === 'image' && (
          <div className="mt-3 space-y-3">
            <input
              value={draft.backgroundImageURL || ''}
              onChange={(e) => onChange({ ...draft, backgroundImageURL: e.target.value.trim() })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-base sm:text-sm"
              placeholder="https://…"
            />
            {uid && (
              <ImageUploader
                uid={uid}
                maxDimension={1920}
                value={draft.backgroundImageURL}
                shape="rect"
                aspect={16 / 9}
                onUploaded={(url) => onChange({ ...draft, backgroundImageURL: url })}
                onRemove={() => onChange({ ...draft, backgroundImageURL: '' })}
              />
            )}
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('backgroundOverlay')}</span>
                <span>{Math.round((draft.backgroundOverlay || 0) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.85}
                step={0.05}
                value={draft.backgroundOverlay || 0}
                onChange={(e) => onChange({ ...draft, backgroundOverlay: Number(e.target.value) })}
                className="mt-2 w-full"
                aria-label={t('backgroundOverlay')}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
