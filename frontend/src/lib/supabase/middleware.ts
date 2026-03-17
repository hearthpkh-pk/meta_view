import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
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

  // Fetch session to ensure it's fresh
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')

  if (!user && !isAuthPage) {
    // No user, redirect to login unless already on login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
     // Logged in user visiting login page, redirect to home structure
     const url = request.nextUrl.clone()
     url.pathname = '/'
     return NextResponse.redirect(url)
  }

  // Strict RBAC path-based protection
  const path = request.nextUrl.pathname
  let userRole = (user?.app_metadata?.role || 'staff') as string

  // If role is staff, briefly check if they actually have a role in the employees table
  // (During transition, app_metadata might not be synced yet)
  if (user && userRole === 'staff') {
    const { data: employeeData } = await supabase
      .from('employees')
      .select('roles(name)')
      .eq('id', user.id)
      .single()

    if (employeeData && (employeeData as any).roles?.name) {
      userRole = (employeeData as any).roles.name.toLowerCase().replace(' ', '_')
    }
  }

  // Define protection rules
  const rules = [
    // Oversight (Manager+)
    { matcher: /^\/admin\/(accounts|pages)/, allowed: ['super_admin', 'admin', 'manager'] },
    // Core Admin (Admin+)
    { matcher: /^\/admin\/(employees|tokens)/, allowed: ['super_admin', 'admin'] },
    // Super Admin Only
    { matcher: /^\/payroll/, allowed: ['super_admin'] },
    // General Admin catch-all (Manager+)
    { matcher: /^\/admin($|\/)/, allowed: ['super_admin', 'admin', 'manager'] },
  ]

  for (const rule of rules) {
    if (rule.matcher.test(path)) {
      if (!rule.allowed.includes(userRole)) {
        console.warn(`[RBAC] Access denied for ${userRole} to ${path}`)
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
      // If matched and allowed, we break to avoid falling into generic rules
      break
    }
  }

  return supabaseResponse
}
