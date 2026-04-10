const { createClient } = require('@supabase/supabase-js')

const url = "https://bimnjpsikglozurfkyuw.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpbW5qcHNpa2dsb3p1cmZreXV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyNTA5NywiZXhwIjoyMDkxNDAxMDk3fQ.XimjtuK2-gGwDed2mo8V4WVWeKU6tFXQXQlxu6WEHMU"

const supabase = createClient(url, key)

async function check() {
  console.log("Checking user admin@fitfem.com...")
  const { data, error } = await supabase.from('users').select('*').eq('email', 'admin@fitfem.com').single()
  if (error) {
    console.error("Error fetching user:", error)
  } else {
    console.log("User data:", JSON.stringify(data, null, 2))
  }

  console.log("\nChecking table columns of users...")
  const { data: sample, error: sampleError } = await supabase.from('users').select('*').limit(1)
  if (sample && sample.length > 0) {
    console.log("Sample columns:", Object.keys(sample[0]))
  } else {
    console.log("No users found to check columns.")
  }
}

check()
