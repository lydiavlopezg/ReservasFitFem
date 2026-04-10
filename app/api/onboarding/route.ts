import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId, selectedModalidades } = await req.json()
    
    if (!userId || !selectedModalidades) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Limpiar cualquier intento previo para evitar errores de clave duplicada
    await supabase.from('user_modalidades').delete().eq('user_id', userId)

    // 2. Insertar modalidades
    const inserts = selectedModalidades.map((mid: string) => ({ 
      user_id: userId, 
      modalidad_id: mid 
    }))
    
    const { error: err1 } = await supabase.from('user_modalidades').insert(inserts)
    if (err1) throw err1

    // 2. Marcar onboarding como hecho
    const { error: err2 } = await supabase
      .from('users')
      .update({ onboarding_done: true })
      .eq('id', userId)
    
    if (err2) throw err2

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API Onboarding Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
