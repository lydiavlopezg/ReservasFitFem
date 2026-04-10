import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MisReservasClient from '@/components/cliente/MisReservasClient'

export const dynamic = 'force-dynamic'

export default async function MisReservasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: config } = await supabase.from('config').select('clave, valor')
  const configMap = Object.fromEntries((config || []).map((r: { clave: string; valor: string }) => [r.clave, r.valor]))
  const horasCancelacion = parseInt(configMap['horas_cancelacion'] || '5')

  const { data: reservas } = await supabase
    .from('reservas')
    .select(`
      id, estado, created_at, cancelada_at,
      sesiones (
        id, fecha, cancelada,
        clases (
          hora_inicio, hora_fin, plazas_max,
          modalidades (nombre)
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  const reservasMapped = (reservas || []).map(r => {
    const s = Array.isArray(r.sesiones) ? r.sesiones[0] : r.sesiones
    const c: any = s && Array.isArray(s.clases) ? s.clases[0] : s?.clases
    const mods: any = c?.modalidades
    const m = mods && Array.isArray(mods) ? mods[0] : mods

    return {
      ...r,
      sesiones: s ? { ...s, clases: c ? { ...c, modalidades: m } : null } : null
    }
  })

  return <MisReservasClient reservas={reservasMapped as any} horasCancelacion={horasCancelacion} userId={user.id} />
}
