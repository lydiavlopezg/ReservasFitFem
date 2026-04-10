import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConfiguracionClient from '@/components/admin/ConfiguracionClient'

export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const supabase = await createClient()

  const { data: config } = await supabase.from('config').select('*').order('clave')

  // Convert array to object
  const configMap = (config || []).reduce((acc: any, item: any) => {
    acc[item.clave] = item.valor
    return acc
  }, {})

  return <ConfiguracionClient config={configMap} />
}
