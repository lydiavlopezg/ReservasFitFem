const { createClient } = require('@supabase/supabase-js')

const url = "https://bimnjpsikglozurfkyuw.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpbW5qcHNpa2dsb3p1cmZreXV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyNTA5NywiZXhwIjoyMDkxNDAxMDk3fQ.XimjtuK2-gGwDed2mo8V4WVWeKU6tFXQXQlxu6WEHMU"

const supabase = createClient(url, key)

async function seed() {
  console.log("Fetching classes...")
  const { data: clases, error: errC } = await supabase.from('clases').select('*')
  if (errC) { console.error(errC); return }
  
  console.log(`Found ${clases.length} classes. Generating sessions for this week and next...`)
  
  const today = new Date()
  const currentDay = today.getDay() // 0=Dom, 1=Lun...
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay
  
  const mondayThisWeek = new Date(today)
  mondayThisWeek.setDate(today.getDate() + diffToMonday)
  mondayThisWeek.setHours(0, 0, 0, 0)

  const sessions = []
  
  // Generar para 2 semanas (semana 0 y semana 1)
  for (let week = 0; week < 2; week++) {
    for (const clase of clases) {
      const sessionDate = new Date(mondayThisWeek)
      sessionDate.setDate(mondayThisWeek.getDate() + (week * 7) + (clase.dia_semana - 1))
      
      const yyyy = sessionDate.getFullYear()
      const mm = String(sessionDate.getMonth() + 1).padStart(2, '0')
      const dd = String(sessionDate.getDate()).padStart(2, '0')
      const dateStr = `${yyyy}-${mm}-${dd}`
      
      sessions.push({
        clase_id: clase.id,
        fecha: dateStr,
        plazas_ocupadas: 0,
        cancelada: false
      })
    }
  }

  console.log(`Inserting ${sessions.length} sessions...`)
  const { error: errI } = await supabase.from('sesiones').insert(sessions)
  if (errI) {
    console.error("Error inserting sessions:", errI)
  } else {
    console.log("Sessions generated successfully!")
  }
}

seed()
