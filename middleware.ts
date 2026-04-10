import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Rutas públicas
  if (path === '/login' || path === '/' || path.startsWith('/_next') || path.startsWith('/api')) {
    if (user && (path === '/login' || path === '/')) {
      // Si ya logueado, redirigir según rol
      const { data: profile } = await supabase
        .from('users')
        .select('rol, onboarding_done, pack_id')
        .eq('id', user.id)
        .single()

      if (profile?.rol === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      if (profile && !profile.onboarding_done) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
      return NextResponse.redirect(new URL('/horario', request.url))
    }
    return supabaseResponse
  }

  // Requiere autenticación
  if (!user) {
    if (path !== '/login') return NextResponse.redirect(new URL('/login', request.url))
    return supabaseResponse
  }

  const { data: profile } = await supabase
    .from('users')
    .select('rol, onboarding_done, activo')
    .eq('id', user.id)
    .single()

  // Si no hay perfil, algo va mal con el registro. Forzar login.
  if (!profile) {
    console.log('Middleware: No profile found for user', user.id)
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rutas de admin: si intentas entrar a /admin/* y no eres admin -> /horario
  if (path.startsWith('/admin')) {
    if (profile.rol !== 'admin') {
      return NextResponse.redirect(new URL('/horario', request.url))
    }
    return supabaseResponse
  }

  // Si eres admin y estás fuera de /admin -> /admin/dashboard
  if (profile.rol === 'admin' && !path.startsWith('/admin') && path !== '/api') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Si no eres admin y no has hecho onboarding -> /onboarding
  if (path !== '/onboarding' && !profile.onboarding_done) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Si ya hiciste onboarding e intentas entrar a /onboarding -> /horario
  if (path === '/onboarding' && profile.onboarding_done) {
    return NextResponse.redirect(new URL('/horario', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
