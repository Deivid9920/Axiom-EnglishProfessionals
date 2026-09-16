'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { MS, Loader2 } from '@/components/icons'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'

// Types
interface User { id: string; email: string; name?: string | null; roles: string[] }
interface Message { role: 'user' | 'assistant' | 'system'; content: string; corrections?: { type: string; original: string; corrected: string; explanation: string }[] }
interface Profile {
  userId: string; cefrInitial: string; cefrCurrent: string; theta: number; thetaSE: number;
  skills: { reading: number; writing: number; listening: number; speaking: number };
  skillCEFRs: { reading: string; writing: string; listening: string; speaking: string };
  learningMode: string;
  professionalDomain: string; jobRole?: string | null;
  learningGoals: string[]; weeklyMinutesGoal: number; onboardingCompleted: boolean;
}
interface Subscription {
  planCode: string;
  features: { maxSessionsPerMonth: number; ragEnabled: boolean; voiceEnabled: boolean; teamEnabled: boolean; adminEnabled: boolean; prioritySupport: boolean } | null;
  subscription: { id: string; status: string; cadence: string; currentPeriodStart: string; currentPeriodEnd: string; cancelAtPeriodEnd: boolean } | null;
}

// Warm pastel palette for skills (coral/mostaza/salvia/terracota)
const PASTEL = {
  reading: { bg: 'var(--ax-surface-peach)', text: 'var(--ax-skill-reading)', icon: '#E76F51', name: 'Lectura', iconName: 'menu_book' },
  writing: { bg: 'var(--ax-surface-amber)', text: 'var(--ax-skill-writing)', icon: '#E9B83E', name: 'Escritura', iconName: 'edit_note' },
  listening: { bg: 'var(--ax-surface-sage)', text: 'var(--ax-skill-listening)', icon: '#6B8E6A', name: 'Audición', iconName: 'hearing' },
  speaking: { bg: 'var(--ax-surface-clay)', text: 'var(--ax-skill-speaking)', icon: '#B85C3C', name: 'Expresión oral', iconName: 'record_voice_over' },
}

// Axiom logo — letter "A" with animated draw-in lines + pulsing vertex nodes
function AxiomLogo({ size = 32, light = false }: { size?: number; light?: boolean }) {
  const stroke = light ? 'rgba(255, 251, 245, 0.55)' : '#2D2A26'
  const fillMain = light ? '#FAF3E7' : '#2D2A26'
  const fillDim = light ? 'rgba(255, 251, 245, 0.6)' : 'rgba(45, 42, 38, 0.45)'
  return (
    <svg className="logo-svg" width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Left diagonal of the A */}
      <line className="l-line" x1="8" y1="36" x2="22" y2="6" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
      {/* Right diagonal of the A */}
      <line className="l-line" x1="36" y1="36" x2="22" y2="6" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
      {/* Crossbar */}
      <line className="l-line l-line-cross" x1="14.5" y1="24" x2="29.5" y2="24" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
      {/* Vertex nodes (apex, two feet, two crossbar junctions) */}
      <circle className="l-node" cx="22" cy="6" r="5" fill={fillMain} />
      <circle className="l-node" cx="8" cy="36" r="5" fill={fillMain} />
      <circle className="l-node" cx="36" cy="36" r="5" fill={fillMain} />
      <circle className="l-node" cx="14.5" cy="24" r="3.2" fill={fillDim} />
      <circle className="l-node" cx="29.5" cy="24" r="3.2" fill={fillDim} />
    </svg>
  )
}

// Main App
export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'auth' | 'app'>('auth')

  // La consulta de sesión devuelve promesas con callbacks diferidos: los
  // cambios de estado ocurren tras resolver el fetch, no durante el montaje.
  function checkAuth() {
    return fetch('/api/auth')
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data?.authenticated) { setUser(data.user); setView('app') } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    void checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="flex flex-col items-center gap-4">
          <AxiomLogo size={48} />
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted-navy)]">
            <Loader2 className="w-3 h-3 animate-spin" /> Cargando Axiom…
          </div>
        </div>
      </div>
    )
  }

  if (view === 'auth' || !user) return <AuthScreen onAuthed={(u) => { setUser(u); setView('app') }} />
  return <AppShell user={user} onLogout={() => { setUser(null); setView('auth') }} />
}

// Auth Screen — Warm gradient + rotating motivational messages
const AUTH_MESSAGES = [
  { icon: 'work', title: 'Aprende inglés dentro de tu trabajo', sub: 'Convierte cada email, reunión y reporte en una oportunidad de practicar.' },
  { icon: 'smart_toy', title: 'Tu asesor IA personal, 24/7', sub: 'Correcciones pedagógicas en tiempo real, sin filas, sin esperas.' },
  { icon: 'description', title: 'Practica con tus propios documentos', sub: 'RAG sobre PDFs, presentaciones, código y transcripciones de reuniones.' },
  { icon: 'analytics', title: 'Métricas pedagógicas con IRT 3PL y FSRS', sub: 'Estimación Bayesian adaptive del nivel y repaso espaciado óptimo.' },
  { icon: 'public', title: 'Diseñado para profesionistas mexicanos', sub: 'Contexto, vocabulario y escenarios de tu industria y tu mercado.' },
]

