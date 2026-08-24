import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AMK ERP API is operational',
    timestamp: new Date().toISOString()
  });
}
