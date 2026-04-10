import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/admin/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Datos base: total usuarios, clases
  const { count: usuariosCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('rol', 'cliente')
  
  // Ocupación promedio
  const { data: sesiones } = await supabase.from('sesiones').select('plazas_ocupadas, clases(plazas_max, modalidades(nombre))')
  let totalPlazas = 0
  let totalOcupadas = 0
  
  const ocupacionPorMod: Record<string, { o: number, t: number }> = {}

  sesiones?.forEach(s => {
    if (!s.clases) return
    const c = Array.isArray(s.clases) ? s.clases[0] : s.clases
    const max = c.plazas_max
    const ocup = s.plazas_ocupadas
    totalPlazas += max
    totalOcupadas += ocup

    const mod: any = c.modalidades
    const nombreMod = Array.isArray(mod) ? mod[0]?.nombre : mod?.nombre
    const finalMod = nombreMod || '?'
    if (!ocupacionPorMod[finalMod]) ocupacionPorMod[finalMod] = { o: 0, t: 0 }
    ocupacionPorMod[finalMod].o += ocup
    ocupacionPorMod[finalMod].t += max
  })

  const globalOcc = totalPlazas > 0 ? (totalOcupadas / totalPlazas) * 100 : 0

  const dataAforo = Object.entries(ocupacionPorMod).map(([name, val]) => ({
    name,
    ocupacion: parseFloat(((val.o / Math.max(val.t, 1)) * 100).toFixed(1))
  }))

  const stats = {
    usuariosTotales: usuariosCount || 0,
    ocupacionMediaGlobal: parseFloat(globalOcc.toFixed(1)),
    sesionesTotales: sesiones?.length || 0,
  }

  return <DashboardClient stats={stats} aforoData={dataAforo.sort((a,b) => b.ocupacion - a.ocupacion)} />
}
