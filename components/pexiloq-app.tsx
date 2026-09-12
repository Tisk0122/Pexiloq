'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, CircleAlert, Copy, ExternalLink, Eye, GripVertical, Layers, Link2, Loader2, LogOut, Menu, Monitor, Palette, Plus, Save, Settings, Smartphone, Trash2, Type, Upload, UserRound, X, ZoomIn, Zap } from 'lucide-react'
import { auth, deleteAccount, firebaseEnabled, isUsernameAvailable, loadAnalytics, loadDailyAnalytics, loadPublicBundle, loadUserBundle, recordAnalytics, saveItems, saveProfile, sendVerificationEmail, type DailyPoint } from '@/lib/firebase'
import { LanguageSwitcher, useI18n } from '@/components/i18n-provider'
import { siteHost, siteUrl } from '@/lib/site'
import { deleteUser, EmailAuthProvider, GoogleAuthProvider, onAuthStateChanged, reauthenticateWithCredential, reauthenticateWithPopup, signOut } from 'firebase/auth'

export type LinkDisplayStyle = 'default' | 'large' | 'thumbnail' | 'text'
export type LinkItem = { id: string; title: string; url: string; visible: boolean; icon?: string; imageURL?: string; bgColor?: string; iconColor?: string; displayStyle?: LinkDisplayStyle; subtitle?: string; visibleFrom?: string; visibleUntil?: string }
export type Project = { id: string; title: string; description: string; url: string; imageURL?: string; technologies: string[]; visible: boolean }
export type Theme = 'light' | 'dark'
export type ButtonStyle = 'solid' | 'outline' | 'ghost'
export type CardRadius = 'lg' | 'xl' | '2xl' | '3xl'
export type FontStyle = 'sans' | 'serif' | 'mono' | 'display' | 'rounded' | 'elegant'
export type AvatarShape = 'circle' | 'rounded' | 'square'
export type BackgroundStyle = 'default' | 'gradient' | 'image' | 'pattern'
export type Density = 'compact' | 'cozy' | 'spacious'
export type SocialIconStyle = 'outline' | 'filled'
export type BackgroundPattern = 'dots' | 'grid' | 'lines'
export type SocialPlatform = 'twitter' | 'facebook' | 'instagram' | 'github' | 'linkedin' | 'youtube' | 'tiktok' | 'telegram' | 'whatsapp' | 'email'
export type TwitterIcon = 'x' | 'bird'
export const socialPlatforms: SocialPlatform[] = ['twitter', 'facebook', 'instagram', 'github', 'linkedin', 'youtube', 'tiktok', 'telegram', 'whatsapp', 'email']
export type LayoutTemplate = 'classic'
export const layoutTemplates: LayoutTemplate[] = ['classic']
export type SectionKind = 'links' | 'projects'
export const defaultSectionOrder: SectionKind[] = ['links', 'projects']
export type ColorThemePack = 'custom' | 'minimal' | 'neon' | 'pastel' | 'darkLuxury'
export const colorThemePacks: ColorThemePack[] = ['custom', 'minimal', 'neon', 'pastel', 'darkLuxury']
export type AvatarAnimation = 'none' | 'pulse' | 'spin' | 'glow'
export const avatarAnimations: AvatarAnimation[] = ['none', 'pulse', 'spin', 'glow']
export const fontStyles: FontStyle[] = ['sans', 'serif', 'mono', 'display', 'rounded', 'elegant']
export type CoverImageFit = 'cover' | 'contain' | 'fill'
export type Profile = {
  uid?: string
  username: string
  displayName: string
  headline: string
  bio: string
  photoURL: string
  website: string
  accentColor: string
  theme: Theme
  buttonStyle: ButtonStyle
  cardRadius: CardRadius
  fontStyle: FontStyle
  backgroundStyle: BackgroundStyle
  backgroundImageURL: string
  backgroundColor: string
  backgroundGradient: string
  backgroundPattern: BackgroundPattern
  socials: Partial<Record<SocialPlatform, string>>
  twitterIcon: TwitterIcon
  avatarShape: AvatarShape
  avatarRing: boolean
  showAvatar: boolean
  showBadge: boolean
  showLinkIcons: boolean
  cardShadow: boolean
  spacing: Density
  socialStyle: SocialIconStyle
  isPublic: boolean
  onboarded?: boolean
  layoutTemplate: LayoutTemplate
  sectionOrder: SectionKind[]
  colorThemePack: ColorThemePack
  backgroundAnimated: boolean
  backgroundOverlay: number
  backgroundPatternDensity: number
  backgroundPatternColor: string
  coverImageURL: string
  coverImageHeight: number
  coverImageFit: CoverImageFit
  coverImagePositionX: number
  coverImagePositionY: number
  showVerifiedBadge: boolean
  avatarAnimation: AvatarAnimation
}

const radiusClass: Record<CardRadius, string> = { lg: 'rounded-lg', xl: 'rounded-xl', '2xl': 'rounded-2xl', '3xl': 'rounded-3xl' }
const radiusLabelKey: Record<CardRadius, string> = { lg: 'radiusLg', xl: 'radiusXl', '2xl': 'radius2xl', '3xl': 'radius3xl' }
const fontClass: Record<FontStyle, string> = { sans: 'font-sans', serif: 'font-serif', mono: 'font-mono', display: 'pexiloq-font-display', rounded: 'pexiloq-font-rounded', elegant: 'pexiloq-font-elegant' }
const fontLabelKey: Record<FontStyle, string> = { sans: 'fontSans', serif: 'fontSerif', mono: 'fontMono', display: 'fontDisplay', rounded: 'fontRounded', elegant: 'fontElegant' }
const fontPreviewFamily: Record<FontStyle, string> = { sans: 'inherit', serif: 'Georgia, serif', mono: 'ui-monospace, monospace', display: "Georgia, 'Times New Roman', serif", rounded: "'Varela Round', ui-rounded, system-ui, sans-serif", elegant: "'Cormorant Garamond', Didot, Georgia, serif" }
const avatarShapeClass: Record<AvatarShape, string> = { circle: 'rounded-full', rounded: 'rounded-2xl', square: 'rounded-none' }
const accentPresets = ['#171717', '#566b5d', '#8a6f55', '#49647a', '#8a5f70', '#9a6b4f', '#3e7a6e', '#7a5aa6']

// Color theme packs: each bundles accentColor + theme + backgroundStyle/color so a single click
// changes the whole tonal combination rather than just the accent.
type ThemePackConfig = { accentColor: string; theme: Theme; backgroundStyle: BackgroundStyle; backgroundColor: string; backgroundGradient: string }
const themePackConfig: Record<Exclude<ColorThemePack, 'custom'>, ThemePackConfig> = {
  minimal: { accentColor: '#171717', theme: 'light', backgroundStyle: 'default', backgroundColor: '#fafaf8', backgroundGradient: '' },
  neon: { accentColor: '#39ff88', theme: 'dark', backgroundStyle: 'gradient', backgroundColor: '', backgroundGradient: 'radial-gradient(120% 120% at 20% 0%, #39ff8833 0%, transparent 55%), radial-gradient(130% 130% at 100% 100%, #ff2fd633 0%, transparent 60%)' },
  pastel: { accentColor: '#f4a6c1', theme: 'light', backgroundStyle: 'gradient', backgroundColor: '', backgroundGradient: 'radial-gradient(120% 120% at 0% 0%, #fde2e4 0%, transparent 60%), radial-gradient(130% 130% at 100% 100%, #e4f0fd 0%, transparent 60%)' },
  darkLuxury: { accentColor: '#c9a24b', theme: 'dark', backgroundStyle: 'default', backgroundColor: '#0f0f0d', backgroundGradient: '' },
}
function applyThemePack(profile: Profile, pack: ColorThemePack): Profile {
  if (pack === 'custom') return { ...profile, colorThemePack: 'custom' }
  const cfg = themePackConfig[pack]
  return { ...profile, colorThemePack: pack, accentColor: cfg.accentColor, theme: cfg.theme, backgroundStyle: cfg.backgroundStyle, backgroundColor: cfg.backgroundColor, backgroundGradient: cfg.backgroundGradient }
}
const gradientPresets: { key: string; value: string }[] = [
  { key: 'gradientAuto', value: '' },
  { key: 'gradientSunset', value: 'radial-gradient(120% 120% at 50% 0%, #f97316 33%, transparent 70%), radial-gradient(130% 130% at 100% 100%, #ec4899 22%, transparent 62%)' },
  { key: 'gradientOcean', value: 'radial-gradient(120% 120% at 80% 0%, #0ea5e9 30%, transparent 65%), radial-gradient(130% 130% at 0% 100%, #6366f1 25%, transparent 60%)' },
  { key: 'gradientForest', value: 'radial-gradient(120% 120% at 0% 0%, #22c55e 25%, transparent 60%), radial-gradient(130% 130% at 100% 100%, #0f766e 30%, transparent 60%)' },
  { key: 'gradientDusk', value: 'radial-gradient(120% 120% at 25% 0%, #a855f7 20%, transparent 60%), radial-gradient(130% 130% at 75% 100%, #3b82f6 25%, transparent 60%)' },
  { key: 'gradientEmber', value: 'radial-gradient(120% 120% at 0% 100%, #ef4444 25%, transparent 60%), radial-gradient(130% 130% at 100% 0%, #f59e0b 28%, transparent 60%)' },
  { key: 'gradientMint', value: 'radial-gradient(120% 120% at 50% 0%, #34d399 25%, transparent 60%), radial-gradient(130% 130% at 100% 100%, #2dd4bf 32%, transparent 62%)' },
]
const linkEmojis = ['⭐', '🔥', '🎧', '🎬', '📚', '🛍️', '✉️', '💬', '🍜', '🧘', '🎮', '📷', '✏️', '💡', '🌿', '🎤']
const patternPresets: BackgroundPattern[] = ['dots', 'grid', 'lines']
const patternLabelKey: Record<BackgroundPattern, string> = { dots: 'patternDots', grid: 'patternGrid', lines: 'patternLines' }
const densityPresets: Density[] = ['compact', 'cozy', 'spacious']
const densityLabelKey: Record<Density, string> = { compact: 'spacingCompact', cozy: 'spacingCozy', spacious: 'spacingSpacious' }
const spacingConfig: Record<Density, { linkGap: string; linkPad: string; sectionGap: string }> = {
  compact: { linkGap: 'space-y-2', linkPad: 'px-3.5 py-3', sectionGap: 'mt-6' },
  cozy: { linkGap: 'space-y-3', linkPad: 'px-4 py-4', sectionGap: 'mt-8' },
  spacious: { linkGap: 'space-y-4', linkPad: 'px-5 py-5', sectionGap: 'mt-10' },
}

function patternStyle(pattern: BackgroundPattern, accent: string, density = 1, color?: string): React.CSSProperties {
  const col = color || accent
  const d = Math.min(Math.max(density || 1, 0.4), 2.5)
  if (pattern === 'grid') { const size = 28 / d; return { backgroundImage: `linear-gradient(${col}26 1px, transparent 1px), linear-gradient(90deg, ${col}26 1px, transparent 1px)`, backgroundSize: `${size}px ${size}px` } }
  if (pattern === 'lines') { const size = 14 / d; return { backgroundImage: `repeating-linear-gradient(135deg, ${col}1f 0 2px, transparent 2px ${size}px)` } }
  const size = 20 / d
  return { backgroundImage: `radial-gradient(${col}40 1.6px, transparent 1.6px)`, backgroundSize: `${size}px ${size}px` }
}

const linkDisplayStyles: LinkDisplayStyle[] = ['default', 'large', 'thumbnail', 'text']

const emptyProfile: Profile = {
  username: '', displayName: '', headline: '', bio: '', photoURL: '', website: '',
  accentColor: '#171717', theme: 'light', buttonStyle: 'solid', cardRadius: '3xl', fontStyle: 'sans',
  backgroundStyle: 'default', backgroundImageURL: '', backgroundColor: '', backgroundGradient: '', backgroundPattern: 'dots', socials: {}, twitterIcon: 'x',
  avatarShape: 'circle', avatarRing: true,
  showAvatar: true, showBadge: true, showLinkIcons: true, cardShadow: true, spacing: 'cozy', socialStyle: 'outline', isPublic: true, onboarded: false,
  layoutTemplate: 'classic', sectionOrder: [...defaultSectionOrder],
  colorThemePack: 'custom', backgroundAnimated: false, backgroundOverlay: 0, backgroundPatternDensity: 1, backgroundPatternColor: '',
  coverImageURL: '', coverImageHeight: 140, coverImageFit: 'cover', coverImagePositionX: 50, coverImagePositionY: 50, showVerifiedBadge: false, avatarAnimation: 'none',
}

// Ensures profiles saved before layoutTemplate/sectionOrder existed still render correctly.
export function normalizeProfile(p: Partial<Profile>): Profile {
  const merged: Profile = { ...emptyProfile, ...p }
  if (!layoutTemplates.includes(merged.layoutTemplate)) merged.layoutTemplate = 'classic'
  const validOrder = Array.isArray(merged.sectionOrder) && merged.sectionOrder.length
    ? (merged.sectionOrder.filter((s) => defaultSectionOrder.includes(s)) as SectionKind[])
    : []
  const missing = defaultSectionOrder.filter((s) => !validOrder.includes(s))
  merged.sectionOrder = [...validOrder, ...missing]
  if (!colorThemePacks.includes(merged.colorThemePack)) merged.colorThemePack = 'custom'
  if (!fontStyles.includes(merged.fontStyle)) merged.fontStyle = 'sans'
  if (!avatarAnimations.includes(merged.avatarAnimation)) merged.avatarAnimation = 'none'
  if (typeof merged.backgroundOverlay !== 'number' || Number.isNaN(merged.backgroundOverlay)) merged.backgroundOverlay = 0
  if (typeof merged.backgroundPatternDensity !== 'number' || Number.isNaN(merged.backgroundPatternDensity)) merged.backgroundPatternDensity = 1
  if (typeof merged.coverImageHeight !== 'number' || Number.isNaN(merged.coverImageHeight) || merged.coverImageHeight <= 0) merged.coverImageHeight = 140
  if (!['cover', 'contain', 'fill'].includes(merged.coverImageFit)) merged.coverImageFit = 'cover'
  if (typeof merged.coverImagePositionX !== 'number' || Number.isNaN(merged.coverImagePositionX)) merged.coverImagePositionX = 50
  if (typeof merged.coverImagePositionY !== 'number' || Number.isNaN(merged.coverImagePositionY)) merged.coverImagePositionY = 50
  return merged
}

export type TemplateBundle = { profile: Profile; links: LinkItem[]; projects: Project[] }
function makeTemplate(headline: string, bio: string, links: [string, string, string], projects: { title: string; description: string; tech: [string, string] }[]): TemplateBundle {
  const urls = ['https://medium.com', 'https://youtube.com', 'https://instagram.com']
  return {
    profile: { username: 'amira', displayName: 'Amira Moss', headline, bio, photoURL: '', website: 'https://pexiloq.vercel.app', accentColor: '#171717', theme: 'light', buttonStyle: 'solid', cardRadius: '3xl', fontStyle: 'sans', backgroundStyle: 'default', backgroundImageURL: '', backgroundColor: '', backgroundGradient: '', backgroundPattern: 'dots', socials: {}, twitterIcon: 'x', avatarShape: 'circle', avatarRing: true, showAvatar: true, showBadge: true, showLinkIcons: true, cardShadow: true, spacing: 'cozy', socialStyle: 'outline', isPublic: true, onboarded: true, layoutTemplate: 'classic', sectionOrder: [...defaultSectionOrder], colorThemePack: 'custom', backgroundAnimated: false, backgroundOverlay: 0, backgroundPatternDensity: 1, backgroundPatternColor: '', coverImageURL: '', coverImageHeight: 140, coverImageFit: 'cover', coverImagePositionX: 50, coverImagePositionY: 50, showVerifiedBadge: false, avatarAnimation: 'none' },
    links: links.map((title, i) => ({ id: String(i + 1), title, url: urls[i], visible: true })),
    projects: projects.map((p, i) => ({ id: String(i + 1), title: p.title, description: p.description, url: 'https://example.com', imageURL: '', technologies: [...p.tech], visible: true })),
  }
}
const langTemplates: Record<string, TemplateBundle> = {
  en: makeTemplate('Designer, collector of good ideas.', 'Building gentle tools for a more considered internet.', ['Read my latest thoughts', 'The creative process', 'Say hello'], [{ title: 'Soft systems', description: 'A study in gentle digital tools.', tech: ['Product design', 'Research'] }, { title: 'Slow internet', description: 'Exploring a more considered web.', tech: ['Writing', 'Art direction'] }]),
  ja: makeTemplate('デザイナー。良きアイデアを集める人。', 'より考え抜かれたインターネットのために、優しい道具を作っています。', ['最新の考えを読む', '創作のプロセス', 'ご連絡はこちら'], [{ title: 'ソフトシステム', description: '優しいデジタルツールの研究。', tech: ['プロダクトデザイン', 'リサーチ'] }, { title: 'スローインターネット', description: 'より考え抜かれたウェブの探求。', tech: ['執筆', 'アートディレクション'] }]),
  zh: makeTemplate('设计师，美好想法的收集者。', '为更深思熟虑的互联网，打造温柔的工具。', ['阅读我的最新想法', '创作过程', '打个招呼'], [{ title: '轻柔系统', description: '关于温柔数字工具的研究。', tech: ['产品设计', '研究'] }, { title: '慢速互联网', description: '探索更考究的网页。', tech: ['写作', '艺术指导'] }]),
  ko: makeTemplate('디자이너. 좋은 아이디어를 모으는 사람.', '더 신중한 인터넷을 위해 부드러운 도구를 만듭니다.', ['최신 생각 읽기', '창작 과정', '인사하기'], [{ title: '소프트 시스템', description: '부드러운 디지털 도구에 대한 연구.', tech: ['프로덕트 디자인', '리서치'] }, { title: '느린 인터넷', description: '더 신중한 웹을 탐구합니다.', tech: ['글쓰기', '아트 디렉션'] }]),
  es: makeTemplate('Diseñadora, coleccionista de buenas ideas.', 'Creo herramientas amables para una internet más considerada.', ['Lee mis últimos pensamientos', 'El proceso creativo', 'Saluda'], [{ title: 'Sistemas suaves', description: 'Un estudio sobre herramientas digitales amables.', tech: ['Diseño de producto', 'Investigación'] }, { title: 'Internet lenta', description: 'Explorando una web más considerada.', tech: ['Escritura', 'Dirección de arte'] }]),
  fr: makeTemplate('Designer, collectionneuse de bonnes idées.', 'Je construis des outils doux pour un internet plus réfléchi.', ['Lire mes dernières réflexions', 'Le processus créatif', 'Dites bonjour'], [{ title: 'Systèmes doux', description: 'Une étude sur les outils numériques doux.', tech: ['Design produit', 'Recherche'] }, { title: 'Internet lent', description: 'Explorer un web plus réfléchi.', tech: ['Écriture', 'Direction artistique'] }]),
  de: makeTemplate('Designerin, Sammlerin guter Ideen.', 'Ich baue sanfte Werkzeuge für ein durchdachteres Internet.', ['Meine neuesten Gedanken lesen', 'Der kreative Prozess', 'Sag Hallo'], [{ title: 'Sanfte Systeme', description: 'Eine Studie über sanfte digitale Werkzeuge.', tech: ['Produktdesign', 'Forschung'] }, { title: 'Langsames Internet', description: 'Ein durchdachteres Web erkunden.', tech: ['Schreiben', 'Art Direction'] }]),
  pt: makeTemplate('Designer, colecionadora de boas ideias.', 'Crio ferramentas gentis para uma internet mais cuidadosa.', ['Leia meus pensamentos recentes', 'O processo criativo', 'Diga olá'], [{ title: 'Sistemas suaves', description: 'Um estudo sobre ferramentas digitais gentis.', tech: ['Design de produto', 'Pesquisa'] }, { title: 'Internet lenta', description: 'Explorando uma web mais cuidadosa.', tech: ['Escrita', 'Direção de arte'] }]),
  hi: makeTemplate('डिज़ाइनर, अच्छे विचारों की संग्रहकर्ता।', 'अधिक विचारशील इंटरनेट के लिए सौम्य उपकरण बना रही हूँ।', ['मेरे नवीनतम विचार पढ़ें', 'रचनात्मक प्रक्रिया', 'नमस्ते कहें'], [{ title: 'सॉफ़्ट सिस्टम', description: 'सौम्य डिजिटल उपकरणों का अध्ययन।', tech: ['उत्पाद डिज़ाइन', 'अनुसंधान'] }, { title: 'धीमा इंटरनेट', description: 'अधिक विचारशील वेब की खोज।', tech: ['लेखन', 'कला निर्देशन'] }]),
}
export function fallbackTemplate(lang?: string): TemplateBundle { return langTemplates[lang || 'en'] || langTemplates.en }

