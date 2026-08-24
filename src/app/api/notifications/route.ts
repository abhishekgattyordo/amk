import { NextRequest } from 'next/server';
import { NotificationService } from '../../../services/notification.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../utils/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const readParam = searchParams.get('read');
    const read = readParam !== null ? readParam === 'true' : undefined;
    const userId = searchParams.get('userId') || undefined;
    const recipientRole = searchParams.get('recipientRole') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { notifications, total } = await NotificationService.getAll({ read, userId, recipientRole, page, limit });
    return paginatedResponse(notifications, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const notification = await NotificationService.create(body);
    return successResponse(notification, 'Notification created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (action === 'markAllRead') {
      const userId = searchParams.get('userId') || undefined;
      await NotificationService.markAllAsRead(userId);
      return successResponse(null, 'All notifications marked as read');
    }

    if (!id) return errorResponse('Notification ID required', 400);

    const updated = await NotificationService.markAsRead(id);
    return successResponse(updated, 'Notification marked as read');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
