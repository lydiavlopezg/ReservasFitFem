import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import styles from './perfil.module.css'

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nombre, apellidos, email, fecha_nacimiento, pack_id, packs(nombre, num_actividades, sesiones_semanales)')
    .eq('id', user.id)
    .single()

  const { data: modalidades } = await supabase
    .from('user_modalidades')
    .select('modalidades(nombre)')
    .eq('user_id', user.id)

  if (!profile) redirect('/login')

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mi Perfil</h1>

      {/* Card principal */}
      <div className={styles.profileCard}>
        <div className={styles.avatar}>
          <span>{profile.nombre.charAt(0)}{profile.apellidos.charAt(0)}</span>
        </div>
        <div>
          <h2 className={styles.name}>{profile.nombre} {profile.apellidos}</h2>
          <p className={styles.email}>{profile.email}</p>
        </div>
      </div>

      {/* Info */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Datos personales</h3>
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Nombre</span>
            <span className={styles.fieldValue}>{profile.nombre} {profile.apellidos}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <span className={styles.fieldValue}>{profile.email}</span>
          </div>
          {profile.fecha_nacimiento && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Fecha de nacimiento</span>
              <span className={styles.fieldValue}>
                {new Date(profile.fecha_nacimiento).toLocaleDateString('es-ES')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pack */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Mi suscripción</h3>
        <div className={styles.packCard}>
          <div className={styles.packIcon}>💪</div>
          <div>
            <p className={styles.packName}>{(profile.packs as { nombre?: string })?.nombre || 'Sin pack'}</p>
            {(profile.packs as { sesiones_semanales?: number | null })?.sesiones_semanales ? (
              <p className={styles.packDetail}>Hasta {(profile.packs as { sesiones_semanales?: number })?.sesiones_semanales} sesiones por semana</p>
            ) : (
              <p className={styles.packDetail}>Sesiones ilimitadas</p>
            )}
          </div>
        </div>

        {modalidades && modalidades.length > 0 && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
              Modalidades incluidas
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {modalidades.map((m: any, i: number) => {
                const nombreMod = Array.isArray(m.modalidades) ? m.modalidades[0]?.nombre : m.modalidades?.nombre
                return (
                  <span key={i} className="badge badge-primary" style={{ fontSize: 'var(--font-sm)', padding: '4px 12px' }}>
                    {nombreMod}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="alert alert-info" style={{ marginTop: 'var(--space-4)' }}>
        <span>ℹ️</span>
        <span>Para cambiar tu pack, modalidades o contraseña, contacta con la administración.</span>
      </div>
    </div>
  )
}