function AuthScreen({ onAuthed }: { onAuthed: (u: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % AUTH_MESSAGES.length), 4200)
    return () => clearInterval(t)
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = mode === 'register' ? '/api/auth?action=register' : '/api/auth'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'register' ? { email, password, name } : { email, password }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error'); return }
      toast.success(mode === 'register' ? 'Cuenta creada' : 'Sesión iniciada')
      onAuthed(data.user)
    } catch { toast.error('Error de red') }
    finally { setLoading(false) }
  }

  return (
    <main className="grid grid-cols-1 md:grid-cols-2 min-h-screen bg-crema">
      {/* Left — warm gradient hero with rotating motivational messages */}
      <section className="hidden md:flex auth-hero-warm relative p-12 lg:p-20 flex-col justify-between text-white overflow-hidden" aria-label="Presentación Axiom">
        <div className="orb" style={{ top: '-80px', right: '-80px', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(233, 184, 62, 0.5) 0%, transparent 70%)' }} />
        <div className="orb" style={{ bottom: '-60px', left: '-60px', width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(244, 163, 138, 0.5) 0%, transparent 70%)', animationDelay: '2s' }} />

        <div className="relative z-10 flex items-center gap-3 cursor-pointer select-none">
          <AxiomLogo size={44} light />
          <span className="text-2xl font-bold tracking-tight">Axiom</span>
        </div>

        {/* Rotating motivational messages */}
        <div className="relative z-10 min-h-[280px] flex items-center">
          {AUTH_MESSAGES.map((m, i) => (
            <div key={i} className={`motiv-message ${i === msgIdx ? 'shown-msg' : 'hidden-msg'}`}>
              <div className="max-w-md">
                <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25">
                  <MS name={m.icon} className="!text-[16px]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Axiom</span>
                </div>
                <h2 className="text-3xl lg:text-[2.6rem] font-bold leading-[1.15] tracking-tight drop-shadow-sm">{m.title}</h2>
                <p className="text-white/85 text-base lg:text-lg mt-4 leading-relaxed max-w-sm">{m.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex gap-1.5">
            {AUTH_MESSAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setMsgIdx(i)}
                aria-label={`Ver mensaje ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === msgIdx ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
          <p className="text-xs opacity-70 ml-2">© 2026 Axiom</p>
        </div>
      </section>

      {/* Right — form on warm cream */}
      <section className="bg-crema p-6 md:p-12 lg:p-20 flex items-center justify-center">
        <div className="w-full max-w-[480px]">
          <div className="bg-papel rounded-[28px] p-8 md:p-10 form-shadow border border-[var(--color-border-soft)]">
            <div className="flex items-center gap-3 mb-8 md:hidden">
              <div className="w-10 h-10 bg-coral rounded-xl flex items-center justify-center"><MS name="translate" className="text-papel" fill /></div>
              <span className="text-xl font-semibold text-carbon tracking-tighter">Axiom</span>
            </div>
            <nav className="tab-pill mb-8" role="tablist">
              <button role="tab" aria-selected={mode === 'login'} className={`tab-pill-button ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Iniciar Sesión</button>
              <button role="tab" aria-selected={mode === 'register'} className={`tab-pill-button ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Registrarse</button>
            </nav>
            {mode === 'login' ? (
              <><h1 className="text-[28px] font-semibold text-carbon mb-1 tracking-tight">¡Hola de nuevo!</h1><p className="text-sm text-grafito mb-7">Continúa aprendiendo inglés a tu ritmo.</p></>
            ) : (
              <><h1 className="text-[28px] font-semibold text-carbon mb-1 tracking-tight">Crea tu cuenta</h1><p className="text-sm text-grafito mb-7">Empieza a aprender inglés hoy mismo.</p></>
            )}
            <form onSubmit={submit} className="space-y-5">
              {mode === 'register' && (
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-carbon ml-1">Nombre</label>
                  <div className="relative">
                    <MS name="person" className="absolute left-4 top-1/2 -translate-y-1/2 text-grafito pointer-events-none" />
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" autoComplete="name" className="w-full pl-12 pr-4 py-4 bg-crema/60 border-[var(--color-border-soft)] rounded-2xl focus:ring-2 focus:ring-coral/30 focus:border-coral transition-all outline-none text-sm h-12" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-carbon ml-1">Correo</label>
                <div className="relative">
                  <MS name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-grafito pointer-events-none" />
                  <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="nombre@empresa.mx" autoComplete="email" className="w-full pl-12 pr-4 py-4 bg-crema/60 border-[var(--color-border-soft)] rounded-2xl focus:ring-2 focus:ring-coral/30 focus:border-coral transition-all outline-none text-sm h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-carbon ml-1">Contraseña</label>
                <div className="relative">
                  <MS name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-grafito pointer-events-none" />
                  <Input id="password" type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} className="w-full pl-12 pr-12 py-4 bg-crema/60 border-[var(--color-border-soft)] rounded-2xl focus:ring-2 focus:ring-coral/30 focus:border-coral transition-all outline-none text-sm h-12" />
                  <button type="button" onClick={() => setShowPass(!showPass)} aria-label="Mostrar contraseña" className="absolute right-4 top-1/2 -translate-y-1/2 text-grafito hover:text-coral transition-colors"><MS name={showPass ? 'visibility_off' : 'visibility'} /></button>
                </div>
              </div>
              <button type="submit" disabled={loading} className={`w-full py-4 btn-tactile font-semibold text-lg rounded-2xl transition-all flex items-center justify-center gap-2 mt-2 ${loading ? 'btn-loading' : ''}`}>
                <span className="spinner-axiom" /><span className="btn-text flex items-center gap-2">{loading ? 'Procesando…' : (mode === 'register' ? 'Crear cuenta' : 'Ingresar')}</span>
              </button>
            </form>
            <p className="mt-8 text-center text-xs text-grafito">
              {mode === 'login' ? '¿Nuevo en Axiom?' : '¿Ya tienes cuenta?'}{' '}
              <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-coral font-bold hover:text-terracota ml-1 underline decoration-coral/30 underline-offset-4 transition-colors">
                {mode === 'login' ? 'Crea una cuenta gratuita' : 'Inicia sesión'}
              </button>
            </p>
          </div>
          <button onClick={() => { setEmail('admin@axiom.mx'); setPassword('axiom12345'); setMode('login'); toast.info('Credenciales demo cargadas') }} className="mt-4 w-full py-3 px-4 bg-papel border border-[var(--color-border-soft)] rounded-2xl text-sm font-medium text-carbon hover:border-coral hover:bg-coral/5 transition-all flex items-center justify-center gap-2">
            <MS name="bolt" className="text-coral" /> Usar cuenta demo
          </button>
        </div>
      </section>
    </main>
  )
}

// App Shell — Unified Writing tab (typing + translation selection cards)
type TabKey = 'dashboard' | 'chat' | 'reading' | 'writing' | 'voice' | 'premium' | 'plans' | 'metrics' | 'admin'

function AppShell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tab, setTab] = useState<TabKey>('dashboard')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('axiom-theme') as 'light' | 'dark') || 'light'
  })
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('axiom-onboarding-done') !== 'true'
  })

  // Apply theme class to <html>
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('axiom-theme', theme)
  }, [theme])

  const loadProfile = useCallback(async () => {
    const [pRes, sRes] = await Promise.all([fetch('/api/profile'), fetch('/api/billing')])
    if (pRes.ok) { const data = await pRes.json(); setProfile(data.profile) }
    if (sRes.ok) { const data = await sRes.json(); setSubscription({ planCode: data.plan?.code || 'basico', features: data.plan?.features || null, subscription: data.subscription }) }
  }, [])

  useEffect(() => { let cancelled = false; (async () => { await loadProfile(); if (cancelled) return })(); return () => { cancelled = true } }, [loadProfile])

  const isAdmin = user.roles.includes('ADMIN')
  const navItems: { key: TabKey; label: string; icon: string; adminOnly?: boolean }[] = [
    { key: 'dashboard', label: 'Inicio', icon: 'space_dashboard' },
    { key: 'chat', label: 'Asesor IA', icon: 'smart_toy' },
    { key: 'reading', label: 'Lectura', icon: 'record_voice_over' },
    { key: 'writing', label: 'Escritura', icon: 'edit_note' },
    { key: 'voice', label: 'Voz Natural', icon: 'text_to_speech' },
    { key: 'premium', label: 'Premium', icon: 'workspace_premium' },
    { key: 'plans', label: 'Planes', icon: 'credit_card' },
    { key: 'metrics', label: 'Métricas', icon: 'analytics' },
  ]

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="sidebar-axiom">
        <div className="flex items-center gap-2.5 mb-10 px-1 w-full justify-center">
          <AxiomLogo size={28} light />
          <span className="sidebar-text text-lg font-bold text-white tracking-tight">Axiom</span>
        </div>
        <div className="w-full flex-1">
          <div className="sidebar-label">Menú</div>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setTab(item.key)} className={`sidebar-link ${tab === item.key ? 'active' : ''}`} aria-current={tab === item.key ? 'page' : undefined}>
              <MS name={item.icon} className="!text-[20px] flex-shrink-0" />
              <span className="sidebar-text">{item.label}</span>
            </button>
          ))}
          {isAdmin && (
            <>
              <div className="sidebar-label mt-4">Admin</div>
              <button onClick={() => setTab('admin')} className={`sidebar-link ${tab === 'admin' ? 'active' : ''}`} aria-current={tab === 'admin' ? 'page' : undefined}><MS name="admin_panel_settings" className="!text-[20px]" /><span className="sidebar-text">Panel Admin</span></button>
            </>
          )}
        </div>
        <div className="w-full pt-3 border-t border-white/10 space-y-1">
          {/* Theme toggle */}
          <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-white/5 mb-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${theme === 'light' ? 'bg-coral text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
              aria-label="Modo claro"
            >
              <MS name="light_mode" className="!text-[16px]" />
              <span className="sidebar-text">Claro</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${theme === 'dark' ? 'bg-coral text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
              aria-label="Modo oscuro"
            >
              <MS name="dark_mode" className="!text-[16px]" />
              <span className="sidebar-text">Oscuro</span>
            </button>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #E76F51, #C2553A)', color: '#FFF' }}>
              {(user.name || user.email)[0].toUpperCase()}
            </div>
            <div className="sidebar-text overflow-hidden">
              <div className="text-white text-xs font-semibold truncate">{user.name || 'Usuario'}</div>
              <div className="text-white/40 text-[10px] truncate">{user.email}</div>
            </div>
          </div>
          <button onClick={onLogout} className="sidebar-link mt-1 !justify-center hover:!bg-red-500/10 hover:!text-red-300">
            <MS name="logout" className="!text-[20px]" /><span className="sidebar-text">Cerrar sesión</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-[72px] p-6 lg:p-8 min-w-0" style={{ marginLeft: '72px' }}>
        <div className="max-w-[1400px] mx-auto">
          <div key={tab} className="fade-up">
            {tab === 'dashboard' && <DashboardTab user={user} profile={profile} subscription={subscription} onRefresh={loadProfile} onNavigate={setTab} />}
            {tab === 'chat' && <ChatTab profile={profile} />}
            {tab === 'reading' && <ReadingTab profile={profile} subscription={subscription} />}
            {tab === 'writing' && <WritingHubTab profile={profile} />}
            {tab === 'voice' && <VoiceStudioTab profile={profile} />}
            {tab === 'premium' && <PremiumTab profile={profile} subscription={subscription} />}
            {tab === 'plans' && <PlansTab subscription={subscription} onUpdated={loadProfile} />}
            {tab === 'metrics' && <MetricsTab profile={profile} />}
            {tab === 'admin' && <AdminTab user={user} />}
          </div>
        </div>
      </main>
      {/* Onboarding overlay for new users */}
      {showOnboarding && (
        <OnboardingTour onClose={() => {
          setShowOnboarding(false)
          localStorage.setItem('axiom-onboarding-done', 'true')
        }} onNavigate={(t) => setTab(t)} />
      )}
    </div>
  )
}

// 1. DASHBOARD — Accesos directos a módulos y temas del currículo
function DashboardTab({ user, profile, subscription, onRefresh, onNavigate }: {
  user: User; profile: Profile | null; subscription: Subscription | null; onRefresh: () => void; onNavigate: (t: TabKey) => void
}) {
  const [curriculum, setCurriculum] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/curriculum').then(r => r.json()).then(c => {
      if (c?.ok) setCurriculum(c)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#E76F51]" /></div>

  const inProgressTopics = curriculum?.topics?.filter((t: any) => t.status === 'in_progress' || t.status === 'completed') || []
  const upcomingTopics = curriculum?.topics?.filter((t: any) => t.status === 'not_started' && t.isUpcoming) || []
  const currentTopics = curriculum?.topics?.filter((t: any) => t.status === 'not_started' && !t.isUpcoming) || []

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-navy)]">Tu espacio</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#2D2A26] tracking-tight mt-1">
            ¡Hola, <span style={{ color: '#E76F51' }}>{user.name || user.email.split('@')[0]}</span>!
          </h1>
          <p className="text-sm text-[var(--color-muted-navy)] mt-0.5">
            Continúa donde te quedaste. Tu avance detallado vive en la pestaña de Métricas.
          </p>
        </div>
        <button onClick={() => onNavigate('chat')} className="btn-tactile px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
          <MS name="play_arrow" /> Practicar ahora
        </button>
      </div>

      {/* Topic Cards — What you're studying */}
      <div>
        <h2 className="text-lg font-bold text-[#2D2A26] mb-3 tracking-tight flex items-center gap-2">
          <MS name="school" className="!text-[20px] text-[#E76F51]" /> Lo que estás aprendiendo
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentTopics.slice(0, 6).map((t: any) => (
            <button key={t.id} onClick={() => {
              // Map DB module names to TabKey — typing/translation now live under 'writing'
              const moduleMap: Record<string, TabKey> = {
                typing: 'writing', translation: 'writing',
                conversation: 'chat', voice: 'voice', reading: 'reading',
              }
              onNavigate(moduleMap[t.module] || 'dashboard')
            }} className="module-card-axiom mc-teal text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: (t.color || '#E76F51') + '15' }}>
                  <MS name={t.icon || 'school'} className="!text-[20px]" style={{ color: t.color || '#E76F51' } as any} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#2D2A26] truncate">{t.title}</div>
                  <span className="pill-badge pill-teal">{t.cefrLevel}</span>
                </div>
              </div>
              <p className="text-xs text-[var(--color-muted-navy)] leading-relaxed">{t.description}</p>
            </button>
          ))}
          {currentTopics.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-[var(--color-border-soft)] p-8 text-center">
              <MS name="auto_awesome" className="!text-[40px] text-[#E76F51] mb-2" />
              <p className="text-sm text-[var(--color-muted-navy)]">¡Empieza tu primera lección para ver tu progreso aquí!</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming topics */}
      {upcomingTopics.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#2D2A26] mb-3 tracking-tight flex items-center gap-2">
            <MS name="upcoming" className="!text-[20px] text-[#E9B83E]" /> Lo que viene próximamente
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingTopics.slice(0, 3).map((t: any) => (
              <div key={t.id} className="bg-white rounded-2xl border border-dashed border-[#E9B83E]/30 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--ax-surface-amber)' }}>
                    <MS name={t.icon || 'lock'} className="!text-[20px]" style={{ color: '#E9B83E' } as any} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#2D2A26] truncate">{t.title}</div>
                    <span className="pill-badge pill-amber">Próximo nivel</span>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-muted-navy)] leading-relaxed">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 2. CHAT — Asesor IA
function ChatTab({ profile }: { profile: Profile | null }) {
  const [mode, setMode] = useState<'casual' | 'technical_interview' | 'reinforcement'>('casual')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [messages])

  async function startSession() {
    setSending(true); setMessages([])
    try {
      const res = await fetch('/api/modules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ module: 'conversation', mode }) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setSessionId(data.session.id)
      if (data.firstResponse) setMessages([{ role: 'assistant', content: data.firstResponse.content, corrections: data.firstResponse.corrections }])
      toast.success('Sesión iniciada')
    } catch { toast.error('Error de red') } finally { setSending(false) }
  }

  async function send() {
    if (!input.trim() || !sessionId) return
    const userMsg = input.trim(); setInput(''); setMessages(prev => [...prev, { role: 'user', content: userMsg }]); setSending(true)
    try {
      const res = await fetch('/api/modules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, message: userMsg }) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setMessages(prev => [...prev, { role: 'assistant', content: data.response.content, corrections: data.response.corrections }])
    } catch { toast.error('Error de red') } finally { setSending(false) }
  }

  async function endSession() {
    if (!sessionId) return
    await fetch('/api/modules', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
    toast.success('Sesión finalizada. ¡Buen trabajo!')
    setSessionId(null); setMessages([])
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Tu asesor de IA</h2>
        <p className="text-sm text-[var(--color-muted-navy)] mt-0.5">Conversa en inglés con tu tutor personal. Te corregirá en tiempo real.</p>
      </div>
      <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border-soft)] bg-paper">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#2D2A26] flex items-center justify-center"><MS name="smart_toy" className="text-white !text-[20px]" /></div>
            <div>
              <div className="font-bold text-sm text-[#2D2A26]">Asesor IA</div>
              <div className="flex items-center gap-1.5 text-xs">
                {sessionId ? <><span className="live-dot" /><span className="text-[#6B8E6A] font-medium">Conectado</span></> : <span className="text-[var(--color-muted-navy)]">Desconectado</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!sessionId && (
              <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                <SelectTrigger className="w-[180px] h-9 bg-white border-[var(--color-border-soft)] rounded-lg text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="technical_interview">Entrevista</SelectItem>
                  <SelectItem value="reinforcement">Refuerzo</SelectItem>
                </SelectContent>
              </Select>
            )}
            {sessionId ? (
              <button onClick={endSession} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#E24B4A]/8 text-[#E24B4A] border border-[#E24B4A]/20 hover:bg-[#E24B4A]/14 transition-colors">
                <MS name="stop_circle" className="!text-[14px]" /> Terminar
              </button>
            ) : (
              <button onClick={startSession} disabled={sending} className="btn-tactile px-4 py-2 rounded-lg text-xs flex items-center gap-1.5">
                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <MS name="play_arrow" className="!text-[14px]" />} Iniciar
              </button>
            )}
          </div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-axiom p-6 bg-paper">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #FCEAE3, #F4DDD2)' }}>
                <MS name="smart_toy" className="!text-[40px] text-[#E76F51]" />
              </div>
              <h3 className="text-lg font-bold text-[#2D2A26] tracking-tight mb-1">{sessionId ? 'Escribe tu primer mensaje' : 'Habla con tu asesor de IA'}</h3>
              <p className="text-sm text-[var(--color-muted-navy)] max-w-md">
                {sessionId ? 'Tu asesor te responderá en inglés y te corregirá los errores.' : `Tu asesor se adaptará a tu nivel (${profile?.cefrCurrent || 'A2'}). ¡Solo presiona "Iniciar"!`}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
              {sending && <div className="flex items-center gap-2 text-xs text-[var(--color-muted-navy)] ml-12"><Loader2 className="w-3 h-3 animate-spin" /> Tu asesor está pensando…</div>}
            </div>
          )}
        </div>
        {sessionId && (
          <div className="border-t border-[var(--color-border-soft)] bg-white p-4">
            <div className="max-w-3xl mx-auto flex gap-2 items-end">
              <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe en inglés…" className="min-h-[48px] max-h-[120px] resize-none rounded-2xl border-[var(--color-border-soft)] bg-paper focus:bg-white focus:border-[#E76F51] focus:ring-2 focus:ring-[#E76F51]/20 transition-all text-sm py-3 px-4" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
              <button onClick={send} disabled={sending || !input.trim()} className="w-12 h-12 rounded-2xl btn-tactile flex items-center justify-center flex-shrink-0 disabled:opacity-50" aria-label="Enviar">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MS name="send" className="!text-[20px]" />}
              </button>
            </div>
            <p className="text-[10px] text-[var(--color-muted-navy)] text-center mt-2">Enter para enviar · Shift + Enter para nueva línea</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-2.5 msg-in max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
      <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold" style={isUser ? { background: 'linear-gradient(135deg, #E76F51, #C2553A)', color: '#2D2A26' } : { background: '#2D2A26', color: '#fff' }}>
        {isUser ? 'YO' : <MS name="smart_toy" className="!text-[18px]" />}
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}>
          {message.content.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-1.5' : ''}>{line}</p>)}
          {message.corrections && message.corrections.length > 0 && (
            <div className="correction-card-axiom">
              <div className="correction-head"><MS name="spellcheck" className="!text-[14px]" /> Correcciones ({message.corrections.length})</div>
              <div className="space-y-2">
                {message.corrections.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs flex-wrap">
                    <span className="pill-badge pill-error flex-shrink-0"><s>{c.original}</s></span>
                    <MS name="arrow_forward" className="!text-[14px] text-[var(--color-muted-navy)] mt-0.5" />
                    <span className="pill-badge pill-success flex-shrink-0">{c.corrected}</span>
                    <span className="text-[var(--color-muted-navy)] text-[11px] mt-0.5">{c.explanation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 3. LECTURA Y PRONUNCIACIÓN — Textos de BD + Micrófono + TTS Kokoro
function ReadingTab({ profile, subscription }: { profile: Profile | null; subscription: Subscription | null }) {
  const [readingText, setReadingText] = useState<{ id: string; title: string; content: string; wordCount: number; cefrLevel: string } | null>(null)
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Track word-level errors for visual display
  const [wordErrors, setWordErrors] = useState<{ word: string; index: number; error: string }[]>([])

  async function loadText() {
    setLoading(true); setFeedback(null); setTranscript(''); setWordErrors([])
    try {
      const res = await fetch('/api/reading')
      const data = await res.json()
      if (res.ok) { setReadingText(data.text); toast.success('Texto cargado') }
      else toast.error(data.error)
    } finally { setLoading(false) }
  }

  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { toast.error('Tu navegador no soporta reconocimiento de voz. Usa Chrome.'); return }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'; recognition.continuous = true; recognition.interimResults = true
    recognition.onresult = (event: any) => {
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript + ' '
      }
      if (final) setTranscript(prev => prev + final)
    }
    recognition.onerror = (e: any) => { toast.error(`Error: ${e.error}`); setListening(false) }
    recognition.onend = () => setListening(false)
    recognition.start(); recognitionRef.current = recognition; setListening(true); setTranscript('')
    toast.info('Escuchando… lee el texto en voz alta')
  }

  function stopListening() { recognitionRef.current?.stop(); setListening(false) }

  async function analyzePronunciation() {
    if (!transcript.trim() || !readingText) { toast.error('No hay transcripción para analizar'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalText: readingText.content, spokenText: transcript }),
      })
      const data = await res.json()
      if (res.ok) {
        setFeedback(data)
        // Compute word-level errors for visual display
        const origWords = readingText.content.toLowerCase().match(/\b[\w']+\b/g) || []
        const spokenWords = transcript.toLowerCase().match(/\b[\w']+\b/g) || []
        const errors: { word: string; index: number; error: string }[] = []
        for (let i = 0; i < origWords.length; i++) {
          if (i >= spokenWords.length) { errors.push({ word: origWords[i], index: i, error: 'Faltante' }) }
          else if (origWords[i] !== spokenWords[i]) {
            const dist = levenshteinSimple(origWords[i], spokenWords[i])
            if (dist > 1 || origWords[i].length <= 3) errors.push({ word: origWords[i], index: i, error: spokenWords[i] })
          }
        }
        setWordErrors(errors)
        toast.success('Análisis completo')
      } else toast.error(data.error)
    } finally { setLoading(false) }
  }

  async function playTTS() {
    if (!readingText) return
    setTtsLoading(true)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: readingText.content, voice: 'af_heart', speed: 0.9 }),
      })
      const data = await res.json()
      if (res.ok && data.audio) {
        const blob = new Blob([Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))], { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setTimeout(() => audioRef.current?.play(), 100)
        toast.success('Reproduciendo audio natural (Kokoro)')
      } else if (data.available === false || data.error?.includes('no disponible')) {
        // Fallback to Web Speech API
        playWebSpeechFallback(readingText.content)
      } else {
        toast.error(data.error || 'TTS no disponible')
      }
    } catch {
      // Network error — try Web Speech fallback
      playWebSpeechFallback(readingText.content)
    } finally { setTtsLoading(false) }
  }

  function playWebSpeechFallback(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Tu navegador no soporta síntesis de voz. Usa Chrome o Edge.')
      return
    }
    const synth = window.speechSynthesis
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    const voices = synth.getVoices()
    const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google')) || voices.find(v => v.lang.startsWith('en'))
    if (enVoice) utterance.voice = enVoice
    synth.speak(utterance)
    toast.info('Reproduciendo voz natural (Web Speech API)')
  }

  // Render text with word-level error highlighting
  const renderTextWithErrors = () => {
    if (!readingText) return null
    const words = readingText.content.split(/(\s+)/)
    const errorSet = new Set(wordErrors.map(e => e.index))
    let wordIdx = 0
    return words.map((part, i) => {
      if (/\s/.test(part)) return part
      const isError = errorSet.has(wordIdx)
      const errorInfo = wordErrors.find(e => e.index === wordIdx)
      wordIdx++
      return (
        <span key={i} className={isError ? 'bg-red-100 text-red-700 rounded px-1 cursor-help' : ''} title={errorInfo ? `Dijiste: "${errorInfo.error}"` : ''}>
          {part}
        </span>
      )
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Lectura y Pronunciación</h2>
        <p className="text-sm text-[var(--color-muted-navy)] mt-0.5">Lee textos en voz alta y mejora tu pronunciación con feedback instantáneo.</p>
      </div>

      {/* Reading text card */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border-soft)] bg-paper">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: PASTEL.reading.bg }}>
              <MS name="menu_book" className="!text-[20px]" style={{ color: PASTEL.reading.icon } as any} />
            </div>
            <div>
              <div className="font-bold text-sm text-[#2D2A26]">{readingText?.title || 'Selecciona un texto'}</div>
              {readingText && <div className="text-xs text-[var(--color-muted-navy)]">{readingText.wordCount} palabras · Nivel {readingText.cefrLevel}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadText} disabled={loading} className="text-xs font-semibold text-[#E76F51] bg-[#E76F51]/10 hover:bg-[#E76F51]/15 px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MS name="refresh" className="!text-[14px]" />} Nuevo texto
            </button>
            {readingText && (
              <button onClick={playTTS} disabled={ttsLoading} className="text-xs font-semibold text-[#B85C3C] bg-[#F4DDD2] hover:bg-[#F4DDD2]/80 px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
                {ttsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MS name="volume_up" className="!text-[14px]" />} Escuchar
              </button>
            )}
          </div>
        </div>
        {readingText ? (
          <div className="p-6">
            {wordErrors.length > 0 ? (
              <p className="text-base text-[#2D2A26] leading-relaxed">{renderTextWithErrors()}</p>
            ) : (
              <p className="text-base text-[#2D2A26] leading-relaxed">{readingText.content}</p>
            )}
            {wordErrors.length > 0 && (
              <div className="mt-4 p-3 bg-[#FBEFD6] rounded-xl border border-[#E9B83E]/20">
                <p className="text-xs font-semibold text-[#C99627] flex items-center gap-1">
                  <MS name="info" className="!text-[14px]" /> Las palabras en rojo son las que pronunciaste incorrectamente. Pasa el cursor sobre ellas para ver qué dijiste.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center">
            <button onClick={loadText} className="btn-tactile px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
              <MS name="play_arrow" /> Cargar texto para leer
            </button>
          </div>
        )}
      </div>

      {/* Mic + recording controls */}
      {readingText && (
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
          <h3 className="font-bold text-[#2D2A26] text-base mb-4 flex items-center gap-2">
            <MS name="mic" className="!text-[20px]" style={{ color: listening ? '#E24B4A' : PASTEL.speaking.icon } as any} />
            Tu lectura en voz alta
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            {/* Large microphone button */}
            <button
              onClick={listening ? stopListening : startListening}
              className="relative group flex-shrink-0"
              title={listening ? 'Detener grabación' : 'Empezar a grabar'}
              aria-label={listening ? 'Detener grabación' : 'Empezar a grabar'}
            >
              {/* Pulsing rings when listening */}
              {listening && (
                <>
                  <span className="absolute inset-0 rounded-full bg-[#E24B4A] opacity-20 animate-ping" style={{ animationDuration: '1.5s' }} />
                  <span className="absolute inset-0 rounded-full bg-[#E24B4A] opacity-30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                </>
              )}
              <div
                className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 ${
                  listening
                    ? 'bg-gradient-to-br from-[#E24B4A] to-[#C0392B] shadow-[#E24B4A]/40'
                    : 'bg-gradient-to-br from-[#7B1FA2] to-[#AB47BC] shadow-[#7B1FA2]/40'
                }`}
              >
                <MS name={listening ? 'stop' : 'mic'} className="!text-[36px] text-white" />
              </div>
              {/* Label below */}
              <div className="text-center mt-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${listening ? 'text-[#E24B4A] recording-blink' : 'text-[#7B1FA2]'}`}>
                  {listening ? 'Grabando…' : 'Iniciar'}
                </span>
              </div>
            </button>

            {/* Instructions + analyze button */}
            <div className="flex-1 w-full">
              <div className="bg-crema/50 rounded-xl p-3 mb-3 border border-[var(--color-border-soft)]">
                <p className="text-xs text-grafito leading-relaxed flex items-start gap-1.5">
                  <MS name="tips_and_updates" className="!text-[14px] text-mostaza-dark mt-0.5" />
                  <span>
                    {listening
                      ? <strong>Leyendo…</strong>
                      : 'Presiona el botón del micrófono y lee el texto en voz alta. Después pulsa <strong>Analizar pronunciación</strong>.'}
                  </span>
                </p>
              </div>
              <button onClick={analyzePronunciation} disabled={loading || !transcript} className="btn-tactile w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MS name="analytics" className="!text-[16px]" />} Analizar pronunciación
              </button>
            </div>
          </div>
          <Textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Lo que digas aparecerá aquí…" className="min-h-[100px] border-[var(--color-border-soft)] focus:border-[#E76F51] focus:ring-2 focus:ring-[#E76F51]/20 text-sm" />
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
          <h3 className="font-bold text-[#2D2A26] text-base mb-4 flex items-center gap-2">
            <MS name="insights" className="!text-[20px] text-[#E76F51]" /> Resultados de tu pronunciación
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <PronStat label="Precisión" value={`${Math.round(feedback.metrics.accuracy * 100)}%`} icon="spellcheck" color="#E76F51" />
            <PronStat label="Palabras/min" value={feedback.metrics.wordsPerMinute} icon="speed" color="#E9B83E" />
            <PronStat label="Dudas" value={feedback.metrics.hesitationCount} icon="pause_circle" color="#E24B4A" />
            <PronStat label="Palabras" value={`${feedback.metrics.spokenWordCount}/${feedback.metrics.originalWordCount}`} icon="format_list_numbered" color="#6B8E6A" />
          </div>
          {feedback.metrics.problemPhonemes?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-[var(--color-muted-navy)] mb-1.5 uppercase tracking-wide">Fonemas a mejorar</p>
              <div className="flex flex-wrap gap-1.5">{feedback.metrics.problemPhonemes.map((p: string, i: number) => <span key={i} className="pill-badge pill-amber">{p}</span>)}</div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-[var(--color-muted-navy)] mb-1.5 uppercase tracking-wide">Consejos de tu coach</p>
            <div className="chat-bubble-ai !rounded-xl whitespace-pre-wrap text-sm">{feedback.feedback}</div>
          </div>
        </div>
      )}

      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setAudioUrl(null)} />
    </div>
  )
}

function PronStat({ label, value, icon, color }: { label: string; value: any; icon: string; color: string }) {
  return (
    <div className="rounded-xl p-3 border" style={{ background: color + '10', borderColor: color + '25' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: 'var(--ax-chip-solid)' }}>
        <MS name={icon} className="!text-[16px]" style={{ color } as any} />
      </div>
      <div className="text-lg font-bold tracking-tight" style={{ color }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide font-semibold mt-0.5" style={{ color: color + 'aa' }}>{label}</div>
    </div>
  )
}

function levenshteinSimple(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const dp: number[] = Array(b.length + 1).fill(0).map((_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]; dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

// 4. HUB DE ESCRITURA — Selección entre Mecanografía y Traducción
function WritingHubTab({ profile }: { profile: Profile | null }) {
  const [selected, setSelected] = useState<'none' | 'typing' | 'translation'>('none')

  if (selected === 'typing') {
    return <TypingPractice profile={profile} onBack={() => setSelected('none')} />
  }
  if (selected === 'translation') {
    return <TranslationPractice profile={profile} onBack={() => setSelected('none')} />
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Hero greeting */}
      <div className="text-center max-w-2xl mx-auto pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-coral/10 text-coral text-xs font-bold mb-4 animate-pulse">
          <MS name="auto_awesome" className="!text-[16px]" /> Módulo de Escritura
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-carbon tracking-tight mb-3">
          ¿Qué deseas practicar <span className="text-coral">hoy</span>?
        </h1>
        <p className="text-grafito text-base">
          Elige una de las dos modalidades para mejorar tus habilidades de escritura en inglés.
          Cada una tiene su propio enfoque pedagógico.
        </p>
      </div>

      {/* Selection cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-4">
        {/* Typing card */}
        <button
          onClick={() => setSelected('typing')}
          className="group relative overflow-hidden rounded-3xl border-2 border-[var(--color-border-soft)] bg-papel hover:border-coral transition-all duration-500 hover:shadow-2xl hover:shadow-coral/10 hover:-translate-y-1 text-left p-7"
        >
          {/* Decorative blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-coral/10 group-hover:bg-coral/20 transition-colors duration-500" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-mostaza/10 group-hover:bg-mostaza/20 transition-colors duration-500" />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-coral to-terracota flex items-center justify-center mb-4 shadow-lg shadow-coral/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <MS name="keyboard" className="!text-[36px] text-white" />
            </div>
            <h3 className="text-xl font-bold text-carbon mb-1 tracking-tight">Mecanografía</h3>
            <p className="text-xs font-semibold text-coral mb-3 uppercase tracking-wider">Typing Practice</p>
            <p className="text-sm text-grafito leading-relaxed mb-4">
              Escribe textos en inglés y recibe tu velocidad (WPM), precisión y errores en tiempo real.
              Algoritmo puro, sin IA.
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="px-2.5 py-1 rounded-full bg-coral/10 text-coral text-[10px] font-bold uppercase tracking-wide">Tiempo real</span>
              <span className="px-2.5 py-1 rounded-full bg-mostaza/15 text-mostaza-dark text-[10px] font-bold uppercase tracking-wide">Métricas WPM</span>
              <span className="px-2.5 py-1 rounded-full bg-salvia/15 text-salvia-dark text-[10px] font-bold uppercase tracking-wide">Algorítmico</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-coral group-hover:gap-3 transition-all">
              Comenzar a escribir
              <MS name="arrow_forward" className="!text-[18px] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>

        {/* Translation card */}
        <button
          onClick={() => setSelected('translation')}
          className="group relative overflow-hidden rounded-3xl border-2 border-[var(--color-border-soft)] bg-papel hover:border-salvia transition-all duration-500 hover:shadow-2xl hover:shadow-salvia/10 hover:-translate-y-1 text-left p-7"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-salvia/10 group-hover:bg-salvia/20 transition-colors duration-500" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-terracota/10 group-hover:bg-terracota/20 transition-colors duration-500" />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-salvia to-salvia-dark flex items-center justify-center mb-4 shadow-lg shadow-salvia/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
              <MS name="translate" className="!text-[36px] text-white" />
            </div>
            <h3 className="text-xl font-bold text-carbon mb-1 tracking-tight">Traducción</h3>
            <p className="text-xs font-semibold text-salvia-dark mb-3 uppercase tracking-wider">Translation Practice</p>
            <p className="text-sm text-grafito leading-relaxed mb-4">
              Traduce textos del español al inglés (y viceversa). Evaluado con BLEU, Levenshtein y
              similitud semántica.
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="px-2.5 py-1 rounded-full bg-salvia/15 text-salvia-dark text-[10px] font-bold uppercase tracking-wide">BLEU score</span>
              <span className="px-2.5 py-1 rounded-full bg-coral/10 text-coral text-[10px] font-bold uppercase tracking-wide">ES ↔ EN</span>
              <span className="px-2.5 py-1 rounded-full bg-mostaza/15 text-mostaza-dark text-[10px] font-bold uppercase tracking-wide">Vocabulario</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-salvia-dark group-hover:gap-3 transition-all">
              Comenzar a traducir
              <MS name="arrow_forward" className="!text-[18px] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>
      </div>

      {/* Comparison strip */}
      <div className="max-w-4xl mx-auto pt-4">
        <div className="rounded-2xl bg-gradient-to-r from-crema to-papel border border-[var(--color-border-soft)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <MS name="compare_arrows" className="!text-[20px] text-terracota" />
            <h4 className="font-bold text-carbon text-sm">¿Cuál elegir?</h4>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs text-grafito">
            <div>
              <p className="font-semibold text-coral mb-1">Mecanografía te ayuda a:</p>
              <ul className="space-y-1">
                <li className="flex items-start gap-1.5"><MS name="check_circle" className="!text-[12px] text-coral mt-0.5" /> Mejorar velocidad de escritura</li>
                <li className="flex items-start gap-1.5"><MS name="check_circle" className="!text-[12px] text-coral mt-0.5" /> Memorizar ortografía de palabras</li>
                <li className="flex items-start gap-1.5"><MS name="check_circle" className="!text-[12px] text-coral mt-0.5" /> Desarrollar memoria muscular del teclado</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-salvia-dark mb-1">Traducción te ayuda a:</p>
              <ul className="space-y-1">
                <li className="flex items-start gap-1.5"><MS name="check_circle" className="!text-[12px] text-salvia-dark mt-0.5" /> Ampliar vocabulario profesional</li>
                <li className="flex items-start gap-1.5"><MS name="check_circle" className="!text-[12px] text-salvia-dark mt-0.5" /> Entender estructuras gramaticales</li>
                <li className="flex items-start gap-1.5"><MS name="check_circle" className="!text-[12px] text-salvia-dark mt-0.5" /> Pensar directamente en inglés</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ONBOARDING TOUR — Viñetas animadas para usuarios nuevos
function OnboardingTour({ onClose, onNavigate }: { onClose: () => void; onNavigate: (t: TabKey) => void }) {
  const [step, setStep] = useState(0)

  const STEPS = [
    {
      icon: 'rocket_launch',
      iconBg: '#E76F51',
      title: '¡Bienvenido a Axiom!',
      description: 'Tu asesor de inglés con IA. Aprende dentro de tu trabajo con tan solo 15 minutos al día.',
      cta: 'Siguiente',
      target: null,
    },
    {
      icon: 'dashboard',
      iconBg: '#E9B83E',
      title: 'Inicio: Tus módulos de práctica',
      description: 'Aquí están los temas que estás aprendiendo y los accesos a los módulos de conversación, lectura y escritura. Tu avance detallado vive en la pestaña de Métricas.',
      cta: 'Ver Inicio',
      target: 'dashboard' as TabKey,
    },
    {
      icon: 'smart_toy',
      iconBg: '#6B8E6A',
      title: 'Asesor IA: Conversación natural',
      description: 'Practica conversaciones reales con la IA. Te corrige errores en tiempo real y adapta su nivel al tuyo.',
      cta: 'Probar Asesor',
      target: 'chat' as TabKey,
    },
    {
      icon: 'edit_note',
      iconBg: '#E76F51',
      title: 'Escritura: Mecanografía + Traducción',
      description: 'Dos modalidades para practicar escritura: mide tu velocidad (WPM) o traduce textos profesionales ES ↔ EN.',
      cta: 'Explorar Escritura',
      target: 'writing' as TabKey,
    },
    {
      icon: 'text_to_speech',
      iconBg: '#B85C3C',
      title: 'Voz Natural: Escucha y aprende',
      description: 'Escribe cualquier texto en inglés y escúchalo con pronunciación natural. Ideal para practicar listening y speaking.',
      cta: 'Ir a Voz',
      target: 'voice' as TabKey,
    },
    {
      icon: 'workspace_premium',
      iconBg: '#E9B83E',
      title: 'Premium: Desbloquea más',
      description: 'Sube de nivel con redacción profesional, simulaciones de entrevistas y asistente de voz en reuniones.',
      cta: 'Ver Premium',
      target: 'premium' as TabKey,
    },
    {
      icon: 'celebration',
      iconBg: '#6B8E6A',
      title: '¡Listo para empezar!',
      description: 'Recuerda: la constancia vence al talento. Practica 15 minutos diarios y verás resultados en 4 semanas.',
      cta: 'Comenzar mi viaje',
      target: null,
    },
  ]

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function handleCta() {
    if (isLast) {
      onClose()
      return
    }
    if (current.target) {
      onNavigate(current.target)
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  function handleSkip() {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-carbon/60 backdrop-blur-sm p-4">
      <div className="relative bg-papel rounded-3xl shadow-2xl max-w-md w-full overflow-hidden onboarding-card">
        {/* Decorative top bar */}
        <div className="h-1.5 bg-gradient-to-r from-coral via-mostaza to-salvia" />

        {/* Skip button */}
        {!isLast && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-grafito hover:text-coral text-xs font-semibold z-10"
          >
            Saltar
          </button>
        )}

        <div className="p-8 text-center">
          {/* Animated icon */}
          <div className="relative mb-6 flex items-center justify-center">
            <div
              className="absolute w-20 h-20 rounded-full opacity-20 animate-ping"
              style={{ background: current.iconBg, animationDuration: '2s' }}
            />
            <div
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg onboarding-icon-bounce"
              style={{ background: current.iconBg, boxShadow: `0 10px 30px ${current.iconBg}40` }}
            >
              <MS name={current.icon} className="!text-[40px] text-white" />
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-coral' : i < step ? 'w-1.5 bg-coral/40' : 'w-1.5 bg-grafito/20'}`}
              />
            ))}
          </div>

          <h3 className="text-2xl font-bold text-carbon mb-2 tracking-tight">{current.title}</h3>
          <p className="text-sm text-grafito leading-relaxed mb-6">{current.description}</p>

          {/* CTA Button */}
          <button
            onClick={handleCta}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-coral to-terracota text-white font-bold text-sm shadow-lg shadow-coral/30 hover:shadow-xl hover:shadow-coral/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            {current.cta}
            {!isLast && <MS name="arrow_forward" className="!text-[18px]" />}
            {isLast && <MS name="celebration" className="!text-[18px]" />}
          </button>

          {/* Back button (not on first step) */}
          {step > 0 && !isLast && (
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              className="mt-3 text-xs text-grafito hover:text-coral font-semibold flex items-center gap-1 mx-auto"
            >
              <MS name="arrow_back" className="!text-[14px]" /> Anterior
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-4 text-center">
          <p className="text-[10px] text-grafito/60">
            Paso {step + 1} de {STEPS.length} · Puedes saltar esto y volver cuando quieras
          </p>
        </div>
      </div>
    </div>
  )
}

// 4a. MECANOGRAFÍA — Interfaz dedicada de práctica de escritura en inglés
function TypingPractice({ profile, onBack }: { profile: Profile | null; onBack?: () => void }) {
  const [text, setText] = useState<{ id: string; content: string; wordCount: number; cefrLevel: string; topic: string } | null>(null)
  const [typed, setTyped] = useState('')
  const [keystrokes, setKeystrokes] = useState<any[]>([])
  const [startTime, setStartTime] = useState<number | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  function fetchText() {
    return fetch('/api/typing')
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data?.text) setText(data.text) })
      .catch(() => {})
  }

  async function loadText() {
    setTyped(''); setKeystrokes([]); setStartTime(null); setResult(null)
    return fetchText()
  }

  // Al montar no hay nada que reiniciar: los estados ya están en su valor inicial.
  useEffect(() => { void fetchText() }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!startTime) setStartTime(Date.now())
    const pos = e.currentTarget.selectionStart
    const expected = text?.content[pos] || ''
    const char = e.key
    if (char.length === 1) {
      setKeystrokes(prev => [...prev, { char, expected, position: pos, timestamp: Date.now() - (startTime || Date.now()), correct: char === expected, corrected: false }])
    }
  }

  async function submit() {
    if (!text || !startTime) return
    setLoading(true)
    try {
      const durationSec = (Date.now() - startTime) / 1000
      const res = await fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typingTextId: text.id, targetText: text.content, keystrokes, durationSec }),
      })
      const data = await res.json()
      if (res.ok) { setResult(data.result); toast.success(`¡Listo! WPM: ${data.result.wpm}`) }
      else toast.error(data.error)
    } catch { toast.error('Error') } finally { setLoading(false) }
  }

  // Real-time stats
  const correctChars = keystrokes.filter(k => k.correct).length
  const accuracy = keystrokes.length > 0 ? Math.round((correctChars / keystrokes.length) * 100) : 100
  const elapsedMin = startTime ? (Date.now() - startTime) / 60000 : 0
  const liveWpm = elapsedMin > 0 ? Math.round((keystrokes.length / 5) / elapsedMin) : 0

  return (
    <div className="space-y-4 fade-up">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-grafito hover:text-coral transition-colors mb-2">
          <MS name="arrow_back" className="!text-[18px]" /> Volver a Escritura
        </button>
      )}
      {/* Real-time stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 border text-center" style={{ background: 'var(--ax-surface-amber)', borderColor: '#E9B83E25' }}>
          <div className="text-2xl font-bold" style={{ color: '#E9B83E' }}>{liveWpm}</div>
          <div className="text-[10px] uppercase font-semibold" style={{ color: '#C99627' }}>WPM</div>
        </div>
        <div className="rounded-xl p-3 border text-center" style={{ background: 'var(--ax-surface-peach)', borderColor: '#E76F5125' }}>
          <div className="text-2xl font-bold" style={{ color: '#E76F51' }}>{accuracy}%</div>
          <div className="text-[10px] uppercase font-semibold" style={{ color: '#C2553A' }}>Precisión</div>
        </div>
        <div className="rounded-xl p-3 border text-center" style={{ background: 'var(--ax-surface-sage)', borderColor: '#6B8E6A25' }}>
          <div className="text-2xl font-bold" style={{ color: '#6B8E6A' }}>{keystrokes.length}</div>
          <div className="text-[10px] uppercase font-semibold" style={{ color: '#4E6B4D' }}>Teclas</div>
        </div>
      </div>

      {/* Text to type */}
      {text && (
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="pill-badge pill-amber">{text.topic} · {text.cefrLevel}</span>
            <button onClick={loadText} className="text-xs font-semibold text-[#E9B83E] bg-[#E9B83E]/10 px-3 py-1.5 rounded-lg hover:bg-[#E9B83E]/15 transition-colors flex items-center gap-1">
              <MS name="refresh" className="!text-[14px]" /> Otro texto
            </button>
          </div>
          <p className="text-base text-[var(--color-muted-navy)] leading-relaxed mb-4 font-mono">
            {text.content.split('').map((char, i) => {
              const typedChar = typed[i]
              const isTyped = i < typed.length
              const isCorrect = isTyped && typedChar === char
              const isWrong = isTyped && typedChar !== char
              return (
                <span key={i} className={isCorrect ? 'text-[#6B8E6A]' : isWrong ? 'text-[#C2553A] bg-red-50 rounded' : ''}>
                  {char}
                </span>
              )
            })}
          </p>
          <Textarea
            ref={inputRef}
            value={typed}
            onChange={e => setTyped(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Empieza a escribir aquí…"
            className="min-h-[80px] font-mono text-base border-[var(--color-border-soft)] focus:border-[#E9B83E] focus:ring-2 focus:ring-[#E9B83E]/20"
          />
          <button onClick={submit} disabled={loading || !typed.trim()} className="btn-tactile w-full py-3 rounded-xl text-sm mt-3 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MS name="check_circle" className="!text-[16px]" />}
            Evaluar resultado
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
          <h3 className="font-bold text-[#2D2A26] text-base mb-4 flex items-center gap-2">
            <MS name="emoji_events" className="!text-[20px] text-[#E9B83E]" /> Tus resultados
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <PronStat label="WPM" value={result.wpm} icon="speed" color="#E9B83E" />
            <PronStat label="Precisión" value={`${Math.round(result.accuracy * 100)}%`} icon="spellcheck" color="#E76F51" />
            <PronStat label="Consistencia" value={`${Math.round(result.consistency * 100)}%`} icon="timeline" color="#6B8E6A" />
            <PronStat label="Score" value={result.skillScore} icon="grade" color="#B85C3C" />
          </div>
          {result.errors?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-[var(--color-muted-navy)] mb-2 uppercase tracking-wide">Errores cometidos ({result.errorCount})</p>
              <div className="flex flex-wrap gap-1.5">
                {result.errors.slice(0, 15).map((e: any, i: number) => (
                  <span key={i} className="pill-badge pill-error" title={`Esperaba: "${e.expected}"`}>
                    {e.typed || e.char} → {e.expected}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.advice?.length > 0 && (
            <div className="p-3 bg-[#FCEAE3] rounded-xl border border-[#E76F51]/20">
              <p className="text-xs font-semibold text-[#C2553A] mb-1 flex items-center gap-1"><MS name="lightbulb" className="!text-[14px]" /> Consejos para mejorar</p>
              <ul className="text-xs text-[#2D2A26] space-y-1">
                {result.advice.map((a: string, i: number) => <li key={i} className="flex items-start gap-1"><MS name="arrow_right" className="!text-[14px] mt-0.5" /> {a}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 4b. TRADUCCIÓN — Interfaz dedicada de traducción algorítmica ES ↔ EN
function TranslationPractice({ profile, onBack }: { profile: Profile | null; onBack?: () => void }) {
  const [exercise, setExercise] = useState<{ id: string; sourceText: string; sourceLanguage: string; targetLanguage: string; cefrLevel: string; vocabulary: string[]; hints: string[] } | null>(null)
  const [translation, setTranslation] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showHints, setShowHints] = useState(false)

  function fetchExercise() {
    return fetch('/api/translation')
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data?.exercise) setExercise(data.exercise) })
      .catch(() => {})
  }

  async function loadExercise() {
    setTranslation(''); setResult(null); setShowHints(false)
    return fetchExercise()
  }

  // Al montar no hay nada que reiniciar: los estados ya están en su valor inicial.
  useEffect(() => { void fetchExercise() }, [])

  async function submit() {
    if (!exercise || !translation.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: exercise.id,
          userTranslation: translation,
          sourceText: exercise.sourceText,
          targetText: '', // server has the correct answer
          sourceLanguage: exercise.sourceLanguage,
          targetLanguage: exercise.targetLanguage,
          targetVocab: exercise.vocabulary,
        }),
      })
      const data = await res.json()
      if (res.ok) { setResult(data.evaluation); toast.success(`Score: ${data.evaluation.overallScore}/100`) }
      else toast.error(data.error)
    } catch { toast.error('Error') } finally { setLoading(false) }
  }

  const dirLabel = exercise?.sourceLanguage === 'es' ? 'Español → Inglés' : 'Inglés → Español'

  return (
    <div className="space-y-4 fade-up">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-grafito hover:text-salvia-dark transition-colors mb-2">
          <MS name="arrow_back" className="!text-[18px]" /> Volver a Escritura
        </button>
      )}
      {exercise && (
        <>
          {/* Source text */}
          <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="pill-badge pill-teal">{dirLabel} · {exercise.cefrLevel}</span>
              <button onClick={loadExercise} className="text-xs font-semibold text-[#E76F51] bg-[#E76F51]/10 px-3 py-1.5 rounded-lg hover:bg-[#E76F51]/15 transition-colors flex items-center gap-1">
                <MS name="refresh" className="!text-[14px]" /> Otro ejercicio
              </button>
            </div>
            <p className="text-base text-[#2D2A26] leading-relaxed">{exercise.sourceText}</p>
            {exercise.hints?.length > 0 && (
              <div className="mt-3">
                <button onClick={() => setShowHints(!showHints)} className="text-xs font-semibold text-[#E9B83E] flex items-center gap-1">
                  <MS name={showHints ? 'expand_less' : 'lightbulb'} className="!text-[14px]" /> {showHints ? 'Ocultar pistas' : 'Ver pistas'}
                </button>
                {showHints && (
                  <ul className="mt-2 text-xs text-[var(--color-muted-navy)] space-y-1">
                    {exercise.hints.map((h, i) => <li key={i} className="flex items-start gap-1"><MS name="arrow_right" className="!text-[14px] mt-0.5" /> {h}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* User translation */}
          <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
            <h3 className="font-bold text-[#2D2A26] text-sm mb-3">Tu traducción</h3>
            <Textarea value={translation} onChange={e => setTranslation(e.target.value)} placeholder="Escribe tu traducción aquí…" className="min-h-[100px] border-[var(--color-border-soft)] focus:border-[#E76F51] focus:ring-2 focus:ring-[#E76F51]/20 text-sm" />
            <button onClick={submit} disabled={loading || !translation.trim()} className="btn-tactile w-full py-3 rounded-xl text-sm mt-3 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MS name="analytics" className="!text-[16px]" />} Evaluar traducción
            </button>
          </div>
        </>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
          <h3 className="font-bold text-[#2D2A26] text-base mb-4 flex items-center gap-2">
            <MS name="analytics" className="!text-[20px] text-[#E76F51]" /> Evaluación algorítmica
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <PronStat label="Score total" value={`${result.overallScore}/100`} icon="grade" color="#E76F51" />
            <PronStat label="BLEU" value={`${Math.round(result.bleuScore * 100)}%`} icon="analytics" color="#E9B83E" />
            <PronStat label="Palabras correctas" value={`${Math.round(result.wordAccuracy * 100)}%`} icon="spellcheck" color="#6B8E6A" />
            <PronStat label="Gramática" value={`${Math.round(result.grammarScore * 100)}%`} icon="rule" color="#B85C3C" />
          </div>

          {/* Correct translation */}
          <div className="mb-4 p-3 bg-[#FCEAE3] rounded-xl border border-[#E76F51]/20">
            <p className="text-xs font-semibold text-[#C2553A] mb-1">Traducción correcta:</p>
            <p className="text-sm text-[#2D2A26]">{result.targetText || 'No disponible'}</p>
          </div>

          {/* Vocabulary match */}
          {result.matchedVocab?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-[var(--color-muted-navy)] mb-1">Vocabulario correcto:</p>
              <div className="flex flex-wrap gap-1.5">{result.matchedVocab.map((v: string, i: number) => <span key={i} className="pill-badge pill-success">{v}</span>)}</div>
            </div>
          )}
          {result.missedVocab?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-[var(--color-muted-navy)] mb-1">Vocabulario faltante:</p>
              <div className="flex flex-wrap gap-1.5">{result.missedVocab.map((v: string, i: number) => <span key={i} className="pill-badge pill-error">{v}</span>)}</div>
            </div>
          )}

          {/* Errors */}
          {result.errors?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-[var(--color-muted-navy)] mb-2 uppercase tracking-wide">Errores encontrados</p>
              <div className="space-y-1.5">
                {result.errors.slice(0, 10).map((e: any, i: number) => (
                  <div key={i} className="text-xs bg-[#FDECEC] rounded-lg p-2 border border-[#E24B4A]/15">
                    <span className="font-semibold text-[#E24B4A]">{e.type}:</span> {e.suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advice */}
          {result.advice?.length > 0 && (
            <div className="p-3 bg-[#FBEFD6] rounded-xl border border-[#E9B83E]/20">
              <p className="text-xs font-semibold text-[#C99627] mb-1 flex items-center gap-1"><MS name="lightbulb" className="!text-[14px]" /> Consejos</p>
              <ul className="text-xs text-[#2D2A26] space-y-1">
                {result.advice.map((a: string, i: number) => <li key={i} className="flex items-start gap-1"><MS name="arrow_right" className="!text-[14px] mt-0.5" /> {a}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 4c. VOZ NATURAL — Escucha pronunciaciones en inglés con TTS (Kokoro + Web Speech fallback)
function VoiceStudioTab({ profile }: { profile: Profile | null }) {
  const [text, setText] = useState('')
  const [voice, setVoice] = useState<'af_heart' | 'af_bella' | 'af_sky' | 'am_adam' | 'am_michael'>('af_heart')
  const [speed, setSpeed] = useState(0.9)
  const [loading, setLoading] = useState(false)
  const [ttsAvailable, setTtsAvailable] = useState<boolean | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [history, setHistory] = useState<{ text: string; ts: number }[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Check TTS service availability on mount
  useEffect(() => {
    fetch('/api/tts').then(r => r.json()).then(d => setTtsAvailable(d.available === true)).catch(() => setTtsAvailable(false))
    // Init Web Speech API fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }
    // Load history from localStorage
    try {
      const saved = localStorage.getItem('axiom_tts_history')
      // Lectura tras el montaje: el servidor no tiene localStorage y así se
      // evita el desajuste de hidratación. Patrón recomendado por React.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, [])

  function persistHistory(items: { text: string; ts: number }[]) {
    setHistory(items)
    try { localStorage.setItem('axiom_tts_history', JSON.stringify(items.slice(0, 10))) } catch {}
  }

  async function playTTS() {
    if (!text.trim()) { toast.error('Escribe algo para escuchar'); return }

    // Stop any currently playing audio
    stopAll()

    setLoading(true)
    setIsPlaying(true)

    try {
      // Strategy 1: Try Kokoro TTS service via API
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, speed }),
      })
      const data = await res.json()

      if (res.ok && data.audio) {
        // Got Kokoro audio
        const blob = new Blob([Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))], { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setTimeout(() => audioRef.current?.play(), 100)
        toast.success('Reproduciendo voz natural (Kokoro)')
        persistHistory([{ text, ts: Date.now() }, ...history].slice(0, 10))
      } else if (data.available === false || data.error?.includes('no disponible')) {
        // Strategy 2: Fall back to Web Speech API (browser native)
        playWebSpeech()
      } else {
        toast.error(data.error || 'TTS no disponible')
        setIsPlaying(false)
      }
    } catch (error) {
      // Network error or service unreachable — use Web Speech fallback
      playWebSpeech()
    } finally {
      setLoading(false)
    }
  }

  function playWebSpeech() {
    if (!synthRef.current) {
      toast.error('Tu navegador no soporta síntesis de voz. Usa Chrome, Edge o Safari.')
      setIsPlaying(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = speed
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Try to pick an English voice
    const voices = synthRef.current.getVoices()
    const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google')) ||
                    voices.find(v => v.lang.startsWith('en')) ||
                    voices[0]
    if (enVoice) utterance.voice = enVoice

    utterance.onstart = () => { setIsPlaying(true); toast.info('Reproduciendo voz natural (Web Speech)') }
    utterance.onend = () => { setIsPlaying(false) }
    utterance.onerror = () => { setIsPlaying(false); toast.error('Error en la síntesis de voz') }

    utteranceRef.current = utterance
    synthRef.current.speak(utterance)
    persistHistory([{ text, ts: Date.now() }, ...history].slice(0, 10))
  }

  function stopAll() {
    // Stop Kokoro audio
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null) }
    // Stop Web Speech
    if (synthRef.current) { synthRef.current.cancel() }
    setIsPlaying(false)
  }

  // Sample phrases by category for quick practice
  const SAMPLES = [
    { label: 'Saludos', icon: 'waving_hand', text: "Hello! How are you doing today? I hope you're having a wonderful day." },
    { label: 'Trabajo', icon: 'work', text: "Could you please send me the quarterly report by Friday afternoon? I need to review it before the meeting." },
    { label: 'Reunión', icon: 'groups', text: "Let's schedule a call for next Tuesday to discuss the project roadmap and the upcoming deliverables." },
    { label: 'Presentación', icon: 'present_to_all', text: "Today I'd like to present our Q3 results, focusing on the key metrics that drove our growth this quarter." },
    { label: 'Negociación', icon: 'handshake', text: "We're willing to negotiate the terms, but we need to ensure the agreement is mutually beneficial for both parties." },
    { label: 'Email formal', icon: 'mail', text: "Dear Mr. Johnson, I am writing to follow up on our previous conversation regarding the partnership opportunity." },
  ]

  const VOICES = [
    { id: 'af_heart', label: 'Bella (femenina, cálida)', lang: 'en-US' },
    { id: 'af_bella', label: 'Sophie (femenina, suave)', lang: 'en-US' },
    { id: 'af_sky', label: 'Sky (femenina, joven)', lang: 'en-US' },
    { id: 'am_adam', label: 'Adam (masculina, profunda)', lang: 'en-US' },
    { id: 'am_michael', label: 'Michael (masculina, clara)', lang: 'en-US' },
  ] as const

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#2D2A26] tracking-tight flex items-center gap-2">
            <MS name="text_to_speech" className="!text-[28px]" style={{ color: '#B85C3C' } as any} />
            Voz Natural en Inglés
          </h2>
          <p className="text-sm text-[var(--color-muted-navy)] mt-0.5">
            Escribe cualquier texto en inglés y escúchalo con pronunciación natural. Ideal para practicar listening y repeating.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{
          background: ttsAvailable === null ? 'var(--ax-surface-clay)' : ttsAvailable ? 'var(--ax-surface-peach)' : 'var(--ax-surface-amber)',
          color: ttsAvailable === null ? 'var(--ax-skill-speaking)' : ttsAvailable ? 'var(--ax-skill-reading)' : 'var(--ax-skill-writing)',
        }}>
          <span className={`w-2 h-2 rounded-full ${ttsAvailable === null ? 'bg-purple-400' : ttsAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          {ttsAvailable === null ? 'Verificando…' : ttsAvailable ? 'Kokoro TTS disponible' : 'Usando Web Speech API'}
        </div>
      </div>

      {/* Main TTS card */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-border-soft)] bg-paper flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--ax-surface-clay)' }}>
              <MS name="graphic_eq" className="!text-[20px]" style={{ color: '#B85C3C' } as any} />
            </div>
            <div>
              <div className="font-bold text-sm text-[#2D2A26]">Estudio de Voz</div>
              <div className="text-xs text-[var(--color-muted-navy)]">Pronunciación natural • Multi-voz</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={stopAll} disabled={!isPlaying} className="text-xs font-semibold text-[#E24B4A] bg-[#FDECEC] hover:bg-[#FDECEC]/70 px-3 py-2 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40">
              <MS name="stop" className="!text-[14px]" /> Detener
            </button>
            {/* Large TTS button with avatar character */}
            <button
              onClick={playTTS}
              disabled={loading || !text.trim()}
              className="group relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#B85C3C] to-[#E76F51] text-white font-bold text-sm shadow-lg shadow-[#B85C3C]/30 hover:shadow-xl hover:shadow-[#B85C3C]/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              title="Escuchar la pronunciación natural"
            >
              {/* Avatar circle with face icon */}
              <span className="relative w-7 h-7 rounded-full bg-white/20 flex items-center justify-center overflow-hidden group-hover:bg-white/30 transition-colors">
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isPlaying ? (
                  <MS name="graphic_eq" className="!text-[18px] text-white animate-pulse" />
                ) : (
                  <>
                    {/* Person avatar — head + sound waves */}
                    <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="14" cy="10" r="4" fill="white" />
                      <path d="M6 24c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
                      {/* Sound waves next to head */}
                      <path d="M22 6c1.5 1.5 1.5 4 0 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
                      <path d="M24.5 4c2.5 2.5 2.5 7 0 9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
                    </svg>
                  </>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                {loading ? 'Generando…' : isPlaying ? 'Reproduciendo' : 'Leer en voz alta'}
                <MS name="volume_up" className="!text-[16px]" />
              </span>
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escribe o pega aquí el texto en inglés que quieres escuchar…"
            className="min-h-[140px] text-base border-[var(--color-border-soft)] focus:border-[#B85C3C] focus:ring-2 focus:ring-[#B85C3C]/20"
            maxLength={5000}
          />
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-[#2D2A26] mb-1.5">Voz</label>
              <select
                value={voice}
                onChange={e => setVoice(e.target.value as typeof voice)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border-soft)] text-sm bg-white focus:border-[#B85C3C] focus:ring-2 focus:ring-[#B85C3C]/20 outline-none"
              >
                {VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-semibold text-[#2D2A26] mb-1.5">Velocidad: {speed.toFixed(1)}×</label>
              <input
                type="range" min={0.5} max={1.5} step={0.1} value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-[#B85C3C]"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-muted-navy)] mt-0.5">
                <span>0.5×</span><span>1.0×</span><span>1.5×</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-[var(--color-muted-navy)] flex items-center gap-1.5">
            <MS name="info" className="!text-[14px]" />
            {text.length}/5000 caracteres · {text.trim().split(/\s+/).filter(Boolean).length} palabras
          </div>
        </div>
      </div>

      {/* Sample phrases */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
        <h3 className="font-bold text-[#2D2A26] text-base mb-3 flex items-center gap-2">
          <MS name="format_quote" className="!text-[20px] text-[#B85C3C]" /> Frases de ejemplo
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SAMPLES.map((s, i) => (
            <button
              key={i}
              onClick={() => setText(s.text)}
              className="text-left p-3 rounded-xl border border-[var(--color-border-soft)] hover:border-[#B85C3C] hover:bg-[#F4DDD2]/30 transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <MS name={s.icon} className="!text-[18px] text-[#B85C3C]" />
                <span className="text-xs font-bold text-[#2D2A26] group-hover:text-[#B85C3C]">{s.label}</span>
              </div>
              <p className="text-[11px] text-[var(--color-muted-navy)] line-clamp-2 leading-relaxed">{s.text}</p>
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#2D2A26] text-base flex items-center gap-2">
              <MS name="history" className="!text-[20px] text-[#6B8E6A]" /> Historial reciente
            </h3>
            <button onClick={() => persistHistory([])} className="text-xs text-[#E24B4A] hover:underline">Limpiar</button>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((h, i) => (
              <button
                key={i}
                onClick={() => setText(h.text)}
                className="w-full text-left p-3 rounded-xl hover:bg-paper transition-colors flex items-start gap-2 group"
              >
                <MS name="chevron_right" className="!text-[16px] text-[var(--color-muted-navy)] mt-0.5 group-hover:text-[#B85C3C]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#2D2A26] line-clamp-1">{h.text}</p>
                  <p className="text-[10px] text-[var(--color-muted-navy)] mt-0.5">{new Date(h.ts).toLocaleString('es-MX')}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden audio element for Kokoro playback */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onPlay={() => setIsPlaying(true)}
        onEnded={() => { setIsPlaying(false); if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null) } }}
        onPause={() => setIsPlaying(false)}
      />

      {/* Tips */}
      <div className="rounded-2xl border p-4" style={{ background: 'var(--ax-surface-clay)', borderColor: '#B85C3C25' }}>
        <p className="text-xs text-[#9F4630] flex items-start gap-1.5">
          <MS name="lightbulb" className="!text-[16px] mt-0.5" />
          <span>
            <strong>Consejo:</strong> Escribe tus propias frases del trabajo (emails, presentaciones, scripts de reuniones) para escuchar cómo se pronuncian naturalmente. Repite en voz alta para practicar tu speaking.
          </span>
        </p>
      </div>
    </div>
  )
}

// 5. PREMIUM — Redacción profesional + Pronunciación avanzada + Simulaciones
function PremiumTab({ profile, subscription }: { profile: Profile | null; subscription: Subscription | null }) {
  const [subMode, setSubMode] = useState<'writing' | 'interview' | 'meeting'>('writing')
  const [input, setInput] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const isPremium = subscription?.features?.voiceEnabled || subscription?.features?.ragEnabled

  async function submit() {
    if (!input.trim()) return
    setLoading(true); setResponse(null)
    try {
      const moduleMap = { writing: 'text', interview: 'conversation', meeting: 'conversation' }
      const modeMap = { writing: 'professional_writing', interview: 'technical_interview', meeting: 'casual' }
      const res = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: moduleMap[subMode], mode: modeMap[subMode], message: input }),
      })
      const data = await res.json()
      if (res.ok) setResponse(data.firstResponse)
      else toast.error(data.error)
    } catch { toast.error('Error') } finally { setLoading(false) }
  }

  if (!isPremium) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-12 text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--ax-surface-amber)' }}>
          <MS name="workspace_premium" className="!text-[32px]" style={{ color: '#E9B83E' } as any} />
        </div>
        <h3 className="text-lg font-bold text-[#2D2A26] mb-1">Funciones Premium</h3>
        <p className="text-sm text-[var(--color-muted-navy)] mb-5 max-w-md mx-auto">
          Desbloquea redacción profesional, simulación de entrevistas y asistente de voz avanzado con el plan Pro.
        </p>
        <p className="text-xs text-[var(--color-muted-navy)] mb-4">Incluye:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-6">
          <div className="p-3 rounded-xl border" style={{ background: PASTEL.writing.bg, borderColor: PASTEL.writing.icon + '25' }}>
            <MS name="description" className="!text-[24px] mb-1" style={{ color: PASTEL.writing.icon } as any} />
            <div className="text-xs font-semibold text-[#2D2A26]">Redacción profesional</div>
            <div className="text-[10px] text-[var(--color-muted-navy)]">Emails, reportes, propuestas</div>
          </div>
          <div className="p-3 rounded-xl border" style={{ background: PASTEL.speaking.bg, borderColor: PASTEL.speaking.icon + '25' }}>
            <MS name="work" className="!text-[24px] mb-1" style={{ color: PASTEL.speaking.icon } as any} />
            <div className="text-xs font-semibold text-[#2D2A26]">Simulación de entrevistas</div>
            <div className="text-[10px] text-[var(--color-muted-navy)]">Practica entrevistas B2+</div>
          </div>
          <div className="p-3 rounded-xl border" style={{ background: PASTEL.listening.bg, borderColor: PASTEL.listening.icon + '25' }}>
            <MS name="groups" className="!text-[24px] mb-1" style={{ color: PASTEL.listening.icon } as any} />
            <div className="text-xs font-semibold text-[#2D2A26]">Reuniones simuladas</div>
            <div className="text-[10px] text-[var(--color-muted-navy)]">Conversaciones de trabajo</div>
          </div>
        </div>
      </div>
    )
  }

  const modeConfig = {
    writing: { label: 'Redacción', icon: 'description', desc: 'Escribe documentos profesionales: emails, reportes, propuestas técnicas.', placeholder: 'Escribe o pega aquí tu documento profesional…' },
    interview: { label: 'Entrevista', icon: 'work', desc: 'Simula una entrevista de trabajo en inglés. La IA será tu entrevistador.', placeholder: 'Presiona "Iniciar" para comenzar la entrevista simulada…' },
    meeting: { label: 'Reunión', icon: 'groups', desc: 'Practica conversaciones de reunión casual con tus colegas virtuales.', placeholder: 'Presiona "Iniciar" para simular una reunión…' },
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Funciones Premium</h2>
        <p className="text-sm text-[var(--color-muted-navy)] mt-0.5">Herramientas avanzadas para llevar tu inglés al siguiente nivel.</p>
      </div>

      {/* Sub-mode cards */}
      <div className="grid grid-cols-3 gap-3">
        {(['writing', 'interview', 'meeting'] as const).map(m => (
          <button key={m} onClick={() => setSubMode(m)} className={`p-4 rounded-2xl border text-left transition-all ${subMode === m ? 'border-[#E76F51] border-2 bg-white' : 'border-[var(--color-border-soft)] bg-white hover:border-[#E76F51]/30'}`}>
            <MS name={modeConfig[m].icon} className="!text-[28px] mb-2" style={{ color: subMode === m ? '#E76F51' : '#6B6661' } as any} />
            <div className="font-semibold text-sm text-[#2D2A26]">{modeConfig[m].label}</div>
            <div className="text-[10px] text-[var(--color-muted-navy)] mt-0.5">{modeConfig[m].desc}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <MS name={modeConfig[subMode].icon} className="!text-[20px] text-[#E76F51]" />
            <h3 className="font-bold text-[#2D2A26] text-base">Entrada</h3>
          </div>
          <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder={modeConfig[subMode].placeholder} className="min-h-[250px] border-[var(--color-border-soft)] focus:border-[#E76F51] focus:ring-2 focus:ring-[#E76F51]/20 text-sm" />
          <button onClick={submit} disabled={loading || !input.trim()} className={`btn-tactile w-full py-3 rounded-xl text-sm mt-3 flex items-center justify-center gap-2 ${loading ? 'btn-loading' : ''}`}>
            <span className="spinner-axiom" /><span className="btn-text flex items-center gap-2">{loading ? 'Procesando…' : 'Enviar'}</span>
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <MS name="auto_awesome" className="!text-[20px] text-[#E76F51]" />
            <h3 className="font-bold text-[#2D2A26] text-base">Respuesta IA</h3>
          </div>
          {response ? (
            <div className="space-y-3">
              <div className="chat-bubble-ai !rounded-xl whitespace-pre-wrap text-sm">{response.content}</div>
              {response.corrections?.length > 0 && (
                <div className="correction-card-axiom">
                  <div className="correction-head"><MS name="spellcheck" className="!text-[14px]" /> Correcciones</div>
                  <div className="space-y-2">
                    {response.corrections.map((c: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs flex-wrap">
                        <span className="pill-badge pill-error"><s>{c.original}</s></span>
                        <MS name="arrow_forward" className="!text-[14px] text-[var(--color-muted-navy)] mt-0.5" />
                        <span className="pill-badge pill-success">{c.corrected}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-[10px] text-[var(--color-muted-navy)] pt-2 border-t">
                <span>{response.tokensIn + response.tokensOut} tokens</span><span>·</span>
                <span>${(response.costMxnCents / 100).toFixed(2)} MXN</span><span>·</span>
                <span>{response.ragChunksUsed} RAG</span>
              </div>
            </div>
          ) : (
            <div className="h-[250px] flex flex-col items-center justify-center text-center">
              <MS name="article" className="!text-[48px] text-slate-300 mb-2" />
              <p className="text-xs text-[var(--color-muted-navy)]">La respuesta aparecerá aquí</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 6. PLANES — Suscripciones
function PlansTab({ subscription, onUpdated }: { subscription: Subscription | null; onUpdated: () => void }) {
  const plans = [
    { code: 'basico', name: 'Básico', price: 199, icon: 'person', features: ['30 sesiones/mes', 'Chat IA básico', 'Sin RAG con docs'], color: '#2D2A26' },
    { code: 'pro', name: 'Pro', price: 399, icon: 'star', features: ['Sesiones ilimitadas', 'RAG con tus documentos', 'Módulo de voz', 'Evaluación IRT', 'Funciones Premium'], color: '#E76F51', popular: true },
    { code: 'equipo', name: 'Equipo', price: 999, icon: 'groups', features: ['Hasta 15 usuarios', 'Panel de administración', 'Métricas grupales', 'Soporte prioritario'], color: '#E9B83E' },
    { code: 'enterprise', name: 'Enterprise', price: 2999, icon: 'corporate_fare', features: ['SSO/SAML', 'SLA 99.9%', 'Integraciones', 'Onboarding dedicado'], color: '#F4A38A' },
  ]
  const [upgrading, setUpgrading] = useState<string | null>(null)

  async function upgrade(planCode: string) {
    setUpgrading(planCode)
    try {
      const res = await fetch('/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planCode, cadence: 'monthly' }) })
      const data = await res.json()
      if (data.ok) {
        if (data.sandboxInitPoint?.startsWith('/api/')) {
          const payRes = await fetch(data.sandboxInitPoint)
          const payData = await payRes.json()
          if (payData.ok) { toast.success('¡Pago procesado! Plan actualizado'); onUpdated() }
          else toast.error('Error procesando pago')
        } else window.location.href = data.sandboxInitPoint
      } else toast.error(data.error)
    } finally { setUpgrading(null) }
  }

  const currentPlan = subscription?.planCode

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Planes y Suscripciones</h2>
        <p className="text-sm text-[var(--color-muted-navy)] mt-0.5">Elige el plan que se adapte a tu ritmo de aprendizaje.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map(plan => (
          <div key={plan.code} className={`plan-card-axiom p-5 ${currentPlan === plan.code ? 'current' : ''} ${plan.popular ? 'border-[#E76F51] border-2' : ''}`}>
            {plan.popular && <div className="absolute top-0 right-0 bg-[#E76F51] text-[#2D2A26] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-xl">Popular</div>}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: `${plan.color}15` }}>
              <MS name={plan.icon} className="!text-[24px]" style={{ color: plan.color } as any} />
            </div>
            <h3 className="font-bold text-[#2D2A26] text-lg tracking-tight">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mt-1 mb-4">
              <span className="text-3xl font-bold text-[#2D2A26] tracking-tight">${plan.price}</span>
              <span className="text-xs text-[var(--color-muted-navy)]">MXN/mes</span>
            </div>
            <ul className="space-y-2 mb-5">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-[#2D2A26]">
                  <MS name="check_circle" className="!text-[14px] flex-shrink-0 mt-0.5" style={{ color: '#E76F51' } as any} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => upgrade(plan.code)} disabled={currentPlan === plan.code || upgrading === plan.code} className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${currentPlan === plan.code ? 'bg-paper text-[var(--color-muted-navy)] border border-[var(--color-border-soft)] cursor-default' : plan.popular ? 'btn-tactile' : 'bg-[#2D2A26] text-white hover:bg-[#3D3833]'}`}>
              {upgrading === plan.code && <Loader2 className="w-3 h-3 animate-spin" />}
              {currentPlan === plan.code ? '✓ Plan actual' : 'Mejorar'}
              {currentPlan !== plan.code && <MS name="arrow_forward" className="!text-[14px]" />}
            </button>
          </div>
        ))}
      </div>

      {subscription?.subscription && (
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
          <h3 className="font-bold text-[#2D2A26] text-base mb-3 flex items-center gap-2"><MS name="receipt_long" className="!text-[18px] text-[var(--color-muted-navy)]" /> Tu suscripción</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-paper rounded-xl p-3 border border-[var(--color-border-soft)]"><div className="text-[10px] uppercase font-semibold text-[var(--color-muted-navy)]">Estado</div><div className="text-sm font-semibold text-[#2D2A26] capitalize">{subscription.subscription.status}</div></div>
            <div className="bg-paper rounded-xl p-3 border border-[var(--color-border-soft)]"><div className="text-[10px] uppercase font-semibold text-[var(--color-muted-navy)]">Renueva</div><div className="text-sm font-semibold text-[#2D2A26]">{new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString('es-MX')}</div></div>
            <div className="bg-paper rounded-xl p-3 border border-[var(--color-border-soft)]"><div className="text-[10px] uppercase font-semibold text-[var(--color-muted-navy)]">Frecuencia</div><div className="text-sm font-semibold text-[#2D2A26] capitalize">{subscription.subscription.cadence}</div></div>
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--color-muted-navy)] text-center">Pagos procesados por Mercado Pago · Modo sandbox · Sin cobros reales</p>
    </div>
  )
}

// Nombre coloquial del nivel CEFR (compartido entre Métricas y Panel Admin)
const LEVEL_NAMES: Record<string, string> = { A1: 'Principiante', A2: 'Básico', B1: 'Intermedio', B2: 'Intermedio Alto', C1: 'Avanzado', C2: 'Maestría' }

// Interpretación coloquial del puntaje por habilidad
const skillDesc = (score: number) => {
  if (score >= 75) return 'Vas muy bien, continúa así.'
  if (score >= 50) return 'Buen progreso, vas por buen camino.'
  if (score >= 30) return 'Sigue practicando para consolidar.'
  return 'Apenas empiezas; la constancia es la clave.'
}

// Consejos por habilidad según el puntaje actual
const skillAdvice: Record<string, (score: number) => string> = {
  reading: (s) => s < 30
    ? 'Empieza con textos cortos de tu nivel y usa la lectura en voz alta para asociar ortografía y sonido.'
    : s < 60
    ? 'Lee textos de tu dominio profesional y revisa la precisión por palabra que el análisis muestra tras cada lectura.'
    : 'Sube el nivel CEFR de los textos para ampliar vocabulario y estructuras más complejas.',
  writing: (s) => s < 30
    ? 'Comienza con mecanografía: copiar texto correcto fija la ortografía y la puntuación del inglés.'
    : s < 60
    ? 'Alterna mecanografía y traducción: traducir frases completas entrena gramática y vocabulario activo.'
    : 'Traduce textos técnicos de tu área para consolidar la escritura en contextos reales.',
  listening: (s) => s < 30
    ? 'Conversa con el asesor IA en modo casual con frases cortas y revisa las correcciones de cada respuesta.'
    : s < 60
    ? 'Practica en el estudio de Voz Natural: escucha la pronunciación de referencia y repite el mismo texto.'
    : 'Simula entrevistas técnicas con el asesor IA para entrenar la comprensión en contextos exigentes.',
  speaking: (s) => s < 30
    ? 'Lee en voz alta textos cortos y compara tu pronunciación con la voz de referencia.'
    : s < 60
    ? 'Grábate leyendo párrafos completos y corrige las palabras con menor precisión del análisis.'
    : 'Haz lecturas continuas de un minuto sin pausas para ganar fluidez y entonación natural.',
}

// 7. MÉTRICAS — Resumen general, detalle por habilidad con consejos, gráficas y modo de aprendizaje
function MetricsTab({ profile }: { profile: Profile | null }) {
  const [progress, setProgress] = useState<any>(null)
  const [learningMode, setLearningMode] = useState<string>(profile?.learningMode || 'moderado')
  const [loading, setLoading] = useState(true)
  const [savingMode, setSavingMode] = useState(false)

  useEffect(() => {
    fetch('/api/progress?days=30').then(r => r.json()).then(d => {
      if (d?.ok) setProgress(d.progress)
      setLoading(false)
    })
  }, [])

  async function updateLearningMode(mode: string) {
    setLearningMode(mode); setSavingMode(true)
    try {
      await fetch('/api/learning-mode', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ learningMode: mode }) })
      toast.success(`Modo de aprendizaje: ${mode}`)
    } catch { toast.error('Error al guardar') } finally { setSavingMode(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#E76F51]" /></div>

  const skills = progress?.skills || { reading: 20, writing: 20, listening: 20, speaking: 20 }
  const skillCEFRs = progress?.skillCEFRs || { reading: 'A2', writing: 'A2', listening: 'A2', speaking: 'A2' }

  // Chart data
  const pieData = [
    { name: 'Lectura', value: skills.reading, color: PASTEL.reading.icon },
    { name: 'Escritura', value: skills.writing, color: PASTEL.writing.icon },
    { name: 'Audición', value: skills.listening, color: PASTEL.listening.icon },
    { name: 'Oral', value: skills.speaking, color: PASTEL.speaking.icon },
  ]

  const radarData = [
    { skill: 'Lectura', score: skills.reading },
    { skill: 'Escritura', score: skills.writing },
    { skill: 'Audición', score: skills.listening },
    { skill: 'Oral', score: skills.speaking },
  ]

  const trajectoryData = (progress?.trajectory || []).map((t: any) => ({ date: t.date.slice(5), score: t.theta }))

  const moduleData = Object.entries(progress?.moduleBreakdown || {}).map(([name, count]) => ({ name, count: count as number }))

  const modeConfig = {
    tranquilo: { label: 'Tranquilo', icon: 'spa', color: '#E76F51', desc: '2 sesiones/semana, 15 min' },
    moderado: { label: 'Moderado', icon: 'speed', color: '#E9B83E', desc: '4 sesiones/semana, 25 min' },
    agresivo: { label: 'Agresivo', icon: 'rocket_launch', color: '#E24B4A', desc: '6 sesiones/semana, 40 min' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Tus Métricas</h2>
        <p className="text-sm text-[var(--color-muted-navy)] mt-0.5">Revisa tu progreso detallado y ajusta tu plan de aprendizaje.</p>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-4 text-center">
          <MS name="forum" className="!text-[24px] text-[#E76F51] mb-1" />
          <div className="text-2xl font-bold text-[#2D2A26]">{progress?.sessionsCount || 0}</div>
          <div className="text-xs text-[var(--color-muted-navy)]">Sesiones este mes</div>
        </div>
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-4 text-center">
          <MS name="schedule" className="!text-[24px] text-[#E9B83E] mb-1" />
          <div className="text-2xl font-bold text-[#2D2A26]">{progress?.totalActiveMinutes || 0}</div>
          <div className="text-xs text-[var(--color-muted-navy)]">Minutos practicados</div>
        </div>
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-4 text-center">
          <MS name="menu_book" className="!text-[24px] text-[#6B8E6A] mb-1" />
          <div className="text-2xl font-bold text-[#2D2A26]">{progress?.vocabularyCount || 0}</div>
          <div className="text-xs text-[var(--color-muted-navy)]">Palabras aprendidas</div>
        </div>
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-4 text-center">
          <MS name="event_repeat" className="!text-[24px] text-[#B85C3C] mb-1" />
          <div className="text-2xl font-bold text-[#2D2A26]">{progress?.dueReviews || 0}</div>
          <div className="text-xs text-[var(--color-muted-navy)]">Repasos pendientes</div>
        </div>
      </div>

      {/* Desempeño por habilidad — detalle y consejos */}
      <div>
        <h3 className="text-lg font-bold text-[#2D2A26] mb-3 tracking-tight flex items-center gap-2">
          <MS name="insights" className="!text-[20px] text-[#E76F51]" /> Desempeño por habilidad
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {(Object.keys(PASTEL) as Array<keyof typeof PASTEL>).map(skillKey => {
            const skill = PASTEL[skillKey]
            const score = skills[skillKey as keyof typeof skills] || 20
            const cefr = skillCEFRs[skillKey as keyof typeof skillCEFRs] || 'A2'
            return (
              <div key={skillKey} className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: skill.bg }}>
                      <MS name={skill.iconName} className="!text-[22px]" style={{ color: skill.icon } as any} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#2D2A26]">{skill.name}</div>
                      <div className="text-[10px] text-[var(--color-muted-navy)]">Nivel {cefr} · {LEVEL_NAMES[cefr] || 'Básico'}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: skill.text }}>{Math.round(score)}%</div>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--ax-track-soft)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: skill.icon }} />
                </div>
                <p className="text-xs font-medium mb-3" style={{ color: skill.text }}>{skillDesc(score)}</p>
                {score < 85 ? (
                  <div className="rounded-xl p-3 border border-[#E9B83E]/40" style={{ background: 'var(--ax-surface-amber)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <MS name="tips_and_updates" className="!text-[16px] text-[#C99627]" />
                      <span className="text-[10px] font-bold text-[#C99627] uppercase tracking-widest">Consejo</span>
                    </div>
                    <p className="text-xs text-[#7A6A45] leading-relaxed">{skillAdvice[skillKey](score)}</p>
                  </div>
                ) : (
                  <div className="rounded-xl p-3" style={{ background: 'var(--ax-surface-sage)' }}>
                    <p className="text-xs text-[#4E6B4D] leading-relaxed">Dominio sólido de esta habilidad. Mantén tu ritmo de práctica para conservarlo.</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Skill distribution pie chart */}
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
          <h3 className="font-bold text-[#2D2A26] text-sm mb-4 flex items-center gap-2"><MS name="donut_large" className="!text-[18px] text-[#E76F51]" /> Distribución de habilidades</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-[var(--color-muted-navy)]">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill radar chart */}
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
          <h3 className="font-bold text-[#2D2A26] text-sm mb-4 flex items-center gap-2"><MS name="radar" className="!text-[18px] text-[#B85C3C]" /> Perfil de habilidades</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#F5E9D3" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#6B6661' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#A89B8C' }} />
              <Radar name="Score" dataKey="score" stroke="#E76F51" fill="#E76F51" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Learning trajectory */}
      {trajectoryData.length > 0 && (
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
          <h3 className="font-bold text-[#2D2A26] text-sm mb-4 flex items-center gap-2"><MS name="timeline" className="!text-[18px] text-[#6B8E6A]" /> Tu curva de aprendizaje</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trajectoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E9D3" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B6661' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6B6661' }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#E76F51" strokeWidth={3} dot={{ fill: '#E76F51', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Module usage */}
      {moduleData.length > 0 && (
        <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
          <h3 className="font-bold text-[#2D2A26] text-sm mb-4 flex items-center gap-2"><MS name="bar_chart" className="!text-[18px] text-[#E9B83E]" /> Uso por módulo</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={moduleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E9D3" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B6661' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6B6661' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#E76F51" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Learning mode selector */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
        <h3 className="font-bold text-[#2D2A26] text-sm mb-4 flex items-center gap-2">
          <MS name="tune" className="!text-[18px] text-[#2D2A26]" /> Modo de aprendizaje
        </h3>
        <p className="text-xs text-[var(--color-muted-navy)] mb-4">Elige tu ritmo. El sistema adaptará la frecuencia y duración de tus sesiones.</p>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(modeConfig).map(([key, config]) => (
            <button key={key} onClick={() => updateLearningMode(key)} disabled={savingMode} className={`p-4 rounded-2xl border text-center transition-all ${learningMode === key ? 'border-2' : 'border-[var(--color-border-soft)] hover:border-[#E76F51]/30'}`} style={learningMode === key ? { borderColor: config.color, background: config.color + '10' } : {}}>
              <MS name={config.icon} className="!text-[32px] mb-2" style={{ color: config.color } as any} />
              <div className="font-bold text-sm text-[#2D2A26]">{config.label}</div>
              <div className="text-[10px] text-[var(--color-muted-navy)] mt-1">{config.desc}</div>
              {learningMode === key && <MS name="check_circle" className="!text-[18px] mt-2" style={{ color: config.color } as any} />}
            </button>
          ))}
        </div>
        {savingMode && <p className="text-xs text-[var(--color-muted-navy)] text-center mt-2"><Loader2 className="w-3 h-3 inline animate-spin mr-1" />Guardando…</p>}
      </div>
    </div>
  )
}

// 8. PANEL ADMIN — Estadisticas de cualquier usuario por nombre o correo, con reporte imprimible
interface AdminUserRow {
  id: string; name: string | null; email: string; roles: string[]; createdAt: string; lastLoginAt: string | null
  cefrCurrent: string; sessionsCount: number; vocabularyCount: number
  skills: { reading: number; writing: number; listening: number; speaking: number }
}
interface AdminReport {
  windowDays: number
  user: { id: string; name: string | null; email: string; roles: string[]; createdAt: string; lastLoginAt: string | null; learningMode: string; professionalDomain: string | null; weeklyMinutesGoal: number }
  progress: {
    cefrInitial: string; cefrCurrent: string; theta: number
    skills: { reading: number; writing: number; listening: number; speaking: number }
    skillCEFRs: { reading: string; writing: string; listening: string; speaking: string }
    sessionsCount: number; totalActiveMinutes: number; vocabularyCount: number; dueReviews: number
    trajectory: { date: string; theta: number }[]
    moduleBreakdown: Record<string, number>
  }
  platformAvg: { reading: number; writing: number; listening: number; speaking: number }
  allTime: { sessions: number; minutes: number }
}

const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Nunca'

function UserCard({ u, onOpen }: { u: AdminUserRow; onOpen: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] flex-shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #E76F51, #C2553A)', color: '#FFF' }}>
          {(u.name || u.email)[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm text-[#2D2A26] truncate">{u.name || 'Usuario'}</div>
          <div className="text-xs text-[var(--color-muted-navy)] truncate">{u.email}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {u.roles.map(r => <span key={r} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r === 'ADMIN' ? 'bg-[#FCEAE3] text-[#C2553A]' : 'bg-[#E8EFE3] text-[#4E6B4D]'}`}>{r}</span>)}
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-crema)] text-grafito">Nivel {u.cefrCurrent}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl p-2 border border-[var(--color-border-soft)]">
          <div className="text-lg font-bold text-[#2D2A26]">{u.sessionsCount}</div>
          <div className="text-[10px] text-[var(--color-muted-navy)]">sesiones</div>
        </div>
        <div className="rounded-xl p-2 border border-[var(--color-border-soft)]">
          <div className="text-lg font-bold text-[#2D2A26]">{u.vocabularyCount}</div>
          <div className="text-[10px] text-[var(--color-muted-navy)]">palabras</div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-[var(--color-muted-navy)]">Último acceso: {fmtDate(u.lastLoginAt)}</span>
        <button onClick={() => onOpen(u.id)} className="text-xs font-bold text-white px-3 py-1.5 rounded-lg flex items-center gap-1 flex-shrink-0" style={{ background: '#E76F51' }}>
          <MS name="query_stats" className="!text-[14px]" /> Ver estadísticas
        </button>
      </div>
    </div>
  )
}

function AdminTab({ user }: { user: User }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminUserRow[] | null>(null)
  const [recent, setRecent] = useState<AdminUserRow[]>([])
  const [system, setSystem] = useState<{ totalUsers: number; sessionsWindow: number; errorsWindow: number } | null>(null)
  const [searching, setSearching] = useState(false)
  const [report, setReport] = useState<AdminReport | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetch('/api/admin/user-stats').then(r => r.json()).then(d => {
      if (d?.ok) { setRecent(d.users || []); setSystem(d.system || null) }
    }).catch(() => {})
  }, [])

  async function runSearch() {
    const q = query.trim()
    if (q.length < 2) { toast.info('Escribe al menos 2 caracteres del nombre o correo'); return }
    setSearching(true)
    try {
      const r = await fetch(`/api/admin/user-stats?q=${encodeURIComponent(q)}`)
      const d = await r.json()
      if (d?.ok) { setResults(d.users || []); if ((d.users || []).length === 0) toast.info('Sin coincidencias para esa búsqueda') }
      else toast.error(d?.error || 'No se pudo buscar')
    } catch { toast.error('Error de red al buscar') } finally { setSearching(false) }
  }

  async function openReport(userId: string, windowDays: number = days) {
    setLoadingReport(true)
    try {
      const r = await fetch(`/api/admin/user-stats?userId=${encodeURIComponent(userId)}&days=${windowDays}`)
      const d = await r.json()
      if (d?.ok) { setReport(d.report); window.scrollTo({ top: 0, behavior: 'smooth' }) }
      else toast.error(d?.error || 'No se pudo cargar el reporte')
    } catch { toast.error('Error de red') } finally { setLoadingReport(false) }
  }

  async function changeDays(d: number) {
    setDays(d)
    if (report) await openReport(report.user.id, d)
  }

  function backToSearch() { setReport(null); setResults(null); setQuery('') }

  if (loadingReport) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#E76F51]" /></div>

  if (report) {
    const skills = report.progress.skills
    const skillKeys = Object.keys(PASTEL) as Array<keyof typeof PASTEL>
    const strongest = skillKeys.reduce((a, b) => (skills[a] >= skills[b] ? a : b))
    const avg = report.platformAvg
    const above = (k: keyof typeof skills) => Math.round(skills[k]) >= Math.round(avg[k])
    const conclusion =
      `${report.user.name || report.user.email} pasó de un nivel ${report.progress.cefrInitial} a un nivel ${report.progress.cefrCurrent}` +
      `. Acumula ${report.allTime.sessions} sesiones y ${report.allTime.minutes} minutos de práctica activa en total` +
      ` (${report.progress.sessionsCount} sesiones y ${report.progress.totalActiveMinutes} minutos en los últimos ${report.windowDays} días)` +
      `, con ${report.progress.vocabularyCount} palabras en su vocabulario y ${report.progress.dueReviews} repasos pendientes.` +
      ` Su habilidad más sólida es ${PASTEL[strongest].name} con ${Math.round(skills[strongest])}%,` +
      ` ${above(strongest) ? 'por encima' : 'por debajo'} del promedio de la plataforma.`
    const trajectoryData = report.progress.trajectory.map(t => ({ date: t.date.slice(5), score: t.theta }))
    const moduleData = Object.entries(report.progress.moduleBreakdown).map(([name, count]) => ({ name, count }))

    return (
      <div className="space-y-6">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Reporte de avance</h2>
            <p className="text-sm text-[var(--color-muted-navy)] mt-0.5">{report.user.name || report.user.email} · últimos {report.windowDays} días</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="tab-pill">
              {[30, 90, 365].map(d => (
                <button key={d} onClick={() => changeDays(d)} className={`tab-pill-button ${days === d ? 'active' : ''}`}>{d === 365 ? 'Todo' : `${d} días`}</button>
              ))}
            </div>
            <button onClick={backToSearch} className="px-4 py-2.5 rounded-2xl border border-[var(--color-border-soft)] bg-white text-sm font-semibold text-[#2D2A26] hover:border-[#E76F51]/40 transition-all flex items-center gap-1.5">
              <MS name="arrow_back" className="!text-[16px]" /> Cambiar usuario
            </button>
            <button onClick={() => window.print()} title="Abre el diálogo de impresión; elige Guardar como PDF" className="btn-tactile px-4 py-2.5 rounded-2xl text-sm font-semibold flex items-center gap-1.5">
              <MS name="print" className="!text-[16px]" /> Imprimir PDF
            </button>
          </div>
        </div>

        <div className="print-area space-y-6">
          <div className="print-only pb-2 border-b border-[#E2D9CE]">
            <p className="text-lg font-bold">Axiom — Reporte de avance de usuario</p>
            <p className="text-xs">Generado el {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })} por {user.name || user.email}</p>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[12px] flex-shrink-0 flex items-center justify-center text-lg font-bold" style={{ background: 'linear-gradient(135deg, #E76F51, #C2553A)', color: '#FFF' }}>
                  {(report.user.name || report.user.email)[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-bold text-[#2D2A26]">{report.user.name || 'Usuario'}</div>
                  <div className="text-sm text-[var(--color-muted-navy)]">{report.user.email}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {report.user.roles.map(r => <span key={r} className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${r === 'ADMIN' ? 'bg-[#FCEAE3] text-[#C2553A]' : 'bg-[#E8EFE3] text-[#4E6B4D]'}`}>{r}</span>)}
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--color-crema)] text-grafito">Nivel {report.progress.cefrInitial} → {report.progress.cefrCurrent}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-center">
              <div className="rounded-xl p-3 border border-[var(--color-border-soft)]">
                <div className="text-sm font-bold text-[#2D2A26]">{fmtDate(report.user.createdAt)}</div>
                <div className="text-[10px] text-[var(--color-muted-navy)] uppercase tracking-wider">Registro</div>
              </div>
              <div className="rounded-xl p-3 border border-[var(--color-border-soft)]">
                <div className="text-sm font-bold text-[#2D2A26]">{fmtDate(report.user.lastLoginAt)}</div>
                <div className="text-[10px] text-[var(--color-muted-navy)] uppercase tracking-wider">Último acceso</div>
              </div>
              <div className="rounded-xl p-3 border border-[var(--color-border-soft)]">
                <div className="text-sm font-bold text-[#2D2A26] capitalize">{(report.user.professionalDomain || 'general').replace(/_/g, ' ')}</div>
                <div className="text-[10px] text-[var(--color-muted-navy)] uppercase tracking-wider">Dominio</div>
              </div>
              <div className="rounded-xl p-3 border border-[var(--color-border-soft)]">
                <div className="text-sm font-bold text-[#2D2A26]">{report.allTime.minutes} min</div>
                <div className="text-[10px] text-[var(--color-muted-navy)] uppercase tracking-wider">Práctica total</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
            <h3 className="font-bold text-[#2D2A26] text-sm mb-3 flex items-center gap-2"><MS name="description" className="!text-[18px] text-[#E76F51]" /> Conclusión de avance</h3>
            <p className="text-sm text-[#2D2A26] leading-relaxed">{conclusion}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-4 text-center">
              <MS name="forum" className="!text-[24px] text-[#E76F51] mb-1" />
              <div className="text-2xl font-bold text-[#2D2A26]">{report.progress.sessionsCount}</div>
              <div className="text-xs text-[var(--color-muted-navy)]">Sesiones del periodo</div>
            </div>
            <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-4 text-center">
              <MS name="schedule" className="!text-[24px] text-[#E9B83E] mb-1" />
              <div className="text-2xl font-bold text-[#2D2A26]">{report.progress.totalActiveMinutes}</div>
              <div className="text-xs text-[var(--color-muted-navy)]">Minutos del periodo</div>
            </div>
            <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-4 text-center">
              <MS name="menu_book" className="!text-[24px] text-[#6B8E6A] mb-1" />
              <div className="text-2xl font-bold text-[#2D2A26]">{report.progress.vocabularyCount}</div>
              <div className="text-xs text-[var(--color-muted-navy)]">Palabras aprendidas</div>
            </div>
            <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-4 text-center">
              <MS name="event_repeat" className="!text-[24px] text-[#B85C3C] mb-1" />
              <div className="text-2xl font-bold text-[#2D2A26]">{report.progress.dueReviews}</div>
              <div className="text-xs text-[var(--color-muted-navy)]">Repasos pendientes</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#2D2A26] mb-3 tracking-tight flex items-center gap-2">
              <MS name="insights" className="!text-[20px] text-[#E76F51]" /> Desempeño por habilidad
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {skillKeys.map(skillKey => {
                const skill = PASTEL[skillKey]
                const score = skills[skillKey] || 20
                const cefr = report.progress.skillCEFRs[skillKey] || 'A2'
                const avgScore = Math.round(avg[skillKey] ?? 0)
                return (
                  <div key={skillKey} className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: skill.bg }}>
                          <MS name={skill.iconName} className="!text-[22px]" style={{ color: skill.icon } as any} />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#2D2A26]">{skill.name}</div>
                          <div className="text-[10px] text-[var(--color-muted-navy)]">Nivel {cefr} · {LEVEL_NAMES[cefr] || 'Básico'}</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: skill.text }}>{Math.round(score)}%</div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--ax-track-soft)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: skill.icon }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--color-muted-navy)] mb-2">
                      <span>Promedio de la plataforma: {avgScore}%</span>
                      <span className={`font-bold ${above(skillKey) ? 'text-[#6B8E6A]' : 'text-[#C2553A]'}`}>{above(skillKey) ? 'Por encima del promedio' : 'Por debajo del promedio'}</span>
                    </div>
                    <p className="text-xs font-medium mb-3" style={{ color: skill.text }}>{skillDesc(score)}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
              <h3 className="font-bold text-[#2D2A26] text-sm mb-4 flex items-center gap-2"><MS name="timeline" className="!text-[18px] text-[#6B8E6A]" /> Curva de aprendizaje (theta)</h3>
              {trajectoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={trajectoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5E9D3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B6661' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B6661' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#E76F51" strokeWidth={3} dot={{ fill: '#E76F51', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-[var(--color-muted-navy)] py-10 text-center">Sin evaluaciones registradas en el periodo seleccionado.</p>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-5">
              <h3 className="font-bold text-[#2D2A26] text-sm mb-4 flex items-center gap-2"><MS name="bar_chart" className="!text-[18px] text-[#E9B83E]" /> Uso por módulo</h3>
              {moduleData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={moduleData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5E9D3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B6661' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B6661' }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#E76F51" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-[var(--color-muted-navy)] py-10 text-center">Sin sesiones registradas en el periodo seleccionado.</p>
              )}
            </div>
          </div>

          <div className="print-only pt-2 border-t border-[#E2D9CE]">
            <p className="text-[10px]">Documento generado automáticamente por la plataforma Axiom para justificar el avance de aprendizaje del usuario.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h2 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Panel de administración</h2>
        <p className="text-sm text-[var(--color-muted-navy)] mt-0.5">Consulta las estadísticas de cualquier usuario por nombre o correo y genera su reporte en PDF.</p>
      </div>

      {system && (
        <div className="no-print grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-4 text-center">
            <MS name="group" className="!text-[24px] text-[#E76F51] mb-1" />
            <div className="text-2xl font-bold text-[#2D2A26]">{system.totalUsers}</div>
            <div className="text-xs text-[var(--color-muted-navy)]">Usuarios registrados</div>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-4 text-center">
            <MS name="forum" className="!text-[24px] text-[#E9B83E] mb-1" />
            <div className="text-2xl font-bold text-[#2D2A26]">{system.sessionsWindow}</div>
            <div className="text-xs text-[var(--color-muted-navy)]">Sesiones · 30 días</div>
          </div>
          <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-4 text-center">
            <MS name="bug_report" className="!text-[24px] text-[#6B8E6A] mb-1" />
            <div className="text-2xl font-bold text-[#2D2A26]">{system.errorsWindow}</div>
            <div className="text-xs text-[var(--color-muted-navy)]">Errores · 30 días</div>
          </div>
        </div>
      )}

      <div className="no-print bg-white rounded-2xl border border-[var(--color-border-soft)] p-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <MS name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grafito pointer-events-none" />
          <Input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') runSearch() }} placeholder="Buscar por nombre o correo, p. ej. Ana o ana@correo.mx" className="w-full pl-11 pr-4 bg-crema/60 border-[var(--color-border-soft)] rounded-2xl focus:ring-2 focus:ring-coral/30 focus:border-coral transition-all outline-none text-sm h-12" />
        </div>
        <button onClick={runSearch} disabled={searching} className="btn-tactile px-5 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <MS name="search" className="!text-[16px]" />} Buscar
        </button>
      </div>

      {results ? (
        <div>
          <h3 className="text-lg font-bold text-[#2D2A26] mb-3 flex items-center gap-2">
            <MS name="manage_search" className="!text-[20px] text-[#E76F51]" /> Resultados {results.length > 0 && `(${results.length})`}
          </h3>
          {results.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {results.map(u => <UserCard key={u.id} u={u} onOpen={openReport} />)}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-8 text-center text-sm text-[var(--color-muted-navy)]">
              No se encontraron usuarios con ese nombre o correo. Prueba con otro término.
            </div>
          )}
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-bold text-[#2D2A26] mb-3 flex items-center gap-2">
            <MS name="history" className="!text-[20px] text-[#E76F51]" /> Registros recientes
          </h3>
          {recent.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {recent.map(u => <UserCard key={u.id} u={u} onOpen={openReport} />)}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[var(--color-border-soft)] p-8 text-center text-sm text-[var(--color-muted-navy)]">
              Cargando usuarios…
            </div>
          )}
        </div>
      )}
    </div>
  )
}
