'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email o contraseña incorrectos. Recuerda que tu contraseña son los 8 dígitos de tu DNI.')
      setLoading(false)
      return
    }

    // Obtener perfil para ver rol
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('rol, onboarding_done')
        .eq('id', user.id)
        .single()

      if (profile?.rol === 'admin') {
        router.push('/admin/dashboard')
      } else if (!profile?.onboarding_done) {
        router.push('/onboarding')
      } else {
        router.push('/horario')
      }
    }
    router.refresh()
  }

  return (
    <div className={styles.wrapper}>
      {/* Fondo decorativo */}
      <div className={styles.bg}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
      </div>

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoWrap}>
          <img src="/logolargo.PNG" alt="Fit&Fem Studio" style={{ maxWidth: '200px', height: 'auto', marginBottom: '1rem' }} />
          <p className={styles.logoStudio}>STUDIO · OCAÑA</p>
        </div>

        <h1 className={styles.title}>Bienvenida de nuevo</h1>
        <p className={styles.subtitle}>Accede a tu cuenta para reservar tus clases</p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className="form-group">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <p className={styles.hint}>
              💡 Tu contraseña son los <strong>8 dígitos de tu DNI</strong> (sin letra)
            </p>
          </div>

          <button type="submit" className={`btn btn-primary btn-lg w-full ${styles.submitBtn}`} disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Accediendo...' : 'Entrar'}
          </button>
        </form>

        <p className={styles.footer}>
          ¿Problemas para acceder? Contacta con la administración.
        </p>
      </div>
    </div>
  )
}
