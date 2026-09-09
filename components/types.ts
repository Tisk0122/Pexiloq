import type React from 'react'

export type LinkDisplayStyle = 'default' | 'large' | 'thumbnail' | 'text'
export type LinkItem = {
  id: string
  title: string
  url: string
  visible: boolean
  icon?: string
  imageURL?: string
  bgColor?: string
  iconColor?: string
  displayStyle?: LinkDisplayStyle
}

export type Project = {
  id: string
  title: string
  description: string
  url: string
  imageURL?: string
  technologies: string[]
  visible: boolean
}

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

export const radiusClass: Record<CardRadius, string> = { lg: 'rounded-lg', xl: 'rounded-xl', '2xl': 'rounded-2xl', '3xl': 'rounded-3xl' }
export const radiusLabelKey: Record<CardRadius, string> = { lg: 'radiusLg', xl: 'radiusXl', '2xl': 'radius2xl', '3xl': 'radius3xl' }
export const fontClass: Record<FontStyle, string> = { sans: 'font-sans', serif: 'font-serif', mono: 'font-mono', display: 'pexiloq-font-display', rounded: 'pexiloq-font-rounded', elegant: 'pexiloq-font-elegant' }
export const fontLabelKey: Record<FontStyle, string> = { sans: 'fontSans', serif: 'fontSerif', mono: 'fontMono', display: 'fontDisplay', rounded: 'fontRounded', elegant: 'fontElegant' }
export const fontPreviewFamily: Record<FontStyle, string> = { sans: 'inherit', serif: 'Georgia, serif', mono: 'ui-monospace, monospace', display: "Georgia, 'Times New Roman', serif", rounded: "'Varela Round', ui-rounded, system-ui, sans-serif", elegant: "'Cormorant Garamond', Didot, Georgia, serif" }
export const avatarShapeClass: Record<AvatarShape, string> = { circle: 'rounded-full', rounded: 'rounded-2xl', square: 'rounded-none' }
export const accentPresets = ['#171717', '#566b5d', '#8a6f55', '#49647a', '#8a5f70', '#9a6b4f', '#3e7a6e', '#7a5aa6']

export type ThemePackConfig = { accentColor: string; theme: Theme; backgroundStyle: BackgroundStyle; backgroundColor: string; backgroundGradient: string }
export const themePackConfig: Record<Exclude<ColorThemePack, 'custom'>, ThemePackConfig> = {
  minimal: { accentColor: '#171717', theme: 'light', backgroundStyle: 'default', backgroundColor: '#fafaf8', backgroundGradient: '' },
  neon: { accentColor: '#39ff88', theme: 'dark', backgroundStyle: 'gradient', backgroundColor: '', backgroundGradient: 'radial-gradient(120% 120% at 20% 0%, #39ff8833 0%, transparent 55%), radial-gradient(130% 130% at 100% 100%, #ff2fd633 0%, transparent 60%)' },
  pastel: { accentColor: '#f4a6c1', theme: 'light', backgroundStyle: 'gradient', backgroundColor: '', backgroundGradient: 'radial-gradient(120% 120% at 0% 0%, #fde2e4 0%, transparent 60%), radial-gradient(130% 130% at 100% 100%, #e4f0fd 0%, transparent 60%)' },
  darkLuxury: { accentColor: '#c9a24b', theme: 'dark', backgroundStyle: 'default', backgroundColor: '#0f0f0d', backgroundGradient: '' },
}

export function applyThemePack(profile: Profile, pack: ColorThemePack): Profile {
  if (pack === 'custom') return { ...profile, colorThemePack: 'custom' }
  const cfg = themePackConfig[pack]
  return { ...profile, colorThemePack: pack, accentColor: cfg.accentColor, theme: cfg.theme, backgroundStyle: cfg.backgroundStyle, backgroundColor: cfg.backgroundColor, backgroundGradient: cfg.backgroundGradient }
}

