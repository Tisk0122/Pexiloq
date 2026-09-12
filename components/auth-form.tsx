'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Globe2, Loader2 } from 'lucide-react'
import { auth, firebaseEnabled, loadProfileByUsername, saveProfile } from '@/lib/firebase'
import { LanguageSwitcher, useI18n, type Language } from '@/components/i18n-provider'
import { LegalDialog } from '@/components/legal-content'
import { siteHost } from '@/lib/site'
import { browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword, GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'

const copy: Record<Language, Record<string, string>> = {
  en: { login: 'Log in to Pexiloq', signup: 'Create your Pexiloq', loginKicker: 'Welcome back', signupKicker: 'Make your place', loginBody: 'Pick up where you left off.', signupBody: 'A thoughtful home for everything you want to share.', name: 'Name', email: 'Email', password: 'Password', namePlaceholder: 'Your name', emailPlaceholder: 'you@example.com', passwordPlaceholder: 'At least 6 characters', submitLogin: 'Log in', submitSignup: 'Create account', or: 'or continue with', google: 'Google', agree: 'I agree to the', terms: 'Terms of Service', and: 'and', privacy: 'Privacy Policy', required: 'Please accept the terms and privacy policy to continue.', newHere: 'New here?', already: 'Already have an account?', signupLink: 'Sign up', loginLink: 'Log in', home: 'Back to home', wait: 'Please wait…', forgotPassword: 'Forgot?', resetSent: 'Check your email for a reset link.', keepSignedIn: 'Keep me signed in for 30 days', showPassword: 'Show password', hidePassword: 'Hide password', },
  ja: { login: 'Pexiloqにログイン', signup: 'Pexiloqを作成', loginKicker: 'おかえりなさい', signupKicker: 'あなたの場所を作る', loginBody: '続きから始めましょう。', signupBody: '共有したいすべてのためのホーム。', name: '名前', email: 'メールアドレス', password: 'パスワード', namePlaceholder: 'あなたの名前', emailPlaceholder: 'you@example.com', passwordPlaceholder: '6文字以上', submitLogin: 'ログイン', submitSignup: 'アカウントを作成', or: 'または次で続ける', google: 'Google', agree: '同意します：', terms: '利用規約', and: 'および', privacy: 'プライバシーポリシー', required: '続行するには規約への同意が必要です。', newHere: '初めてですか？', already: 'アカウントをお持ちですか？', signupLink: '新規登録', loginLink: 'ログイン', home: 'ホームに戻る', wait: 'お待ちください…', forgotPassword: 'お忘れですか？', resetSent: 'パスワード再設定用のリンクをメールでご確認ください。', keepSignedIn: '30日間ログイン状態を保持する', showPassword: 'パスワードを表示', hidePassword: 'パスワードを隠す', },
  zh: { login: '登录 Pexiloq', signup: '创建你的 Pexiloq', loginKicker: '欢迎回来', signupKicker: '打造你的空间', loginBody: '从上次离开的地方继续。', signupBody: '分享一切的专属空间。', name: '姓名', email: '邮箱', password: '密码', namePlaceholder: '你的姓名', emailPlaceholder: 'you@example.com', passwordPlaceholder: '至少 6 个字符', submitLogin: '登录', submitSignup: '创建账户', or: '或使用以下方式继续', google: 'Google', agree: '我同意', terms: '服务条款', and: '和', privacy: '隐私政策', required: '请先同意条款和隐私政策。', newHere: '还没有账户？', already: '已经有账户？', signupLink: '注册', loginLink: '登录', home: '返回首页', wait: '请稍候…', forgotPassword: '忘记密码？', resetSent: '请查收邮箱中的密码重置链接。', keepSignedIn: '保持登录状态 30 天', showPassword: '显示密码', hidePassword: '隐藏密码', },
  ko: { login: 'Pexiloq 로그인', signup: 'Pexiloq 만들기', loginKicker: '다시 만나 반가워요', signupKicker: '나만의 공간 만들기', loginBody: '이어하던 작업을 계속하세요.', signupBody: '공유하고 싶은 모든 것을 위한 공간.', name: '이름', email: '이메일', password: '비밀번호', namePlaceholder: '이름', emailPlaceholder: 'you@example.com', passwordPlaceholder: '6자 이상', submitLogin: '로그인', submitSignup: '계정 만들기', or: '또는 계속하기', google: 'Google', agree: '동의합니다:', terms: '이용약관', and: '및', privacy: '개인정보 처리방침', required: '계속하려면 약관에 동의해 주세요.', newHere: '처음이신가요?', already: '이미 계정이 있나요?', signupLink: '회원가입', loginLink: '로그인', home: '홈으로', wait: '잠시만요…', forgotPassword: '비밀번호를 잊으셨나요?', resetSent: '이메일에서 비밀번호 재설정 링크를 확인하세요.', keepSignedIn: '30일 동안 로그인 상태 유지', showPassword: '비밀번호 표시', hidePassword: '비밀번호 숨기기', },
  es: { login: 'Inicia sesión en Pexiloq', signup: 'Crea tu Pexiloq', loginKicker: 'Bienvenido de nuevo', signupKicker: 'Crea tu espacio', loginBody: 'Continúa donde lo dejaste.', signupBody: 'Un hogar para todo lo que quieres compartir.', name: 'Nombre', email: 'Correo electrónico', password: 'Contraseña', namePlaceholder: 'Tu nombre', emailPlaceholder: 'tu@ejemplo.com', passwordPlaceholder: 'Al menos 6 caracteres', submitLogin: 'Iniciar sesión', submitSignup: 'Crear cuenta', or: 'o continúa con', google: 'Google', agree: 'Acepto los', terms: 'Términos de servicio', and: 'y la', privacy: 'Política de privacidad', required: 'Acepta los términos y la política de privacidad para continuar.', newHere: '¿Eres nuevo?', already: '¿Ya tienes una cuenta?', signupLink: 'Registrarme', loginLink: 'Iniciar sesión', home: 'Volver al inicio', wait: 'Espera…', forgotPassword: '¿Olvidaste?', resetSent: 'Revisa tu correo para ver el enlace de restablecimiento.', keepSignedIn: 'Mantener la sesión iniciada durante 30 días', showPassword: 'Mostrar contraseña', hidePassword: 'Ocultar contraseña', },
  fr: { login: 'Se connecter à Pexiloq', signup: 'Créer votre Pexiloq', loginKicker: 'Bon retour', signupKicker: 'Créez votre espace', loginBody: 'Reprenez là où vous vous êtes arrêté.', signupBody: 'Un espace pour tout ce que vous souhaitez partager.', name: 'Nom', email: 'E-mail', password: 'Mot de passe', namePlaceholder: 'Votre nom', emailPlaceholder: 'vous@exemple.com', passwordPlaceholder: '6 caractères minimum', submitLogin: 'Se connecter', submitSignup: 'Créer un compte', or: 'ou continuer avec', google: 'Google', agree: 'J’accepte les', terms: 'Conditions', and: 'et la', privacy: 'Politique de confidentialité', required: 'Acceptez les conditions et la politique de confidentialité.', newHere: 'Nouveau ici ?', already: 'Vous avez déjà un compte ?', signupLink: 'S’inscrire', loginLink: 'Se connecter', home: 'Retour à l’accueil', wait: 'Patientez…', forgotPassword: 'Oublié ?', resetSent: 'Consultez votre e-mail pour le lien de réinitialisation.', keepSignedIn: 'Rester connecté pendant 30 jours', showPassword: 'Afficher le mot de passe', hidePassword: 'Masquer le mot de passe', },
  de: { login: 'Bei Pexiloq anmelden', signup: 'Dein Pexiloq erstellen', loginKicker: 'Willkommen zurück', signupKicker: 'Erstelle deinen Ort', loginBody: 'Mach dort weiter, wo du aufgehört hast.', signupBody: 'Ein Zuhause für alles, was du teilen möchtest.', name: 'Name', email: 'E-Mail', password: 'Passwort', namePlaceholder: 'Dein Name', emailPlaceholder: 'du@beispiel.de', passwordPlaceholder: 'Mindestens 6 Zeichen', submitLogin: 'Anmelden', submitSignup: 'Konto erstellen', or: 'oder weiter mit', google: 'Google', agree: 'Ich akzeptiere die', terms: 'Nutzungsbedingungen', and: 'und', privacy: 'Datenschutzerklärung', required: 'Akzeptiere die Bedingungen und Datenschutzrichtlinie.', newHere: 'Neu hier?', already: 'Du hast bereits ein Konto?', signupLink: 'Registrieren', loginLink: 'Anmelden', home: 'Zur Startseite', wait: 'Bitte warten…', forgotPassword: 'Vergessen?', resetSent: 'Prüfe deine E-Mails auf den Link zum Zurücksetzen.', keepSignedIn: '30 Tage angemeldet bleiben', showPassword: 'Passwort anzeigen', hidePassword: 'Passwort verbergen', },
  pt: { login: 'Entrar no Pexiloq', signup: 'Crie seu Pexiloq', loginKicker: 'Bem-vindo de volta', signupKicker: 'Crie seu espaço', loginBody: 'Continue de onde parou.', signupBody: 'Um lar para tudo que você quer compartilhar.', name: 'Nome', email: 'E-mail', password: 'Senha', namePlaceholder: 'Seu nome', emailPlaceholder: 'voce@exemplo.com', passwordPlaceholder: 'Pelo menos 6 caracteres', submitLogin: 'Entrar', submitSignup: 'Criar conta', or: 'ou continue com', google: 'Google', agree: 'Concordo com os', terms: 'Termos de serviço', and: 'e a', privacy: 'Política de privacidade', required: 'Aceite os termos e a política de privacidade.', newHere: 'Novo aqui?', already: 'Já tem uma conta?', signupLink: 'Cadastrar', loginLink: 'Entrar', home: 'Voltar ao início', wait: 'Aguarde…', forgotPassword: 'Esqueceu?', resetSent: 'Verifique seu e-mail para o link de redefinição.', keepSignedIn: 'Manter conectado por 30 dias', showPassword: 'Mostrar senha', hidePassword: 'Ocultar senha', },
  hi: { login: 'Pexiloq में लॉग इन करें', signup: 'अपना Pexiloq बनाएं', loginKicker: 'वापसी पर स्वागत है', signupKicker: 'अपनी जगह बनाएं', loginBody: 'जहाँ छोड़ा था वहीं से शुरू करें।', signupBody: 'आपकी साझा की गई हर चीज़ का घर।', name: 'नाम', email: 'ईमेल', password: 'पासवर्ड', namePlaceholder: 'आपका नाम', emailPlaceholder: 'you@example.com', passwordPlaceholder: 'कम से कम 6 अक्षर', submitLogin: 'लॉग इन', submitSignup: 'खाता बनाएं', or: 'या इसके साथ जारी रखें', google: 'Google', agree: 'मैं सहमत हूँ:', terms: 'सेवा की शर्तें', and: 'और', privacy: 'गोपनीयता नीति', required: 'जारी रखने के लिए शर्तों और गोपनीयता नीति को स्वीकार करें।', newHere: 'यहाँ नए हैं?', already: 'पहले से खाता है?', signupLink: 'साइन अप', loginLink: 'लॉग इन', home: 'होम पर वापस', wait: 'कृपया प्रतीक्षा करें…', forgotPassword: 'भूल गए?', resetSent: 'रीसेट लिंक के लिए अपना ईमेल जांचें।', keepSignedIn: '30 दिनों तक लॉग इन रखें', showPassword: 'पासवर्ड दिखाएं', hidePassword: 'पासवर्ड छिपाएं', },
}

function GoogleIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4"><path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z"/><path fill="#34A853" d="M12 21.7c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.7Z"/><path fill="#FBBC05" d="M6.54 13.78A5.85 5.85 0 0 1 6.23 12c0-.62.11-1.22.31-1.78V7.69H3.3A9.74 9.74 0 0 0 2.26 12c0 1.56.37 3.04 1.04 4.31l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.19c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.16 14.63 2.3 12 2.3a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C6.85 7.91 9 6.19 12 6.19Z"/></svg> }

