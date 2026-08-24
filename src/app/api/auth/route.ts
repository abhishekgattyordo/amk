import { NextRequest } from 'next/server';
import { AuthService } from '../../../services/auth.service';
import { successResponse, errorResponse } from '../../../utils/api';
import { getAuthUser } from '../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }
    const profile = await AuthService.getProfile(user.id);
    return successResponse(profile, 'User profile fetched successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = req.nextUrl.searchParams.get('action');

    if (action === 'register') {
      const result = await AuthService.register(body);
      const res = successResponse(result, 'User registered successfully', 201);
      if (result.token) {
        res.cookies.set('erp_token', result.token, {
          path: '/',
          httpOnly: false,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
        });
        res.cookies.set('token', result.token, {
          path: '/',
          httpOnly: false,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
        });
      }
      return res;
    } else {
      // Default to login
      const result = await AuthService.login(body);
      const res = successResponse(result, 'Logged in successfully');
      if (result.token) {
        res.cookies.set('erp_token', result.token, {
          path: '/',
          httpOnly: false,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
        });
        res.cookies.set('token', result.token, {
          path: '/',
          httpOnly: false,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
        });
      }
      return res;
    }
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