// Content for the two extra showcase personas the landing page uses to demonstrate that
// Pexiloq pages don't all look alike. Kept alongside langTemplates so every piece of sample
// data the marketing site shows lives in one place.
type PersonaCopy = { headline: string; bio: string; links: [string, string, string]; projects: [{ title: string; description: string }, { title: string; description: string }] }
const showcaseCopy: Record<string, { kenji: PersonaCopy; noa: PersonaCopy }> = {
  en: { kenji: { headline: 'DJ and sound designer. Always chasing the next set.', bio: 'New mixes most months, and a studio log for everything in between.', links: ['Latest mix', 'Behind the set', 'Book a show'], projects: [{ title: 'Afterglow EP', description: 'Six tracks recorded over one long summer.' }, { title: 'Live at Nord', description: "A full set from last month's show." }] }, noa: { headline: 'Photographer chasing soft light and quiet mornings.', bio: 'A visual diary of small towns, long walks, and the in-between moments.', links: ['Print shop', 'Behind the lens', 'Say hello'], projects: [{ title: 'Coastal light', description: 'A season spent photographing the shoreline.' }, { title: 'Quiet towns', description: 'Portraits of places most people pass by.' }] } },
  ja: { kenji: { headline: 'DJ・サウンドデザイナー。次のセットをいつも追いかけて。', bio: 'ほぼ毎月新しいミックスを公開。制作の裏側もここに記録しています。', links: ['最新のミックス', 'セットの舞台裏', '出演依頼はこちら'], projects: [{ title: 'Afterglow EP', description: '長い夏に録音した6曲。' }, { title: 'Live at Nord', description: '先月のショーのフルセット。' }] }, noa: { headline: '柔らかな光と静かな朝を追いかける写真家。', bio: '小さな町や長い散歩、その間にある瞬間を記録する視覚的な日記。', links: ['プリントショップ', '撮影の裏側', 'ご連絡はこちら'], projects: [{ title: 'Coastal light', description: '海辺をひと夏かけて撮影した記録。' }, { title: 'Quiet towns', description: '多くの人が通り過ぎる場所の肖像。' }] } },
  zh: { kenji: { headline: 'DJ 兼音效设计师。永远在追下一场演出。', bio: '几乎每月发布新混音，也记录制作背后的点滴。', links: ['最新混音', '幕后花絮', '预约演出'], projects: [{ title: 'Afterglow EP', description: '在漫长的一个夏天录制的六首曲目。' }, { title: 'Live at Nord', description: '上个月演出的完整现场。' }] }, noa: { headline: '追逐柔光与安静清晨的摄影师。', bio: '记录小镇、长途散步与那些间隙时刻的视觉日记。', links: ['版画商店', '镜头背后', '打个招呼'], projects: [{ title: 'Coastal light', description: '用一个季节拍摄的海岸线。' }, { title: 'Quiet towns', description: '那些常被忽略之地的肖像。' }] } },
  ko: { kenji: { headline: 'DJ 겸 사운드 디자이너. 언제나 다음 세트를 좇습니다.', bio: '거의 매달 새 믹스를 공개하고, 작업 과정도 기록합니다.', links: ['최신 믹스', '세트 비하인드', '공연 문의'], projects: [{ title: 'Afterglow EP', description: '긴 여름 동안 녹음한 여섯 곡.' }, { title: 'Live at Nord', description: '지난달 공연의 풀 세트.' }] }, noa: { headline: '부드러운 빛과 고요한 아침을 좇는 사진가.', bio: '작은 마을과 긴 산책, 그 사이의 순간들을 담은 시각 일기.', links: ['프린트 숍', '촬영 비하인드', '인사하기'], projects: [{ title: 'Coastal light', description: '한 계절 동안 해안을 담은 기록.' }, { title: 'Quiet towns', description: '사람들이 스쳐 지나가는 장소의 초상.' }] } },
  es: { kenji: { headline: 'DJ y diseñador de sonido. Siempre detrás del próximo set.', bio: 'Nuevas mezclas casi cada mes, y el detrás de escena del estudio.', links: ['Última mezcla', 'Detrás del set', 'Reservar una fecha'], projects: [{ title: 'Afterglow EP', description: 'Seis pistas grabadas durante un largo verano.' }, { title: 'Live at Nord', description: 'El set completo del show del mes pasado.' }] }, noa: { headline: 'Fotógrafa en busca de luz suave y mañanas tranquilas.', bio: 'Un diario visual de pueblos pequeños, caminatas largas y los momentos de en medio.', links: ['Tienda de impresiones', 'Detrás de la cámara', 'Saluda'], projects: [{ title: 'Coastal light', description: 'Una temporada fotografiando la costa.' }, { title: 'Quiet towns', description: 'Retratos de lugares que casi nadie mira.' }] } },
  fr: { kenji: { headline: 'DJ et sound designer. Toujours à la recherche du prochain set.', bio: 'De nouveaux mixes presque chaque mois, et les coulisses du studio.', links: ['Dernier mix', 'Les coulisses', 'Réserver une date'], projects: [{ title: 'Afterglow EP', description: "Six titres enregistrés au fil d'un long été." }, { title: 'Live at Nord', description: 'Le set complet du concert du mois dernier.' }] }, noa: { headline: 'Photographe en quête de lumière douce et de matins calmes.', bio: 'Un journal visuel de petites villes, longues marches et instants entre deux.', links: ['Boutique de tirages', "Derrière l'objectif", 'Dites bonjour'], projects: [{ title: 'Coastal light', description: 'Une saison passée à photographier le littoral.' }, { title: 'Quiet towns', description: "Portraits de lieux que l'on ne remarque jamais." }] } },
  de: { kenji: { headline: 'DJ und Sound-Designer. Immer auf dem Weg zum nächsten Set.', bio: 'Fast jeden Monat ein neuer Mix, plus Einblicke aus dem Studio.', links: ['Neuester Mix', 'Hinter dem Set', 'Auftritt buchen'], projects: [{ title: 'Afterglow EP', description: 'Sechs Tracks, aufgenommen über einen langen Sommer.' }, { title: 'Live at Nord', description: 'Das komplette Set vom letzten Auftritt.' }] }, noa: { headline: 'Fotografin auf der Suche nach sanftem Licht und stillen Morgen.', bio: 'Ein visuelles Tagebuch aus kleinen Städten, langen Spaziergängen und den Momenten dazwischen.', links: ['Print-Shop', 'Hinter der Kamera', 'Sag Hallo'], projects: [{ title: 'Coastal light', description: 'Eine Saison damit verbracht, die Küste zu fotografieren.' }, { title: 'Quiet towns', description: 'Porträts von Orten, an denen die meisten vorbeigehen.' }] } },
  pt: { kenji: { headline: 'DJ e sound designer. Sempre atrás do próximo set.', bio: 'Novas mixagens quase todo mês, e os bastidores do estúdio.', links: ['Última mixagem', 'Bastidores do set', 'Reservar uma data'], projects: [{ title: 'Afterglow EP', description: 'Seis faixas gravadas ao longo de um longo verão.' }, { title: 'Live at Nord', description: 'O set completo do show do mês passado.' }] }, noa: { headline: 'Fotógrafa em busca de luz suave e manhãs tranquilas.', bio: 'Um diário visual de cidades pequenas, longas caminhadas e os momentos intermediários.', links: ['Loja de impressões', 'Por trás das lentes', 'Diga olá'], projects: [{ title: 'Coastal light', description: 'Uma estação inteira fotografando o litoral.' }, { title: 'Quiet towns', description: 'Retratos de lugares que quase todos ignoram.' }] } },
  hi: { kenji: { headline: 'डीजे और साउंड डिज़ाइनर। हमेशा अगले सेट की तलाश में।', bio: 'लगभग हर महीने नया मिक्स, और स्टूडियो की झलकियाँ।', links: ['नवीनतम मिक्स', 'सेट के पीछे की कहानी', 'शो बुक करें'], projects: [{ title: 'Afterglow EP', description: 'एक लंबी गर्मी में रिकॉर्ड किए गए छह ट्रैक।' }, { title: 'Live at Nord', description: 'पिछले महीने के शो का पूरा सेट।' }] }, noa: { headline: 'मुलायम रोशनी और शांत सुबहों की तलाश करने वाली फ़ोटोग्राफ़र।', bio: 'छोटे कस्बों, लंबी सैर और बीच के पलों की एक दृश्य डायरी।', links: ['प्रिंट शॉप', 'लेंस के पीछे', 'नमस्ते कहें'], projects: [{ title: 'Coastal light', description: 'एक पूरा मौसम तटरेखा की फ़ोटोग्राफ़ी में बिताया।' }, { title: 'Quiet towns', description: 'उन जगहों के चित्र जिन्हें ज़्यादातर लोग बस गुज़र जाते हैं।' }] } },
}

function personaProfile(overrides: Partial<Profile>): Profile {
  return normalizeProfile({
    theme: 'light', buttonStyle: 'solid', cardRadius: '3xl', fontStyle: 'sans', backgroundStyle: 'default',
    avatarShape: 'circle', avatarRing: true, showAvatar: true, showBadge: true, showLinkIcons: true, cardShadow: true,
    spacing: 'cozy', socialStyle: 'outline', isPublic: true, onboarded: true, layoutTemplate: 'classic', twitterIcon: 'x',
    ...overrides,
  })
}
function personaLinks(titles: [string, string, string], urls: [string, string, string]): LinkItem[] {
  return titles.map((title, i) => ({ id: String(i + 1), title, url: urls[i], visible: true }))
}
function personaProjects(items: [{ title: string; description: string }, { title: string; description: string }]): Project[] {
  return items.map((p, i) => ({ id: String(i + 1), title: p.title, description: p.description, url: 'https://example.com', imageURL: '', technologies: [], visible: true }))
}

export type ShowcaseStyle = 'minimal' | 'afterHours' | 'bright'
export type ShowcaseProfile = { style: ShowcaseStyle; bundle: TemplateBundle }

// Three real, fully-rendered Pexiloq pages spanning the range of what the customization
// options actually produce: the same classic layout used in langTemplates, a dark look with
// a gold accent, and a light pastel gradient look. Every field here is a genuine
// Profile/LinkItem/Project — these render through the exact same <ProfileCard> the dashboard
// and public pages use, nothing is faked for the marketing site.
export function showcaseTemplates(lang?: string): ShowcaseProfile[] {
  const l = lang && showcaseCopy[lang] ? lang : 'en'
  const amira = langTemplates[l] || langTemplates.en
  const c = showcaseCopy[l]
  return [
    {
      style: 'minimal',
      bundle: { ...amira, profile: { ...amira.profile, socials: { twitter: 'amira', instagram: 'amira.moss', github: 'amiramoss' } } },
    },
    {
      style: 'afterHours',
      bundle: {
        profile: personaProfile({
          username: 'kenji', displayName: 'Kenji Aoyama', headline: c.kenji.headline, bio: c.kenji.bio, website: '',
          accentColor: '#c9a24b', theme: 'dark', backgroundStyle: 'default', backgroundColor: '#0f0f0d',
          buttonStyle: 'outline', avatarShape: 'rounded', cardRadius: '2xl', spacing: 'cozy', socialStyle: 'filled',
          socials: { twitter: 'kenjimixes', instagram: 'kenji.mixes', youtube: '@kenjimixes' },
        }),
        links: personaLinks(c.kenji.links, ['https://soundcloud.com', 'https://youtube.com', 'https://example.com']),
        projects: personaProjects(c.kenji.projects),
      },
    },
    {
      style: 'bright',
      bundle: {
        profile: personaProfile({
          username: 'noa', displayName: 'Noa Lindgren', headline: c.noa.headline, bio: c.noa.bio, website: '',
          accentColor: '#d98aa0', theme: 'light', backgroundStyle: 'gradient',
          backgroundGradient: 'radial-gradient(120% 120% at 0% 0%, #fde2e4 0%, transparent 60%), radial-gradient(130% 130% at 100% 100%, #e4f0fd 0%, transparent 60%)',
          buttonStyle: 'solid', avatarShape: 'square', cardRadius: '3xl', spacing: 'spacious', socialStyle: 'outline',
          socials: { instagram: 'noa.frames', tiktok: '@noa.frames', youtube: '@noalindgren' },
        }),
        links: personaLinks(c.noa.links, ['https://example.com', 'https://instagram.com', 'https://example.com']),
        projects: personaProjects(c.noa.projects),
      },
    },
  ]
}

export function Logo() {
  return <Link href="/" className="flex shrink-0 items-center" aria-label="Pexiloq home"><img src="/Pexiloq_Logo.png" alt="Pexiloq" width={1774} height={887} className="h-14 w-auto object-contain sm:h-16 md:h-20 lg:h-24" /></Link>
}