function providerFor() { return new GoogleAuthProvider() }

// Firebase Auth errors arrive as technical codes like "auth/invalid-credential" or raw
// English messages ("Firebase: Error (auth/too-many-requests)."). Showing that directly
// breaks two rules at once: it's unreadable for non-technical or non-English-speaking
// users, and it doesn't tell them what to actually do next. This maps the handful of
// codes people realistically hit to a short, localized, actionable message, and falls
// back to a generic "something went wrong" for anything unexpected rather than ever
// surfacing Firebase's own wording.
function friendlyAuthError(err: any, t: (key: string) => string): string {
  const code: string = err?.code || ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return t('authErrorInvalidCredential')
    case 'auth/email-already-in-use':
      return t('authErrorEmailInUse')
    case 'auth/weak-password':
      return t('authErrorWeakPassword')
    case 'auth/invalid-email':
      return t('authErrorInvalidEmail')
    case 'auth/too-many-requests':
      return t('authErrorTooManyRequests')
    case 'auth/network-request-failed':
      return t('authErrorNetwork')
    default:
      return t('somethingWrong')
  }
}

async function ensureUniqueUsername(base: string): Promise<string> {
  if (!firebaseEnabled) return base
  let candidate = base
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const existing = await loadProfileByUsername(candidate)
      if (!existing) return candidate
    } catch {
      return candidate
    }
    candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`
  }
  return candidate
}

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter(); const { language, t } = useI18n(); const c = copy[language]; const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [accepted, setAccepted] = useState(false); const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false); const [showPassword, setShowPassword] = useState(false); const [keepSignedIn, setKeepSignedIn] = useState(true)
  async function finish(result: { user: { uid: string; displayName: string | null; email: string | null } }) {
    if (mode === 'signup') {
      const base = (result.user.email?.split('@')[0] || crypto.randomUUID().slice(0, 8)).toLowerCase().replace(/[^a-z0-9]/g, '') || 'creator'
      const username = await ensureUniqueUsername(base)
      await saveProfile(result.user.uid, { displayName: name || result.user.displayName || result.user.email?.split('@')[0] || 'Pexiloq creator', username, email: result.user.email || '' })
    }
    router.push('/dashboard')
  }
  async function submit(e: React.FormEvent) { e.preventDefault(); if (mode === 'signup' && !accepted) { setError(c.required); return } setBusy(true); setError(''); setNotice(''); try { if (!firebaseEnabled || !auth) { router.push('/dashboard'); return }; if (mode === 'login') await setPersistence(auth, keepSignedIn ? browserLocalPersistence : browserSessionPersistence); const result = mode === 'login' ? await signInWithEmailAndPassword(auth, email, password) : await createUserWithEmailAndPassword(auth, email, password); if (mode === 'signup') { try { await sendEmailVerification(result.user) } catch { /* best effort — the dashboard shows a banner with a resend option */ } }; await finish(result) } catch (err: any) { setError(err.code === 'auth/popup-closed-by-user' ? '' : friendlyAuthError(err, t)) } finally { setBusy(false) } }
  async function oauth() { if (mode === 'signup' && !accepted) { setError(c.required); return }; setBusy(true); setError(''); setNotice(''); try { if (!firebaseEnabled || !auth) { router.push('/dashboard'); return }; if (mode === 'login') await setPersistence(auth, keepSignedIn ? browserLocalPersistence : browserSessionPersistence); await finish(await signInWithPopup(auth, providerFor())) } catch (err: any) { setError(err.code === 'auth/popup-closed-by-user' ? '' : friendlyAuthError(err, t)) } finally { setBusy(false) } }
  async function forgotPassword() {
    setError(''); setNotice('')
    if (!email) { setError(t('authErrorInvalidEmail') || c.emailPlaceholder); return }
    setBusy(true)
    try {
      if (!firebaseEnabled || !auth) { setNotice(c.resetSent); return }
      await sendPasswordResetEmail(auth, email)
      setNotice(c.resetSent)
    } catch (err: any) {
      setError(friendlyAuthError(err, t))
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="min-h-screen bg-background px-5 py-6 sm:px-8 sm:py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-4" />{c.home}
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <Link href="/" aria-label={c.home} className="flex items-center">
            <img src="/Pexiloq_Logo.png" alt="Pexiloq" width={1774} height={887} className="h-10 w-auto object-contain sm:h-12" />
          </Link>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl items-center gap-12 py-12 lg:grid-cols-[0.85fr_1fr] lg:py-16">
        <div className="hidden rounded-[2.5rem] border bg-card p-12 shadow-xs lg:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/80">pexiloq / {mode}</p>
          <p className="mt-20 max-w-sm text-3xl font-medium leading-snug tracking-[-0.05em]">{mode === 'login' ? c.loginBody : c.signupBody}</p>
          <div className="mt-16 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Globe2 className="size-4" />{siteHost}
          </div>
        </div>
        <div className="mx-auto w-full max-w-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/80">{mode === 'login' ? c.loginKicker : c.signupKicker}</p>
          <h1 className="mt-2 text-3xl font-medium tracking-[-0.06em] sm:text-4xl">{mode === 'login' ? c.login : c.signup}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{mode === 'login' ? c.loginBody : c.signupBody}</p>
          <div className="mt-6 inline-flex items-center gap-1 rounded-full border bg-secondary/40 p-1 text-sm font-medium" role="tablist" aria-label={`${c.login} / ${c.signup}`}>
            <Link
              href="/login"
              role="tab"
              aria-selected={mode === 'login'}
              className={`rounded-full px-4 py-1.5 transition ${mode === 'login' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {c.loginLink}
            </Link>
            <Link
              href="/signup"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`rounded-full px-4 py-1.5 transition ${mode === 'signup' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {c.signupLink}
            </Link>
          </div>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => oauth()}
              disabled={busy}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border bg-card px-4 py-3.5 text-sm font-medium shadow-xs transition hover:border-foreground/30 hover:bg-secondary/40 disabled:opacity-50"
            >
              <GoogleIcon />
              <span>{busy ? c.wait : c.google}</span>
            </button>
          </div>
          <div className="relative my-6 text-center text-xs">
            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-border" /></div>
            <span className="relative bg-background px-3 font-medium text-muted-foreground">{c.or}</span>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <label className="block text-xs font-semibold text-muted-foreground">
                <span className="block mb-1.5">{c.name}</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border bg-card px-4 py-3 text-sm font-normal text-foreground outline-none transition focus:border-foreground/50 shadow-xs"
                  placeholder={c.namePlaceholder}
                />
              </label>
            )}
            <label className="block text-xs font-semibold text-muted-foreground">
              <span className="block mb-1.5">{c.email}</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border bg-card px-4 py-3 text-sm font-normal text-foreground outline-none transition focus:border-foreground/50 shadow-xs"
                placeholder={c.emailPlaceholder}
              />
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">
              <span className="mb-1.5 flex items-center justify-between">
                <span>{c.password}</span>
                {mode === 'login' && (
                  <button type="button" onClick={forgotPassword} disabled={busy} className="font-medium normal-case text-foreground/70 underline underline-offset-2 hover:text-foreground disabled:opacity-50">
                    {c.forgotPassword}
                  </button>
                )}
              </span>
              <span className="relative block">
                <input
                  required
                  minLength={6}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border bg-card px-4 py-3 pr-11 text-sm font-normal text-foreground outline-none transition focus:border-foreground/50 shadow-xs"
                  placeholder={c.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? c.hidePassword : c.showPassword}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>
            {mode === 'login' && (
              <label className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <input type="checkbox" checked={keepSignedIn} onChange={(e) => setKeepSignedIn(e.target.checked)} className="size-4 rounded-sm accent-primary" />
                {c.keepSignedIn}
              </label>
            )}
            {mode === 'signup' && (
              <label className="flex items-start gap-3 rounded-xl border bg-secondary/40 p-3.5 text-xs leading-relaxed text-muted-foreground">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 size-4 accent-primary rounded-sm" />
                <span>
                  {c.agree}{' '}
                  <button type="button" onClick={() => setLegal('terms')} className="font-medium text-foreground underline underline-offset-2">
                    {c.terms}
                  </button>{' '}
                  {c.and}{' '}
                  <button type="button" onClick={() => setLegal('privacy')} className="font-medium text-foreground underline underline-offset-2">
                    {c.privacy}
                  </button>.
                </span>
              </label>
            )}
            {notice && <p role="status" className="rounded-xl bg-secondary px-4 py-3 text-xs font-medium text-foreground">{notice}</p>}
            {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">{error}</p>}
            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground shadow-xs transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <><Loader2 className="size-4 animate-spin" />{c.wait}</> : mode === 'login' ? c.submitLogin : c.submitSignup}
              {!busy && <ArrowUpRight className="size-4" />}
            </button>
          </form>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            {mode === 'login' ? c.newHere : c.already}{' '}
            <Link className="font-medium text-foreground underline underline-offset-4" href={mode === 'login' ? '/signup' : '/login'}>
              {mode === 'login' ? c.signupLink : c.loginLink}
            </Link>
          </p>
        </div>
      </div>
      {legal && <LegalDialog kind={legal} onClose={() => setLegal(null)} />}
    </main>
  )
}
