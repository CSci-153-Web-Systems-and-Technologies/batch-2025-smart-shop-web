import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to mainpos on successful authentication
      return NextResponse.redirect(`${origin}/mainpos`)
    }
  }

  // Return to login page if there's an error
  return NextResponse.redirect(`${origin}/`)
}