// A nudge for accounts that signed up by email but haven't confirmed the address yet. Firebase
// flags these accounts (emailVerified false) but never reminds them, so an unverified email is
// easy to lose — and a lost address means a locked-out account when they reset passwords later.
function VerifyEmailBanner() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('')
  if (!user || !user.email || user.emailVerified) return null
  async function resend() {
    setSending(true)
    setStatus('')
    const ok = await sendVerificationEmail()
    setStatus(ok ? t('verificationSent') : t('somethingWrong'))
    setSending(false)
  }
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-secondary/40 px-5 py-4">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="text-sm font-medium">{t('verifyEmail')}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('verifyEmailDesc')}</p>
        </div>
      </div>
      <button onClick={() => void resend()} disabled={sending} className="rounded-full border bg-card px-4 py-2 text-xs font-medium transition hover:border-foreground/40 disabled:opacity-60">
        {sending ? <Loader2 className="mr-1.5 inline size-3 animate-spin" /> : null}{status || t('resendVerification')}
      </button>
    </div>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const pathname = usePathname(); const [mobile, setMobile] = useState(false); const [loggingOut, setLoggingOut] = useState(false); const { t } = useI18n()
  const { profile, loading, uid } = useWorkspace()
  const { user } = useAuth()
  const nav = [
    { href: '/dashboard', label: t('overview'), icon: Eye },
    { href: '/dashboard/profile', label: t('profile'), icon: UserRound },
    { href: '/dashboard/links', label: t('links'), icon: Link2 },
    { href: '/dashboard/projects', label: t('projects'), icon: Layers },
    { href: '/dashboard/appearance', label: t('appearance'), icon: Palette },
    { href: '/dashboard/settings', label: t('settings'), icon: Settings },
  ]
  async function logout() { setLoggingOut(true); if (auth) await signOut(auth); router.push('/') }
  // The dashboard is a signed-in workspace — send anyone who isn't authenticated to
  // /login instead of letting them sit on an empty-state version of someone else's
  // editing UI. Skipped when Firebase isn't configured at all (no auth system to
  // check against), matching how the auth form itself bypasses login in that mode.
  const signedOut = !loading && firebaseEnabled && !uid
  useEffect(() => {
    if (signedOut) router.replace('/login')
  }, [signedOut, router])
  if (loading || signedOut) return <LoadingScreen />
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-6 py-3.5 backdrop-blur-md lg:px-10">
        <div className="flex items-center gap-6">
          <Logo />
          {profile.username && (
            <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground md:flex">
              <span className="size-2 rounded-full" style={{ backgroundColor: profile.isPublic === false ? '#eab308' : '#22c55e' }} />
              <span className="font-mono text-[11px]">{siteHost}/{profile.username}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher compact />
          <button
            className="flex size-9 items-center justify-center rounded-full border bg-card transition hover:border-foreground/30 lg:hidden"
            onClick={() => setMobile(!mobile)}
            aria-label={mobile ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobile}
          >
            {mobile ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          <div className="hidden items-center gap-4 lg:flex">
            <Link
              href={`/${profile.username}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium transition hover:border-foreground/40 hover:bg-secondary"
            >
              {t('viewProfile')} <ArrowUpRight className="size-3.5 text-muted-foreground" />
            </Link>
            <button
              onClick={logout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-border hover:bg-card hover:text-foreground disabled:opacity-50"
            >
              {loggingOut ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />} {t('logout')}
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1440px]">
        {/* Mobile menu overlay */}
        {mobile && (
          <div className="fixed inset-0 top-[65px] z-30 bg-background/98 p-6 backdrop-blur-lg lg:hidden">
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-secondary font-medium">
                  {profile.photoURL ? <CardImg src={profile.photoURL} alt="" className="size-full rounded-full" /> : (profile.displayName || '?').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{profile.displayName || 'Pexiloq Creator'}</p>
                  <p className="text-xs font-mono text-muted-foreground">@{profile.username || 'creator'}</p>
                </div>
              </div>
              <Link
                href={`/${profile.username}`}
                target="_blank"
                onClick={() => setMobile(false)}
                className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-xs font-medium"
              >
                {t('viewProfile')} <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <nav className="space-y-1.5">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  onClick={() => setMobile(false)}
                  href={href}
                  aria-current={pathname === href ? 'page' : undefined}
                  className={`flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-base font-medium transition ${pathname === href ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                    }`}
                >
                  <Icon className="size-5 shrink-0" />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 border-t pt-6">
              <button
                onClick={logout}
                disabled={loggingOut}
                className="flex w-full items-center justify-center gap-2 rounded-full border bg-card py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-50"
              >
                {loggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />} {t('logout')}
              </button>
            </div>
          </div>
        )}
        <aside className="hidden w-64 shrink-0 border-r p-6 lg:block lg:min-h-[calc(100vh-65px)]">
          <div className="mb-6 flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-xs">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-xs font-medium">
              {profile.photoURL ? <CardImg src={profile.photoURL} alt="" className="size-full rounded-full" /> : (profile.displayName || '?').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{profile.displayName || 'Pexiloq Creator'}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">@{profile.username || 'creator'}</p>
            </div>
          </div>
          <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{t('workspace')}</p>
          <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                    }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-10 rounded-2xl border bg-card/60 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">{t('yourPublicPage')}</p>
              <span className="size-2 rounded-full" style={{ backgroundColor: profile.isPublic === false ? '#eab308' : '#22c55e' }} title={profile.isPublic === false ? t('privateProfile') : t('live')} />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t('shareOneLink')}</p>
            <Link
              href={`/${profile.username}`}
              target="_blank"
              className="mt-3.5 inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-4 hover:opacity-80"
            >
              {t('openProfile')} <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-6 lg:p-10">
          {user && <VerifyEmailBanner />}
          {children}
        </main>
      </div>
    </div>
  )
}

type Workspace = { profile: Profile; links: LinkItem[]; projects: Project[]; loading: boolean; persistProfile: (next: Profile) => Promise<void>; persistLinks: (next: LinkItem[]) => Promise<void>; persistProjects: (next: Project[]) => Promise<void>; uid: string | null }
const WorkspaceContext = createContext<Workspace | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [uid, setUid] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!auth) { setLoading(false); return }
    return onAuthStateChanged(auth, async (user) => {
      setUid(user?.uid || null)
      try {
        if (user) {
          const bundle = await loadUserBundle(user.uid)
          if (bundle?.profile) setProfile(normalizeProfile(bundle.profile as Profile))
          if (bundle?.links.length) setLinks(bundle.links as LinkItem[])
          if (bundle?.projects.length) setProjects(bundle.projects as Project[])
        } else {
          setProfile(emptyProfile)
          setLinks([])
          setProjects([])
        }
      } catch {
        // best effort: if Firestore is briefly unreachable, fall back to defaults rather than
        // leaving the dashboard stuck on the loading screen forever.
        if (!user) { setProfile(emptyProfile); setLinks([]); setProjects([]) }
      } finally {
        setLoading(false)
      }
    })
  }, [])
  const persistProfile = async (next: Profile) => { setProfile((prev) => prev === next || JSON.stringify(prev) === JSON.stringify(next) ? prev : next); if (uid) await saveProfile(uid, next as any) }
  const persistLinks = async (next: LinkItem[]) => { setLinks((prev) => prev === next || JSON.stringify(prev) === JSON.stringify(next) ? prev : next); if (uid) await saveItems(uid, 'links', next) }
  const persistProjects = async (next: Project[]) => { setProjects((prev) => prev === next || JSON.stringify(prev) === JSON.stringify(next) ? prev : next); if (uid) await saveItems(uid, 'projects', next) }
  return <WorkspaceContext.Provider value={{ profile, links, projects, loading, persistProfile, persistLinks, persistProjects, uid }}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider')
  return ctx
}

export function useAuth() {
  const [user, setUser] = useState<{ uid: string; displayName: string | null; email: string | null; emailVerified: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!auth) { setLoading(false); return }
    return onAuthStateChanged(auth, (u) => { setUser(u ? { uid: u.uid, displayName: u.displayName, email: u.email, emailVerified: !!u.emailVerified } : null); setLoading(false) })
  }, [])
  return { user, loading }
}

export function Loader({ className = 'size-6' }: { className?: string }) {
  return <span role="status" aria-label="Loading" className={`inline-block animate-spin rounded-full border-2 border-foreground/20 border-t-foreground ${className}`} />
}

export function LoadingScreen({ label }: { label?: string }) {
  const { t } = useI18n()
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute -left-28 -top-32 size-80 rounded-full bg-secondary opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -right-24 size-96 rounded-full bg-secondary opacity-70 blur-3xl" />
      <div className="relative flex flex-col items-center px-6 text-center">
        <img
          src="/Pexiloq_Icon.png"
          alt="Pexiloq"
          width={110}
          height={110}
          className="h-24 w-24 object-contain drop-shadow-[0_10px_30px_rgba(35,35,30,0.16)]"
          style={{ animation: 'pexiloq-pulse 2.1s ease-in-out infinite' }}
        />
        <h1 className="mt-6 text-4xl font-medium tracking-[-0.05em] text-foreground">Pexiloq</h1>
        <div className="mt-9 h-1.5 w-64 max-w-[70vw] overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/3 rounded-full bg-foreground" style={{ animation: 'pexiloq-loadbar 1.5s ease-in-out infinite' }} />
        </div>
        <p className="mt-5 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">{label ?? t('loadingLabel')}</p>
      </div>
    </div>
  )
}

function faviconFor(url: string) {
  try { return `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}` } catch { return '' }
}

// Only ever let users navigate to real web URLs. Without this, a link or website value stored
// on a profile could carry a javascript:/data: URI straight into an <a href> and execute code
// when a visitor clicks it. Render anchors are guarded here at the point they're built, and the
// editors show an inline warning for values that fall this check.
function isSafeWebUrl(raw?: string | null): boolean {
  if (!raw) return true
  if (raw === 'https://' || raw === 'http://') return true
  try {
    const protocol = new URL(raw).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch { return false }
}
function safeHref(raw?: string | null): string | undefined {
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    return url.protocol === 'http:' || url.protocol === 'https:' ? raw : undefined
  } catch { return undefined }
}

// Links can be told to only surface inside a date window (visibleFrom/visibleUntil, both
// YYYY-MM-DD). A link falls outside its window when today is before the start or after the end;
// either field left empty has no bound. Always-on links without scheduling keep the old behavior.
function isLinkActive(item: { visibleFrom?: string; visibleUntil?: string }): boolean {
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  if (item.visibleFrom && item.visibleFrom > todayKey) return false
  if (item.visibleUntil && item.visibleUntil < todayKey) return false
  return true
}

// Self-hosted QR codes. This used to point at an external API (api.qrserver.com), which made
// every QR render depend on a third party: it needed to be reachable with a valid cross-origin
// response, it had no offline story, and it silently dropped the privacy emphasis the rest of
// the product is built around. The `qrcode` package generates the code locally (SVG/PNG), so
// both the inline preview and the large PNG download work with no external request at all.
function QrImage({ value, size, className }: { value: string; size: number; className?: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let live = true
    import('qrcode').then(({ toDataURL }) =>
      toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: 'M' }).then((data) => { if (live) setSrc(data) })
    ).catch(() => { })
    return () => { live = false }
  }, [value, size])
  if (src) return <img src={src} alt="" width={size} height={size} className={className} />
  return <span aria-hidden="true" className={className} style={{ width: size, height: size }} />
}

async function downloadQr(value: string, filename: string) {
  const { toDataURL } = await import('qrcode')
  const data = await toDataURL(value, { width: 512, margin: 2, errorCorrectionLevel: 'M' })
  const anchor = document.createElement('a')
  anchor.href = data
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

function downloadTextFile(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

// Picks black or white text for readable contrast against an arbitrary hex background color.
function contrastColor(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6 && clean.length !== 3) return '#ffffff'
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#151515' : '#ffffff'
}

function accentTextColor(accent: string, dark: boolean): string {
  if (dark) return contrastColor(accent) === '#ffffff' ? '#f5f5f2' : accent
  return contrastColor(accent) === '#151515' ? accent : '#151515'
}

const socialMeta: Record<SocialPlatform, { label: string; placeholder: string; prefix?: string }> = {
  twitter: { label: 'X / Twitter', placeholder: 'yourhandle' },
  facebook: { label: 'Facebook', placeholder: 'yourname', prefix: 'https://facebook.com/' },
  instagram: { label: 'Instagram', placeholder: 'yourhandle', prefix: 'https://instagram.com/' },
  github: { label: 'GitHub', placeholder: 'yourhandle', prefix: 'https://github.com/' },
  linkedin: { label: 'LinkedIn', placeholder: 'yourhandle', prefix: 'https://linkedin.com/in/' },
  youtube: { label: 'YouTube', placeholder: '@yourchannel', prefix: 'https://youtube.com/' },
  tiktok: { label: 'TikTok', placeholder: '@yourhandle', prefix: 'https://tiktok.com/' },
  telegram: { label: 'Telegram', placeholder: 'yourhandle', prefix: 'https://t.me/' },
  whatsapp: { label: 'WhatsApp', placeholder: '+1 555 000 0000', prefix: 'https://wa.me/' },
  email: { label: 'Email', placeholder: 'you@example.com', prefix: 'mailto:' },
}

const TWITTER_X_PATH = 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'
const TWITTER_BIRD_PATH = 'M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z'
const FACEBOOK_PATH = 'M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z'
const TELEGRAM_PATH = 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z'
const WHATSAPP_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z'

function SocialGlyph({ platform, twitterIcon = 'x', className = 'size-4' }: { platform: SocialPlatform; twitterIcon?: TwitterIcon; className?: string }) {
  const commonP = { className, 'aria-hidden': true as const }
  if (platform === 'twitter' && twitterIcon === 'bird') {
    return <svg viewBox="0 0 512 512" {...commonP}><path d={TWITTER_BIRD_PATH} fill="currentColor" /></svg>
  }
  if (platform === 'twitter') {
    return <svg viewBox="0 0 24 24" {...commonP}><path d={TWITTER_X_PATH} fill="currentColor" /></svg>
  }
  if (platform === 'facebook' || platform === 'telegram' || platform === 'whatsapp') {
    return <svg viewBox="0 0 24 24" {...commonP}><path d={platform === 'facebook' ? FACEBOOK_PATH : platform === 'telegram' ? TELEGRAM_PATH : WHATSAPP_PATH} fill="currentColor" /></svg>
  }
  const paths: Partial<Record<SocialPlatform, React.ReactNode>> = {
    instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" strokeWidth={1.7} /><circle cx="12" cy="12" r="4" strokeWidth={1.7} /><circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none" /></>,
    github: <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.93 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.53 9.53 0 0 1 5 0c1.9-1.29 2.74-1.02 2.74-1.02.56 1.38.21 2.4.1 2.65.65.7 1.03 1.59 1.03 2.68 0 3.83-2.34 4.68-4.57 4.92.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" strokeWidth={0.4} fill="currentColor" />,
    linkedin: <><rect x="3.5" y="3.5" width="17" height="17" rx="3" strokeWidth={1.7} /><line x1="7.5" y1="10" x2="7.5" y2="16.5" strokeWidth={1.7} strokeLinecap="round" /><circle cx="7.5" cy="7" r="1.1" fill="currentColor" stroke="none" /><path d="M11 16.5V10M11 12.7c0-1.5 1.2-2.7 2.7-2.7 1.5 0 2.3 1 2.3 2.9v3.6" strokeWidth={1.7} strokeLinecap="round" /></>,
    youtube: <><rect x="2.5" y="5.5" width="19" height="13" rx="4" strokeWidth={1.7} /><path d="M10.5 9.5l5 2.5-5 2.5v-5Z" fill="currentColor" stroke="none" /></>,
    tiktok: <path d="M14 3v10.2a2.8 2.8 0 1 1-2.2-2.74M14 3c.3 2 1.7 3.6 3.8 3.9M14 6.9c.9.8 2 1.3 3.2 1.4" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />,
    email: <><rect x="3" y="5.5" width="18" height="13" rx="2.5" strokeWidth={1.7} /><path d="M4 7l8 6 8-6" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" /></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...commonP}>{paths[platform]}</svg>
}

function socialHref(platform: SocialPlatform, value: string, twitterIcon: TwitterIcon): string {
  if (value.startsWith('http')) return value
  if (platform === 'email') return value.includes('@') ? `mailto:${value}` : value
  if (platform === 'twitter') return `${twitterIcon === 'bird' ? 'https://twitter.com/' : 'https://x.com/'}${value.replace(/^@/, '')}`
  if (platform === 'whatsapp') return `https://wa.me/${value.replace(/[^0-9]/g, '')}`
  return `${socialMeta[platform].prefix}${value.replace(/^@/, '')}`
}

function pageBackgroundStyle(profile: Profile): React.CSSProperties | undefined {
  if (profile.backgroundStyle === 'default' && profile.backgroundColor) return { backgroundColor: profile.backgroundColor }
  if (profile.backgroundStyle === 'gradient') return { backgroundImage: profile.backgroundGradient || `linear-gradient(160deg, ${profile.accentColor}22, transparent 55%)` }
  if (profile.backgroundStyle === 'image' && profile.backgroundImageURL) return { backgroundImage: `url(${profile.backgroundImageURL})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
  if (profile.backgroundStyle === 'pattern') return patternStyle(profile.backgroundPattern || 'dots', profile.accentColor, profile.backgroundPatternDensity || 1, profile.backgroundPatternColor)
  return undefined
}

// How mismatched an image's aspect ratio has to be from its frame before we stop trusting
// a plain center-crop. A portrait avatar in a square frame, or a square logo in a wide banner
// frame, loses its subject to object-cover — this is exactly the "avatar looks cropped/squished"
// failure mode. Past this threshold we auto-switch to a contain-fit with a soft blurred backdrop
// (the same technique Spotify/Apple Music use for mismatched cover art), so the full image is
// always visible with no cropping and no visible letterboxing.
const ASPECT_MISMATCH_THRESHOLD = 1.15

function CardImg({ src, alt, className, fit = 'auto', style }: { src: string; alt: string; className: string; fit?: 'auto' | 'cover' | 'contain' | 'fill'; style?: React.CSSProperties }) {
  const [loaded, setLoaded] = useState(false)
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [frameRatio, setFrameRatio] = useState<number | null>(null)
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const update = () => { if (el.offsetHeight > 0) setFrameRatio(el.offsetWidth / el.offsetHeight) }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const useContain = fit === 'contain' || (fit === 'auto' && naturalRatio !== null && frameRatio !== null && Math.max(naturalRatio, frameRatio) / Math.min(naturalRatio, frameRatio) > ASPECT_MISMATCH_THRESHOLD)
  const objectFitClass = fit === 'fill' ? 'object-fill' : useContain ? 'object-contain' : 'object-cover'
  return (
    <div ref={frameRef} className={`relative overflow-hidden bg-secondary/60 ${className}`}>
      {!loaded && <span className="absolute inset-0 animate-pulse bg-secondary" />}
      {useContain && loaded && (
        // Soft blurred fill behind a contain-fit image reads as an intentional frame rather
        // than empty letterbox bars, while guaranteeing nothing from the original image is cropped off.
        <img src={src} alt="" aria-hidden="true" className="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-2xl" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={(e) => { setLoaded(true); const img = e.currentTarget; if (img.naturalWidth && img.naturalHeight) setNaturalRatio(img.naturalWidth / img.naturalHeight) }}
        onError={() => setLoaded(true)}
        className={`relative size-full transition-opacity duration-300 ${objectFitClass} ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={style}
      />
    </div>
  )
}

type Skin = { card: string; sub: string; bar: string; strip: string; strongText: string }
type CardTrack = (type: 'links' | 'projects' | 'socials', key: string) => void

function LinksSection({ profile, links, skin, onTrack }: { profile: Profile; links: LinkItem[]; skin: Skin; onTrack?: CardTrack }) {
  const visibleLinks = links.filter((item) => item.visible && isLinkActive(item))
  if (!visibleLinks.length) return null
  const dark = profile.theme === 'dark'
  const spacing = spacingConfig[profile.spacing || 'cozy']
  const ghostHover = dark ? 'hover:bg-white/10' : 'hover:bg-secondary/50'
  const linkStyle = (item: LinkItem, base: string) => ({
    className: base,
    style: item.bgColor
      ? { backgroundColor: item.bgColor, color: contrastColor(item.bgColor) }
      : profile.buttonStyle === 'solid'
        ? { backgroundColor: profile.accentColor, color: '#ffffff' }
        : profile.buttonStyle === 'outline'
          ? { borderColor: profile.accentColor, color: profile.accentColor, backgroundColor: 'transparent' }
          : { color: profile.accentColor, backgroundColor: 'transparent' },
  })
  const baseLinkClass = profile.buttonStyle === 'solid'
    ? `flex min-h-12 items-center justify-between rounded-xl border border-transparent text-left text-sm font-medium transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:-translate-y-0.5 active:translate-y-0 active:shadow-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current`
    : profile.buttonStyle === 'outline'
      ? `flex min-h-12 items-center justify-between rounded-xl border-2 text-left text-sm font-medium transition duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:-translate-y-0.5 active:translate-y-0 active:shadow-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current`
      : `flex min-h-12 items-center justify-between rounded-xl border border-transparent text-left text-sm font-medium transition duration-200 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 active:translate-y-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current ${ghostHover}`
  const icon = (item: LinkItem, sizeClass = 'size-4') => profile.showLinkIcons !== false && (item.icon ? <span className="shrink-0 text-base leading-none" style={item.iconColor ? { color: item.iconColor } : undefined}>{item.icon}</span> : <img src={faviconFor(item.url)} alt="" aria-hidden="true" className={`${sizeClass} shrink-0 rounded-sm opacity-90`} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />)
  const iconChip = (item: LinkItem, tone?: string) => {
    const rendered = icon(item)
    if (!rendered) return null
    return (
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-full ${tone || (dark ? 'bg-white/10' : 'bg-secondary/70')}`}
      >
        {rendered}
      </span>
    )
  }

  // A link's own displayStyle (if set) overrides the default look for that one link.
  function renderLink(item: LinkItem) {
    const style = item.displayStyle && item.displayStyle !== 'default' ? item.displayStyle : null
    if (style === 'text') {
      return (
        <a key={item.id} href={safeHref(item.url)} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} className={`flex items-center gap-2 px-1 py-2 text-left text-sm font-medium underline underline-offset-4 transition hover:opacity-70`} style={{ color: item.bgColor || profile.accentColor }}>
          {icon(item, 'size-3.5')}
          <span className="min-w-0">
            <span className="block truncate">{item.title}</span>
            {item.subtitle && <span className={`block truncate text-xs font-normal opacity-70 no-underline underline-offset-4`}>{item.subtitle}</span>}
          </span>
        </a>
      )
    }
    if (style === 'large') {
      return (
        <a key={item.id} href={safeHref(item.url)} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} {...linkStyle(item, `${baseLinkClass} ${spacing.linkPad} min-h-16 text-base`)}>
          <span className="flex min-w-0 items-center gap-3">
            {icon(item, 'size-5')}
            <span className="min-w-0">
              <span className="block truncate">{item.title}</span>
              {item.subtitle && <span className="block truncate text-xs font-normal opacity-70">{item.subtitle}</span>}
            </span>
          </span>
          <ExternalLink className="size-4 shrink-0 opacity-70" />
        </a>
      )
    }
    if (style === 'thumbnail') {
      return (
        <a key={item.id} href={safeHref(item.url)} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} className={`flex items-center gap-4 rounded-2xl border p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 ${skin.bar}`} style={item.bgColor ? { backgroundColor: item.bgColor, color: contrastColor(item.bgColor) } : undefined}>
          {item.imageURL
            ? <CardImg src={item.imageURL} alt={item.title} className="size-14 shrink-0 rounded-xl" />
            : <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary text-lg">{icon(item, 'size-6')}</span>}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{item.title}</span>
            {item.subtitle
              ? <span className={`mt-0.5 block truncate text-xs ${item.bgColor ? 'opacity-70' : skin.sub}`}>{item.subtitle}</span>
              : <span className={`mt-0.5 block truncate text-xs ${item.bgColor ? 'opacity-70' : skin.sub}`}>{item.url.replace(/^https?:\/\//, '')}</span>}
          </span>
          <ExternalLink className="size-4 shrink-0 opacity-50 transition group-hover:opacity-80" />
        </a>
      )
    }
    // No per-link override: default look.
    return (
      <a key={item.id} href={safeHref(item.url)} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} {...linkStyle(item, `group ${baseLinkClass} ${spacing.linkPad}`)}>
        <span className="flex min-w-0 items-center gap-3">
          {iconChip(item)}
          <span className="min-w-0">
            <span className="block truncate">{item.title}</span>
            {item.subtitle && <span className="block truncate text-xs font-normal opacity-70">{item.subtitle}</span>}
          </span>
        </span>
        <ExternalLink className="size-4 shrink-0 opacity-60 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </a>
    )
  }

  return <div className={`${spacing.sectionGap} ${spacing.linkGap}`}>{visibleLinks.map((item) => renderLink(item))}</div>
}

function ProjectsSection({ profile, projects, skin, onTrack, t }: { profile: Profile; projects: Project[]; skin: Skin; onTrack?: CardTrack; t: (key: string) => string }) {
  const visibleProjects = projects.filter((item) => item.visible)
  if (!visibleProjects.length) return null
  const spacing = spacingConfig[profile.spacing || 'cozy']
  // The lead project gets a solid accent-colored card to stand out from the rest, but "solid
  // accent + fixed white text" breaks the moment someone picks a light accent color (pink,
  // mint, pale yellow) — the caption and title both wash out to near-illegible. Deriving both
  // from the accent's actual luminance keeps the lead card legible for any color the person
  // picks, the same way link buttons with a custom bgColor already do (see contrastColor above).
  const leadText = contrastColor(profile.accentColor)
  const leadSubText = leadText === '#ffffff' ? 'rgba(255,255,255,0.78)' : 'rgba(21,21,21,0.62)'
  return (
    <div className={`${spacing.sectionGap} grid gap-3 sm:grid-cols-2`}>
      {visibleProjects.map((item, index) => (
        <a key={item.id} href={safeHref(item.url)} target="_blank" rel="noreferrer" onClick={() => onTrack?.('projects', item.id)} className={`flex min-h-32 flex-col rounded-xl p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${index === 0 ? '' : skin.strip}`} style={index === 0 ? { backgroundColor: profile.accentColor, color: leadText } : undefined}>
          {item.imageURL && <div className="mb-3"><CardImg src={item.imageURL} alt={item.title} className="aspect-[16/10] w-full rounded-lg" /></div>}
          <span className={`text-[10px] font-medium uppercase tracking-widest ${index === 0 ? '' : skin.sub}`} style={index === 0 ? { color: leadSubText } : undefined}>{t('selectedWork')}</span>
          <p className={`${item.imageURL ? 'mt-3' : 'mt-8'} text-sm font-medium leading-snug ${index === 0 ? '' : skin.strongText}`}>{item.title}</p>
          {item.description && <p className={`mt-1.5 line-clamp-2 text-xs leading-relaxed ${index === 0 ? '' : skin.sub}`} style={index === 0 ? { color: leadSubText } : undefined}>{item.description}</p>}
          {Array.isArray(item.technologies) && item.technologies.filter(Boolean).length > 0 && (
            <span className="mt-3 flex flex-wrap gap-1.5">
              {item.technologies.filter(Boolean).map((tech) => (
                <span key={tech} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${index === 0 ? 'bg-white/15' : 'bg-secondary/80'}`} style={index === 0 ? { color: leadText } : undefined}>{tech}</span>
              ))}
            </span>
          )}
        </a>
      ))}
    </div>
  )
}