export const gradientPresets: { key: string; value: string }[] = [
  { key: 'gradientAuto', value: '' },
  { key: 'gradientSunset', value: 'radial-gradient(120% 120% at 50% 0%, #f97316 33%, transparent 70%), radial-gradient(130% 130% at 100% 100%, #ec4899 22%, transparent 62%)' },
  { key: 'gradientOcean', value: 'radial-gradient(120% 120% at 80% 0%, #0ea5e9 30%, transparent 65%), radial-gradient(130% 130% at 0% 100%, #6366f1 25%, transparent 60%)' },
  { key: 'gradientForest', value: 'radial-gradient(120% 120% at 0% 0%, #22c55e 25%, transparent 60%), radial-gradient(130% 130% at 100% 100%, #0f766e 30%, transparent 60%)' },
  { key: 'gradientDusk', value: 'radial-gradient(120% 120% at 25% 0%, #a855f7 20%, transparent 60%), radial-gradient(130% 130% at 75% 100%, #3b82f6 25%, transparent 60%)' },
  { key: 'gradientEmber', value: 'radial-gradient(120% 120% at 0% 100%, #ef4444 25%, transparent 60%), radial-gradient(130% 130% at 100% 0%, #f59e0b 28%, transparent 60%)' },
  { key: 'gradientMint', value: 'radial-gradient(120% 120% at 50% 0%, #34d399 25%, transparent 60%), radial-gradient(130% 130% at 100% 100%, #2dd4bf 32%, transparent 62%)' },
]

export const linkEmojis = ['⭐', '🔥', '🎧', '🎬', '📚', '🛍️', '✉️', '💬', '🍜', '🧘', '🎮', '📷', '✏️', '💡', '🌿', '🎤']
export const patternPresets: BackgroundPattern[] = ['dots', 'grid', 'lines']
export const patternLabelKey: Record<BackgroundPattern, string> = { dots: 'patternDots', grid: 'patternGrid', lines: 'patternLines' }
export const densityPresets: Density[] = ['compact', 'cozy', 'spacious']
export const densityLabelKey: Record<Density, string> = { compact: 'spacingCompact', cozy: 'spacingCozy', spacious: 'spacingSpacious' }
export const spacingConfig: Record<Density, { linkGap: string; linkPad: string; sectionGap: string }> = {
  compact: { linkGap: 'space-y-2', linkPad: 'px-3.5 py-3', sectionGap: 'mt-6' },
  cozy: { linkGap: 'space-y-3', linkPad: 'px-4 py-4', sectionGap: 'mt-8' },
  spacious: { linkGap: 'space-y-4', linkPad: 'px-5 py-5', sectionGap: 'mt-10' },
}

export function patternStyle(pattern: BackgroundPattern, accent: string, density = 1, color?: string): React.CSSProperties {
  const col = color || accent
  const d = Math.min(Math.max(density || 1, 0.4), 2.5)
  if (pattern === 'grid') { const size = 28 / d; return { backgroundImage: `linear-gradient(${col}26 1px, transparent 1px), linear-gradient(90deg, ${col}26 1px, transparent 1px)`, backgroundSize: `${size}px ${size}px` } }
  if (pattern === 'lines') { const size = 14 / d; return { backgroundImage: `repeating-linear-gradient(135deg, ${col}1f 0 2px, transparent 2px ${size}px)` } }
  const size = 20 / d
  return { backgroundImage: `radial-gradient(${col}40 1.6px, transparent 1.6px)`, backgroundSize: `${size}px ${size}px` }
}

export const linkDisplayStyles: LinkDisplayStyle[] = ['default', 'large', 'thumbnail', 'text']

export const emptyProfile: Profile = {
  username: '', displayName: '', headline: '', bio: '', photoURL: '', website: '',
  accentColor: '#171717', theme: 'light', buttonStyle: 'solid', cardRadius: '3xl', fontStyle: 'sans',
  backgroundStyle: 'default', backgroundImageURL: '', backgroundColor: '', backgroundGradient: '', backgroundPattern: 'dots', socials: {}, twitterIcon: 'x',
  avatarShape: 'circle', avatarRing: true,
  showAvatar: true, showBadge: true, showLinkIcons: true, cardShadow: true, spacing: 'cozy', socialStyle: 'outline', isPublic: true, onboarded: false,
  layoutTemplate: 'classic', sectionOrder: [...defaultSectionOrder],
  colorThemePack: 'custom', backgroundAnimated: false, backgroundOverlay: 0, backgroundPatternDensity: 1, backgroundPatternColor: '',
  coverImageURL: '', coverImageHeight: 140, coverImageFit: 'cover', coverImagePositionX: 50, coverImagePositionY: 50, showVerifiedBadge: false, avatarAnimation: 'none',
}

