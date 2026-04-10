import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { action } = await req.json()

    if (action === 'generate') {
      const { data: lastSession } = await supabaseAdmin
        .from('sesiones')
        .select('fecha')
        .order('fecha', { ascending: false })
        .limit(1)

      let baseDate = new Date()
      if (lastSession && lastSession.length > 0) {
        // Usamos T12:00:00 para evitar problemas de desfase horario al crear el Date
        baseDate = new Date(lastSession[0].fecha + 'T12:00:00')
        baseDate.setDate(baseDate.getDate() + 1)
      }
      baseDate.setHours(12, 0, 0, 0)

      const { data: clases, error: clasesError } = await supabaseAdmin
        .from('clases')
        .select('*')
        .eq('activa', true)

      if (clasesError) throw clasesError

      const inserted = []
      // Generamos exactamente 7 días a partir de la fecha base
      for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate)
        d.setDate(baseDate.getDate() + i)
        
        const diaJS = d.getDay()
        const diaDB = diaJS === 0 ? 7 : diaJS 
        const dateStr = d.toISOString().split('T')[0]
        
        const clasesHoy = clases.filter(c => c.dia_semana === diaDB)

        for (const clase of clasesHoy) {
          const { data, error } = await supabaseAdmin
            .from('sesiones')
            .upsert({
              clase_id: clase.id,
              fecha: dateStr,
              plazas_ocupadas: 0,
              cancelada: false
            }, { 
              onConflict: 'clase_id, fecha' 
            })
            .select()

          if (!error && data) inserted.push(data)
        }
      }

      return NextResponse.json({ 
        success: true, 
        count: inserted.length,
        period: `${baseDate.toISOString().split('T')[0]} - 7 días`
      })
    }

    if (action === 'delete_future') {
      const today = new Date().toISOString().split('T')[0]
      const { data: conReservas } = await supabaseAdmin.from('reservas').select('sesion_id')
      const idsExcluir = Array.from(new Set(conReservas?.map(r => r.sesion_id) || []))

      let query = supabaseAdmin.from('sesiones').delete().gt('fecha', today)
      if (idsExcluir.length > 0) {
        query = query.not('id', 'in', `(${idsExcluir.join(',')})`)
      }
      const { error } = await query
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    console.error('API Error:', error.message)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}
