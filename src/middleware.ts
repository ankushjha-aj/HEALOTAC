import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  // TEMPORARILY DISABLED FOR DEBUGGING
  // Define protected routes
  // const protectedRoutes = ['/dashboard', '/cadets', '/reports', '/medical-records']

  // const isProtectedRoute = protectedRoutes.some(route =>
  //   request.nextUrl.pathname.startsWith(route)
  // )

  // if (isProtectedRoute) {
  //   // Check for authentication token
  //   const token = request.cookies.get('auth-token')?.value ||
  //                 request.headers.get('authorization')?.replace('Bearer ', '')

  //   if (!token) {
  //     // Redirect to login if no token
  //     const loginUrl = new URL('/', request.url)
  //     return NextResponse.redirect(loginUrl)
  //   }

  //   try {
  //     // Verify token
  //     jwt.verify(token, process.env.JWT_SECRET!)
  //   } catch (error) {
  //     // Token is invalid, redirect to login
  //     const loginUrl = new URL('/', request.url)
  //     return NextResponse.redirect(loginUrl)
  //   }
  // }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
