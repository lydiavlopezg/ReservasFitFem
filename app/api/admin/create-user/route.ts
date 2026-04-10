import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { email, password, user_metadata, modalidades } = await req.json()
    const supabase = createAdminClient()

    // 1. Crear usuario en Auth (usando admin API para auto-confirmar email)
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    
    // El trigger en Supabase normalmente inserta en la tabla `users` al crear en auth, 
    // pero como el trigger no está definido en el script SQL, lo insertamos manualmente.
    const userId = data.user.id

    const { error: dbError } = await supabase.from('users').insert({
      id: userId,
      email,
      nombre: user_metadata.nombre,
      apellidos: user_metadata.apellidos,
      dni_numerico: user_metadata.dni_numerico,
      fecha_nacimiento: user_metadata.fecha_nacimiento,
      rol: user_metadata.rol,
      pack_id: user_metadata.pack_id,
      onboarding_done: true
    })

    if (dbError) {
      // Rollback
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    // 2. Insertar modalidades preasignadas (Pack 1) si las hay
    if (modalidades && modalidades.length > 0) {
      const inserts = modalidades.map((m: string) => ({ user_id: userId, modalidad_id: m }))
      await supabase.from('user_modalidades').insert(inserts)
    }

    // 3. TODO: Interfaz con Resend para el email de bienvenida

    return NextResponse.json({ success: true, user: data.user })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
