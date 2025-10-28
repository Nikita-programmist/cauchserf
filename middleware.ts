import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: {
      headers: req.headers
    }
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options?: Parameters<typeof res.cookies.set>[2]) {
        res.cookies.set(name, value, options);
      },
      remove(name: string, options?: Parameters<typeof res.cookies.delete>[1]) {
        res.cookies.delete(name, options);
      }
    }
  });

  try {
    await supabase.auth.getSession();
  } catch (error) {
    console.error('Supabase auth refresh error in middleware', error);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)']
};
