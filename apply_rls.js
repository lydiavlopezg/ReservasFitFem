const { createClient } = require('@supabase/supabase-js')

const url = "https://bimnjpsikglozurfkyuw.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpbW5qcHNpa2dsb3p1cmZreXV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyNTA5NywiZXhwIjoyMDkxNDAxMDk3fQ.XimjtuK2-gGwDed2mo8V4WVWeKU6tFXQXQlxu6WEHMU"

const supabase = createClient(url, key)

async function applyRLS() {
  console.log("Applying RLS policies via RPC or direct SQL if possible...")
  
  const sql = `
-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_modalidades ENABLE ROW LEVEL SECURITY;

-- Borrar politicas antiguas si existen para evitar conflictos
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own modalities" ON public.user_modalidades;
DROP POLICY IF EXISTS "Users can insert own modalities" ON public.user_modalidades;
DROP POLICY IF EXISTS "Admins can do everything on users" ON public.users;
DROP POLICY IF EXISTS "Admins can do everything on modalities" ON public.user_modalidades;

-- Políticas para USERS
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Políticas para USER_MODALIDADES
CREATE POLICY "Users can read own modalities" ON public.user_modalidades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own modalities" ON public.user_modalidades FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permitir que ADMIN lea todo
CREATE POLICY "Admins can do everything on users" ON public.users FOR ALL USING (
  (SELECT rol FROM public.users WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins can do everything on modalities" ON public.user_modalidades FOR ALL USING (
  (SELECT rol FROM public.users WHERE id = auth.uid()) = 'admin'
);
`

  // Since execute_sql might not exist, we try to use it if it's there, 
  // but if not, this will fail. Let's try to find a way to run SQL.
  // Using the service role should bypass RLS anyway, but for the client we need it.
  
  // Note: I cannot run raw SQL via the JS client easily without a RPC.
  // I will assume the user has the dashboard or I can find another way.
  
  // Actually, I'll try to check if I can define the RPC myself? No, need SQL for that.
  
  console.log("Trying to execute SQL via the MCP tool was the intended way, but it fails.")
  console.log("However, I can try to use the 'mcp_supabase-mcp-server_execute_sql' specifically again.")
}

applyRLS()
