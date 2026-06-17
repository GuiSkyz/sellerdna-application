import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase URL or Key is missing in middleware');
      return supabaseResponse;
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')
    const isPublicPage = request.nextUrl.pathname === '/' || isAuthPage || request.nextUrl.pathname.startsWith('/api')
    const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding')

    // Not logged in and trying to access protected page → login
    if (!user && !isPublicPage && !isOnboarding) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Logged in and on auth page → check ML account
    if (user && isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // For logged-in users on protected pages (not onboarding), check ML account
    if (user && !isPublicPage) {
      const { data: mlAccount, error } = await supabase
        .from('mercadolivre_accounts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      const hasMLAccount = !!mlAccount && !error

      // User is on onboarding but already has ML account → dashboard
      if (isOnboarding && hasMLAccount) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }

      // User is NOT on onboarding and does NOT have ML account → onboarding
      if (!isOnboarding && !hasMLAccount) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse;
  } catch (e) {
    console.error('Middleware execution error:', e);
    // Em caso de erro, apenas deixa seguir para não dar 500
    return NextResponse.next({ request });
  }
}