export function ProfileCard({ profile, links, projects, onTrack }: { profile: Profile; links: LinkItem[]; projects: Project[]; onTrack?: CardTrack }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const qrValue = `https://${typeof window !== 'undefined' ? window.location.host : siteHost}/${profile.username}`
  const dark = profile.theme === 'dark'
  const skin: Skin = dark
    ? { card: 'border-[#3a3d38] bg-[#262926] text-[#f5f5f2]', sub: 'text-[#adb1a9]', bar: 'border-[#3a3d38]', strip: 'bg-[#30332f] text-[#adb1a9]', strongText: 'text-[#f5f5f2]' }
    : { card: 'border-border bg-card text-foreground', sub: 'text-muted-foreground', bar: 'border-[#e3e3dd]', strip: 'bg-secondary text-muted-foreground', strongText: 'text-foreground' }
  const radius = radiusClass[profile.cardRadius]
  const font = fontClass[profile.fontStyle]
  const actionColor = accentTextColor(profile.accentColor, dark)
  async function share() {
    await navigator.clipboard?.writeText(`${window.location.host}/${profile.username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  const cardShadow = profile.cardShadow === false ? '' : 'shadow-[0_20px_60px_rgba(35,35,30,0.08)]'
  const socialFilled = profile.socialStyle === 'filled'
  const sectionOrder: SectionKind[] = profile.sectionOrder?.length ? profile.sectionOrder : defaultSectionOrder
  const sections: Record<SectionKind, React.ReactNode> = {
    links: <LinksSection key="links" profile={profile} links={links} skin={skin} onTrack={onTrack} />,
    projects: <ProjectsSection key="projects" profile={profile} projects={projects} skin={skin} onTrack={onTrack} t={t} />,
  }
  return (
    <div className={`pexiloq-fade-in mx-auto max-w-xl my-8 ${font} overflow-hidden border ${cardShadow} ${radius} ${skin.card}`}>
      {profile.coverImageURL && (
        <div className="w-full" style={{ height: `${profile.coverImageHeight || 140}px` }}>
          <CardImg
            src={profile.coverImageURL}
            alt=""
            className="h-full w-full"
            fit={profile.coverImageFit || 'cover'}
            style={{ objectPosition: `${profile.coverImagePositionX ?? 50}% ${profile.coverImagePositionY ?? 50}%` }}
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex min-w-0 items-center gap-1.5 truncate rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-tight ${dark ? 'border-white/15 bg-white/5' : 'border-[#e3e3dd] bg-secondary/50'} ${skin.sub}`}>
            <span className="min-w-0 truncate">{siteHost}/{profile.username}</span>
          </span>
          <span className={`flex shrink-0 items-center gap-0.5 rounded-full border p-0.5 ${dark ? 'border-white/15' : 'border-[#e3e3dd]'}`}>
            <button type="button" onClick={() => setShowQr((v) => !v)} aria-label={t('showQr')} title={t('showQr')} aria-pressed={showQr} className={`rounded-full p-2 transition ${showQr ? (dark ? 'bg-white/15' : 'bg-secondary/80') : dark ? 'hover:bg-white/10' : 'hover:bg-secondary/60'}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5"><rect x="3" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" /><rect x="14" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" /><rect x="3" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" /><rect x="14.5" y="14.5" width="2.5" height="2.5" fill="currentColor" /><rect x="18.5" y="14.5" width="2.5" height="2.5" fill="currentColor" /><rect x="14.5" y="18.5" width="2.5" height="2.5" fill="currentColor" /><rect x="18.5" y="18.5" width="2.5" height="2.5" fill="currentColor" /></svg>
            </button>
            <span className="relative">
              <button type="button" onClick={share} aria-label={t('shareButton')} title={t('shareButton')} className={`rounded-full p-2 transition ${dark ? 'hover:bg-white/10' : 'hover:bg-secondary/60'}`}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </button>
              {copied && (
                <span role="status" aria-live="polite" className={`pexiloq-fade-in pointer-events-none absolute right-0 top-full mt-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium shadow-sm ${dark ? 'bg-white text-[#151515]' : 'bg-[#151515] text-white'}`}>
                  {t('copied')}
                </span>
              )}
            </span>
          </span>
        </div>
        {showQr && (
          <div className={`mt-4 flex flex-col items-center gap-3 rounded-2xl border pt-5 pb-5 text-center ${dark ? 'border-white/15 bg-white/5' : 'border-[#e3e3dd] bg-secondary/30'}`}>
            <QrImage value={qrValue} size={148} className="rounded-xl border bg-white p-2" />
            <button type="button" onClick={() => void downloadQr(qrValue, `${profile.username}-pexiloq-qr.png`)} className="text-xs font-medium underline underline-offset-4" style={{ color: actionColor }}>{t('downloadQr')}</button>
          </div>
        )}
        <div className={`px-2 pb-6 pt-7 text-center sm:px-6 ${showQr ? 'mt-4' : profile.coverImageURL ? '-mt-7' : ''}`}>
          {profile.showAvatar && (
            <div
              className={`mx-auto ${profile.coverImageURL && !showQr ? '-mt-3' : ''} relative grid size-24 place-items-center overflow-hidden text-xl font-medium ${dark ? 'bg-white/10 text-[#f5f5f2]' : 'bg-secondary text-[#151515]'} ${avatarShapeClass[profile.avatarShape]} ${profile.avatarAnimation === 'pulse' ? 'pexiloq-avatar-pulse' : ''} ${profile.avatarAnimation === 'spin' ? 'pexiloq-avatar-spin' : ''} ${profile.avatarAnimation === 'glow' ? 'pexiloq-avatar-glow' : ''}`}
              style={{
                // The ring always derives from the profile's own accent color, never a fixed
                // hue, so it can't clash with a brand-colored avatar. A themed background
                // ring plus a soft shadow lifts the avatar off a cover photo edge cleanly.
                ...(profile.avatarRing ? { outline: `3px solid ${profile.accentColor}`, outlineOffset: 2 } : undefined),
                boxShadow: profile.coverImageURL ? `0 4px 16px rgba(0,0,0,0.18)` : `0 10px 24px -8px rgba(21,21,21,0.18)`,
                ...(profile.avatarAnimation === 'spin' || profile.avatarAnimation === 'glow' ? ({ '--pexiloq-avatar-ring-color': profile.accentColor } as React.CSSProperties) : undefined),
              }}
            >
              {profile.photoURL ? <CardImg src={profile.photoURL} alt={profile.displayName} className={`size-full ${avatarShapeClass[profile.avatarShape]}`} /> : profile.displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <h1 className={`${profile.showAvatar ? 'mt-5' : ''} flex items-center justify-center gap-1.5 text-[1.85rem] font-medium leading-[1.15] tracking-[-0.045em] ${font}`}>
            <span className="min-w-0 truncate">{profile.displayName}</span>
            {profile.showVerifiedBadge && (
              <span aria-label={t('verifiedBadge')} title={t('verifiedBadge')} className="inline-grid size-5 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: profile.accentColor }}>
                <Check className="size-3" strokeWidth={3} />
              </span>
            )}
          </h1>
          {profile.headline && <p className={`mt-1.5 text-sm font-medium ${skin.sub}`}>{profile.headline}</p>}
          {profile.bio && <p className={`mt-4 text-sm leading-6 mx-auto max-w-sm ${skin.sub}`}>{profile.bio}</p>}
          {profile.website && (
            <a href={safeHref(profile.website)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium underline decoration-current/30 underline-offset-4 transition hover:decoration-current/70" style={{ color: actionColor }}>
              {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          )}
          {Object.entries(profile.socials || {}).filter(([, v]) => v).length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {socialPlatforms.filter((p) => profile.socials?.[p]).map((p) => {
                const value = profile.socials![p]!
                const href = socialHref(p, value, profile.twitterIcon)
                return <a key={p} href={href} target="_blank" rel="noreferrer" aria-label={socialMeta[p].label} onClick={() => onTrack?.('socials', p)} className={`grid size-9 place-items-center rounded-full transition duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:-translate-y-0.5 active:translate-y-0 ${socialFilled ? '' : `border ${skin.bar}`}`} style={socialFilled ? { backgroundColor: profile.accentColor, color: '#ffffff' } : undefined}><SocialGlyph platform={p} twitterIcon={profile.twitterIcon} className="size-4" /></a>
              })}
            </div>
          )}
        </div>
        {sectionOrder.map((key) => <div key={key}>{sections[key]}</div>)}
        {profile.showBadge && (
          <div className={`mt-2 flex justify-center border-t pt-4 ${skin.bar}`}>
            <a
              href={siteUrl}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] transition hover:-translate-y-0.5 ${dark ? 'bg-white/10 hover:bg-white/15' : 'bg-secondary/70 hover:bg-secondary'} ${skin.sub}`}
            >
              {t('made')} <span className={`font-semibold ${dark ? 'text-[#f5f5f2]' : 'text-[#151515]'}`}>pexiloq</span>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export function Overview() {
  const { profile, links, projects, uid } = useWorkspace()
  const { t } = useI18n()
  const [stats, setStats] = useState<{ views: number; links: Record<string, number>; projects: Record<string, number>; socials: Record<string, number> } | null>(null)
  const [daily, setDaily] = useState<DailyPoint[]>([])
  const [trendDays, setTrendDays] = useState(7)
  const [trendMetric, setTrendMetric] = useState<'views' | 'clicks'>('views')
  useEffect(() => {
    if (!uid) { setStats(null); return }
    let live = true
    void loadAnalytics(uid).then((s) => { if (live) setStats(s) })
    return () => { live = false }
  }, [uid])
  useEffect(() => {
    if (!uid) { setDaily([]); return }
    let live = true
    void loadDailyAnalytics(uid, trendDays).then((points) => { if (live) setDaily(points) })
    return () => { live = false }
  }, [uid, trendDays])
  if (!profile.onboarded && !(profile.displayName && profile.username)) return <Onboarding />
  const totalClicks = Math.max(0, Object.values(stats?.links || {}).reduce((a, b) => a + b, 0) + Object.values(stats?.projects || {}).reduce((a, b) => a + b, 0) + Object.values(stats?.socials || {}).reduce((a, b) => a + b, 0))
  const clicks = [
    ...links.filter((l) => l.visible).map((l) => ({ label: l.title || t('linkTitle'), count: stats?.links?.[l.id] || 0 })),
    ...projects.filter((p) => p.visible).map((p) => ({ label: p.title || t('project'), count: stats?.projects?.[p.id] || 0 })),
    ...socialPlatforms.filter((p) => profile.socials?.[p]).map((p) => ({ label: socialMeta[p].label, count: stats?.socials?.[p] || 0 })),
  ].filter((r) => r.count > 0).sort((a, b) => b.count - a.count).slice(0, 6)
  const maxClicks = Math.max(1, ...clicks.map((c) => c.count))
  return (
    <>
      <PageHeader
        eyebrow={t('workspace')}
        title={`${t('goodToSee')}, ${profile.displayName.split(' ')[0] || 'Creator'}.`}
        description={t('calmPlace')}
        action={
          <Link
            href={`/${profile.username}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-xs transition hover:opacity-90"
          >
            {t('viewProfile')} <ArrowUpRight className="size-4" />
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label={t('liveLinks')} value={String(links.filter((i) => i.visible).length)} accent={profile.accentColor} icon={Link2} />
        <Stat label={t('projects')} value={String(projects.filter((i) => i.visible).length)} accent={profile.accentColor} icon={Layers} />
        <Stat label={t('profileStatus')} value={profile.username ? (profile.isPublic === false ? t('privateProfile') : t('live')) : t('draft')} accent={profile.accentColor} icon={UserRound} />
        <Stat label={t('pageViews')} value={String(stats?.views ?? 0)} accent={profile.accentColor} icon={Eye} />
        <Stat label={t('totalClicks')} value={String(totalClicks)} accent={profile.accentColor} icon={Zap} />
      </div>
      <section className="mt-8 rounded-2xl border bg-card p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{t('trafficTrend')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('trendHint')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border p-0.5 text-xs" role="group" aria-label={t('trafficTrend')}>
              {(['views', 'clicks'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setTrendMetric(m)} aria-pressed={trendMetric === m} className={`rounded-full px-3 py-1 transition ${trendMetric === m ? 'bg-secondary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>{m === 'views' ? t('trendViews') : t('trendClicks')}</button>
              ))}
            </div>
            <div className="flex rounded-full border p-0.5 text-xs" role="group" aria-label={t('trafficTrend')}>
              {[7, 30].map((d) => (
                <button key={d} type="button" onClick={() => setTrendDays(d)} aria-pressed={trendDays === d} className={`rounded-full px-3 py-1 transition ${trendDays === d ? 'bg-secondary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>{d === 7 ? t('last7Days') : t('last30Days')}</button>
              ))}
            </div>
          </div>
        </div>
        <TrendChart points={daily} metric={trendMetric} accent={profile.accentColor} t={t} />
      </section>
      <section className="mt-8 rounded-2xl border bg-card p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{t('insights')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('analyticsHint')}</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground font-mono">{totalClicks} clicks</span>
        </div>
        {clicks.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-secondary/40 px-4 py-8 text-center">
            <Zap className="size-8 text-muted-foreground/60" />
            <p className="mt-2 text-sm font-medium">{t('noClicksYet')}</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3.5">
            {clicks.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-44 shrink-0 truncate text-xs font-medium">{row.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(row.count / maxClicks) * 100}%`, backgroundColor: profile.accentColor }} />
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">{row.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{t('livePreview')}</p>
              <h2 className="mt-1 text-lg font-medium tracking-[-0.03em]">{t('thisWorld')}</h2>
            </div>
            <Link href="/dashboard/profile" className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4 hover:opacity-80">
              {t('edit')} <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <div className="mt-6"><LivePreview profile={profile} links={links} projects={projects} note={false} /></div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border bg-secondary/50 p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{t('nextSteps')}</p>
            <div className="mt-5 space-y-3">
              {[
                [t('completeProfile'), '/dashboard/profile', UserRound],
                [t('addFirstLink'), '/dashboard/links', Link2],
                [t('showcaseProject'), '/dashboard/projects', Layers],
                [t('makeItYours'), '/dashboard/appearance', Palette],
              ].map(([label, href, Icon]: any) => (
                <Link
                  href={href}
                  key={href}
                  className="group flex items-center justify-between rounded-xl border bg-card p-3.5 transition hover:border-foreground/30 hover:shadow-xs"
                >
                  <span className="flex items-center gap-3 text-xs font-medium">
                    <Icon className="size-4 text-muted-foreground transition group-hover:text-foreground" />
                    {label}
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-8 rounded-xl border bg-card p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">{t('proTip')}</p>
            <p className="mt-1 leading-relaxed">{t('proTipBody')}</p>
          </div>
        </div>
      </section>
    </>
  )
}

function Stat({ label, value, accent, icon: Icon }: { label: string; value: string; accent?: string; icon?: any }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs transition hover:border-foreground/20">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground/60" />}
      </div>
      <p className="mt-3 text-3xl font-medium tracking-[-0.06em]" style={{ color: accent || 'currentColor' }}>{value}</p>
    </div>
  )
}

// Per-day bar chart for the traffic trend in Overview. Zero-data days render as a short neutral
// stub so the span of time stays visible; tooltips (title) carry the per-day numbers rather than
// cramming labels into the chart itself.
function TrendChart({ points, metric, accent, t }: { points: DailyPoint[]; metric: 'views' | 'clicks'; accent: string; t: (key: string) => string }) {
  if (points.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-secondary/40 px-4 py-8 text-center">
        <Eye className="size-8 text-muted-foreground/60" />
        <p className="mt-2 text-sm font-medium">{t('noClicksYet')}</p>
      </div>
    )
  }
  const values = points.map((p) => p[metric])
  const max = Math.max(1, ...values)
  const total = values.reduce((a, b) => a + b, 0)
  const label = metric === 'views' ? t('trendViews') : t('trendClicks')
  return (
    <div className="mt-6">
      <div className="flex items-end gap-3">
        <p className="mb-1 shrink-0 font-mono text-xs text-muted-foreground">{label} · {total}</p>
        <div className="flex h-36 flex-1 items-end gap-[3px]">
          {points.map((p) => {
            const v = p[metric]
            const height = v > 0 ? Math.max(8, (v / max) * 100) : 3
            return (
              <div
                key={p.date}
                title={`${p.date} — ${label}: ${v}`}
                className={`min-w-0 flex-1 rounded-t transition hover:opacity-80 ${v > 0 ? '' : 'bg-secondary'}`}
                style={v > 0 ? { height: `${height}%`, backgroundColor: accent } : { height: `${height}%` }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/80">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-medium tracking-[-0.06em] sm:text-4xl">{title}</h1>
        <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function Editor({ kind }: { kind: 'profile' | 'links' | 'projects' | 'appearance' }) {
  const { profile, links, projects, persistProfile, persistLinks, persistProjects, uid } = useWorkspace()
  const { t } = useI18n()
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [draftProfile, setDraftProfile] = useState(profile)
  const [draftLinks, setDraftLinks] = useState(links)
  const [draftProjects, setDraftProjects] = useState(projects)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  function reorder<T>(list: T[], setList: (next: T[]) => void, targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return
    const next = [...list]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(targetIndex, 0, moved)
    setList(next)
    setDragIndex(null)
  }
  useEffect(() => { setDraftProfile(profile); setDraftLinks(links); setDraftProjects(projects) }, [profile, links, projects])
  const persistNow = async () => {
    setSaving(true)
    try {
      if (kind === 'profile' || kind === 'appearance') await persistProfile(draftProfile)
      if (kind === 'links') await persistLinks(draftLinks)
      if (kind === 'projects') await persistProjects(draftProjects)
    } finally { setSaving(false) }
  }
  const showSaved = () => { setNotice(t('saved')); window.setTimeout(() => setNotice(''), 2000) }
  const flushNow = async () => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null }
    await persistNow()
  }
  const firstRun = useRef(true)
  const timer = useRef<number | null>(null)
  // A username mid-check or already known to be taken/too-short must never reach Firestore —
  // otherwise autosave (which fires on every keystroke) or the unmount flush could silently
  // write an unavailable handle. usernameStatus tracks the live state of draftProfile.username
  // for the profile/appearance editor specifically; other editor kinds don't touch it.
  const usernameStatus = useUsernameStatus(draftProfile.username, profile.username, uid)
  const usernameBlocksSave = (kind === 'profile' || kind === 'appearance') && (usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'short')
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    if (timer.current) window.clearTimeout(timer.current)
    if (usernameBlocksSave) return
    timer.current = window.setTimeout(async () => { timer.current = null; await persistNow(); showSaved() }, 600)
  }, [draftProfile, draftLinks, draftProjects, usernameBlocksSave])
  const latest = useRef({ profile: draftProfile, links: draftLinks, projects: draftProjects })
  useEffect(() => { latest.current = { profile: draftProfile, links: draftLinks, projects: draftProjects } })
  const usernameBlocksSaveRef = useRef(usernameBlocksSave)
  useEffect(() => { usernameBlocksSaveRef.current = usernameBlocksSave })
  useEffect(() => () => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null }
    const { profile: p, links: l, projects: pr } = latest.current
    // If the last-known username check hadn't cleared, fall back to the last saved
    // username rather than writing the unverified draft value on unmount.
    const safeProfile = usernameBlocksSaveRef.current ? { ...p, username: profile.username } : p
    if (uid && (kind === 'profile' || kind === 'appearance')) void saveProfile(uid, safeProfile as any)
    if (uid && kind === 'links') void saveItems(uid, 'links', l)
    if (uid && kind === 'projects') void saveItems(uid, 'projects', pr)
  }, [uid, kind])
  async function save() {
    if (usernameBlocksSave) { showUsernameBlockedNotice(); return }
    await flushNow(); showSaved()
  }
  function showUsernameBlockedNotice() {
    setNotice(usernameStatus === 'taken' ? t('usernameTaken') : usernameStatus === 'short' ? t('usernameTooShort') : t('usernameChecking'))
    window.setTimeout(() => setNotice(''), 2000)
  }
  const addLink = () => setDraftLinks([...draftLinks, { id: crypto.randomUUID(), title: '', url: 'https://', visible: true }])
  const addProject = () => setDraftProjects([...draftProjects, { id: crypto.randomUUID(), title: '', description: '', url: 'https://', technologies: [], visible: true }])
  const titles = { profile: t('yourProfile'), links: t('yourLinks'), projects: t('yourProjects'), appearance: t('yourAppearance') }
  const descriptions = { profile: t('introduce'), links: t('important'), projects: t('considered'), appearance: t('tune') }
  return (
    <>
      <PageHeader
        eyebrow={t('customize')}
        title={titles[kind]}
        description={descriptions[kind]}
        action={
          <div className="flex flex-col items-end gap-1.5">
            <button onClick={save} disabled={saving || usernameBlocksSave} className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{saving ? <><Loader2 className="mr-2 inline size-4 animate-spin" />{t('saving')}</> : <><Save className="mr-2 inline size-4" />{notice || t('save')}</>}</button>
            {/* Autosave already fires on every change — this caption makes that fact visible so
               people trust it instead of anxiously mashing Save. */}
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {saving ? <><Loader2 className="size-3 animate-spin" />{t('autosaving')}</> : notice ? <><Check className="size-3" />{t('autosaved')}</> : t('autosaveHint')}
            </span>
          </div>
        }
      />
      {kind === 'profile' && (
        <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-start">
          <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-xs">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('stepBasics')}</p>
              <div className="mt-4 space-y-4">
                <Field label={t('displayName')} value={draftProfile.displayName} onChange={(v) => setDraftProfile({ ...draftProfile, displayName: v })} placeholder="e.g. Amira Moss" />
                <Field label={t('username')} value={draftProfile.username} onChange={(v) => setDraftProfile({ ...draftProfile, username: v.toLowerCase().replace(/[^a-z0-9-]/g, '') })} prefix={`${siteHost}/`} placeholder="username" note={<UsernameNote status={usernameStatus} />} invalid={usernameStatus === 'taken' || usernameStatus === 'short'} />
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('stepAbout')}</p>
              <div className="mt-4 space-y-4">
                <Field label={t('headline')} value={draftProfile.headline} onChange={(v) => setDraftProfile({ ...draftProfile, headline: v })} placeholder="e.g. Designer & Curator" />
                <Field label={t('bio')} value={draftProfile.bio} onChange={(v) => setDraftProfile({ ...draftProfile, bio: v })} area placeholder="Tell visitors a little about yourself..." />
                <Field label={t('website')} value={draftProfile.website} onChange={(v) => setDraftProfile({ ...draftProfile, website: v })} placeholder="https://yourwebsite.com" />
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('profilePhoto')}</p>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border bg-secondary text-base font-semibold shadow-xs">
                  {draftProfile.photoURL ? <CardImg src={draftProfile.photoURL} alt="" className="size-full rounded-full" /> : (draftProfile.displayName || '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="grid flex-1 gap-2.5">
                  <ImageUploader uid={uid} maxDimension={512} value={draftProfile.photoURL} shape="circle" aspect={1} onUploaded={(url) => setDraftProfile({ ...draftProfile, photoURL: url })} />
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer select-none font-medium hover:text-foreground">{t('orPasteUrl')}</summary>
                    <input value={draftProfile.photoURL || ''} onChange={(e) => setDraftProfile({ ...draftProfile, photoURL: e.target.value.trim() })} className="mt-2 w-full rounded-xl border bg-background px-3 py-2 text-xs" placeholder="https://…" />
                  </details>
                  <p className="text-[11px] text-muted-foreground">{t('photoFitHint')}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('socialLinks')}</p>
              <div className="mt-4 space-y-2.5">
                {socialPlatforms.map((platform) => (
                  <div key={platform} className="flex items-center gap-3">
                    {platform === 'twitter' ? (
                      <div className="flex shrink-0 items-center gap-1 rounded-full border bg-background p-1" role="group" aria-label="X / Twitter icon">
                        {(['x', 'bird'] as const).map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            title={icon === 'x' ? 'X' : 'Twitter'}
                            onClick={() => setDraftProfile({ ...draftProfile, twitterIcon: icon })}
                            aria-pressed={draftProfile.twitterIcon === icon}
                            className={`rounded-full p-1 transition ${draftProfile.twitterIcon === icon ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            <SocialGlyph platform="twitter" twitterIcon={icon} className="size-3.5" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="grid size-9 shrink-0 place-items-center rounded-full border bg-background text-muted-foreground"><SocialGlyph platform={platform} className="size-4" /></span>
                    )}
                    <input
                      value={draftProfile.socials?.[platform] || ''}
                      onChange={(e) => setDraftProfile({ ...draftProfile, socials: { ...draftProfile.socials, [platform]: e.target.value.trim() } })}
                      className="w-full rounded-xl border bg-background px-3.5 py-2 text-xs transition focus:border-foreground/40"
                      placeholder={`${socialMeta[platform].label} — ${socialMeta[platform].placeholder}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:self-start"><LivePreview profile={draftProfile} links={draftLinks} projects={draftProjects} /></div>
        </div>
      )}
      {kind === 'appearance' && (
        <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-start">
          <div className="rounded-2xl border bg-card p-6 shadow-xs"><AppearanceControls draft={draftProfile} onChange={setDraftProfile} uid={uid} /></div>
          <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:self-start"><LivePreview profile={draftProfile} links={draftLinks} projects={draftProjects} /></div>
        </div>
      )}
      {kind === 'links' && (
        <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-start">
          <div className="space-y-3">
            {draftLinks.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-10 text-center">
                <Link2 className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">{t('noLinksYet')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('noLinksYetHint')}</p>
              </div>
            )}
            {draftLinks.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorder(draftLinks, setDraftLinks, index)}
                onDragEnd={() => setDragIndex(null)}
                className={`flex flex-col gap-3 rounded-2xl border bg-card p-4 transition sm:flex-row sm:items-center ${dragIndex === index ? 'opacity-50' : ''}`}
              >
                <span className="hidden cursor-grab select-none text-muted-foreground active:cursor-grabbing sm:block" title={t('dragToReorder')}><GripVertical className="size-4" /></span>
                <button className="text-muted-foreground transition hover:text-destructive" onClick={() => { void deleteStoredImage(uid, item.imageURL); setDraftLinks(draftLinks.filter((x) => x.id !== item.id)) }} aria-label={t('deleteLink')}><Trash2 className="size-4" /></button>
                {faviconFor(item.url) && <img src={faviconFor(item.url)} alt="" className="hidden size-5 rounded-sm sm:block" />}
                <div className="grid flex-1 gap-2">
                  <div className="grid gap-2 md:grid-cols-2">
                    <input value={item.title} onChange={(e) => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, title: e.target.value } : x))} className="rounded-lg border bg-background px-3 py-2 text-sm" placeholder={t('linkTitle')} />
                    <input value={item.url} onChange={(e) => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, url: e.target.value } : x))} className={`rounded-lg border bg-background px-3 py-2 text-sm ${!isSafeWebUrl(item.url) ? 'border-destructive/60' : ''}`} placeholder="https://" />
                  </div>
                  {!isSafeWebUrl(item.url) && <p className="flex items-center gap-1.5 text-xs text-destructive"><CircleAlert className="size-3.5 shrink-0" />{t('invalidUrl')}</p>}
                  <input value={item.subtitle || ''} onChange={(e) => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, subtitle: e.target.value } : x))} className="rounded-lg border bg-background px-3 py-2 text-sm" placeholder={t('linkSubtitlePlaceholder')} aria-label={t('linkSubtitle')} />
                  <div className="flex items-center gap-2">
                    <input value={item.icon || ''} maxLength={4} onChange={(e) => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, icon: e.target.value.trim() } : x))} className="w-14 rounded-lg border bg-background px-2 py-2 text-center text-lg" placeholder={t('emoji')} aria-label={t('emoji')} />
                    <div className="flex gap-0.5 overflow-x-auto">{linkEmojis.map((emoji) => <button key={emoji} type="button" onClick={() => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, icon: x.icon === emoji ? '' : emoji } : x))} aria-pressed={item.icon === emoji} className={`shrink-0 rounded-md p-1 text-base transition ${item.icon === emoji ? 'bg-secondary' : 'hover:bg-secondary/60'}`}>{emoji}</button>)}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t pt-2">
                    <span className="text-xs text-muted-foreground">{t('linkDisplayStyle')}</span>
                    {linkDisplayStyles.map((style) => (
                      <button key={style} type="button" onClick={() => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, displayStyle: style } : x))} aria-pressed={(item.displayStyle || 'default') === style} className={`rounded-full border px-3 py-1 text-xs capitalize transition ${(item.displayStyle || 'default') === style ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'}`}>{t(`linkStyle${style.charAt(0).toUpperCase()}${style.slice(1)}`)}</button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-muted-foreground">{t('linkScheduling')}</span>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{t('visibleFrom')}</span>
                      <input type="date" value={item.visibleFrom || ''} onChange={(e) => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, visibleFrom: e.target.value || undefined } : x))} className="rounded-lg border bg-background px-2 py-1.5 text-xs" />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{t('visibleUntil')}</span>
                      <input type="date" value={item.visibleUntil || ''} onChange={(e) => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, visibleUntil: e.target.value || undefined } : x))} className="rounded-lg border bg-background px-2 py-1.5 text-xs" />
                    </label>
                    {(item.visibleFrom || item.visibleUntil) && <button type="button" onClick={() => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, visibleFrom: undefined, visibleUntil: undefined } : x))} className="text-xs text-muted-foreground underline underline-offset-4">{t('clear')}</button>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
                      <input type="color" value={item.bgColor || '#ffffff'} onChange={(e) => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, bgColor: e.target.value } : x))} className="size-4 cursor-pointer appearance-none rounded-full border border-border p-0" aria-label={t('linkBgColor')} />
                      <span>{t('linkBgColor')}</span>
                    </label>
                    {item.bgColor && <button type="button" onClick={() => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, bgColor: '' } : x))} className="text-xs text-muted-foreground underline underline-offset-4">{t('bgDefault')}</button>}
                    <label className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
                      <input type="color" value={item.iconColor || '#171717'} onChange={(e) => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, iconColor: e.target.value } : x))} className="size-4 cursor-pointer appearance-none rounded-full border border-border p-0" aria-label={t('linkIconColor')} />
                      <span>{t('linkIconColor')}</span>
                    </label>
                    {item.iconColor && <button type="button" onClick={() => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, iconColor: '' } : x))} className="text-xs text-muted-foreground underline underline-offset-4">{t('bgDefault')}</button>}
                  </div>
                  {item.displayStyle === 'thumbnail' && (
                    <div className="grid gap-2 border-t pt-2 md:grid-cols-2">
                      <input value={item.imageURL || ''} onChange={(e) => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, imageURL: e.target.value.trim() } : x))} className="rounded-lg border bg-background px-3 py-2 text-sm" placeholder={t('linkThumbnailUrl')} />
                      <ImageUploader uid={uid} maxDimension={512} value={item.imageURL} shape="rect" aspect={1} onUploaded={(url) => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, imageURL: url } : x))} />
                    </div>
                  )}
                </div>
                <button onClick={() => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, visible: !x.visible } : x))} className={`rounded-full px-3 py-1 text-xs transition ${item.visible ? 'bg-secondary font-medium' : 'border text-muted-foreground'}`}>{item.visible ? t('visible') : t('hidden')}</button>
              </div>
            ))}
            <button onClick={addLink} className="rounded-full border px-4 py-2 text-sm transition hover:border-foreground/40"><Plus className="mr-1 inline size-4" />{t('addLink')}</button>
          </div>
          <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:self-start"><LivePreview profile={draftProfile} links={draftLinks} projects={draftProjects} /></div>
        </div>
      )}
      {kind === 'projects' && (
        <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-start">
          <div className="space-y-3">
            {draftProjects.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-10 text-center">
                <Layers className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">{t('noProjectsYet')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('noProjectsYetHint')}</p>
              </div>
            )}
            {draftProjects.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorder(draftProjects, setDraftProjects, index)}
                onDragEnd={() => setDragIndex(null)}
                className={`rounded-2xl border bg-card p-5 transition ${dragIndex === index ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium"><span className="cursor-grab select-none text-muted-foreground active:cursor-grabbing" title={t('dragToReorder')}><GripVertical className="size-4" /></span>{t('project')}</span>
                  <button onClick={() => { void deleteStoredImage(uid, item.imageURL); setDraftProjects(draftProjects.filter((x) => x.id !== item.id)) }} aria-label={t('deleteProject')} className="text-muted-foreground transition hover:text-destructive"><Trash2 className="size-4" /></button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input value={item.title} onChange={(e) => setDraftProjects(draftProjects.map((x) => x.id === item.id ? { ...x, title: e.target.value } : x))} className="rounded-lg border bg-background px-3 py-2 text-sm" placeholder={t('projectTitle')} />
                  <input value={item.url} onChange={(e) => setDraftProjects(draftProjects.map((x) => x.id === item.id ? { ...x, url: e.target.value } : x))} className={`rounded-lg border bg-background px-3 py-2 text-sm ${!isSafeWebUrl(item.url) ? 'border-destructive/60' : ''}`} placeholder={t('projectUrl')} />
                  {!isSafeWebUrl(item.url) && <p className="flex items-center gap-1.5 text-xs text-destructive md:col-span-2"><CircleAlert className="size-3.5 shrink-0" />{t('invalidUrl')}</p>}
                  <textarea value={item.description} onChange={(e) => setDraftProjects(draftProjects.map((x) => x.id === item.id ? { ...x, description: e.target.value } : x))} className="min-h-24 rounded-lg border bg-background px-3 py-2 text-sm md:col-span-2" placeholder={t('description')} />
                  <input value={(item.technologies || []).join(', ')} onChange={(e) => setDraftProjects(draftProjects.map((x) => x.id === item.id ? { ...x, technologies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } : x))} className="rounded-lg border bg-background px-3 py-2 text-sm md:col-span-2" placeholder={t('technologiesHint')} aria-label={t('technologies')} />
                  <input value={item.imageURL || ''} onChange={(e) => setDraftProjects(draftProjects.map((x) => x.id === item.id ? { ...x, imageURL: e.target.value.trim() } : x))} className="rounded-lg border bg-background px-3 py-2 text-sm md:col-span-2" placeholder="Image URL (optional) — https://" />
                  <ImageUploader uid={uid} maxDimension={1024} value={item.imageURL} shape="rect" aspect={16 / 9} onUploaded={(url) => setDraftProjects(draftProjects.map((x) => x.id === item.id ? { ...x, imageURL: url } : x))} className="md:col-span-2" />
                </div>
              </div>
            ))}
            <button onClick={addProject} className="rounded-full border px-4 py-2 text-sm transition hover:border-foreground/40"><Plus className="mr-1 inline size-4" />{t('addProject')}</button>
          </div>
          <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:self-start"><LivePreview profile={draftProfile} links={draftLinks} projects={draftProjects} /></div>
        </div>
      )}
    </>
  )
}

function AppearanceControls({ draft, onChange, uid }: { draft: Profile; onChange: (next: Profile) => void; uid?: string | null }) {
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
  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium"><GripVertical className="mr-2 inline size-4 text-muted-foreground" />{t('sectionOrder')}</p>
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
              className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition ${dragSection === index ? 'opacity-50' : ''}`}
            >
              <span className="cursor-grab select-none text-muted-foreground active:cursor-grabbing" title={t('dragToReorder')}><GripVertical className="size-4" /></span>
              <span className="font-medium">{sectionLabel[key]}</span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <p className="text-sm font-medium"><Palette className="mr-2 inline size-4 text-muted-foreground" />{t('colorThemePack')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('colorThemePackHint')}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <button onClick={() => onChange(applyThemePack(draft, 'custom'))} aria-pressed={draft.colorThemePack === 'custom'} className={`overflow-hidden rounded-xl border text-left transition ${draft.colorThemePack === 'custom' ? 'border-foreground ring-2 ring-foreground/20' : 'hover:border-foreground/40'}`}>
            <div className="h-12 bg-secondary/60" style={{ backgroundColor: draft.accentColor }} />
            <p className="border-t px-2 py-1.5 text-xs font-medium">{t('themePackCustom')}</p>
          </button>
          {(['minimal', 'neon', 'pastel', 'darkLuxury'] as const).map((pack) => {
            const cfg = themePackConfig[pack]
            return (
              <button key={pack} onClick={() => onChange(applyThemePack(draft, pack))} aria-pressed={draft.colorThemePack === pack} className={`overflow-hidden rounded-xl border text-left transition ${draft.colorThemePack === pack ? 'border-foreground ring-2 ring-foreground/20' : 'hover:border-foreground/40'}`}>
                <div className="h-12" style={{ backgroundColor: cfg.theme === 'dark' ? '#161615' : '#f2f2ec', backgroundImage: cfg.backgroundGradient || undefined }}>
                  <div className="flex h-full items-center justify-center"><span className="size-5 rounded-full" style={{ backgroundColor: cfg.accentColor }} /></div>
                </div>
                <p className="border-t px-2 py-1.5 text-xs font-medium">{t(`themePack${pack.charAt(0).toUpperCase()}${pack.slice(1)}`)}</p>
              </button>
            )
          })}
        </div>
      </section>
      <section>
        <p className="text-sm font-medium"><Palette className="mr-2 inline size-4 text-muted-foreground" />{t('accentColor')}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {accentPresets.map((color) => <button key={color} onClick={() => onChange({ ...draft, accentColor: color, colorThemePack: 'custom' })} aria-label={color} className={`size-10 rounded-full border-4 transition ${draft.accentColor === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: color }} />)}
          <label className="relative inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs text-muted-foreground" style={{ color: 'inherit' }}>
            <input type="color" value={draft.accentColor} onChange={(e) => onChange({ ...draft, accentColor: e.target.value, colorThemePack: 'custom' })} className="size-5 cursor-pointer appearance-none rounded-full border border-border p-0" aria-label={t('accentColor')} />
            <span>{draft.accentColor}</span>
          </label>
        </div>
      </section>
      <section>
        <p className="text-sm font-medium"><Zap className="mr-2 inline size-4 text-muted-foreground" />{t('theme')}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(['light', 'dark'] as const).map((theme) => <button key={theme} onClick={() => onChange({ ...draft, theme, colorThemePack: 'custom' })} className={`rounded-xl border px-4 py-3 text-left text-sm transition ${draft.theme === theme ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'}`}>{t(theme)}</button>)}
        </div>
      </section>
      <section>
        <p className="text-sm font-medium">{t('buttonStyle')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['solid', 'outline', 'ghost'] as const).map((style) => <button key={style} onClick={() => onChange({ ...draft, buttonStyle: style })} className={`rounded-full border px-4 py-2 text-sm transition ${draft.buttonStyle === style ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'}`} style={draft.buttonStyle === style ? { borderColor: draft.accentColor, color: draft.accentColor } : undefined}>{t(style)}</button>)}
        </div>
      </section>
      <section>
        <p className="text-sm font-medium">{t('spacing')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {densityPresets.map((density) => <button key={density} onClick={() => onChange({ ...draft, spacing: density })} className={`rounded-full border px-4 py-2 text-sm transition ${draft.spacing === density ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'}`}>{t(densityLabelKey[density])}</button>)}
        </div>
      </section>
      <section>
        <p className="text-sm font-medium">{t('cardRadius')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['lg', 'xl', '2xl', '3xl'] as const).map((radius) => <button key={radius} onClick={() => onChange({ ...draft, cardRadius: radius })} className={`rounded-lg border px-4 py-2 text-sm transition ${draft.cardRadius === radius ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'}`}>{t(radiusLabelKey[radius])}</button>)}
        </div>
        <div className="mt-3"><Toggle label={t('cardShadow')} checked={draft.cardShadow !== false} onChange={(v) => onChange({ ...draft, cardShadow: v })} /></div>
      </section>
      <section>
        <p className="text-sm font-medium"><Type className="mr-2 inline size-4 text-muted-foreground" />{t('fontStyle')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {fontStyles.map((font) => (
            <button
              key={font}
              type="button"
              onClick={() => onChange({ ...draft, fontStyle: font })}
              aria-pressed={draft.fontStyle === font}
              className={`rounded-xl border px-4 py-2 text-sm transition ${draft.fontStyle === font ? 'border-foreground bg-secondary font-semibold' : 'hover:border-foreground/40'}`}
              style={{ fontFamily: fontPreviewFamily[font] }}
            >
              {t(fontLabelKey[font])}
            </button>
          ))}
        </div>
      </section>
      <section>
        <p className="text-sm font-medium">{t('sections')}</p>
        <div className="mt-4 space-y-2">
          <Toggle label={t('showAvatar')} checked={draft.showAvatar} onChange={(v) => onChange({ ...draft, showAvatar: v })} />
          <Toggle label={t('showLinkIcons')} checked={draft.showLinkIcons !== false} onChange={(v) => onChange({ ...draft, showLinkIcons: v })} />
          <Toggle label={t('showBadge')} checked={draft.showBadge} onChange={(v) => onChange({ ...draft, showBadge: v })} />
          <Toggle label={t('showVerifiedBadge')} checked={draft.showVerifiedBadge} onChange={(v) => onChange({ ...draft, showVerifiedBadge: v })} />
        </div>
      </section>
      <section>
        <p className="text-sm font-medium">{t('coverImage')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('coverImageHint')}</p>
        <div className="mt-3 space-y-3">
          <input value={draft.coverImageURL || ''} onChange={(e) => onChange({ ...draft, coverImageURL: e.target.value.trim() })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="https://…" />
          {uid && <ImageUploader uid={uid} maxDimension={1920} value={draft.coverImageURL} shape="rect" aspect={0} onUploaded={(url) => onChange({ ...draft, coverImageURL: url })} onRemove={() => onChange({ ...draft, coverImageURL: '' })} />}
          {draft.coverImageURL && (
            <div className="mt-4 space-y-4 rounded-xl border bg-secondary/30 p-4">
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('coverImageHeight')}</span>
                  <span>{draft.coverImageHeight || 140}px</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={360}
                  step={10}
                  value={draft.coverImageHeight || 140}
                  onChange={(e) => onChange({ ...draft, coverImageHeight: Number(e.target.value) })}
                  className="mt-2 w-full"
                  aria-label={t('coverImageHeight')}
                />
              </div>
              <div>
                <span className="block text-xs font-medium text-muted-foreground">{t('coverImageFit')}</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(['cover', 'contain', 'fill'] as const).map((fit) => (
                    <button
                      key={fit}
                      type="button"
                      onClick={() => onChange({ ...draft, coverImageFit: fit })}
                      aria-pressed={(draft.coverImageFit || 'cover') === fit}
                      className={`rounded-full border px-3 py-1 text-xs transition ${(draft.coverImageFit || 'cover') === fit ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'}`}
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
          {(['circle', 'rounded', 'square'] as const).map((shape) => <button key={shape} onClick={() => onChange({ ...draft, avatarShape: shape })} className={`rounded-xl border px-4 py-2 text-sm capitalize transition ${draft.avatarShape === shape ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'}`}>{t(shape === 'circle' ? 'avatarCircle' : shape === 'rounded' ? 'avatarRounded' : 'avatarSquare')}</button>)}
        </div>
        <div className="mt-3"><Toggle label={t('avatarRing')} checked={draft.avatarRing} onChange={(v) => onChange({ ...draft, avatarRing: v })} /></div>
        <p className="mt-4 text-xs font-medium text-muted-foreground">{t('avatarAnimation')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {avatarAnimations.map((anim) => <button key={anim} onClick={() => onChange({ ...draft, avatarAnimation: anim })} className={`rounded-full border px-4 py-2 text-sm capitalize transition ${draft.avatarAnimation === anim ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'}`}>{t(`avatarAnim${anim.charAt(0).toUpperCase()}${anim.slice(1)}`)}</button>)}
        </div>
      </section>
      <section>
        <p className="text-sm font-medium">{t('socialStyle')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['outline', 'filled'] as const).map((style) => <button key={style} onClick={() => onChange({ ...draft, socialStyle: style })} className={`rounded-full border px-4 py-2 text-sm capitalize transition ${draft.socialStyle === style ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'}`}>{t(style === 'outline' ? 'socialOutline' : 'socialFilled')}</button>)}
        </div>
      </section>
      <section>
        <p className="text-sm font-medium">{t('pageBackground')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['default', 'gradient', 'pattern', 'image'] as const).map((style) => <button key={style} onClick={() => onChange({ ...draft, backgroundStyle: style })} className={`rounded-xl border px-4 py-2 text-sm capitalize transition ${draft.backgroundStyle === style ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'}`}>{t(`bg${style.charAt(0).toUpperCase() + style.slice(1)}`)}</button>)}
        </div>
        {draft.backgroundStyle === 'default' && (
          <label className="mt-3 flex items-center gap-3 rounded-xl border px-3 py-2 text-sm">
            <input type="color" value={draft.backgroundColor || '#f6f8fc'} onChange={(e) => onChange({ ...draft, backgroundColor: e.target.value })} className="size-6 cursor-pointer appearance-none rounded-full border border-border p-0" aria-label={t('customColor')} />
            <span>{t('customColor')}</span>
            {draft.backgroundColor && <button type="button" onClick={() => onChange({ ...draft, backgroundColor: '' })} className="ml-auto text-xs text-muted-foreground underline underline-offset-4">{t('bgDefault')}</button>}
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
                  className={`h-11 w-11 rounded-xl border transition ${draft.backgroundGradient === preset.value ? 'scale-105 border-foreground ring-2 ring-foreground/20' : 'hover:scale-105'}`}
                  style={{ backgroundImage: preset.value || `linear-gradient(160deg, ${draft.accentColor}66, transparent)` }}
                />
              ))}
            </div>
            <input value={draft.backgroundGradient || ''} onChange={(e) => onChange({ ...draft, backgroundGradient: e.target.value.trim() })} className="mt-3 w-full rounded-lg border bg-background px-3 py-2 text-xs" placeholder={t('gradientCustom')} aria-label={t('gradientCustom')} />
            <div className="mt-3"><Toggle label={t('backgroundAnimated')} checked={draft.backgroundAnimated} onChange={(v) => onChange({ ...draft, backgroundAnimated: v })} /></div>
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
                  className={`h-11 w-11 rounded-xl border bg-background transition ${(draft.backgroundPattern || 'dots') === pattern ? 'scale-105 border-foreground ring-2 ring-foreground/20' : 'hover:scale-105'}`}
                  style={patternStyle(pattern, draft.accentColor, draft.backgroundPatternDensity || 1, draft.backgroundPatternColor)}
                />
              ))}
            </div>
            <label className="mt-3 flex items-center gap-3 rounded-xl border px-3 py-2 text-sm">
              <input type="color" value={draft.backgroundPatternColor || draft.accentColor} onChange={(e) => onChange({ ...draft, backgroundPatternColor: e.target.value })} className="size-6 cursor-pointer appearance-none rounded-full border border-border p-0" aria-label={t('patternColor')} />
              <span>{t('patternColor')}</span>
              {draft.backgroundPatternColor && <button type="button" onClick={() => onChange({ ...draft, backgroundPatternColor: '' })} className="ml-auto text-xs text-muted-foreground underline underline-offset-4">{t('bgDefault')}</button>}
            </label>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{t('patternDensity')}</span><span>{(draft.backgroundPatternDensity || 1).toFixed(1)}×</span></div>
              <input type="range" min={0.4} max={2.5} step={0.1} value={draft.backgroundPatternDensity || 1} onChange={(e) => onChange({ ...draft, backgroundPatternDensity: Number(e.target.value) })} className="mt-2 w-full" aria-label={t('patternDensity')} />
            </div>
          </div>
        )}
        {draft.backgroundStyle === 'image' && (
          <div className="mt-3 space-y-3">
            <input value={draft.backgroundImageURL || ''} onChange={(e) => onChange({ ...draft, backgroundImageURL: e.target.value.trim() })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="https://…" />
            {uid && <ImageUploader uid={uid} maxDimension={1920} value={draft.backgroundImageURL} shape="rect" aspect={16 / 9} onUploaded={(url) => onChange({ ...draft, backgroundImageURL: url })} onRemove={() => onChange({ ...draft, backgroundImageURL: '' })} />}
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{t('backgroundOverlay')}</span><span>{Math.round((draft.backgroundOverlay || 0) * 100)}%</span></div>
              <input type="range" min={0} max={0.85} step={0.05} value={draft.backgroundOverlay || 0} onChange={(e) => onChange({ ...draft, backgroundOverlay: Number(e.target.value) })} className="mt-2 w-full" aria-label={t('backgroundOverlay')} />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function Onboarding() {
  const { t } = useI18n()
  const { profile, links, projects, persistProfile, persistLinks, persistProjects, uid } = useWorkspace()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Profile>(profile)
  const [draftLinks, setDraftLinks] = useState<LinkItem[]>(links)
  const [draftProjects, setDraftProjects] = useState<Project[]>(projects)
  const [busy, setBusy] = useState(false)
  const [finishError, setFinishError] = useState('')
  const steps = [
    { label: t('stepBasics'), hint: t('stepBasicsHint') },
    { label: t('stepAbout'), hint: t('stepAboutHint') },
    { label: t('stepLinks'), hint: t('stepLinksHint') },
    { label: t('stepProjects'), hint: t('stepProjectsHint') },
    { label: t('stepStyle'), hint: t('stepStyleHint') },
    { label: t('stepPrivacy'), hint: t('stepPrivacyHint') },
  ]
  const isLast = step === steps.length - 1
  const setField = (patch: Partial<Profile>) => setDraft({ ...draft, ...patch })
  // Onboarding has no saved username yet (profile.username starts empty for a new account),
  // so any non-empty handle here has to clear the same availability check as the editor
  // before "Launch" is allowed to write it.
  const usernameStatus = useUsernameStatus(draft.username, profile.username, uid)
  const usernameBlocksFinish = usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'short'
  async function finish() {
    if (usernameBlocksFinish) {
      setFinishError(usernameStatus === 'taken' ? t('usernameTaken') : usernameStatus === 'short' ? t('usernameTooShort') : t('usernameChecking'))
      return
    }
    setBusy(true); setFinishError('')
    try {
      await persistProfile({ ...draft, isPublic: draft.isPublic ?? true, onboarded: true })
      await persistLinks(draftLinks)
      await persistProjects(draftProjects)
    } catch (err: any) {
      setFinishError(String(err?.message || err).replace('Firebase: ', '') || t('somethingWrong'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t('workspace')}</p>
      <h2 className="mt-3 text-3xl font-medium tracking-[-0.05em] sm:text-4xl">{t('onboardingTitle')}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{t('onboardingSubtitle')}</p>
      <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">{steps.map((s, i) => (
        <div key={s.label} className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${i === step ? 'border-foreground bg-secondary font-medium' : i < step ? 'text-muted-foreground' : 'border-transparent text-muted-foreground/60'}`}><span className={`grid size-4 place-items-center rounded-full text-[10px] ${i < step ? 'bg-foreground text-background' : i === step ? 'bg-foreground/15' : ''}`}>{i < step ? <Check className="size-3" /> : i + 1}</span>{s.label}</div>
      ))}</div>
      <div className={`mt-6 grid gap-6 ${isLast ? '' : 'lg:grid-cols-[1fr_0.75fr]'}`}>
        <div className="rounded-2xl border bg-card p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{steps[step].label}</p>
          <p className="mt-2 text-sm text-muted-foreground">{steps[step].hint}</p>
          {step === 0 && (
            <div className="mt-6 space-y-4">
              <Field label={t('displayName')} value={draft.displayName} onChange={(v) => setField({ displayName: v })} />
              <Field label={t('username')} value={draft.username} prefix={`${siteHost}/`} onChange={(v) => setField({ username: v.toLowerCase().replace(/[^a-z0-9-]/g, '') })} note={<UsernameNote status={usernameStatus} />} invalid={usernameStatus === 'taken' || usernameStatus === 'short'} />
              <Field label={t('headline')} value={draft.headline} onChange={(v) => setField({ headline: v })} />
            </div>
          )}
          {step === 1 && (
            <div className="mt-6 space-y-4">
              <Field label={t('bio')} value={draft.bio} onChange={(v) => setField({ bio: v })} area />
              <Field label={t('website')} value={draft.website} onChange={(v) => setField({ website: v })} />
              <div className="block text-sm">
                <span>{t('profilePhoto')}</span>
                <div className="mt-2 flex items-center gap-4">
                  <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-sm font-medium">
                    {draft.photoURL ? <CardImg src={draft.photoURL} alt="" className="size-full rounded-full" /> : (draft.displayName || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="grid flex-1 gap-2">
                    <ImageUploader uid={uid} maxDimension={512} value={draft.photoURL} shape="circle" aspect={1} onUploaded={(url) => setField({ photoURL: url })} />
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer select-none">{t('orPasteUrl')}</summary>
                      <input value={draft.photoURL || ''} onChange={(e) => setField({ photoURL: e.target.value.trim() })} className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="https://…" />
                    </details>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t('photoFitHint')}</p>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="mt-6 space-y-3">
              {draftLinks.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center">
                  <button className="text-muted-foreground transition hover:text-destructive" onClick={() => { void deleteStoredImage(uid, item.imageURL); setDraftLinks(draftLinks.filter((x) => x.id !== item.id)) }} aria-label={t('deleteLink')}><Trash2 className="size-4" /></button>
                  <input value={item.title} onChange={(e) => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, title: e.target.value } : x))} className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm" placeholder={t('linkTitle')} />
                  <input value={item.url} onChange={(e) => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, url: e.target.value } : x))} className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm" placeholder="https://" />
                  <button onClick={() => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, visible: !x.visible } : x))} className={`rounded-full px-3 py-1 text-xs transition ${item.visible ? 'bg-secondary font-medium' : 'border text-muted-foreground'}`}>{item.visible ? t('visible') : t('hidden')}</button>
                </div>
              ))}
              <button onClick={() => setDraftLinks([...draftLinks, { id: crypto.randomUUID(), title: '', url: 'https://', visible: true }])} className="rounded-full border px-4 py-2 text-sm transition hover:border-foreground/40"><Plus className="mr-1 inline size-4" />{t('addLink')}</button>
            </div>
          )}
          {step === 3 && (
            <div className="mt-6 space-y-3">
              {draftProjects.map((item) => (
                <div key={item.id} className="rounded-xl border bg-background p-4">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">{t('project')}</p>
                    <button onClick={() => { void deleteStoredImage(uid, item.imageURL); setDraftProjects(draftProjects.filter((x) => x.id !== item.id)) }} aria-label={t('deleteProject')} className="text-muted-foreground transition hover:text-destructive"><Trash2 className="size-4" /></button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input value={item.title} onChange={(e) => setDraftProjects(draftProjects.map((x) => x.id === item.id ? { ...x, title: e.target.value } : x))} className="rounded-lg border bg-background px-3 py-2 text-sm" placeholder={t('projectTitle')} />
                    <input value={item.url} onChange={(e) => setDraftProjects(draftProjects.map((x) => x.id === item.id ? { ...x, url: e.target.value } : x))} className="rounded-lg border bg-background px-3 py-2 text-sm" placeholder={t('projectUrl')} />
                    <textarea value={item.description} onChange={(e) => setDraftProjects(draftProjects.map((x) => x.id === item.id ? { ...x, description: e.target.value } : x))} className="min-h-20 rounded-lg border bg-background px-3 py-2 text-sm md:col-span-2" placeholder={t('description')} />
                  </div>
                </div>
              ))}
              <button onClick={() => setDraftProjects([...draftProjects, { id: crypto.randomUUID(), title: '', description: '', url: 'https://', imageURL: '', technologies: [], visible: true }])} className="rounded-full border px-4 py-2 text-sm transition hover:border-foreground/40"><Plus className="mr-1 inline size-4" />{t('addProject')}</button>
            </div>
          )}
          {step === 4 && <div className="mt-6"><AppearanceControls draft={draft} onChange={setDraft} uid={uid} /></div>}
          {step === 5 && (
            <div className="mt-6">
              <div className="grid gap-3 md:grid-cols-2">
                <button onClick={() => setField({ isPublic: true })} className={`rounded-2xl border p-5 text-left transition ${draft.isPublic === false ? 'hover:border-foreground/40' : 'border-foreground bg-secondary'}`}><p className="text-sm font-medium">{t('publicProfile')}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{t('publicProfileText')}</p></button>
                <button onClick={() => setField({ isPublic: false })} className={`rounded-2xl border p-5 text-left transition ${draft.isPublic === false ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'}`}><p className="text-sm font-medium">{t('privateProfile')}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{t('privateProfileText')}</p></button>
              </div>
              <div className="mt-8 border-t pt-6"><LivePreview profile={draft} links={draftLinks.filter((i) => i.visible)} projects={draftProjects.filter((i) => i.visible)} /></div>
            </div>
          )}
          {finishError && <p role="alert" className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{finishError}</p>}
          <div className="mt-8 flex items-center justify-between">
            <button onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0} className="rounded-full border px-5 py-3 text-sm transition hover:border-foreground/40 disabled:opacity-40">{t('stepBack')}</button>
            {isLast ? <button onClick={finish} disabled={busy || usernameBlocksFinish} className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : t('stepLaunch')}<ArrowUpRight className="size-4" /></button> : <button onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))} className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">{t('stepNext')}<ArrowUpRight className="size-4" /></button>}
          </div>
        </div>
        {/* A live preview beside every step (not just the final privacy step) means the person
         sees their page take shape as they type, instead of filling out forms blind until the end. */}
        {!isLast && <div className="hidden lg:block lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:self-start"><LivePreview profile={draft} links={draftLinks.filter((i) => i.visible)} projects={draftProjects.filter((i) => i.visible)} /></div>}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, area, prefix, placeholder, note, invalid }: { label: string; value: string; onChange: (value: string) => void; area?: boolean; prefix?: string; placeholder?: string; note?: React.ReactNode; invalid?: boolean }) {
  return <label className="block text-sm">{label}<div className={`mt-2 flex ${invalid ? 'rounded-lg ring-1 ring-destructive' : ''}`}>{prefix && <span className="shrink-0 rounded-l-lg border border-r-0 bg-secondary px-3 py-2 text-xs text-muted-foreground">{prefix}</span>}{area ? <textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-28 w-full min-w-0 rounded-lg border bg-background px-3 py-2" /> : <input value={value} onChange={(e) => onChange(e.target.value)} className={`w-full min-w-0 rounded-lg border bg-background px-3 py-2 ${prefix ? 'rounded-l-none' : ''}`} placeholder={placeholder} />}</div>{note}</label>
}

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'short'

// Shared by the profile editor and the onboarding wizard — both let someone type a handle,
// and in both places it has to be checked against every other account's handle before it's
// safe to save, since pexiloq.com/<handle> only has room for one owner.
function useUsernameStatus(value: string, savedUsername: string, uid: string | null): UsernameStatus {
  const [status, setStatus] = useState<UsernameStatus>('idle')
  useEffect(() => {
    if (!value || value === savedUsername) { setStatus('idle'); return }
    if (value.length < 3) { setStatus('short'); return }
    let cancelled = false
    setStatus('checking')
    const handle = window.setTimeout(async () => {
      if (!uid || !firebaseEnabled) { if (!cancelled) setStatus('available'); return }
      try {
        const ok = await isUsernameAvailable(value, uid)
        if (!cancelled) setStatus(ok ? 'available' : 'taken')
      } catch { if (!cancelled) setStatus('available') }
    }, 450)
    return () => { cancelled = true; window.clearTimeout(handle) }
  }, [value, savedUsername, uid])
  return status
}

function UsernameNote({ status }: { status: UsernameStatus }) {
  const { t } = useI18n()
  if (status === 'idle') return null
  if (status === 'checking') return <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" />{t('usernameChecking')}</p>
  if (status === 'available') return <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600"><Check className="size-3" />{t('usernameAvailable')}</p>
  if (status === 'taken') return <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive"><CircleAlert className="size-3" />{t('usernameTaken')}</p>
  return <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive"><CircleAlert className="size-3" />{t('usernameTooShort')}</p>
}

const R2_MAX_BYTES = 10 * 1024 * 1024
const IMAGE_QUALITY = 0.82

// Fetches a fresh Firebase ID token for the signed-in user, if any. Sent alongside
// userId on every /api/upload request so the server can confirm the caller really
// is the account it claims to be acting as, rather than trusting the uid at face value.
async function getIdToken(): Promise<string | null> {
  try {
    return (await auth?.currentUser?.getIdToken()) || null
  } catch {
    return null
  }
}

// Best-effort cleanup: removes a previously uploaded image from R2 once it's no longer
// referenced anywhere (replaced by a new upload, removed by the user, or its owning link/
// project/account was deleted). Silently no-ops on externally hosted URLs or if the
// request fails, since a failed cleanup should never block the user's edit from saving.
async function deleteStoredImage(uid: string | null | undefined, url?: string | null) {
  if (!uid || !url) return
  try {
    const idToken = await getIdToken()
    await fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: uid, url, idToken }) })
  } catch { /* best effort */ }
}

