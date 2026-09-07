'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, CircleAlert, Copy, ExternalLink, Eye, GripVertical, Layers, Link2, Loader2, LogOut, Menu, Monitor, Palette, Plus, Save, Settings, Smartphone, Trash2, Type, Upload, UserRound, X, ZoomIn, Zap } from 'lucide-react'
import { auth, deleteAccount, firebaseEnabled, loadAnalytics, loadPublicBundle, loadUserBundle, recordAnalytics, saveItems, saveProfile } from '@/lib/firebase'
import { LanguageSwitcher, useI18n } from '@/components/i18n-provider'
import { deleteUser, EmailAuthProvider, GoogleAuthProvider, onAuthStateChanged, reauthenticateWithCredential, reauthenticateWithPopup, signOut } from 'firebase/auth'

export type LinkDisplayStyle = 'default' | 'large' | 'thumbnail' | 'text'
export type LinkItem = { id: string; title: string; url: string; visible: boolean; icon?: string; imageURL?: string; bgColor?: string; iconColor?: string; displayStyle?: LinkDisplayStyle }
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
export type LayoutTemplate = 'classic' | 'grid' | 'magazine' | 'card'
export const layoutTemplates: LayoutTemplate[] = ['classic', 'grid', 'magazine', 'card']
export type SectionKind = 'links' | 'projects'
export const defaultSectionOrder: SectionKind[] = ['links', 'projects']
export type ColorThemePack = 'custom' | 'minimal' | 'neon' | 'pastel' | 'darkLuxury'
export const colorThemePacks: ColorThemePack[] = ['custom', 'minimal', 'neon', 'pastel', 'darkLuxury']
export type AvatarAnimation = 'none' | 'pulse' | 'spin' | 'glow'
export const avatarAnimations: AvatarAnimation[] = ['none', 'pulse', 'spin', 'glow']
export const fontStyles: FontStyle[] = ['sans', 'serif', 'mono', 'display', 'rounded', 'elegant']
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
  coverImageURL: '', showVerifiedBadge: false, avatarAnimation: 'none',
}

// Ensures profiles saved before layoutTemplate/sectionOrder existed still render correctly.
function normalizeProfile(p: Partial<Profile>): Profile {
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
  return merged
}

