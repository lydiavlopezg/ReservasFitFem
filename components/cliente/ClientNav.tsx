'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './ClientNav.module.css'

interface Profile {
  nombre: string
  apellidos: string
  packs: { nombre: string } | null
}

export default function ClientNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/horario', label: 'Horario', icon: '📅' },
    { href: '/mis-reservas', label: 'Mis Reservas', icon: '✅' },
    { href: '/perfil', label: 'Mi Perfil', icon: '👤' },
  ]

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/horario" className={styles.logo}>
          <img src="/logolargo.PNG" alt="Fit&Fem" style={{ height: '32px', width: 'auto' }} />
        </Link>

        {/* Nav links — escritorio */}
        <nav className={styles.navLinks}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`${styles.navLink} ${pathname === l.href ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Perfil & logout */}
        <div className={styles.userArea}>
          {profile && (
            <span className={styles.userName}>
              Hola, <strong>{profile.nombre}</strong>
            </span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} aria-label="Cerrar sesión">
            Salir
          </button>
        </div>
      </div>

      {/* Bottom nav — móvil */}
      <nav className={styles.bottomNav}>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`${styles.bottomNavLink} ${pathname === l.href ? styles.bottomActive : ''}`}
          >
            <span className={styles.bottomIcon}>{l.icon}</span>
            <span className={styles.bottomLabel}>{l.label.split(' ')[0]}</span>
          </Link>
        ))}
        <button className={styles.bottomNavLink} onClick={handleLogout}>
          <span className={styles.bottomIcon}>🚪</span>
          <span className={styles.bottomLabel}>Salir</span>
        </button>
      </nav>
    </header>
  )
}
