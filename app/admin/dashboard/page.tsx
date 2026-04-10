import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/admin/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Usuarios totales (clientes)
  const { count: usuariosCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('rol', 'cliente')

  // 2. Sesiones con datos de clase y modalidad (hasta 2000 para cubrir varios meses)
  const { data: sesiones } = await supabase
    .from('sesiones')
    .select(`
      id, fecha, plazas_ocupadas, cancelada,
      clases (
        hora_inicio, plazas_max,
        modalidades (nombre)
      )
    `)
    .order('fecha', { ascending: false })
    .limit(2000)

  // 3. Reservas con perfil de usuario (para edad y estado)
  const { data: reservas } = await supabase
    .from('reservas')
    .select(`
      id, created_at, estado, sesion_id,
      users (fecha_nacimiento, nombre)
    `)
    .order('created_at', { ascending: false })
    .limit(5000)

  // Mapear datos para el cliente
  // Nota: Pasamos los datos crudos pero estructurados para que el cliente filtre por Mes/Año
  const sesionesMapped = (sesiones || []).map(s => {
    const c = Array.isArray(s.clases) ? s.clases[0] : s.clases
    const modObj: any = c?.modalidades
    const nombreMod = Array.isArray(modObj) ? modObj[0]?.nombre : modObj?.nombre
    
    return {
      id: s.id,
      fecha: s.fecha,
      ocupadas: s.plazas_ocupadas,
      max: c?.plazas_max || 22,
      modalidad: nombreMod || 'Desconocida',
      hora: c?.hora_inicio || '00:00'
    }
  })

  const reservasMapped = (reservas || []).map(r => {
    const u = Array.isArray(r.users) ? r.users[0] : r.users
    return {
      id: r.id,
      fecha: r.created_at,
      estado: r.estado,
      sesion_id: r.sesion_id,
      fecha_nacimiento: u?.fecha_nacimiento || null
    }
  })

  return (
    <DashboardClient 
      usuariosTotales={usuariosCount || 0}
      sesiones={sesionesMapped}
      reservas={reservasMapped}
    />
  )
}
