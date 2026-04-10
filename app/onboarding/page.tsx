import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingClient from './OnboardingClient'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  console.log('Onboarding Server Component: Start')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('Onboarding Server: No user, redirect to login')
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('onboarding_done, pack_id, packs(num_actividades)')
    .eq('id', user.id)
    .single()

  console.log('Onboarding Server: Profile fetched', { 
    id: user.id, 
    onboarding_done: profile?.onboarding_done,
    pack_id: profile?.pack_id
  })

  if (!profile || profile.onboarding_done) {
    console.log('Onboarding Server: Redirecting to /horario because done or no profile')
    redirect('/horario')
  }
  const p: any = profile.packs
  const num = (Array.isArray(p) ? p[0]?.num_actividades : p?.num_actividades) || 1
  if (num >= 99) {
    // Ilimitado: marcar directamente como hecho
    await supabase.from('users').update({ onboarding_done: true }).eq('id', user.id)
    redirect('/horario')
  }

  const { data: modalidades } = await supabase.from('modalidades').select('id, nombre').order('nombre')

  return (
    <OnboardingClient
      userId={user.id}
      packNumActividades={num}
      modalidades={modalidades || []}
    />
  )
}