export function normalizeProfile(p: Partial<Profile>): Profile {
  const merged: Profile = { ...emptyProfile, ...p }
  if (!layoutTemplates.includes(merged.layoutTemplate)) merged.layoutTemplate = 'classic'
  if (!Array.isArray(merged.sectionOrder) || merged.sectionOrder.length === 0) merged.sectionOrder = [...defaultSectionOrder]
  if (!colorThemePacks.includes(merged.colorThemePack)) merged.colorThemePack = 'custom'
  if (!['cover', 'contain', 'fill'].includes(merged.coverImageFit)) merged.coverImageFit = 'cover'
  if (typeof merged.coverImagePositionX !== 'number') merged.coverImagePositionX = 50
  if (typeof merged.coverImagePositionY !== 'number') merged.coverImagePositionY = 50
  if (!avatarAnimations.includes(merged.avatarAnimation)) merged.avatarAnimation = 'none'
  return merged
}

export type TemplateBundle = { profile: Profile; links: LinkItem[]; projects: Project[] }

export function makeTemplate(headline: string, bio: string, links: [string, string, string], projects: { title: string; description: string; tech: [string, string] }[]): TemplateBundle {
  return {
    profile: {
      ...emptyProfile,
      username: 'amira', displayName: 'Amira Moss', headline, bio, photoURL: '', website: 'https://example.com',
      accentColor: '#171717', theme: 'light', buttonStyle: 'solid', cardRadius: '3xl', fontStyle: 'sans',
      backgroundStyle: 'default', socials: { twitter: 'amira', instagram: 'amira.moss', github: 'amiramoss' },
      isPublic: true, onboarded: true, layoutTemplate: 'classic',
    },
    links: [
      { id: '1', title: links[0], url: 'https://newsletter.example.com', visible: true, icon: '✉️' },
      { id: '2', title: links[1], url: 'https://store.example.com', visible: true, icon: '🛍️' },
      { id: '3', title: links[2], url: 'https://youtube.com', visible: true, icon: '🎬' },
    ],
    projects: projects.map((p, i) => ({
      id: String(i + 1), title: p.title, description: p.description, url: 'https://example.com', imageURL: '', technologies: p.tech, visible: true,
    })),
  }
}