// Deletes every image ever uploaded for this account. Called when the account itself is
// deleted so avatars, cover/background images, and link/project thumbnails don't linger
// in storage after the profile is gone. idToken must be captured *before* the Firebase Auth
// account is deleted (see SettingsPage.removeAccount) — once the account is gone there's no
// user left to mint a fresh token from.
async function purgeAllStoredImages(uid: string, idToken?: string | null) {
  try {
    await fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: uid, purgeAll: true, idToken }) })
  } catch { /* best effort */ }
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality))
}

async function compressImage(file: File, maxDimension: number): Promise<{ blob: Blob; type: string } | null> {
  const mime = file.type
  if (mime === 'image/svg+xml' || mime === 'image/gif' || mime === 'image/avif') return null
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return null
  }
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    if (w >= bitmap.width && h >= bitmap.height) return null
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, w, h)
    let best: { blob: Blob; type: string } | null = null
    for (const m of ['image/webp', 'image/jpeg']) {
      const blob = await canvasToBlob(canvas, m, IMAGE_QUALITY)
      if (blob && blob.type.startsWith('image/') && (!best || blob.size < best.blob.size)) best = { blob, type: m }
    }
    if (!best || best.blob.size >= file.size) return null
    return best
  } finally {
    bitmap.close()
  }
}

