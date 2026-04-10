import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientesClient from '@/components/admin/ClientesClient'

export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select('id, email, nombre, apellidos, dni_numerico, rol, activo, packs(nombre, num_actividades)')
    .eq('rol', 'cliente')
    .order('created_at', { ascending: false })

  const { data: packs } = await supabase.from('packs').select('id, nombre, num_actividades')
  const { data: modalidades } = await supabase.from('modalidades').select('id, nombre')

  const clientesMapped = (users || []).map(u => ({
    ...u,
    packs: Array.isArray(u.packs) ? u.packs[0] : u.packs
  }))

  return (
    <ClientesClient 
      clientes={clientesMapped as any} 
      packs={packs || []} 
      modalidades={modalidades || []} 
    />
  )
}
