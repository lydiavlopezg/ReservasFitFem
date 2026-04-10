import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/admin/AdminNav'
import styles from './admin-layout.module.css'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nombre, rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'admin') redirect('/horario')

  return (
    <div className={styles.shell}>
      <AdminNav nombre={profile.nombre} />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
