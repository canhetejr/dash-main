import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .limit(1)

    return NextResponse.json({
      status: 'ok',
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Missing',
      },
      supabaseResponse: {
        data,
        error,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: err.message,
      },
      { status: 500 }
    )
  }
}
