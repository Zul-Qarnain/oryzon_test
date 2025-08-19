import { NextRequest, NextResponse } from 'next/server';
import { chatsService } from '@/backend/services/chats/chats.service';

export async function GET(request: NextRequest, context: { params: { businessId: string } }) {
  try {
    const { businessId } = await context.params;
    const { data: chats } = await chatsService.getAllChats({
      filter: { businessId },
      include: {
        customer: true,
      }
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
