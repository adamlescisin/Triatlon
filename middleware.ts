import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (path.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (path.startsWith('/timing') && !['admin', 'timekeeper'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (path.startsWith('/announcer') && !['admin', 'announcer'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/timing/:path*', '/announcer/:path*'],
}