export const langTemplates: Record<string, TemplateBundle> = {
  en: makeTemplate('Design engineer building quiet tools and gentle interfaces.', 'Working independently from Berlin. Writing about soft systems and personal web.', ['Weekly dispatch', 'Selected work', 'Studio playlist'], [{ title: 'Solitude Studio', description: 'A minimal audio player built for focused work sessions.', tech: ['Next.js', 'Web Audio'] }, { title: 'Atlas Icons', description: 'Two hundred sharp vector icons for quiet interfaces.', tech: ['Figma', 'SVG'] }]),
  ja: makeTemplate('静かなツールと心地よいインターフェースを創るデザインエンジニア。', 'ベルリンから独立して活動中。ソフトシステムと個人ウェブについて執筆しています。', ['ウィークリーレター', '厳選作品', 'スタジオプレイリスト'], [{ title: 'Solitude Studio', description: '集中作業のためのミニマルなオーディオプレイヤー。', tech: ['Next.js', 'Web Audio'] }, { title: 'Atlas Icons', description: 'シンプルなUIのための200種類のベクターアイコン。', tech: ['Figma', 'SVG'] }]),
  zh: makeTemplate('打造安静工具与温和界面的设计工程师。', '在柏林独立工作。记录关于软系统与个人网页的想法。', ['每周通讯', '精选作品', '工作室歌单'], [{ title: 'Solitude Studio', description: '专为专注工作打造的极简音频播放器。', tech: ['Next.js', 'Web Audio'] }, { title: 'Atlas Icons', description: '为简约界面设计的 200 个精美矢量图标。', tech: ['Figma', 'SVG'] }]),
  ko: makeTemplate('고요한 도구와 부드러운 인터페이스를 만드는 디자인 엔지니어.', '베를린에서 독립적으로 활동 중. 소프트 시스템과 개인 웹에 대해 글을 씁니다.', ['주간 뉴스레터', '선정된 작업', '스튜디오 플레이리스트'], [{ title: 'Solitude Studio', description: '몰입 작업을 위해 만든 미니멀 오디오 플레이어.', tech: ['Next.js', 'Web Audio'] }, { title: 'Atlas Icons', description: '정갈한 인터페이스를 위한 200개의 벡터 아이콘.', tech: ['Figma', 'SVG'] }]),
  es: makeTemplate('Ingeniera de diseño creando herramientas tranquilas e interfaces amables.', 'Trabajando de forma independiente desde Berlín. Escribiendo sobre sistemas suaves y la web personal.', ['Boletín semanal', 'Trabajo seleccionado', 'Lista del estudio'], [{ title: 'Solitude Studio', description: 'Un reproductor de audio minimalista para sesiones de trabajo enfocado.', tech: ['Next.js', 'Web Audio'] }, { title: 'Atlas Icons', description: '200 iconos vectoriales definidos para interfaces limpias.', tech: ['Figma', 'SVG'] }]),
  fr: makeTemplate('Ingénieure designer créant des outils calmes et des interfaces douces.', 'Travaille en indépendante depuis Berlin. Écrit sur les systèmes doux et le web personnel.', ['Lettre hebdomadaire', 'Travaux choisis', 'Playlist du studio'], [{ title: 'Solitude Studio', description: 'Un lecteur audio minimaliste conçu pour le travail concentré.', tech: ['Next.js', 'Web Audio'] }, { title: 'Atlas Icons', description: '200 icônes vectorielles nettes pour interfaces épurées.', tech: ['Figma', 'SVG'] }]),
  de: makeTemplate('Design-Ingenieurin für ruhige Werkzeuge und sanfte Interfaces.', 'Unabhängig tätig in Berlin. Schreibt über softe Systeme und das persönliche Web.', ['Wöchentlicher Brief', 'Ausgewählte Arbeiten', 'Studio-Playlist'], [{ title: 'Solitude Studio', description: 'Ein minimaler Audioplayer für fokussierte Arbeitsphasen.', tech: ['Next.js', 'Web Audio'] }, { title: 'Atlas Icons', description: '200 präzise Vektoricons für schlichte Interfaces.', tech: ['Figma', 'SVG'] }]),
  pt: makeTemplate('Engenheira de design criando ferramentas tranquilas e interfaces suaves.', 'Trabalhando de forma independente em Berlim. Escrevendo sobre sistemas suaves e a web pessoal.', ['Boletim semanal', 'Trabalho selecionado', 'Playlist do estúdio'], [{ title: 'Solitude Studio', description: 'Um player de áudio minimalista feito para sessões de trabalho focado.', tech: ['Next.js', 'Web Audio'] }, { title: 'Atlas Icons', description: '200 ícones vetoriais nítidos para interfaces limpas.', tech: ['Figma', 'SVG'] }]),
  hi: makeTemplate('शांत टूल्स और सौम्य इंटरफ़ेस बनाने वाली डिज़ाइन इंजीनियर।', 'बर्लिन से स्वतंत्र रूप से कार्यरत। सॉफ़्ट सिस्टम और व्यक्तिगत वेब पर लेखन।', ['साप्ताहिक पत्र', 'चुना हुआ काम', 'स्टूडियो प्लेलिस्ट'], [{ title: 'Solitude Studio', description: 'एकाग्र कार्य सत्रों के लिए बना एक न्यूनतम ऑडियो प्लेयर।', tech: ['Next.js', 'Web Audio'] }, { title: 'Atlas Icons', description: 'शांत इंटरफ़ेस के लिए 200 तीखे वेक्टर आइकन।', tech: ['Figma', 'SVG'] }]),
}

export function fallbackTemplate(lang?: string): TemplateBundle { return langTemplates[lang || 'en'] || langTemplates.en }