// File types that can't be safely re-drawn onto a canvas without losing what makes them
// useful (SVG stays vector, animated GIF would be flattened to one frame) — for these,
// uploads skip the crop step and go through as-is, same as the pre-existing behavior.
const UNCROPPABLE_TYPES = new Set(['image/svg+xml', 'image/gif', 'image/avif'])

type CropShape = 'circle' | 'rect'

// A focal-point picker for images, in the spirit of the avatar/cover-photo adjusters on
// X and Instagram: drag to reposition, slide to zoom, and the visible frame previews
// exactly what will be uploaded. Works purely in the source image's own pixel space, so
// the exported crop is full resolution regardless of how small the on-screen frame is.
function ImageCropModal({ file, shape, aspect = 1, maxDimension, title, onCancel, onConfirm }: {
  file: File
  shape: CropShape
  aspect?: number
  maxDimension: number
  title: string
  onCancel: () => void
  onConfirm: (blob: Blob, type: string) => void
}) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bitmapRef = useRef<ImageBitmap | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState(1)
  const [aspectPreset, setAspectPreset] = useState<number>(aspect || 0)
  const center = useRef({ x: 0, y: 0 })
  const dragState = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    createImageBitmap(file).then((bitmap) => {
      if (cancelled) { bitmap.close(); return }
      bitmapRef.current = bitmap
      center.current = { x: bitmap.width / 2, y: bitmap.height / 2 }
      setReady(true)
    }).catch(() => { if (!cancelled) setError(t('uploadFailed')) })
    return () => { cancelled = true; bitmapRef.current?.close() }
  }, [file])

  const effectiveAspect = shape === 'circle'
    ? 1
    : aspectPreset > 0
      ? aspectPreset
      : bitmapRef.current
        ? bitmapRef.current.width / bitmapRef.current.height
        : 1

  const frameW = 320
  const frameH = shape === 'circle' ? 320 : Math.min(320, Math.max(80, Math.round(320 / effectiveAspect)))

  function minScale() {
    const bitmap = bitmapRef.current
    if (!bitmap) return 1
    return Math.max(frameW / bitmap.width, frameH / bitmap.height)
  }

  function sourceRect() {
    const bitmap = bitmapRef.current
    if (!bitmap) return { sx: 0, sy: 0, sw: 1, sh: 1 }
    const scale = minScale() * zoom
    const sw = Math.min(bitmap.width, frameW / scale)
    const sh = Math.min(bitmap.height, frameH / scale)
    const sx = Math.min(Math.max(center.current.x - sw / 2, 0), bitmap.width - sw)
    const sy = Math.min(Math.max(center.current.y - sh / 2, 0), bitmap.height - sh)
    return { sx, sy, sw, sh }
  }

  function draw() {
    const canvas = canvasRef.current
    const bitmap = bitmapRef.current
    if (!canvas || !bitmap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { sx, sy, sw, sh } = sourceRect()
    ctx.clearRect(0, 0, frameW, frameH)
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, frameW, frameH)
  }

  useEffect(() => { if (ready) draw() }, [ready, zoom, aspectPreset])

  function panBy(dx: number, dy: number) {
    const bitmap = bitmapRef.current
    if (!bitmap) return
    const { sw, sh } = sourceRect()
    center.current = {
      x: Math.min(Math.max(center.current.x - dx * (sw / frameW), sw / 2), bitmap.width - sw / 2),
      y: Math.min(Math.max(center.current.y - dy * (sh / frameH), sh / 2), bitmap.height - sh / 2),
    }
    draw()
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    dragState.current = { x: e.clientX, y: e.clientY }
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.x
    const dy = e.clientY - dragState.current.y
    dragState.current = { x: e.clientX, y: e.clientY }
    panBy(dx, dy)
  }
  function onPointerUp() { dragState.current = null }

  async function confirm() {
    const bitmap = bitmapRef.current
    if (!bitmap) return
    setBusy(true)
    setError('')
    try {
      const { sx, sy, sw, sh } = sourceRect()
      let outW = maxDimension
      let outH = Math.round(maxDimension / effectiveAspect)
      if (shape !== 'circle' && (aspect <= 0 || aspectPreset === 0)) {
        const scale = Math.min(1, maxDimension / Math.max(sw, sh))
        outW = Math.max(1, Math.round(sw * scale))
        outH = Math.max(1, Math.round(sh * scale))
      }
      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas unavailable')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, outW, outH)
      let best: { blob: Blob; type: string } | null = null
      for (const m of ['image/webp', 'image/jpeg']) {
        const blob = await canvasToBlob(canvas, m, IMAGE_QUALITY)
        if (blob && (!best || blob.size < best.blob.size)) best = { blob, type: m }
      }
      if (!best) throw new Error('export failed')
      onConfirm(best.blob, best.type)
    } catch {
      setError(t('uploadFailed'))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('cropHint')}</p>
        <div className="mt-4 flex justify-center">
          <canvas
            ref={canvasRef}
            width={frameW}
            height={frameH}
            className={`touch-none bg-secondary ${shape === 'circle' ? 'rounded-full' : 'rounded-xl'}`}
            style={{ width: frameW, height: frameH, cursor: ready ? 'grab' : 'default' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            disabled={!ready}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
            aria-label={t('cropZoom')}
          />
        </div>
        {shape === 'rect' && aspect <= 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs">
            {([
              { label: t('aspectFree'), value: 0 },
              { label: '3:1', value: 3 },
              { label: '16:9', value: 16 / 9 },
              { label: '4:3', value: 4 / 3 },
              { label: '1:1', value: 1 },
            ] as const).map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setAspectPreset(opt.value)}
                className={`rounded-full border px-2.5 py-1 transition ${aspectPreset === opt.value ? 'border-foreground bg-secondary font-medium' : 'text-muted-foreground hover:border-foreground/40'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        {error && <p role="alert" className="mt-3 flex items-center gap-1.5 text-xs text-destructive"><CircleAlert className="size-3.5" />{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-full border px-5 py-2.5 text-sm transition hover:border-foreground/40 disabled:opacity-40">{t('cancel')}</button>
          <button type="button" onClick={confirm} disabled={!ready || busy} className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : null}{t('cropApply')}</button>
        </div>
      </div>
    </div>
  )
}

function ImageUploader({ uid, onUploaded, label, accept = 'image/*', className = '', maxDimension = 1600, value, shape = 'rect', aspect = 1, onRemove }: { uid: string | null; onUploaded: (url: string) => void; label?: string; accept?: string; className?: string; maxDimension?: number; value?: string; shape?: CropShape; aspect?: number; onRemove?: () => void }) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState<'compress' | 'upload'>('upload')
  const [error, setError] = useState('')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  async function upload(uploadFile: Blob, contentType: string) {
    setBusy(true)
    setError('')
    try {
      setPhase('upload')
      const idToken = await getIdToken()
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, contentType, size: uploadFile.size, idToken }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'upload error')
      const put = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' }, body: uploadFile })
      if (!put.ok) throw new Error('upload error')
      onUploaded(data.publicUrl)
      // The new image is live — the previous one (if any) is now orphaned, so remove it
      // from R2 rather than leaving it to accumulate storage costs forever.
      if (value && value !== data.publicUrl) void deleteStoredImage(uid, value)
    } catch {
      setError(t('uploadFailed'))
    } finally {
      setBusy(false)
      setPhase('upload')
      if (inputRef.current) inputRef.current.value = ''
    }
  }
  async function handleFile(file: File) {
    setError('')
    if (!file.type.startsWith('image/')) { setError(t('uploadFailed')); return }
    if (file.size > R2_MAX_BYTES) { setError(t('fileTooLarge')); return }
    if (UNCROPPABLE_TYPES.has(file.type)) {
      setBusy(true)
      setPhase('compress')
      const compressed = await compressImage(file, maxDimension)
      await upload(compressed?.blob ?? file, compressed?.type ?? file.type)
      return
    }
    // Raster formats open the crop tool so the person can pick exactly what's shown,
    // the same reposition-before-you-post step X and Instagram use for avatars/covers.
    setCropFile(file)
  }
  function removeImage() {
    if (onRemove) onRemove()
    else onUploaded('')
    void deleteStoredImage(uid, value)
  }
  const busyLabel = busy ? (phase === 'compress' ? t('compressing') : t('uploading')) : (label ?? t('uploadImage'))
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <label
        onDragOver={(e) => { e.preventDefault(); if (!busy) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (busy) return
          const f = e.dataTransfer.files?.[0]
          if (f) void handleFile(f)
        }}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition hover:border-foreground/40 ${busy ? 'pointer-events-none opacity-60' : ''} ${dragOver ? 'border-foreground bg-secondary ring-2 ring-foreground/15' : ''}`}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {dragOver ? t('dropToUpload') : busyLabel}
        <input ref={inputRef} type="file" accept={accept} className="sr-only" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }} />
      </label>
      {value && (
        <button type="button" onClick={removeImage} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs text-muted-foreground transition hover:border-destructive/50 hover:text-destructive disabled:opacity-40">
          <X className="size-3.5" />{t('removeImage')}
        </button>
      )}
      {error && <p role="alert" className="flex w-full items-center gap-1.5 text-xs text-destructive"><CircleAlert className="size-3.5" />{error}</p>}
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          shape={shape}
          aspect={aspect}
          maxDimension={maxDimension}
          title={label ?? t('uploadImage')}
          onCancel={() => { setCropFile(null); if (inputRef.current) inputRef.current.value = '' }}
          onConfirm={(blob, type) => { setCropFile(null); void upload(blob, type) }}
        />
      )}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${checked ? 'border-foreground bg-secondary' : 'hover:border-foreground/40'}`}><span>{label}</span><span className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${checked ? 'bg-foreground' : 'bg-border'}`}><span className={`inline-block size-4 rounded-full bg-background shadow transition ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} /></span></button>
}

function PreviewNote() {
  const { t } = useI18n()
  return <p className="mb-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">{t('preview')}</p>
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({ width: el.offsetWidth, height: el.offsetHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, ...size }
}

// Real device widths the profile page is authored at (roughly an iPhone's CSS viewport for
// "phone", and a common laptop/desktop browser viewport for "desktop"). Content is measured and
// scaled to fit the frame rather than reflowing, so the preview always wraps text and triggers
// the same responsive (sm:/md:) rules that a real visitor's device would — including desktop-only
// layout differences that a phone-width preview could never reveal.
const PHONE_CONTENT_WIDTH = 390
const DESKTOP_CONTENT_WIDTH = 1280

export type PreviewDevice = 'phone' | 'desktop'

export function PhonePreviewFrame({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const { ref: screenRef, width: screenWidth } = useElementSize<HTMLDivElement>()
  const { ref: contentRef, height: contentHeight } = useElementSize<HTMLDivElement>()
  const scale = screenWidth > 0 ? screenWidth / PHONE_CONTENT_WIDTH : 1
  const skin = profile.theme === 'dark' ? 'bg-[#20221f] text-[#f5f5f2]' : 'bg-background text-foreground'
  return (
    <div className="pexiloq-phone-frame">
      <div className="pexiloq-phone-shell">
        <div className="pexiloq-phone-screen" ref={screenRef}>
          <div className="pexiloq-phone-scroll">
            <div style={{ position: 'relative', height: contentHeight ? contentHeight * scale : undefined }}>
              <div ref={contentRef} style={{ position: 'absolute', top: 0, left: 0, width: PHONE_CONTENT_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <PageBackground profile={profile} className={`min-h-[844px] px-5 py-8 ${skin}`}>
                  {children}
                </PageBackground>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DesktopPreviewFrame({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const { ref: screenRef, width: screenWidth } = useElementSize<HTMLDivElement>()
  const { ref: contentRef, height: contentHeight } = useElementSize<HTMLDivElement>()
  const scale = screenWidth > 0 ? screenWidth / DESKTOP_CONTENT_WIDTH : 1
  const skin = profile.theme === 'dark' ? 'bg-[#20221f] text-[#f5f5f2]' : 'bg-background text-foreground'
  const url = `${siteHost}/${profile.username || ''}`
  return (
    <div className="pexiloq-desktop-frame">
      <div className="pexiloq-desktop-shell">
        <div className="pexiloq-desktop-bar">
          <span className="pexiloq-desktop-dot" /><span className="pexiloq-desktop-dot" /><span className="pexiloq-desktop-dot" />
          <span className="pexiloq-desktop-url">{url}</span>
        </div>
        <div className="pexiloq-desktop-screen" ref={screenRef}>
          <div className="pexiloq-desktop-scroll">
            <div style={{ position: 'relative', height: contentHeight ? contentHeight * scale : undefined }}>
              <div ref={contentRef} style={{ position: 'absolute', top: 0, left: 0, width: DESKTOP_CONTENT_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <PageBackground profile={profile} className={`min-h-[800px] px-5 py-10 ${skin}`}>
                  {children}
                </PageBackground>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeviceToggle({ device, onChange }: { device: PreviewDevice; onChange: (device: PreviewDevice) => void }) {
  const { t } = useI18n()
  return (
    <div className="pexiloq-device-toggle shadow-xs" role="group" aria-label={t('preview')}>
      <button type="button" aria-pressed={device === 'phone'} onClick={() => onChange('phone')} className="flex items-center gap-1.5"><Smartphone className="size-3.5" /><span>{t('previewPhone')}</span></button>
      <button type="button" aria-pressed={device === 'desktop'} onClick={() => onChange('desktop')} className="flex items-center gap-1.5"><Monitor className="size-3.5" /><span>{t('previewDesktop')}</span></button>
    </div>
  )
}

function ProfilePageContent({ profile, links, projects, onTrack, ctaHref = '/signup' }: { profile: Profile; links: LinkItem[]; projects: Project[]; onTrack?: CardTrack; ctaHref?: string }) {
  const { t } = useI18n()
  const chromePill = profile.theme === 'dark'
    ? 'border-white/15 bg-white/5 text-[#f5f5f2] hover:bg-white/10'
    : 'border-border bg-card/80 backdrop-blur-sm hover:bg-card'
  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Logo />
        <Link href={ctaHref} className={`inline-flex items-center whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium transition ${chromePill}`}>
          {t('createYours')} <ArrowUpRight className="ml-1 inline size-3" />
        </Link>
      </div>
      <div className="mt-8 sm:mt-10"><ProfileCard profile={profile} links={links} projects={projects} onTrack={onTrack} /></div>
    </div>
  )
}

// Single entry point for every live-preview surface in the workspace (overview, profile editor,
// appearance editor, onboarding). Keeping the device toggle + frame selection in one place means
// every preview behaves identically and stays correct if the preview mechanics ever change.
function LivePreview({ profile, links, projects, note = true }: { profile: Profile; links: LinkItem[]; projects: Project[]; note?: boolean }) {
  const [device, setDevice] = useState<PreviewDevice>('phone')
  return (
    <div>
      {/* The parent panel is itself sticky with its own max-height + overflow-y-auto (so a
         preview taller than the viewport scrolls independently of the form on the left). That
         means this row needs its own `sticky top-0` — without it, scrolling that inner panel
         carries the toggle out of view along with the frame, leaving no way to switch device
         mid-scroll. Pinning it to the top of its own scroll container, with a background so the
         frame doesn't show through underneath it, keeps it reachable at all times. */}
      <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center justify-between gap-3 bg-background/95 py-1 backdrop-blur-sm">
        {note ? <PreviewNote /> : <span />}
        <DeviceToggle device={device} onChange={setDevice} />
      </div>
      {device === 'phone' ? (
        <PhonePreviewFrame profile={profile}><ProfilePageContent profile={profile} links={links} projects={projects} /></PhonePreviewFrame>
      ) : (
        <DesktopPreviewFrame profile={profile}><ProfilePageContent profile={profile} links={links} projects={projects} /></DesktopPreviewFrame>
      )}
    </div>
  )
}

function PageBackground({ profile, className, children }: { profile: Profile; className?: string; children: React.ReactNode }) {
  const animated = profile.backgroundStyle === 'gradient' && profile.backgroundAnimated
  const overlay = profile.backgroundStyle === 'image' && profile.backgroundImageURL && profile.backgroundOverlay > 0
  return (
    <div className={`relative ${className || ''} ${animated ? 'pexiloq-animated-gradient' : ''}`} style={pageBackgroundStyle(profile)}>
      {overlay && <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: profile.theme === 'dark' ? '#000000' : '#ffffff', opacity: Math.min(Math.max(profile.backgroundOverlay, 0), 1) }} />}
      <div className="relative">{children}</div>
    </div>
  )
}

export function SettingsPage() {
  const { profile, links, projects, persistProfile } = useWorkspace()
  const { t } = useI18n()
  const router = useRouter()
  const [notice, setNotice] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportNotice, setExportNotice] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [needReauth, setNeedReauth] = useState(false)
  const [reauthPassword, setReauthPassword] = useState('')
  const [r2, setR2] = useState<{ configured: boolean; maxBytes: number } | null>(null)
  useEffect(() => { fetch('/api/upload').then((res) => res.json()).then(setR2).catch(() => setR2(null)) }, [])
  async function removeAccount() {
    const user = auth?.currentUser
    if (!user) { router.push('/'); return }
    const uidToPurge = user.uid
    // Must grab the token before deleteUser() below signs the account out —
    // afterwards there's no user left to mint a fresh ID token from.
    const idToken = await getIdToken()
    await deleteUser(user)
    try { await deleteAccount(uidToPurge) } catch { /* account gone; best effort cleanup */ }
    // Also clear out every avatar/cover/background/link/project image ever uploaded for
    // this account so nothing is left behind in R2 once the profile itself is gone.
    void purgeAllStoredImages(uidToPurge, idToken)
    router.push('/')
  }
  async function confirmDelete() {
    setBusy(true); setError('')
    try {
      await removeAccount()
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') setNeedReauth(true)
      else setError(String(err?.message || err).replace('Firebase: ', '') || t('somethingWrong'))
      setBusy(false)
    }
  }
  async function submitReauth(e?: React.FormEvent) {
    e?.preventDefault(); setBusy(true); setError('')
    const user = auth?.currentUser
    if (!user) { router.push('/'); return }
    try {
      if (isGoogle) await reauthenticateWithPopup(user, new GoogleAuthProvider())
      else await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email || '', reauthPassword))
      await removeAccount()
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') { setBusy(false); return }
      setError(String(err?.message || err).replace('Firebase: ', '') || t('somethingWrong'))
      setBusy(false)
    }
  }
  const isGoogle = auth?.currentUser?.providerData.some((p) => p.providerId === 'google.com') ?? false
  const resetDelete = () => { setConfirming(false); setConfirmText(''); setError(''); setNeedReauth(false); setReauthPassword('') }
  function markExported() { setExporting(false); setExportNotice(t('exported')); window.setTimeout(() => setExportNotice(''), 2500) }
  function exportJson() {
    const payload = { exportedAt: new Date().toISOString(), app: 'Pexiloq', profile, links, projects }
    downloadTextFile(`${profile.username || 'my-profile'}-pexiloq.json`, JSON.stringify(payload, null, 2), 'application/json')
    markExported()
  }
  function exportMarkdown() {
    const lines: string[] = ['# Pexiloq export', '', `**Display name:** ${profile.displayName}`, `**Username:** ${profile.username}`]
    if (profile.headline) lines.push(`**Headline:** ${profile.headline}`)
    if (profile.bio) lines.push(`**Bio:** ${profile.bio}`)
    if (profile.website) lines.push(`**Website:** ${profile.website}`)
    lines.push('')
    const socialRows = socialPlatforms.filter((p) => profile.socials?.[p])
    if (socialRows.length) {
      lines.push('## Socials', '')
      socialRows.forEach((p) => lines.push(`- ${socialMeta[p].label}: ${profile.socials![p]}`))
      lines.push('')
    }
    const visibleLinks = links.filter((l) => l.visible)
    if (visibleLinks.length) {
      lines.push('## Links', '')
      visibleLinks.forEach((l) => lines.push(`- [${l.title}](${l.url}${l.subtitle ? ` "${l.subtitle}"` : ''})`))
      lines.push('')
    }
    const visibleProjects = projects.filter((p) => p.visible)
    if (visibleProjects.length) {
      lines.push('## Projects', '')
      visibleProjects.forEach((p) => {
        lines.push(`### ${p.title}`, '')
        if (p.description) lines.push(p.description, '')
        if (p.url) lines.push(`Link: ${p.url}`)
        if (Array.isArray(p.technologies) && p.technologies.length) lines.push(`Technologies: ${p.technologies.join(', ')}`)
        lines.push('')
      })
    }
    downloadTextFile(`${profile.username || 'my-profile'}-pexiloq.md`, lines.join('\n'), 'text/markdown')
    markExported()
  }
  return (
    <>
      <PageHeader eyebrow={t('accountLabel')} title={t('settings')} description={t('settingsDesc')} />
      <div className="max-w-2xl rounded-2xl border bg-card p-6">
        <p className="text-sm font-medium">{t('publicUrl')}</p>
        <p className="mt-2 text-sm text-muted-foreground">{siteHost}/{profile.username}</p>
        <div className="my-8 border-t" />
        <p className="text-sm font-medium">{t('stepPrivacy')}</p>
        <p className="mt-2 text-sm text-muted-foreground">{profile.isPublic === false ? t('privateProfileText') : t('publicProfileText')}</p>
        <div className="mt-4"><Toggle label={t('publicProfile')} checked={profile.isPublic !== false} onChange={(v) => { setSaving(true); void persistProfile({ ...profile, isPublic: v }).finally(() => setSaving(false)) }} /></div>
        {saving && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" />{t('saving')}</p>}
        <div className="my-8 border-t" />
        <p className="text-sm font-medium">{t('firebaseConnection')}</p>
        <p className="mt-2 text-sm text-muted-foreground">{firebaseEnabled ? t('firebaseConnected') : t('firebasePreview')}</p>
        {!firebaseEnabled && <pre className="mt-4 overflow-auto rounded-xl bg-secondary p-4 text-xs">NEXT_PUBLIC_FIREBASE_API_KEY=...</pre>}
        <div className="my-8 border-t" />
        <p className="text-sm font-medium">{t('imageStorage')}</p>
        <p className="mt-2 text-sm text-muted-foreground">{r2 === null ? '…' : r2.configured ? t('r2Ready') : t('r2Missing')}</p>
        {r2 !== null && !r2.configured && <pre className="mt-4 overflow-auto rounded-xl bg-secondary p-4 text-xs">R2_ACCOUNT_ID=…<br />R2_ACCESS_KEY_ID=…<br />R2_SECRET_ACCESS_KEY=…<br />R2_BUCKET=…<br />R2_PUBLIC_URL=…</pre>}
        <button onClick={() => { setSaving(true); void persistProfile(profile).finally(() => { setSaving(false); setNotice(t('saved')) }) }} disabled={saving} className="mt-8 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-60">{saving ? <><Loader2 className="mr-2 inline size-4 animate-spin" />{t('saving')}</> : notice || t('saveSettings')}</button>
      </div>
      <div className="mt-8 max-w-2xl rounded-2xl border bg-card p-6">
        <p className="text-sm font-medium">{t('exportData')}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t('exportDataDesc')}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={() => { setExporting(true); exportJson() }} disabled={exporting} className="rounded-full border px-5 py-3 text-sm transition hover:border-foreground/40 disabled:opacity-60">{t('downloadJson')}</button>
          <button onClick={() => { setExporting(true); exportMarkdown() }} disabled={exporting} className="rounded-full border px-5 py-3 text-sm transition hover:border-foreground/40 disabled:opacity-60">{t('downloadMarkdown')}</button>
          {exportNotice && <span role="status" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Check className="size-3.5" />{exportNotice}</span>}
        </div>
      </div>
      <div className="mt-8 max-w-2xl rounded-2xl border border-destructive/40 bg-card p-6">
        <p className="text-sm font-medium text-destructive">{t('dangerZone')}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t('deleteAccountDesc')}</p>
        <p className="mt-1 text-xs text-destructive/80">{t('deleteWarning')}</p>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="mt-4 rounded-full border border-destructive/40 px-5 py-3 text-sm text-destructive transition hover:bg-destructive/10">{t('deleteAccount')}</button>
        ) : (
          <div className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
            {needReauth ? (
              <form onSubmit={submitReauth} className="space-y-3">
                <p className="text-sm text-destructive">{t('reauthTitle')}</p>
                <p className="text-xs text-muted-foreground">{auth?.currentUser?.email || ''}</p>
                {!isGoogle && <input required type="password" value={reauthPassword} onChange={(e) => setReauthPassword(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder={t('password')} autoFocus />}
                {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
                <div className="flex flex-wrap gap-3">
                  <button type="submit" disabled={busy || (!isGoogle && !reauthPassword)} className="rounded-full bg-destructive px-5 py-3 text-sm font-medium text-white disabled:opacity-40">{busy ? t('wait') : isGoogle ? t('reauthGoogle') : t('reauthSubmit')}</button>
                  <button type="button" onClick={resetDelete} disabled={busy} className="rounded-full border px-5 py-3 text-sm transition hover:border-foreground/40 disabled:opacity-40">{t('cancel')}</button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-sm text-destructive">{t('typeToConfirm')}</p>
                <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="mt-3 w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="DELETE" />
                {error && <p className="mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={confirmDelete} disabled={confirmText.trim() !== 'DELETE' || busy} className="rounded-full bg-destructive px-5 py-3 text-sm font-medium text-white disabled:opacity-40">{busy ? t('wait') : t('confirmDelete')}</button>
                  <button onClick={resetDelete} disabled={busy} className="rounded-full border px-5 py-3 text-sm transition hover:border-foreground/40 disabled:opacity-40">{t('cancel')}</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// Public-profile data rarely changes second-to-second, but the page can be opened repeatedly
// by the same visitor (reloads, re-opening the link, multiple tabs). Caching the fetched bundle
// in the browser for a short window avoids re-reading Firestore for those repeat opens — on a
// Firebase Spark (free) plan every read counts against a small daily quota, so cutting repeat
// reads from the same visitor matters a lot under real traffic.
const PUBLIC_PROFILE_CACHE_MS = 60_000
function readPublicProfileCache(username: string) {
  try {
    const raw = window.localStorage.getItem(`pxl_pub_${username}`)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > PUBLIC_PROFILE_CACHE_MS) return null
    return data as { profile: Profile; links: LinkItem[]; projects: Project[] }
  } catch { return null }
}
function writePublicProfileCache(username: string, data: unknown) {
  try { window.localStorage.setItem(`pxl_pub_${username}`, JSON.stringify({ data, ts: Date.now() })) } catch { /* storage full/blocked, skip caching */ }
}

// A page view only needs to be recorded once per visitor per visit, not once per reload. This
// dedupes writes across reloads/re-opens within a window, instead of only within one component
// mount, cutting down repeat analytics writes for the same visitor.
const VIEW_DEDUPE_MS = 30 * 60 * 1000
function shouldRecordView(uid: string) {
  try {
    const key = `pxl_view_${uid}`
    const last = Number(window.localStorage.getItem(key) || 0)
    if (Date.now() - last < VIEW_DEDUPE_MS) return false
    window.localStorage.setItem(key, String(Date.now()))
    return true
  } catch { return true }
}

export function PublicProfile({ username }: { username?: string }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [data, setData] = useState<{ profile: Profile; links: LinkItem[]; projects: Project[] } | null | 'missing'>(null)
  const viewRecorded = useRef<string | null>(null)
  const lastClick = useRef<string | null>(null)
  useEffect(() => {
    let live = true
    async function load() {
      if (!username || !firebaseEnabled) { setData('missing'); return }
      const cached = readPublicProfileCache(username)
      if (cached) { setData(cached); return }
      try {
        const bundle = await loadPublicBundle(username)
        if (!live) return
        if (!bundle) { setData('missing'); return }
        const p = bundle.profile as Profile
        const result = { profile: { ...normalizeProfile(p), isPublic: p.isPublic !== false }, links: bundle.links as LinkItem[], projects: bundle.projects as Project[] }
        setData(result)
        writePublicProfileCache(username, result)
      } catch { if (live) setData('missing') }
    }
    void load()
    return () => { live = false }
  }, [username])
  const skin = data !== null && data !== 'missing' ? data.profile.theme === 'dark' ? 'bg-[#20221f] text-[#f5f5f2]' : 'bg-background text-foreground' : 'bg-background text-foreground'
  const pageStyle: React.CSSProperties | undefined = data !== null && data !== 'missing' ? pageBackgroundStyle(data.profile) : undefined
  const animated = data !== null && data !== 'missing' && data.profile.backgroundStyle === 'gradient' && data.profile.backgroundAnimated
  const overlay = Boolean(data !== null && data !== 'missing' && data.profile.backgroundStyle === 'image' && data.profile.backgroundImageURL && data.profile.backgroundOverlay > 0)
  const pageUid = data !== null && data !== 'missing' ? data.profile.uid : null
  // The signed-in visitor might be the profile's own owner — checking their own live page from
  // the workspace ("Share" / "View live"), scanning their own QR code, or clicking their own
  // links to test them. None of that is a real visitor, so it must never inflate their own
  // analytics.
  const isOwnerViewing = Boolean(user && pageUid && user.uid === pageUid)
  // Only a genuinely public profile page counts as a "view" — a private profile shows nothing
  // but a locked notice, so opening it (by the owner previewing their own link, a stale bookmark,
  // etc.) must never be recorded as a visitor view.
  const isPublicProfile = data !== null && data !== 'missing' && data.profile.isPublic !== false
  useEffect(() => {
    if (pageUid && isPublicProfile && !isOwnerViewing && viewRecorded.current !== pageUid && shouldRecordView(pageUid)) { viewRecorded.current = pageUid; void recordAnalytics(pageUid, 'views') }
  }, [pageUid, isPublicProfile, isOwnerViewing])
  if (data === null) return <LoadingScreen />
  const track = (type: 'links' | 'projects' | 'socials', key: string) => {
    if (!pageUid || isOwnerViewing) return
    const fingerprint = `${type}:${key}`
    if (lastClick.current === fingerprint) return // guards against duplicate fires (e.g. double-click/bubbled events)
    lastClick.current = fingerprint
    window.setTimeout(() => { if (lastClick.current === fingerprint) lastClick.current = null }, 2000)
    void recordAnalytics(pageUid, type, key)
  }
  const loaded = data !== 'missing' ? data : null
  const pageDark = loaded ? loaded.profile.theme === 'dark' : false
  const noticeCard = pageDark ? 'border-white/10 bg-white/5' : 'border-border bg-card'
  const noticeSub = pageDark ? 'text-[#adb1a9]' : 'text-muted-foreground'
  return (
    <main className={`relative min-h-screen px-5 py-8 sm:py-10 ${skin} ${animated ? 'pexiloq-animated-gradient' : ''}`} style={pageStyle}>
      {overlay && loaded && <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: loaded.profile.theme === 'dark' ? '#000000' : '#ffffff', opacity: Math.min(Math.max(loaded.profile.backgroundOverlay, 0), 1) }} />}
      <div className="relative mx-auto max-w-2xl">
        {data === 'missing' && (
          <div className={`mt-16 rounded-2xl border p-10 text-center ${noticeCard}`}>
            <p className="text-lg font-medium">{t('notFound')}</p>
          </div>
        )}
        {loaded && !loaded.profile.isPublic && (
          <div className={`mt-16 rounded-2xl border p-10 text-center ${noticeCard}`}>
            <p className="text-lg font-medium">{t('privateNotice')}</p>
            <p className={`mt-2 text-sm ${noticeSub}`}>{t('privateProfileText')}</p>
            <Link href={user ? '/dashboard' : '/signup'} className="mt-6 inline-flex items-center gap-1 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90">{t('publishNow')} <ArrowUpRight className="size-4" /></Link>
          </div>
        )}
        {loaded && loaded.profile.isPublic && (
          <ProfilePageContent profile={loaded.profile} links={loaded.links} projects={loaded.projects} onTrack={track} ctaHref={user ? '/dashboard' : '/signup'} />
        )}
      </div>
    </main>
  )
}