type TemplateBundle = { profile: Profile; links: LinkItem[]; projects: Project[] }
function makeTemplate(headline: string, bio: string, links: [string, string, string], projects: { title: string; description: string; tech: [string, string] }[]): TemplateBundle {
  const urls = ['https://medium.com', 'https://youtube.com', 'https://instagram.com']
  return {
    profile: { username: 'amira', displayName: 'Amira Moss', headline, bio, photoURL: '', website: 'https://pexiloq.com', accentColor: '#171717', theme: 'light', buttonStyle: 'solid', cardRadius: '3xl', fontStyle: 'sans', backgroundStyle: 'default', backgroundImageURL: '', backgroundColor: '', backgroundGradient: '', backgroundPattern: 'dots', socials: {}, twitterIcon: 'x', avatarShape: 'circle', avatarRing: true, showAvatar: true, showBadge: true, showLinkIcons: true, cardShadow: true, spacing: 'cozy', socialStyle: 'outline', isPublic: true, onboarded: true, layoutTemplate: 'classic', sectionOrder: [...defaultSectionOrder], colorThemePack: 'custom', backgroundAnimated: false, backgroundOverlay: 0, backgroundPatternDensity: 1, backgroundPatternColor: '', coverImageURL: '', showVerifiedBadge: false, avatarAnimation: 'none' },
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

export function Logo() {
  return <Link href="/" className="flex shrink-0 items-center" aria-label="Pexiloq home"><img src="/Pexiloq_Logo.png" alt="Pexiloq" width={1774} height={887} className="h-14 w-auto object-contain sm:h-16 md:h-20 lg:h-24" /></Link>
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const pathname = usePathname(); const [mobile, setMobile] = useState(false); const [loggingOut, setLoggingOut] = useState(false); const { t } = useI18n()
  const { profile, loading } = useWorkspace()
  const nav = [{ href: '/dashboard', label: t('overview'), icon: Eye }, { href: '/dashboard/profile', label: t('profile'), icon: UserRound }, { href: '/dashboard/links', label: t('links'), icon: Link2 }, { href: '/dashboard/projects', label: t('projects'), icon: Layers }, { href: '/dashboard/appearance', label: t('appearance'), icon: Palette }, { href: '/dashboard/settings', label: t('settings'), icon: Settings }]
  async function logout() { setLoggingOut(true); if (auth) await signOut(auth); router.push('/') }
  if (loading) return <LoadingScreen />
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-3 lg:px-10">
        <Logo />
        <div className="flex items-center gap-4">
          <LanguageSwitcher compact />
          <button className="lg:hidden" onClick={() => setMobile(!mobile)} aria-label={mobile ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobile}><Menu className="size-5" /></button>
          <div className="hidden items-center gap-4 lg:flex">
            <Link href={`/${profile.username}`} target="_blank" className="text-sm text-muted-foreground hover:text-foreground">{t('viewProfile')} <ExternalLink className="ml-1 inline size-3" /></Link>
            <button onClick={logout} disabled={loggingOut} className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">{loggingOut ? <Loader2 className="mr-1 inline size-4 animate-spin" /> : <LogOut className="mr-1 inline size-4" />} {t('logout')}</button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1440px]">
        <aside className={`${mobile ? 'block' : 'hidden'} w-full border-b p-6 lg:block lg:w-64 lg:border-b-0 lg:border-r lg:min-h-[calc(100vh-73px)]`}>
          <p className="mb-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">{t('workspace')}</p>
          <nav className="space-y-1">{nav.map(({ href, label, icon: Icon }) => <Link key={href} onClick={() => setMobile(false)} href={href} aria-current={pathname === href ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${pathname === href ? 'bg-secondary font-medium' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'}`}><Icon className="size-4" />{label}</Link>)}</nav>
          <div className="mt-10 rounded-2xl bg-secondary p-4">
            <p className="text-sm font-medium">{t('yourPublicPage')}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{t('shareOneLink')}</p>
            <Link href={`/${profile.username}`} className="mt-3 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4">{t('openProfile')} <ArrowUpRight className="size-3" /></Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-6 lg:p-12">{children}</main>
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
  const [user, setUser] = useState<{ uid: string; displayName: string | null; email: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!auth) { setLoading(false); return }
    return onAuthStateChanged(auth, (u) => { setUser(u ? { uid: u.uid, displayName: u.displayName, email: u.email } : null); setLoading(false) })
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

function qrCodeFor(url: string, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(url)}`
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

function CardImg({ src, alt, className, fit = 'auto' }: { src: string; alt: string; className: string; fit?: 'auto' | 'cover' | 'contain' }) {
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
        className={`relative size-full transition-opacity duration-300 ${useContain ? 'object-contain' : 'object-cover'} ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}

type Skin = { card: string; sub: string; bar: string; strip: string }
type CardTrack = (type: 'links' | 'projects' | 'socials', key: string) => void

function LinksSection({ profile, links, skin, layout, onTrack }: { profile: Profile; links: LinkItem[]; skin: Skin; layout: LayoutTemplate; onTrack?: CardTrack }) {
  const visibleLinks = links.filter((item) => item.visible)
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
    ? `flex items-center justify-between rounded-xl border border-transparent text-left text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-md`
    : profile.buttonStyle === 'outline'
      ? `flex items-center justify-between rounded-xl border-2 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm`
      : `flex items-center justify-between rounded-xl border border-transparent text-left text-sm font-medium transition hover:-translate-y-0.5 ${ghostHover}`
  const icon = (item: LinkItem, sizeClass = 'size-4') => profile.showLinkIcons !== false && (item.icon ? <span className="shrink-0 text-base leading-none" style={item.iconColor ? { color: item.iconColor } : undefined}>{item.icon}</span> : <img src={faviconFor(item.url)} alt="" aria-hidden="true" className={`${sizeClass} shrink-0 rounded-sm opacity-90`} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />)

  // A link's own displayStyle (if set) overrides the layout template's default look for that one link.
  function renderLink(item: LinkItem, fallback: LayoutTemplate | 'default') {
    const style = item.displayStyle && item.displayStyle !== 'default' ? item.displayStyle : null
    if (style === 'text') {
      return (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} className={`flex items-center gap-2 px-1 py-2 text-left text-sm font-medium underline underline-offset-4 transition hover:opacity-70`} style={{ color: item.bgColor || profile.accentColor }}>
          {icon(item, 'size-3.5')}
          <span className="truncate">{item.title}</span>
        </a>
      )
    }
    if (style === 'large') {
      return (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} {...linkStyle(item, `${baseLinkClass} ${spacing.linkPad} min-h-16 text-base`)}>
          <span className="flex min-w-0 items-center gap-3">
            {icon(item, 'size-5')}
            <span className="truncate">{item.title}</span>
          </span>
          <ExternalLink className="size-4 shrink-0 opacity-70" />
        </a>
      )
    }
    if (style === 'thumbnail') {
      return (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} className={`flex items-center gap-4 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${skin.bar}`} style={item.bgColor ? { backgroundColor: item.bgColor, color: contrastColor(item.bgColor) } : undefined}>
          {item.imageURL
            ? <CardImg src={item.imageURL} alt={item.title} className="size-14 shrink-0 rounded-xl" />
            : <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary text-lg">{icon(item, 'size-6')}</span>}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{item.title}</span>
            <span className={`block truncate text-xs ${item.bgColor ? 'opacity-70' : skin.sub}`}>{item.url.replace(/^https?:\/\//, '')}</span>
          </span>
          <ExternalLink className="size-4 shrink-0 opacity-60" />
        </a>
      )
    }
    // No per-link override: fall back to the layout template's default look.
    if (fallback === 'grid') {
      return (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} {...linkStyle(item, `${baseLinkClass} flex-col gap-2 px-3 py-4 text-center`)}>
          <span className="text-xl leading-none">{item.icon || <img src={faviconFor(item.url)} alt="" aria-hidden="true" className="mx-auto size-5 rounded-sm opacity-90" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />}</span>
          <span className="line-clamp-2 w-full truncate text-xs">{item.title}</span>
        </a>
      )
    }
    if (fallback === 'card') {
      return (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} {...linkStyle(item, `${baseLinkClass} ${spacing.linkPad} shadow-[0_10px_30px_rgba(35,35,30,0.08)]`)}>
          <span className="flex min-w-0 items-center gap-3">
            {icon(item)}
            <span className="truncate">{item.title}</span>
          </span>
          <ExternalLink className="size-4 shrink-0 opacity-70" />
        </a>
      )
    }
    if (fallback === 'magazine') {
      return (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} className={`flex items-center gap-4 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${skin.bar}`}>
          {item.imageURL
            ? <CardImg src={item.imageURL} alt={item.title} className="size-14 shrink-0 rounded-xl" />
            : <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary text-lg">{item.icon || <img src={faviconFor(item.url)} alt="" aria-hidden="true" className="size-6 rounded-sm opacity-90" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />}</span>}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{item.title}</span>
            <span className={`block truncate text-xs ${skin.sub}`}>{item.url.replace(/^https?:\/\//, '')}</span>
          </span>
          <ExternalLink className="size-4 shrink-0 opacity-60" />
        </a>
      )
    }
    return (
      <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrack?.('links', item.id)} {...linkStyle(item, `${baseLinkClass} ${spacing.linkPad}`)}>
        <span className="flex min-w-0 items-center gap-3">
          {icon(item)}
          <span className="truncate">{item.title}</span>
        </span>
        <ExternalLink className="size-4 shrink-0 opacity-70" />
      </a>
    )
  }

  if (layout === 'grid') {
    return <div className={`${spacing.sectionGap} grid grid-cols-2 gap-3 sm:grid-cols-3`}>{visibleLinks.map((item) => renderLink(item, 'grid'))}</div>
  }
  if (layout === 'card') {
    return <div className={`${spacing.sectionGap} ${spacing.linkGap}`}>{visibleLinks.map((item) => renderLink(item, 'card'))}</div>
  }
  if (layout === 'magazine') {
    return <div className={`${spacing.sectionGap} space-y-3`}>{visibleLinks.map((item) => renderLink(item, 'magazine'))}</div>
  }
  return <div className={`${spacing.sectionGap} ${spacing.linkGap}`}>{visibleLinks.map((item) => renderLink(item, 'default'))}</div>
}

function ProjectsSection({ profile, projects, skin, layout, onTrack, t }: { profile: Profile; projects: Project[]; skin: Skin; layout: LayoutTemplate; onTrack?: CardTrack; t: (key: string) => string }) {
  const visibleProjects = projects.filter((item) => item.visible)
  if (!visibleProjects.length) return null
  const spacing = spacingConfig[profile.spacing || 'cozy']
  if (layout === 'magazine') {
    return (
      <div className={`${spacing.sectionGap} space-y-4`}>
        {visibleProjects.map((item, index) => (
          <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrack?.('projects', item.id)} className={`block overflow-hidden rounded-2xl text-left transition hover:-translate-y-0.5 ${index === 0 ? '' : `border ${skin.bar}`}`} style={index === 0 ? { backgroundColor: profile.accentColor, color: '#ffffff' } : undefined}>
            {item.imageURL && <CardImg src={item.imageURL} alt={item.title} className="h-40 w-full" />}
            <div className="p-4">
              <span className={`text-[10px] uppercase tracking-widest ${index === 0 ? 'text-white/70' : skin.sub}`}>{t('selectedWork')}</span>
              <p className="mt-2 text-base font-medium">{item.title}</p>
              <p className={`mt-1 text-xs ${index === 0 ? 'text-white/70' : skin.sub}`}>{item.description}</p>
            </div>
          </a>
        ))}
      </div>
    )
  }
  const cols = layout === 'grid' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
  return (
    <div className={`${spacing.sectionGap} grid gap-3 ${cols}`}>
      {visibleProjects.map((item, index) => (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer" onClick={() => onTrack?.('projects', item.id)} className={`min-h-32 rounded-xl p-4 text-left transition hover:-translate-y-0.5 ${index === 0 ? '' : skin.strip}`} style={index === 0 ? { backgroundColor: profile.accentColor, color: '#ffffff' } : undefined}>
          {item.imageURL && <div className="mb-3"><CardImg src={item.imageURL} alt={item.title} className="h-20 w-full rounded-lg" /></div>}
          <span className={`text-[10px] uppercase tracking-widest ${index === 0 ? 'text-white/70' : ''}`}>{t('selectedWork')}</span>
          <p className={`${item.imageURL ? 'mt-3' : 'mt-8'} text-sm font-medium`}>{item.title}</p>
          <p className={`mt-1 text-xs ${index === 0 ? 'text-white/70' : ''}`}>{item.description}</p>
        </a>
      ))}
    </div>
  )
}

export function ProfileCard({ profile, links, projects, preview = false, onTrack }: { profile: Profile; links: LinkItem[]; projects: Project[]; preview?: boolean; onTrack?: CardTrack }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const dark = profile.theme === 'dark'
  const skin: Skin = dark
    ? { card: 'border-[#3a3d38] bg-[#262926] text-[#f5f5f2]', sub: 'text-[#adb1a9]', bar: 'border-[#3a3d38]', strip: 'bg-[#30332f] text-[#adb1a9]' }
    : { card: 'border-border bg-card text-foreground', sub: 'text-muted-foreground', bar: 'border-[#e3e3dd]', strip: 'bg-secondary text-muted-foreground' }
  const radius = radiusClass[profile.cardRadius]
  const font = fontClass[profile.fontStyle]
  async function share() {
    await navigator.clipboard?.writeText(`${window.location.host}/${profile.username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  const cardShadow = profile.cardShadow === false ? '' : 'shadow-[0_24px_70px_rgba(35,35,30,0.1)]'
  const socialFilled = profile.socialStyle === 'filled'
  const layout: LayoutTemplate = layoutTemplates.includes(profile.layoutTemplate) ? profile.layoutTemplate : 'classic'
  const sectionOrder: SectionKind[] = profile.sectionOrder?.length ? profile.sectionOrder : defaultSectionOrder
  const maxWidth = layout === 'magazine' ? 'max-w-md' : layout === 'card' ? 'max-w-2xl' : 'max-w-xl'
  const isNameCard = layout === 'card'
  const sections: Record<SectionKind, React.ReactNode> = {
    links: <LinksSection key="links" profile={profile} links={links} skin={skin} layout={layout} onTrack={onTrack} />,
    projects: <ProjectsSection key="projects" profile={profile} projects={projects} skin={skin} layout={layout} onTrack={onTrack} t={t} />,
  }
  return (
    <div className={`pexiloq-fade-in mx-auto ${maxWidth} overflow-hidden border ${cardShadow} ${radius} ${skin.card} ${preview ? '' : 'my-8'}`}>
      {profile.coverImageURL && <div className="h-28 w-full sm:h-36"><CardImg src={profile.coverImageURL} alt="" className="h-full w-full" fit="cover" /></div>}
      <div className="p-5">
      <div className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b pb-3 text-[10px] uppercase tracking-[0.18em] ${skin.bar} ${skin.sub}`}>
        <span className="min-w-0 truncate py-1">pexiloq.com / {profile.username}</span>
        <span className="flex shrink-0 items-center gap-1">
          <button onClick={() => setShowQr((v) => !v)} aria-label={t('showQr')} aria-pressed={showQr} className={`-my-1 rounded-full px-2.5 py-2 transition ${showQr ? 'bg-secondary/80' : 'hover:bg-secondary/50'}`}>{t('qr')}</button>
          <button onClick={share} aria-label={t('shareButton')} className="-my-1 flex items-center gap-1 rounded-full px-2.5 py-2 transition hover:bg-secondary/50">{copied ? <Check className="inline size-3" /> : <Copy className="inline size-3" />} {copied ? t('copied') : t('shareButton')}</button>
        </span>
      </div>
      {showQr && !preview && (
        <div className="flex flex-col items-center gap-3 border-b pb-6 pt-6 text-center">
          <img src={qrCodeFor(`https://${typeof window !== 'undefined' ? window.location.host : 'pexiloq.com'}/${profile.username}`)} alt={t('qr')} width={160} height={160} className="rounded-xl border" />
          <a href={qrCodeFor(`https://${typeof window !== 'undefined' ? window.location.host : 'pexiloq.com'}/${profile.username}`, 512)} download={`${profile.username}-pexiloq-qr.png`} target="_blank" rel="noreferrer" className="text-xs underline underline-offset-4" style={{ color: profile.accentColor }}>{t('downloadQr')}</a>
        </div>
      )}
      <div className={`px-2 py-8 sm:px-8 ${isNameCard ? 'text-left sm:flex sm:items-start sm:gap-8' : 'text-center'} ${profile.coverImageURL ? '-mt-8' : ''}`}>
        <div className={isNameCard ? 'sm:w-64 sm:shrink-0 sm:text-left text-center' : ''}>
          {profile.showAvatar && (
            <div
              className={`${isNameCard ? 'mx-auto sm:mx-0' : 'mx-auto'} ${profile.coverImageURL ? '-mt-2' : ''} relative grid size-20 place-items-center overflow-hidden bg-secondary text-xl font-medium ${avatarShapeClass[profile.avatarShape]} ${profile.avatarAnimation === 'pulse' ? 'pexiloq-avatar-pulse' : ''} ${profile.avatarAnimation === 'spin' ? 'pexiloq-avatar-spin' : ''} ${profile.avatarAnimation === 'glow' ? 'pexiloq-avatar-glow' : ''}`}
              style={{
                // The ring always derives from the profile's own accent color, never a fixed
                // hue, so it can't clash with a brand-colored avatar. A themed background
                // ring plus a soft shadow lifts the avatar off a cover photo edge cleanly.
                ...(profile.avatarRing ? { outline: `3px solid ${profile.accentColor}`, outlineOffset: 2 } : undefined),
                boxShadow: profile.coverImageURL ? `0 4px 16px rgba(0,0,0,0.18)` : undefined,
                ...(profile.avatarAnimation === 'spin' || profile.avatarAnimation === 'glow' ? ({ '--pexiloq-avatar-ring-color': profile.accentColor } as React.CSSProperties) : undefined),
              }}
            >
              {profile.photoURL ? <CardImg src={profile.photoURL} alt={profile.displayName} className={`size-full ${avatarShapeClass[profile.avatarShape]}`} /> : profile.displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <h1 className={`mt-5 flex items-center gap-1.5 text-3xl font-medium tracking-[-0.05em] ${font} ${isNameCard ? '' : 'justify-center'}`}>
            {profile.displayName}
            {profile.showVerifiedBadge && (
              <span aria-label={t('verifiedBadge')} title={t('verifiedBadge')} className="inline-grid size-5 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: profile.accentColor }}>
                <Check className="size-3" strokeWidth={3} />
              </span>
            )}
          </h1>
          <p className={`mt-2 text-sm ${skin.sub}`}>{profile.headline}</p>
          {profile.bio && <p className={`mt-5 text-sm leading-6 ${skin.sub} ${isNameCard ? 'sm:max-w-none' : 'mx-auto max-w-sm'}`}>{profile.bio}</p>}
          {profile.website && <a href={profile.website} target="_blank" className="mt-4 inline-block text-xs underline underline-offset-4" style={{ color: profile.accentColor }}>{profile.website.replace(/^https?:\/\//, '')}</a>}
          {Object.entries(profile.socials || {}).filter(([, v]) => v).length > 0 && (
            <div className={`mt-5 flex flex-wrap items-center gap-2 ${isNameCard ? 'justify-center sm:justify-start' : 'justify-center'}`}>
              {socialPlatforms.filter((p) => profile.socials?.[p]).map((p) => {
                const value = profile.socials![p]!
                const href = socialHref(p, value, profile.twitterIcon)
                return <a key={p} href={href} target="_blank" rel="noreferrer" aria-label={socialMeta[p].label} onClick={() => onTrack?.('socials', p)} className={`grid size-9 place-items-center rounded-full transition hover:-translate-y-0.5 ${socialFilled ? '' : `border ${skin.bar}`}`} style={socialFilled ? { backgroundColor: profile.accentColor, color: '#ffffff' } : undefined}><SocialGlyph platform={p} twitterIcon={profile.twitterIcon} className="size-4" /></a>
              })}
            </div>
          )}
        </div>
        <div className={isNameCard ? 'mt-8 min-w-0 flex-1 sm:mt-0' : ''}>
          {sectionOrder.map((key) => <div key={key}>{sections[key]}</div>)}
        </div>
      </div>
      {profile.showBadge && <div className={`border-t pt-4 text-center text-[10px] ${skin.bar} ${skin.sub}`}>{t('made')} <span className="font-semibold text-foreground">pexiloq</span></div>}
      </div>
    </div>
  )
}

export function Overview() {
  const { profile, links, projects, uid } = useWorkspace()
  const { t } = useI18n()
  const [stats, setStats] = useState<{ views: number; links: Record<string, number>; projects: Record<string, number>; socials: Record<string, number> } | null>(null)
  useEffect(() => {
    if (!uid) { setStats(null); return }
    let live = true
    void loadAnalytics(uid).then((s) => { if (live) setStats(s) })
    return () => { live = false }
  }, [uid])
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
      <PageHeader eyebrow={t('workspace')} title={`${t('goodToSee')}, ${profile.displayName.split(' ')[0]}.`} description={t('calmPlace')} action={<Link href={`/${profile.username}`} className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">{t('viewProfile')} <ArrowUpRight className="ml-1 inline size-4" /></Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label={t('liveLinks')} value={String(links.filter((i) => i.visible).length)} accent={profile.accentColor} />
        <Stat label={t('projects')} value={String(projects.filter((i) => i.visible).length)} accent={profile.accentColor} />
        <Stat label={t('profileStatus')} value={profile.username ? (profile.isPublic === false ? t('privateProfile') : t('live')) : t('draft')} accent={profile.accentColor} />
        <Stat label={t('pageViews')} value={String(stats?.views ?? 0)} accent={profile.accentColor} />
        <Stat label={t('totalClicks')} value={String(totalClicks)} accent={profile.accentColor} />
      </div>
      <section className="mt-10 rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t('insights')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('analyticsHint')}</p>
          </div>
        </div>
        {clicks.length === 0 ? (
          <p className="mt-6 rounded-xl bg-secondary px-4 py-5 text-sm text-muted-foreground">{t('noClicksYet')}</p>
        ) : (
          <div className="mt-6 space-y-3">
            {clicks.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-44 shrink-0 truncate text-sm">{row.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full" style={{ width: `${(row.count / maxClicks) * 100}%`, backgroundColor: profile.accentColor }} /></div>
                <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums">{row.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t('livePreview')}</p>
              <h2 className="mt-2 text-xl font-medium tracking-[-0.04em]">{t('thisWorld')}</h2>
            </div>
            <Link href="/dashboard/profile" className="text-sm underline underline-offset-4">{t('edit')}</Link>
          </div>
          <div className="mt-6"><LivePreview profile={profile} links={links} projects={projects} note={false} /></div>
        </div>
        <div className="rounded-2xl bg-secondary p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t('nextSteps')}</p>
          <div className="mt-6 space-y-5">
            {([[t('completeProfile'), '/dashboard/profile'], [t('addFirstLink'), '/dashboard/links'], [t('showcaseProject'), '/dashboard/projects'], [t('makeItYours'), '/dashboard/appearance']] as const).map(([label, href]) => <Link href={href} key={href} className="flex items-center justify-between border-b pb-4 text-sm"><span>{label}</span><ArrowUpRight className="size-4 text-muted-foreground" /></Link>)}
          </div>
        </div>
      </section>
    </>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return <div className="rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-4 text-3xl font-medium tracking-[-0.06em]" style={{ color: accent }}>{value}</p></div>
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p><h1 className="mt-3 text-4xl font-medium tracking-[-0.07em] sm:text-5xl">{title}</h1><p className="mt-4 max-w-xl leading-7 text-muted-foreground">{description}</p></div>{action}</div>
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
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => { timer.current = null; await persistNow(); showSaved() }, 600)
  }, [draftProfile, draftLinks, draftProjects])
  const latest = useRef({ profile: draftProfile, links: draftLinks, projects: draftProjects })
  useEffect(() => { latest.current = { profile: draftProfile, links: draftLinks, projects: draftProjects } })
  useEffect(() => () => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null }
    const { profile: p, links: l, projects: pr } = latest.current
    if (uid && (kind === 'profile' || kind === 'appearance')) void saveProfile(uid, p as any)
    if (uid && kind === 'links') void saveItems(uid, 'links', l)
    if (uid && kind === 'projects') void saveItems(uid, 'projects', pr)
  }, [uid, kind])
  async function save() { await flushNow(); showSaved() }
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
            <button onClick={save} disabled={saving} className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{saving ? <><Loader2 className="mr-2 inline size-4 animate-spin" />{t('saving')}</> : <><Save className="mr-2 inline size-4" />{notice || t('save')}</>}</button>
            {/* Autosave already fires on every change — this caption makes that fact visible so
               people trust it instead of anxiously mashing Save. */}
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {saving ? <><Loader2 className="size-3 animate-spin" />{t('autosaving')}</> : notice ? <><Check className="size-3" />{t('autosaved')}</> : t('autosaveHint')}
            </span>
          </div>
        }
      />
      {kind === 'profile' && (
        <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr]">
          <div className="space-y-4 rounded-2xl border bg-card p-6">
            <Field label={t('displayName')} value={draftProfile.displayName} onChange={(v) => setDraftProfile({ ...draftProfile, displayName: v })} />
            <Field label={t('username')} value={draftProfile.username} onChange={(v) => setDraftProfile({ ...draftProfile, username: v.toLowerCase().replace(/[^a-z0-9-]/g, '') })} prefix="pexiloq.com/" />
            <Field label={t('headline')} value={draftProfile.headline} onChange={(v) => setDraftProfile({ ...draftProfile, headline: v })} />
            <Field label={t('bio')} value={draftProfile.bio} onChange={(v) => setDraftProfile({ ...draftProfile, bio: v })} area />
            <Field label={t('website')} value={draftProfile.website} onChange={(v) => setDraftProfile({ ...draftProfile, website: v })} />
            <div className="block text-sm">
              <span>{t('profilePhoto')}</span>
              <div className="mt-2 flex items-center gap-4">
                <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-sm font-medium">
                  {draftProfile.photoURL ? <CardImg src={draftProfile.photoURL} alt="" className="size-full rounded-full" /> : (draftProfile.displayName || '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="grid flex-1 gap-2">
                  <ImageUploader uid={uid} maxDimension={512} value={draftProfile.photoURL} shape="circle" aspect={1} onUploaded={(url) => setDraftProfile({ ...draftProfile, photoURL: url })} />
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer select-none">{t('orPasteUrl')}</summary>
                    <input value={draftProfile.photoURL || ''} onChange={(e) => setDraftProfile({ ...draftProfile, photoURL: e.target.value.trim() })} className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="https://…" />
                  </details>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t('photoFitHint')}</p>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium">{t('socialLinks')}</p>
              <div className="mt-3 space-y-2">
                {socialPlatforms.map((platform) => (
                  <div key={platform} className="flex items-center gap-3">
                    {platform === 'twitter' ? (
                      <div className="flex shrink-0 items-center gap-1 rounded-full border p-0.5" role="group" aria-label="X / Twitter icon">
                        {(['x', 'bird'] as const).map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            title={icon === 'x' ? 'X' : 'Twitter'}
                            onClick={() => setDraftProfile({ ...draftProfile, twitterIcon: icon })}
                            aria-pressed={draftProfile.twitterIcon === icon}
                            className={`rounded-full p-1 transition ${draftProfile.twitterIcon === icon ? 'bg-secondary' : 'text-muted-foreground'}`}
                          >
                            <SocialGlyph platform="twitter" twitterIcon={icon} className="size-4" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border text-muted-foreground"><SocialGlyph platform={platform} className="size-3.5" /></span>
                    )}
                    <input
                      value={draftProfile.socials?.[platform] || ''}
                      onChange={(e) => setDraftProfile({ ...draftProfile, socials: { ...draftProfile.socials, [platform]: e.target.value.trim() } })}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      placeholder={`${socialMeta[platform].label} — ${socialMeta[platform].placeholder}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div><LivePreview profile={draftProfile} links={draftLinks} projects={draftProjects} /></div>
        </div>
      )}
      {kind === 'appearance' && (
        <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr]">
          <div className="rounded-2xl border bg-card p-6"><AppearanceControls draft={draftProfile} onChange={setDraftProfile} uid={uid} /></div>
          <div><LivePreview profile={draftProfile} links={draftLinks} projects={draftProjects} /></div>
        </div>
      )}
      {kind === 'links' && (
        <div className="max-w-3xl space-y-3">
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
                  <input value={item.url} onChange={(e) => setDraftLinks(draftLinks.map((x) => x.id === item.id ? { ...x, url: e.target.value } : x))} className="rounded-lg border bg-background px-3 py-2 text-sm" placeholder="https://" />
                </div>
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
      )}
      {kind === 'projects' && (
        <div className="max-w-3xl space-y-3">
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
                <input value={item.url} onChange={(e) => setDraftProjects(draftProjects.map((x) => x.id === item.id ? { ...x, url: e.target.value } : x))} className="rounded-lg border bg-background px-3 py-2 text-sm" placeholder={t('projectUrl')} />
                <textarea value={item.description} onChange={(e) => setDraftProjects(draftProjects.map((x) => x.id === item.id ? { ...x, description: e.target.value } : x))} className="min-h-24 rounded-lg border bg-background px-3 py-2 text-sm md:col-span-2" placeholder={t('description')} />
                <input value={item.imageURL || ''} onChange={(e) => setDraftProjects(draftProjects.map((x) => x.id === item.id ? { ...x, imageURL: e.target.value.trim() } : x))} className="rounded-lg border bg-background px-3 py-2 text-sm md:col-span-2" placeholder="Image URL (optional) — https://" />
                <ImageUploader uid={uid} maxDimension={1024} value={item.imageURL} shape="rect" aspect={16 / 9} onUploaded={(url) => setDraftProjects(draftProjects.map((x) => x.id === item.id ? { ...x, imageURL: url } : x))} className="md:col-span-2" />
              </div>
            </div>
          ))}
          <button onClick={addProject} className="rounded-full border px-4 py-2 text-sm transition hover:border-foreground/40"><Plus className="mr-1 inline size-4" />{t('addProject')}</button>
        </div>
      )}
    </>
  )
}

const layoutPreviewBars: Record<LayoutTemplate, { shape: string; count: number }> = {
  classic: { shape: 'bar', count: 3 },
  grid: { shape: 'tile', count: 6 },
  magazine: { shape: 'row', count: 2 },
  card: { shape: 'split', count: 1 },
}

function LayoutPreview({ layout, accent }: { layout: LayoutTemplate; accent: string }) {
  const cfg = layoutPreviewBars[layout]
  if (cfg.shape === 'tile') {
    return <div className="grid grid-cols-3 gap-1 p-2">{Array.from({ length: cfg.count }).map((_, i) => <div key={i} className="aspect-square rounded-[3px]" style={{ backgroundColor: `${accent}33` }} />)}</div>
  }
  if (cfg.shape === 'row') {
    return <div className="flex flex-col gap-1.5 p-2">{Array.from({ length: cfg.count }).map((_, i) => <div key={i} className="h-4 rounded-[3px]" style={{ backgroundColor: `${accent}33` }} />)}<div className="mt-1 h-6 rounded-[3px]" style={{ backgroundColor: `${accent}55` }} /></div>
  }
  if (cfg.shape === 'split') {
    return <div className="flex h-full gap-1.5 p-2"><div className="w-1/3 rounded-[3px]" style={{ backgroundColor: `${accent}55` }} /><div className="flex flex-1 flex-col gap-1.5">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-3 rounded-[3px]" style={{ backgroundColor: `${accent}33` }} />)}</div></div>
  }
  return <div className="flex flex-col items-center gap-1.5 p-2">{Array.from({ length: cfg.count }).map((_, i) => <div key={i} className="h-3.5 w-full rounded-[3px]" style={{ backgroundColor: `${accent}33` }} />)}</div>
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
        <p className="text-sm font-medium"><Layers className="mr-2 inline size-4 text-muted-foreground" />{t('layoutTemplate')}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {layoutTemplates.map((layout) => (
            <button key={layout} onClick={() => onChange({ ...draft, layoutTemplate: layout })} aria-pressed={draft.layoutTemplate === layout} className={`overflow-hidden rounded-xl border text-left transition ${draft.layoutTemplate === layout ? 'border-foreground ring-2 ring-foreground/20' : 'hover:border-foreground/40'}`}>
              <div className="h-16 bg-secondary/60"><LayoutPreview layout={layout} accent={draft.accentColor} /></div>
              <p className="border-t px-2 py-1.5 text-xs font-medium capitalize">{t(`layout${layout.charAt(0).toUpperCase()}${layout.slice(1)}`)}</p>
            </button>
          ))}
        </div>
      </section>
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
          {(['light', 'dark'] as const).map((theme) => <button key={theme} onClick={() => onChange({ ...draft, theme, colorThemePack: 'custom' })} className={`rounded-xl border px-4 py-3 text-left text-sm capitalize transition ${draft.theme === theme ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'}`}>{t(theme)}</button>)}
        </div>
      </section>
      <section>
        <p className="text-sm font-medium">{t('buttonStyle')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['solid', 'outline', 'ghost'] as const).map((style) => <button key={style} onClick={() => onChange({ ...draft, buttonStyle: style })} className={`rounded-full border px-4 py-2 text-sm capitalize transition ${draft.buttonStyle === style ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'}`} style={draft.buttonStyle === style ? { borderColor: draft.accentColor, color: draft.accentColor } : undefined}>{t(style)}</button>)}
        </div>
      </section>
      <section>
        <p className="text-sm font-medium">{t('spacing')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {densityPresets.map((density) => <button key={density} onClick={() => onChange({ ...draft, spacing: density })} className={`rounded-full border px-4 py-2 text-sm capitalize transition ${draft.spacing === density ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'}`}>{t(densityLabelKey[density])}</button>)}
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
          {fontStyles.map((font) => <button key={font} onClick={() => onChange({ ...draft, fontStyle: font })} className={`rounded-xl border px-4 py-2 text-sm transition ${draft.fontStyle === font ? 'border-foreground bg-secondary font-medium' : 'hover:border-foreground/40'}`} style={{ fontFamily: fontPreviewFamily[font] }}>{t(fontLabelKey[font])}</button>)}
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
        <div className="mt-3 space-y-2">
          <input value={draft.coverImageURL || ''} onChange={(e) => onChange({ ...draft, coverImageURL: e.target.value.trim() })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="https://…" />
          {uid && <ImageUploader uid={uid} maxDimension={1600} value={draft.coverImageURL} shape="rect" aspect={3} onUploaded={(url) => onChange({ ...draft, coverImageURL: url })} onRemove={() => onChange({ ...draft, coverImageURL: '' })} />}
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
  async function finish() {
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
            <Field label={t('username')} value={draft.username} prefix="pexiloq.com/" onChange={(v) => setField({ username: v.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
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
          {isLast ? <button onClick={finish} disabled={busy} className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : t('stepLaunch')}<ArrowUpRight className="size-4" /></button> : <button onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))} className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">{t('stepNext')}<ArrowUpRight className="size-4" /></button>}
        </div>
      </div>
      {/* A live preview beside every step (not just the final privacy step) means the person
         sees their page take shape as they type, instead of filling out forms blind until the end. */}
      {!isLast && <div className="hidden lg:block"><LivePreview profile={draft} links={draftLinks.filter((i) => i.visible)} projects={draftProjects.filter((i) => i.visible)} /></div>}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, area, prefix, placeholder }: { label: string; value: string; onChange: (value: string) => void; area?: boolean; prefix?: string; placeholder?: string }) {
  return <label className="block text-sm">{label}<div className="mt-2 flex">{prefix && <span className="shrink-0 rounded-l-lg border border-r-0 bg-secondary px-3 py-2 text-xs text-muted-foreground">{prefix}</span>}{area ? <textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-28 w-full min-w-0 rounded-lg border bg-background px-3 py-2" /> : <input value={value} onChange={(e) => onChange(e.target.value)} className={`w-full min-w-0 rounded-lg border bg-background px-3 py-2 ${prefix ? 'rounded-l-none' : ''}`} placeholder={placeholder} />}</div></label>
}

const R2_MAX_BYTES = 10 * 1024 * 1024
const IMAGE_QUALITY = 0.82

// Best-effort cleanup: removes a previously uploaded image from R2 once it's no longer
// referenced anywhere (replaced by a new upload, removed by the user, or its owning link/
// project/account was deleted). Silently no-ops on externally hosted URLs or if the
// request fails, since a failed cleanup should never block the user's edit from saving.
async function deleteStoredImage(uid: string | null | undefined, url?: string | null) {
  if (!uid || !url) return
  try {
    await fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: uid, url }) })
  } catch { /* best effort */ }
}

// Deletes every image ever uploaded for this account. Called when the account itself is
// deleted so avatars, cover/background images, and link/project thumbnails don't linger
// in storage after the profile is gone.
async function purgeAllStoredImages(uid: string) {
  try {
    await fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: uid, purgeAll: true }) })
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
function ImageCropModal({ file, shape, aspect, maxDimension, title, onCancel, onConfirm }: {
  file: File
  shape: CropShape
  aspect: number
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
  const center = useRef({ x: 0, y: 0 })
  const dragState = useRef<{ x: number; y: number } | null>(null)
  const frameW = 320
  const frameH = shape === 'circle' ? 320 : Math.round(320 / aspect)

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

  useEffect(() => { if (ready) draw() }, [ready, zoom])

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
      const outW = shape === 'circle' ? maxDimension : maxDimension
      const outH = shape === 'circle' ? maxDimension : Math.round(maxDimension / aspect)
      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas unavailable')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      const { sx, sy, sw, sh } = sourceRect()
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
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, contentType, size: uploadFile.size }),
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

function PhonePreviewFrame({ profile, children }: { profile: Profile; children: React.ReactNode }) {
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
  const url = `pexiloq.com/${profile.username || ''}`
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
    <div className="pexiloq-device-toggle" role="group" aria-label={t('preview')}>
      <button type="button" aria-pressed={device === 'phone'} onClick={() => onChange('phone')}><Smartphone className="size-3.5" />{t('previewPhone')}</button>
      <button type="button" aria-pressed={device === 'desktop'} onClick={() => onChange('desktop')}><Monitor className="size-3.5" />{t('previewDesktop')}</button>
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {note ? <PreviewNote /> : <span />}
        <DeviceToggle device={device} onChange={setDevice} />
      </div>
      {device === 'phone' ? (
        <PhonePreviewFrame profile={profile}><ProfileCard profile={profile} links={links} projects={projects} preview /></PhonePreviewFrame>
      ) : (
        <DesktopPreviewFrame profile={profile}><ProfileCard profile={profile} links={links} projects={projects} preview /></DesktopPreviewFrame>
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
  const { profile, persistProfile } = useWorkspace()
  const { t } = useI18n()
  const router = useRouter()
  const [notice, setNotice] = useState('')
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
    await deleteUser(user)
    try { await deleteAccount(uidToPurge) } catch { /* account gone; best effort cleanup */ }
    // Also clear out every avatar/cover/background/link/project image ever uploaded for
    // this account so nothing is left behind in R2 once the profile itself is gone.
    void purgeAllStoredImages(uidToPurge)
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
  return (
    <>
      <PageHeader eyebrow={t('accountLabel')} title={t('settings')} description={t('settingsDesc')} />
      <div className="max-w-2xl rounded-2xl border bg-card p-6">
        <p className="text-sm font-medium">{t('publicUrl')}</p>
        <p className="mt-2 text-sm text-muted-foreground">pexiloq.com/{profile.username}</p>
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
  // Only a genuinely public profile page counts as a "view" — a private profile shows nothing
  // but a locked notice, so opening it (by the owner previewing their own link, a stale bookmark,
  // etc.) must never be recorded as a visitor view.
  const isPublicProfile = data !== null && data !== 'missing' && data.profile.isPublic !== false
  useEffect(() => {
    if (pageUid && isPublicProfile && viewRecorded.current !== pageUid && shouldRecordView(pageUid)) { viewRecorded.current = pageUid; void recordAnalytics(pageUid, 'views') }
  }, [pageUid, isPublicProfile])
  if (data === null) return <LoadingScreen />
  const track = (type: 'links' | 'projects' | 'socials', key: string) => {
    if (!pageUid) return
    const fingerprint = `${type}:${key}`
    if (lastClick.current === fingerprint) return // guards against duplicate fires (e.g. double-click/bubbled events)
    lastClick.current = fingerprint
    window.setTimeout(() => { if (lastClick.current === fingerprint) lastClick.current = null }, 2000)
    void recordAnalytics(pageUid, type, key)
  }
  const loaded = data !== 'missing' ? data : null
  return (
    <main className={`relative min-h-screen px-5 py-8 ${skin} ${animated ? 'pexiloq-animated-gradient' : ''}`} style={pageStyle}>
      {overlay && loaded && <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: loaded.profile.theme === 'dark' ? '#000000' : '#ffffff', opacity: Math.min(Math.max(loaded.profile.backgroundOverlay, 0), 1) }} />}
      <div className="relative mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3"><Logo /><Link href="/dashboard" className="whitespace-nowrap rounded-full border px-4 py-2 text-xs">{t('createYours')} <ArrowUpRight className="ml-1 inline size-3" /></Link></div>
        {data === 'missing' && <div className="mt-16 rounded-2xl border bg-card p-10 text-center"><p className="text-lg font-medium">{t('notFound')}</p></div>}
        {loaded && !loaded.profile.isPublic && (
          <div className="mt-16 rounded-2xl border bg-card p-10 text-center">
            <p className="text-lg font-medium">{t('privateNotice')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('privateProfileText')}</p>
            <Link href="/dashboard" className="mt-6 inline-flex items-center gap-1 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">{t('publishNow')} <ArrowUpRight className="size-4" /></Link>
          </div>
        )}
        {loaded && loaded.profile.isPublic && (
          <div className="mt-10"><ProfileCard profile={loaded.profile} links={loaded.links} projects={loaded.projects} onTrack={track} /></div>
        )}
      </div>
    </main>
  )
}