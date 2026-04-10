import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HorarioAdminClient from '@/components/admin/HorarioAdminClient'

export const dynamic = 'force-dynamic'

export default async function HorarioAdminPage() {
  const supabase = await createClient()

  // Leer todas las clases base (horario fijo)
  const { data: clases } = await supabase
    .from('clases')
    .select('*, modalidades(nombre)')
    .order('dia_semana', { ascending: true })
    .order('hora_inicio', { ascending: true })

  const { data: modalidades } = await supabase.from('modalidades').select('*')

  return <HorarioAdminClient clases={clases || []} modalidades={modalidades || []} />
}
