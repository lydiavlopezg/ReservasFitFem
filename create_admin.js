const { createClient } = require('@supabase/supabase-js')

const url = "https://bimnjpsikglozurfkyuw.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpbW5qcHNpa2dsb3p1cmZreXV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyNTA5NywiZXhwIjoyMDkxNDAxMDk3fQ.XimjtuK2-gGwDed2mo8V4WVWeKU6tFXQXQlxu6WEHMU"

const supabase = createClient(url, key)

async function create() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@fitfem.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      nombre: 'Lydia/Ana',
      apellidos: 'Admin',
      dni_numerico: '12345678',
      rol: 'admin'
    }
  })

  // The user says "incluso poniendo 12345678", but actually Supabase might require >=6 chars. I will overwrite it to '12345678' just to be 100% sure.
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('El usuario ya existe en Supabase Auth.')
      // we could try to fetch it
    } else {
      console.error("Error creating user:", error)
      return
    }
  }

  // To ensure the password is what the user expects, we can just update it
  if (data?.user) {
    await supabase.auth.admin.updateUserById(data.user.id, { password: '12345678' })
    console.log("ID del nuevo admin:", data.user.id)
    
    // Insert into users
    const { error: dbError } = await supabase.from('users').insert({
      id: data.user.id,
      email: 'admin@fitfem.com',
      nombre: 'Ana/Lydia',
      apellidos: 'Admin',
      dni_numerico: '12345678',
      rol: 'admin',
      onboarding_done: true
    })
    
    if (dbError) {
      console.error("Error BD:", dbError)
    } else {
      console.log("¡Creada Ana/Lydia Admin con éxito!")
    }
  }
}

create()
