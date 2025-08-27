import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Silence noisy dev sourcemap fetches coming from external libs
// Example: /_next/src/*.ts or /src/features/*.ts
export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname
  if (p.startsWith('/_next/src/') || p.startsWith('/src/features/')) {
    return new Response(null, { status: 204 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/_next/src/:path*', '/src/features/:path*'],
}