export type PersonaCopy = { headline: string; bio: string; links: [string, string, string]; projects: [{ title: string; description: string }, { title: string; description: string }] }
export const showcaseCopy: Record<string, { kenji: PersonaCopy; noa: PersonaCopy }> = {
  en: { kenji: { headline: 'DJ & sound designer chasing the next set.', bio: 'New mixes most months, and a studio log for everything in between.', links: ['Latest mix', 'Behind the set', 'Book a show'], projects: [{ title: 'Afterglow EP', description: 'Six tracks recorded over one long summer.' }, { title: 'Live at Nord', description: "A full set from last month's show." }] }, noa: { headline: 'Photographer chasing soft light and quiet mornings.', bio: 'A visual diary of small towns, long walks, and the in-between moments.', links: ['Print shop', 'Behind the lens', 'Say hello'], projects: [{ title: 'Coastal light', description: 'A season spent photographing the shoreline.' }, { title: 'Quiet towns', description: 'Portraits of places most people pass by.' }] } },
  ja: { kenji: { headline: 'DJ・サウンドデザイナー。次のセットをいつも追いかけて。', bio: 'ほぼ毎月新しいミックスを公開。制作の裏側もここに記録しています。', links: ['最新のミックス', 'セットの舞台裏', '出演依頼はこちら'], projects: [{ title: 'Afterglow EP', description: '長い夏に録音した6曲。' }, { title: 'Live at Nord', description: '先月のショーのフルセット。' }] }, noa: { headline: '柔らかな光と静かな朝を追いかける写真家。', bio: '小さな町や長い散歩、その間にある瞬間を記録する視覚的な日記。', links: ['プリントショップ', '撮影の裏側', 'ご連絡はこちら'], projects: [{ title: 'Coastal light', description: '海辺をひと夏かけて撮影した記録。' }, { title: 'Quiet towns', description: '多くの人が通り過ぎる場所の肖像。' }] } },
  zh: { kenji: { headline: 'DJ 兼音效设计师。永远在追下一场演出。', bio: '几乎每月发布新混音，也记录制作背后的点滴。', links: ['最新混音', '幕后花絮', '预约演出'], projects: [{ title: 'Afterglow EP', description: '在漫长的一个夏天录制的六首曲目。' }, { title: 'Live at Nord', description: '上个月演出的完整现场。' }] }, noa: { headline: '追逐柔光与安静清晨的摄影师。', bio: '记录小镇、长途散步与那些间隙时刻的视觉日记。', links: ['版画商店', '镜头背后', '打个招呼'], projects: [{ title: 'Coastal light', description: '用一个季节拍摄的海岸线。' }, { title: 'Quiet towns', description: '那些常被忽略之地的肖像。' }] } },
  ko: { kenji: { headline: 'DJ 겸 사운드 디자이너. 언제나 다음 세트를 좇습니다.', bio: '거의 매달 새 믹스를 공개하고, 작업 과정도 기록합니다.', links: ['최신 믹스', '세트 비하인드', '공연 문의'], projects: [{ title: 'Afterglow EP', description: '긴 여름 동안 녹음한 여섯 곡.' }, { title: 'Live at Nord', description: '지난달 공연의 풀 세트.' }] }, noa: { headline: '부드러운 빛과 고요한 아침을 좇는 사진가.', bio: '작은 마을과 긴 산책, 그 사이의 순간들을 담은 시각 일기.', links: ['프린트 숍', '촬영 비하인드', '인사하기'], projects: [{ title: 'Coastal light', description: '한 계절 동안 해안을 담은 기록.' }, { title: 'Quiet towns', description: '사람들이 스쳐 지나가는 장소의 초상.' }] } },
  es: { kenji: { headline: 'DJ y diseñador de sonido. Siempre detrás del próximo set.', bio: 'Nuevas mezclas casi cada mes, y el detrás de escena del estudio.', links: ['Última mezcla', 'Detrás del set', 'Reservar una fecha'], projects: [{ title: 'Afterglow EP', description: 'Seis pistas grabadas durante un largo verano.' }, { title: 'Live at Nord', description: 'El set completo del show del mes pasado.' }] }, noa: { headline: 'Fotágrafa en busca de luz suave y mañanas tranquilas.', bio: 'Un diario visual de pueblos pequeños, caminatas largas y los momentos de en medio.', links: ['Tienda de impresiones', 'Detrás de la cámara', 'Saluda'], projects: [{ title: 'Coastal light', description: 'Una temporada fotografiando la costa.' }, { title: 'Quiet towns', description: 'Retratos de lugares que casi nadie mira.' }] } },
  fr: { kenji: { headline: 'DJ et sound designer. Toujours à la recherche du prochain set.', bio: 'De nouveaux mixes presque chaque mois, et les coulisses du studio.', links: ['Dernier mix', 'Les coulisses', 'Réserver une date'], projects: [{ title: 'Afterglow EP', description: "Six titres enregistrés au fil d'un long été." }, { title: 'Live at Nord', description: 'Le set complet du concert du mois dernier.' }] }, noa: { headline: 'Photographe en quête de lumière douce et de matins calmes.', bio: 'Un journal visuel de petites villes, longues marches et instants entre deux.', links: ['Boutique de tirages', "Derrière l'objectif", 'Dites bonjour'], projects: [{ title: 'Coastal light', description: 'Une saison passée à photographier le littoral.' }, { title: 'Quiet towns', description: "Portraits de lieux que l'on ne remarque jamais." }] } },
  de: { kenji: { headline: 'DJ und Sound-Designer. Immer auf dem Weg zum nächsten Set.', bio: 'Fast jeden Monat ein neuer Mix, plus Einblicke aus dem Studio.', links: ['Neuester Mix', 'Hinter dem Set', 'Auftritt buchen'], projects: [{ title: 'Afterglow EP', description: 'Sechs Tracks, aufgenommen über einen langen Sommer.' }, { title: 'Live at Nord', description: 'Das komplette Set vom letzten Auftritt.' }] }, noa: { headline: 'Fotografin auf der Suche nach sanftem Licht und stillen Morgen.', bio: 'Ein visuelles Tagebuch aus kleinen Städten, langen Spaziergängen und den Momenten dazwischen.', links: ['Print-Shop', 'Hinter der Kamera', 'Sag Hallo'], projects: [{ title: 'Coastal light', description: 'Eine Saison damit verbracht, die Küste zu fotografieren.' }, { title: 'Quiet towns', description: 'Porträts von Orten, an denen die meisten vorbeigehen.' }] } },
  pt: { kenji: { headline: 'DJ e sound designer. Sempre atrás do próximo set.', bio: 'Novas mixagens quase todo mês, e os bastidores do estúdio.', links: ['Última mixagem', 'Bastidores do set', 'Reservar uma data'], projects: [{ title: 'Afterglow EP', description: 'Seis faixas gravadas ao longo de um longo verão.' }, { title: 'Live at Nord', description: 'O set completo do show do mês passado.' }] }, noa: { headline: 'Fotógrafa em busca de luz suave e manhãs tranquilas.', bio: 'Um diário visual de cidades pequenas, longas caminhadas e os momentos intermediários.', links: ['Loja de impressões', 'Por trás das lentes', 'Diga olá'], projects: [{ title: 'Coastal light', description: 'Uma estação inteira fotografando o litoral.' }, { title: 'Quiet towns', description: 'Retratos de lugares que quase todos ignoram.' }] } },
  hi: { kenji: { headline: 'डीजे और साउंड डिज़ाइनर। हमेशा अगले सेट की तलाश में।', bio: 'लगभग हर महीने नया मिक्स, और स्टूडियो की झलकियाँ।', links: ['नवीनतम मिक्स', 'सेट के पीछे की कहानी', 'शो बुक करें'], projects: [{ title: 'Afterglow EP', description: 'एक लंबी गर्मी में रिकॉर्ड किए गए छह ट्रैक।' }, { title: 'Live at Nord', description: 'पिछले महीने के शो का पूरा सेट।' }] }, noa: { headline: 'मुलायम रोशनी और शांत सुबहों की तलाश करने वाली फ़ोटोग्राफ़र।', bio: 'छोटे कस्बों, लंबी सैर और बीच के पलों की एक दृश्य डायरी।', links: ['प्रिंट शॉप', 'लेंस के पीछे', 'नमस्ते कहें'], projects: [{ title: 'Coastal light', description: 'एक पूरा मौसम तटरेखा की फ़ोटोग्राफ़ी में बिताया।' }, { title: 'Quiet towns', description: 'उन जगहों के चित्र जिन्हें ज़्यादातर लोग बस गुज़र जाते हैं।' }] } },
}

