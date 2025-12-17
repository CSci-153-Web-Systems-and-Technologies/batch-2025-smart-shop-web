import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Placeholder middleware - will be fully implemented later
  return null
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}