import { NextResponse } from 'next/server';

export function successResponse(data: any, message?: string, status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function errorResponse(error: any, status = 400) {
  const message = typeof error === 'string' ? error : error?.message || 'An error occurred';
  return NextResponse.json({ success: false, error: message, details: typeof error === 'object' && error.errors ? error.errors : undefined }, { status });
}

export function paginatedResponse(data: any[], total: number, page: number, limit: number) {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / (limit || 10)) || 1,
    },
  });
}