export function personaProfile(overrides: Partial<Profile>): Profile {
  return normalizeProfile({
    theme: 'light', buttonStyle: 'solid', cardRadius: '3xl', fontStyle: 'sans', backgroundStyle: 'default',
    avatarShape: 'circle', avatarRing: true, showAvatar: true, showBadge: true, showLinkIcons: true, cardShadow: true,
    spacing: 'cozy', socialStyle: 'outline', isPublic: true, onboarded: true, layoutTemplate: 'classic', twitterIcon: 'x',
    ...overrides,
  })
}

export function personaLinks(titles: [string, string, string], urls: [string, string, string]): LinkItem[] {
  return titles.map((title, i) => ({ id: String(i + 1), title, url: urls[i], visible: true }))
}

export function personaProjects(items: [{ title: string; description: string }, { title: string; description: string }]): Project[] {
  return items.map((p, i) => ({ id: String(i + 1), title: p.title, description: p.description, url: 'https://example.com', imageURL: '', technologies: [], visible: true }))
}

export type ShowcaseStyle = 'minimal' | 'afterHours' | 'bright'
export type ShowcaseProfile = { style: ShowcaseStyle; bundle: TemplateBundle }

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
          layoutTemplate: 'magazine', socials: { twitter: 'kenjimixes', instagram: 'kenji.mixes', youtube: '@kenjimixes' },
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
          layoutTemplate: 'grid', socials: { instagram: 'noa.frames', tiktok: '@noa.frames', youtube: '@noalindgren' },
        }),
        links: personaLinks(c.noa.links, ['https://example.com', 'https://instagram.com', 'https://example.com']),
        projects: personaProjects(c.noa.projects),
      },
    },
  ]
}
