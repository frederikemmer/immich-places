import {NextResponse} from 'next/server';

import type {NextRequest} from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8082';

export function middleware(request: NextRequest): NextResponse {
	const path = request.nextUrl.pathname.replace('/api/backend', '');
	const url = new URL(path + request.nextUrl.search, BACKEND_URL);
	return NextResponse.rewrite(url);
}

export const config = {
	matcher: '/api/backend/:path*'
};
