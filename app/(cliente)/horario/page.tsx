import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HorarioSemanal from '@/components/cliente/HorarioSemanal'

export const dynamic = 'force-dynamic'

export default async function HorarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener perfil completo
  const { data: profile } = await supabase
    .from('users')
    .select('id, pack_id, packs(nombre, num_actividades, sesiones_semanales)')
    .eq('id', user.id)
    .single()

  // Modalidades del usuario
  const { data: userMods } = await supabase
    .from('user_modalidades')
    .select('modalidad_id')
    .eq('user_id', user.id)

  // Obtener solo sesiones de la semana actual
  const hoy = new Date()
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7)) // Lunes de esta semana
  
  const domingoNext = new Date(lunes)
  domingoNext.setDate(lunes.getDate() + 13) // Domingo de la PROXIMA semana

  const desde = lunes.toISOString().split('T')[0]
  const hasta = domingoNext.toISOString().split('T')[0]

  const { data: sesiones } = await supabase
    .from('sesiones')
    .select(`
      id, fecha, plazas_ocupadas, cancelada,
      clases (
        id, monitora, hora_inicio, hora_fin, plazas_max, dia_semana,
        modalidades (id, nombre)
      )
    `)
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .eq('cancelada', false)
    .order('fecha', { ascending: true })

  // Reservas actuales del usuario
  const { data: misReservas } = await supabase
    .from('reservas')
    .select('sesion_id, estado')
    .eq('user_id', user.id)
    .in('estado', ['confirmada', 'espera'])

  // Config
  const { data: configRows } = await supabase.from('config').select('clave, valor')
  const config = Object.fromEntries((configRows || []).map((r: { clave: string; valor: string }) => [r.clave, r.valor]))

  const sesionesMapped = (sesiones || []).map(s => {
    const c = Array.isArray(s.clases) ? s.clases[0] : s.clases
    const m = c && Array.isArray(c.modalidades) ? c.modalidades[0] : c?.modalidades
    return {
      ...s,
      clases: c ? { ...c, modalidades: m } : null
    }
  })

  const profileMapped = profile ? {
    ...profile,
    packs: Array.isArray(profile.packs) ? profile.packs[0] : profile.packs
  } : null

  return (
    <HorarioSemanal
      sesiones={sesionesMapped as any}
      misReservas={misReservas || []}
      userId={user.id}
      profile={profileMapped as any}
      userModalidadIds={(userMods || []).map((m: { modalidad_id: string }) => m.modalidad_id)}
      config={config}
    />
  )
}
