import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientNav from '@/components/cliente/ClientNav'
import styles from './client-layout.module.css'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nombre, apellidos, pack_id, packs(nombre)')
    .eq('id', user.id)
    .single()

  const profileMapped = profile ? {
    ...profile,
    packs: Array.isArray(profile.packs) ? profile.packs[0] : profile.packs
  } : null

  return (
    <div className={styles.shell}>
      <ClientNav profile={profileMapped as any} />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
