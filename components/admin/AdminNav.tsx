'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './AdminNav.module.css'

export default function AdminNav({ nombre }: { nombre: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/clientes', label: 'Clientes', icon: '👥' },
    { href: '/admin/admin-horario', label: 'Horario Base', icon: '📅' },
    { href: '/admin/configuracion', label: 'Configuración', icon: '⚙️' },
  ]

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src="/logolargo.PNG" alt="Fit&Fem" style={{ height: '40px', width: 'auto', marginBottom: '8px' }} />
          <div className={styles.adminBadge}>ADMIN PANEL</div>
        </div>

        <nav className={styles.nav}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`${styles.navLink} ${pathname === l.href ? styles.active : ''}`}
            >
              <span className={styles.icon}>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className={styles.footer}>
          <p className={styles.userName}>Hola, <strong>{nombre}</strong></p>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Header móvil */}
      <header className={styles.mobileHeader}>
        <div className={styles.brand}>
          <img src="/logolargo.PNG" alt="Fit&Fem" style={{ height: '28px', width: 'auto' }} />
        </div>
        <button className={styles.menuBtn} onClick={() => document.getElementById('mobileNav')?.classList.toggle(styles.open)}>
          ☰
        </button>
      </header>

      {/* Nav móvil expandible */}
      <nav id="mobileNav" className={styles.mobileNav}>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`${styles.navLink} ${pathname === l.href ? styles.active : ''}`}
            onClick={() => document.getElementById('mobileNav')?.classList.remove(styles.open)}
          >
            <span className={styles.icon}>{l.icon}</span>
            {l.label}
          </Link>
        ))}
        <button className={`${styles.navLink} ${styles.logoutBtnMobile}`} onClick={handleLogout}>
          <span className={styles.icon}>🚪</span> Salir
        </button>
      </nav>
    </>
  )
}
