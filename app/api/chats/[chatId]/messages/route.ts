import { NextRequest, NextResponse } from 'next/server';
import { chatsService } from '@/backend/services/chats/chats.service';

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await context.params;
    const chat = await chatsService.getChatById(chatId, {
      include: {
        messages: {
          limit: 100,
          orderBy: {
            field: 'timestamp',
            direction: 'asc',
          }
        }
      }
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(chat.messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}